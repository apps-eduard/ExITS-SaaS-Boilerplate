/**
 * Customer Money Loan Controller
 * Handles customer-facing loan operations with proper Knex and camelCase
 * Uses correct table names: loan_applications, loans, repayment_schedules, loan_payments
 */

const knex = require('../../../config/knex');
const logger = require('../../../utils/logger');

class CustomerLoanController {
  /**
   * Get customer's loan applications
   * GET /api/customer/money-loan/applications
   */
  async getMyApplications(req, res) {
    try {
      const customerId = req.customer.customerId;
      const { status, page = 1, limit = 10 } = req.query;

      let query = knex('loan_applications')
        .where({ customerId })
        .orderBy('createdAt', 'desc');

      if (status) {
        query = query.where({ status });
      }

      const offset = (page - 1) * limit;
      const [applications, totalResult] = await Promise.all([
        query.limit(limit).offset(offset),
        knex('loan_applications')
          .where({ customerId })
          .modify((qb) => {
            if (status) qb.where({ status });
          })
          .count('* as total')
          .first(),
      ]);

      res.json({
        success: true,
        data: {
          applications,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(totalResult.total),
            totalPages: Math.ceil(totalResult.total / limit),
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching customer applications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch applications',
        error: error.message,
      });
    }
  }

  /**
   * Get customer's active loans
   * GET /api/customer/money-loan/loans
   */
  async getMyLoans(req, res) {
    try {
      const customerId = req.customer.customerId;
      const { page = 1, limit = 10 } = req.query;

      const offset = (page - 1) * limit;

      const [loans, totalResult] = await Promise.all([
        knex('loans')
          .where({ customerId, status: 'active' })
          .orderBy('createdAt', 'desc')
          .limit(limit)
          .offset(offset),
        knex('loans')
          .where({ customerId, status: 'active' })
          .count('* as total')
          .first(),
      ]);

      // Get next payment for each loan
      for (const loan of loans) {
        const nextPayment = await knex('repayment_schedules')
          .where({ loanId: loan.id, status: 'pending' })
          .orderBy('dueDate', 'asc')
          .first();

        loan.nextPayment = nextPayment;
      }

      res.json({
        success: true,
        data: {
          loans,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(totalResult.total),
            totalPages: Math.ceil(totalResult.total / limit),
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching customer loans:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch loans',
        error: error.message,
      });
    }
  }

  /**
   * Get detailed information about a specific loan
   * GET /api/customer/money-loan/loans/:loanId
   */
  async getLoanDetails(req, res) {
    try {
      const customerId = req.customer.customerId;
      const { loanId } = req.params;

      const loan = await knex('loans')
        .where({ id: loanId, customerId })
        .first();

      if (!loan) {
        return res.status(404).json({
          success: false,
          message: 'Loan not found',
        });
      }

      // Get repayment schedules
      const schedules = await knex('repayment_schedules')
        .where({ loanId })
        .orderBy('dueDate', 'asc');

      // Get payment history
      const payments = await knex('loan_payments')
        .where({ loanId })
        .orderBy('paymentDate', 'desc');

      // Get application details
      const application = await knex('loan_applications')
        .where({ id: loan.applicationId })
        .first();

      // Calculate summary
      const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const remainingSchedules = schedules.filter(s => s.status === 'pending').length;

      res.json({
        success: true,
        data: {
          loan,
          application,
          schedules,
          payments,
          summary: {
            totalPaid,
            remainingSchedules,
            nextPaymentDue: schedules.find(s => s.status === 'pending')?.dueDate,
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching loan details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch loan details',
        error: error.message,
      });
    }
  }

  /**
   * Submit a new loan application
   * POST /api/customer/money-loan/applications
   */
  async submitApplication(req, res) {
    try {
      const customerId = req.customer.customerId;
      const tenantId = req.customer.tenantId;
      const {
        loanAmount,
        loanTermMonths,
        purpose,
        monthlyIncome,
        employmentStatus,
        collateralType,
        collateralDescription,
        collateralValue,
      } = req.body;

      // Validation
      if (!loanAmount || !loanTermMonths || !purpose) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: loanAmount, loanTermMonths, purpose',
        });
      }

      // Get active loan product (configuration)
      const loanProduct = await knex('loan_products')
        .where({ tenantId, isActive: true })
        .first();

      if (!loanProduct) {
        return res.status(400).json({
          success: false,
          message: 'No active loan product available',
        });
      }

      // Validate amount
      if (loanAmount < loanProduct.minAmount || loanAmount > loanProduct.maxAmount) {
        return res.status(400).json({
          success: false,
          message: `Loan amount must be between ${loanProduct.minAmount} and ${loanProduct.maxAmount}`,
        });
      }

      // Convert months to days (30 days per month)
      const requestedTermDays = loanTermMonths * 30;

      // Validate term
      if (requestedTermDays < loanProduct.minTermDays || requestedTermDays > loanProduct.maxTermDays) {
        const minMonths = Math.floor(loanProduct.minTermDays / 30);
        const maxMonths = Math.floor(loanProduct.maxTermDays / 30);
        return res.status(400).json({
          success: false,
          message: `Loan term must be between ${minMonths} and ${maxMonths} months`,
        });
      }

      // Calculate interest (flat rate calculation)
      const interestRate = loanProduct.interestRate;
      let totalInterest;

      if (loanProduct.interestType === 'flat') {
        totalInterest = (loanAmount * interestRate * loanTermMonths) / 100;
      } else {
        // Reducing balance (simplified)
        const monthlyRate = interestRate / 12 / 100;
        totalInterest = loanAmount * monthlyRate * loanTermMonths;
      }

      const totalAmount = loanAmount + totalInterest;

      // Generate application number
      const appCount = await knex('loan_applications')
        .where({ tenantId })
        .count('* as count')
        .first();
      const applicationNumber = `APP-${new Date().getFullYear()}-${String(parseInt(appCount.count) + 1).padStart(6, '0')}`;

      // Create application with additional data in JSONB field
      const applicationData = {
        collateral: collateralType ? {
          type: collateralType,
          description: collateralDescription,
          estimatedValue: collateralValue,
        } : null,
        employment: {
          status: employmentStatus,
          monthlyIncome,
        },
      };

      const [application] = await knex('loan_applications').insert({
        tenantId,
        customerId,
        loanProductId: loanProduct.id,
        applicationNumber,
        requestedAmount: loanAmount,
        requestedTermDays,
        purpose,
        status: 'submitted',
        applicationData: JSON.stringify(applicationData),
      }).returning('*');

      logger.info(`Customer ${customerId} submitted loan application ${application.id}`);

      res.json({
        success: true,
        message: 'Loan application submitted successfully',
        data: {
          application,
          calculated: {
            totalInterest,
            totalAmount,
            monthlyPayment: totalAmount / loanTermMonths,
          },
        },
      });
    } catch (error) {
      logger.error('Error submitting loan application:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit application',
        error: error.message,
      });
    }
  }

  /**
   * Get payment schedules for a loan
   * GET /api/customer/money-loan/loans/:loanId/schedules
   */
  async getPaymentSchedules(req, res) {
    try {
      const customerId = req.customer.customerId;
      const { loanId } = req.params;

      // Verify loan belongs to customer
      const loan = await knex('loans')
        .where({ id: loanId, customerId })
        .first();

      if (!loan) {
        return res.status(404).json({
          success: false,
          message: 'Loan not found',
        });
      }

      const schedules = await knex('repayment_schedules')
        .where({ loanId })
        .orderBy('dueDate', 'asc');

      res.json({
        success: true,
        data: {
          schedules,
          summary: {
            total: schedules.length,
            paid: schedules.filter(s => s.status === 'paid').length,
            pending: schedules.filter(s => s.status === 'pending').length,
            overdue: schedules.filter(s => s.status === 'overdue').length,
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching payment schedules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment schedules',
        error: error.message,
      });
    }
  }

  /**
   * Get payment history for a loan
   * GET /api/customer/money-loan/loans/:loanId/payments
   */
  async getPaymentHistory(req, res) {
    try {
      const customerId = req.customer.customerId;
      const { loanId } = req.params;

      // Verify loan belongs to customer
      const loan = await knex('loans')
        .where({ id: loanId, customerId })
        .first();

      if (!loan) {
        return res.status(404).json({
          success: false,
          message: 'Loan not found',
        });
      }

      const payments = await knex('loan_payments')
        .where({ loanId })
        .orderBy('paymentDate', 'desc');

      const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

      res.json({
        success: true,
        data: {
          payments,
          summary: {
            totalPayments: payments.length,
            totalPaid,
            lastPaymentDate: payments[0]?.paymentDate,
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching payment history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment history',
        error: error.message,
      });
    }
  }

  /**
   * Make a payment on a loan
   * POST /api/customer/money-loan/loans/:loanId/payments
   */
  async makePayment(req, res) {
    try {
      const customerId = req.customer.customerId;
      const tenantId = req.customer.tenantId;
      const { loanId } = req.params;
      const { amount, paymentMethod, transactionId } = req.body;

      // Validation
      if (!amount || !paymentMethod) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: amount, paymentMethod',
        });
      }

      // Verify loan belongs to customer and is active
      const loan = await knex('loans')
        .where({ id: loanId, customerId, status: 'active' })
        .first();

      if (!loan) {
        return res.status(404).json({
          success: false,
          message: 'Loan not found or not active',
        });
      }

      // Validate amount
      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Payment amount must be greater than zero',
        });
      }

      if (amount > loan.outstandingBalance) {
        return res.status(400).json({
          success: false,
          message: 'Payment amount exceeds outstanding balance',
        });
      }

      // Generate payment reference
      const paymentCount = await knex('loan_payments')
        .where({ tenantId })
        .count('* as count')
        .first();
      const paymentReference = `PAY-${new Date().getFullYear()}-${String(parseInt(paymentCount.count) + 1).padStart(8, '0')}`;

      // Process payment in transaction
      await knex.transaction(async (trx) => {
        // 1. Insert payment record
        const [payment] = await trx('loan_payments').insert({
          tenantId,
          loanId,
          customerId,
          paymentReference,
          amount,
          principalAmount: amount, // Simplified - should allocate to principal/interest
          interestAmount: 0,
          penaltyAmount: 0,
          paymentMethod,
          transactionId,
          paymentDate: knex.fn.now(),
          status: 'completed',
        }).returning('*');

        // 2. Update loan
        const newAmountPaid = parseFloat(loan.amountPaid || 0) + amount;
        const newOutstandingBalance = parseFloat(loan.outstandingBalance) - amount;
        const newStatus = newOutstandingBalance === 0 ? 'paid_off' : 'active';

        await trx('loans')
          .where({ id: loanId })
          .update({
            amountPaid: newAmountPaid,
            outstandingBalance: newOutstandingBalance,
            status: newStatus,
          });

        // 3. Update repayment schedule (mark oldest pending as paid)
        const pendingSchedule = await trx('repayment_schedules')
          .where({ loanId, status: 'pending' })
          .orderBy('dueDate', 'asc')
          .first();

        if (pendingSchedule && amount >= pendingSchedule.totalAmount) {
          await trx('repayment_schedules')
            .where({ id: pendingSchedule.id })
            .update({
              status: 'paid',
              paidDate: knex.fn.now(),
              amountPaid: pendingSchedule.totalAmount,
              outstandingAmount: 0,
            });
        } else if (pendingSchedule) {
          // Partial payment
          const newAmountPaid = parseFloat(pendingSchedule.amountPaid || 0) + amount;
          await trx('repayment_schedules')
            .where({ id: pendingSchedule.id })
            .update({
              status: 'partially_paid',
              amountPaid: newAmountPaid,
              outstandingAmount: parseFloat(pendingSchedule.totalAmount) - newAmountPaid,
            });
        }

        logger.info(`Customer ${customerId} made payment ${paymentReference} for loan ${loanId}`);
      });

      // Get updated loan
      const updatedLoan = await knex('loans').where({ id: loanId }).first();

      res.json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          paymentReference,
          amount,
          newOutstandingBalance: updatedLoan.outstandingBalance,
          loanStatus: updatedLoan.status,
        },
      });
    } catch (error) {
      logger.error('Error processing payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process payment',
        error: error.message,
      });
    }
  }

  /**
   * Get dashboard statistics for customer
   * GET /api/customer/money-loan/dashboard
   */
  async getDashboardStats(req, res) {
    try {
      const customerId = req.customer.customerId;

      // Get active loans count
      const activeLoansResult = await knex('loans')
        .where({ customerId, status: 'active' })
        .count('* as count')
        .first();

      // Get total outstanding balance
      const outstandingResult = await knex('loans')
        .where({ customerId, status: 'active' })
        .sum('outstandingBalance as total')
        .first();

      // Get next payment due
      const nextPayment = await knex('repayment_schedules as rs')
        .join('loans as l', 'rs.loanId', 'l.id')
        .where({ 'l.customerId': customerId, 'rs.status': 'pending' })
        .orderBy('rs.dueDate', 'asc')
        .select('rs.*', 'l.loanNumber')
        .first();

      // Get pending applications
      const pendingAppsResult = await knex('loan_applications')
        .where({ customerId, status: 'submitted' })
        .count('* as count')
        .first();

      res.json({
        success: true,
        data: {
          activeLoans: parseInt(activeLoansResult.count),
          totalOutstanding: parseFloat(outstandingResult.total || 0),
          nextPayment: nextPayment ? {
            dueDate: nextPayment.dueDate,
            amount: nextPayment.totalAmount,
            loanNumber: nextPayment.loanNumber,
          } : null,
          pendingApplications: parseInt(pendingAppsResult.count),
        },
      });
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard statistics',
        error: error.message,
      });
    }
  }
}

module.exports = new CustomerLoanController();
