/**
 * Money Loan - Loan Service
 * Business logic for loan applications and management
 */

const knex = require('../../../../config/knex');
const logger = require('../../../../utils/logger');

class MoneyloanLoanService {
  /**
   * Create a new loan application
   */
  async createLoanApplication(tenantId, applicationData) {
    try {
      const {
        customerId,
        loanProductId,
        requestedAmount,
        requestedTermDays,
        purpose,
        creditScore,
        annualIncome,
        employmentStatus,
        collateralDescription,
      } = applicationData;

      // Generate application number
      const appNumber = `APP-${tenantId}-${Date.now()}`;

      // Store optional fields in application_data JSONB column
      const appData = {};
      if (creditScore) appData.creditScore = creditScore;
      if (annualIncome) appData.annualIncome = annualIncome;
      if (employmentStatus) appData.employmentStatus = employmentStatus;
      if (collateralDescription) appData.collateralDescription = collateralDescription;

      const [application] = await knex('money_loan_applications')
        .insert({
          tenantId,
          customerId,
          loanProductId,
          applicationNumber: appNumber,
          requestedAmount,
          requestedTermDays,
          purpose: purpose || 'Loan application',
          status: 'submitted',
          applicationData: appData,
        })
        .returning('*');

      logger.info(`✅ Loan application created: ${application.id}`);
      return application;
    } catch (error) {
      logger.error('❌ Error creating loan application:', error);
      throw error;
    }
  }

  /**
   * Get loan application by ID
   */
  async getLoanApplication(tenantId, applicationId) {
    try {
      const application = await knex('money_loan_applications')
        .where({ id: applicationId, tenant_id: tenantId })
        .first();

      if (!application) {
        throw new Error('Loan application not found');
      }

      return application;
    } catch (error) {
      logger.error('❌ Error fetching loan application:', error);
      throw error;
    }
  }

  /**
   * Get all loan applications for a customer
   */
  async getCustomerApplications(tenantId, customerId) {
    try {
      const applications = await knex('money_loan_applications')
        .where({ tenant_id: tenantId, customer_id: customerId })
        .orderBy('created_at', 'desc');

      return applications;
    } catch (error) {
      logger.error('❌ Error fetching customer applications:', error);
      throw error;
    }
  }

  /**
   * Get all loan applications for a tenant (with optional filters)
   */
  async getAllApplications(tenantId, filters = {}) {
    try {
      let query = knex('money_loan_applications as mla')
        .leftJoin('customers as c', 'mla.customer_id', 'c.id')
        .leftJoin('money_loan_products as mlp', 'mla.loan_product_id', 'mlp.id')
        .leftJoin('money_loan_customer_profiles as mlcp', function() {
          this.on('mlcp.customer_id', '=', 'c.id')
              .andOn('mlcp.tenant_id', '=', 'mla.tenant_id');
        })
        .leftJoin('users as u', 'mla.reviewed_by', 'u.id')
        .where('mla.tenant_id', tenantId)
        .select(
          'mla.*',
          'c.first_name',
          'c.last_name',
          'c.email as customer_email',
          'c.phone as customer_phone',
          'mlcp.credit_score as customer_credit_score',
          'mlp.name as product_name',
          'u.first_name as reviewer_first_name',
          'u.last_name as reviewer_last_name',
          'u.email as reviewer_email'
        );

      if (filters.status) {
        query = query.where('mla.status', filters.status);
      }

      if (filters.product_id) {
        query = query.where('mla.loan_product_id', filters.product_id);
      }

      if (filters.customer_id) {
        query = query.where('mla.customer_id', filters.customer_id);
      }

      if (filters.search) {
        query = query.where(function() {
          this.where('mla.application_number', 'ilike', `%${filters.search}%`)
            .orWhere('c.first_name', 'ilike', `%${filters.search}%`)
            .orWhere('c.last_name', 'ilike', `%${filters.search}%`);
        });
      }

      const applications = await query.orderBy('mla.created_at', 'desc');
      
      // Map the response to ensure correct field names for frontend
      const mapped = applications.map(app => {
        // Convert all camelCase to snake_case for frontend compatibility
        return {
          id: app.id,
          tenant_id: app.tenantId,
          application_number: app.applicationNumber,
          customer_id: app.customerId,
          loan_product_id: app.loanProductId,
          requested_amount: app.requestedAmount,
          requested_term_days: app.requestedTermDays,
          purpose: app.purpose,
          status: app.status,
          reviewed_by: app.reviewedBy,
          reviewed_at: app.reviewedAt,
          review_notes: app.reviewNotes,
          approved_amount: app.approvedAmount,
          approved_term_days: app.approvedTermDays,
          approved_interest_rate: app.approvedInterestRate,
          application_data: app.applicationData,
          credit_assessment: app.creditAssessment,
          created_at: app.createdAt,
          updated_at: app.updatedAt,
          // Customer JOIN fields
          first_name: app.firstName,
          last_name: app.lastName,
          customer_email: app.customerEmail,
          customer_phone: app.customerPhone,
          customer_credit_score: app.customerCreditScore,
          product_name: app.productName,
          // Reviewer JOIN fields
          reviewer_first_name: app.reviewerFirstName,
          reviewer_last_name: app.reviewerLastName,
          reviewer_email: app.reviewerEmail
        };
      });
      
      return mapped;
    } catch (error) {
      logger.error('❌ Error fetching all applications:', error);
      throw error;
    }
  }

  /**
   * Update loan application
   */
  async updateLoanApplication(tenantId, applicationId, updateData) {
    try {
      const [application] = await knex('money_loan_applications')
        .where({ id: applicationId, tenant_id: tenantId })
        .update({
          ...updateData,
          updated_at: knex.fn.now(),
        })
        .returning('*');

      if (!application) {
        throw new Error('Loan application not found');
      }

      logger.info(`✅ Loan application updated: ${applicationId}`);
      return application;
    } catch (error) {
      logger.error('❌ Error updating loan application:', error);
      throw error;
    }
  }

  /**
   * Approve loan application and create active loan
   */
  async approveLoanApplication(tenantId, applicationId, approvalData) {
    const trx = await knex.transaction();

    try {
      const {
        approvedBy,
        approvedAmount,
        interestRate,
        loanTermDays,
        totalFees,
        totalInterest,
        monthlyPayment,
        notes,
      } = approvalData;

      // Get application details
      const application = await trx('money_loan_applications')
        .where({ id: applicationId, tenantId })
        .first();

      if (!application) {
        throw new Error('Loan application not found');
      }

      // Update application status
      await trx('money_loan_applications')
        .where({ id: applicationId, tenant_id: tenantId })
        .update({
          status: 'approved',
          reviewed_by: approvedBy,
          approved_amount: approvedAmount,
          approved_term_days: loanTermDays,
          approved_interest_rate: interestRate,
          reviewed_at: knex.fn.now(),
          review_notes: notes,
          updated_at: knex.fn.now(),
        });

      // Create active loan record
      const totalAmount = approvedAmount + totalFees + totalInterest;
      const loanNumber = `LOAN-${tenantId}-${Date.now()}`;

      const [loan] = await trx('money_loan_loans')
        .insert({
          tenant_id: tenantId,
          application_id: applicationId,
          loan_product_id: application.loanProductId,
          customer_id: application.customerId,
          loan_number: loanNumber,
          principal_amount: approvedAmount,
          interest_rate: interestRate,
          interest_type: 'flat',
          term_days: loanTermDays,
          processing_fee: totalFees,
          total_interest: totalInterest,
          total_amount: totalAmount,
          monthly_payment: monthlyPayment,
          outstanding_balance: totalAmount,
          status: 'pending',
          approved_by: approvedBy,
        })
        .returning('*');

      await trx.commit();
      logger.info(`✅ Loan application approved and loan created: ${loan.id}`);
      return loan;
    } catch (error) {
      await trx.rollback();
      logger.error('❌ Error approving loan application:', error);
      throw error;
    }
  }

  /**
   * Reject loan application
   */
  async rejectLoanApplication(tenantId, applicationId, rejectionData) {
    try {
      const { rejectedBy, reason } = rejectionData;

      const [application] = await knex('money_loan_applications')
        .where({ id: applicationId, tenant_id: tenantId })
        .update({
          status: 'rejected',
          reviewed_by: rejectedBy,
          reviewed_at: knex.fn.now(),
          review_notes: reason,
          updated_at: knex.fn.now(),
        })
        .returning('*');

      if (!application) {
        throw new Error('Loan application not found');
      }

      logger.info(`✅ Loan application rejected: ${applicationId}`);
      return application;
    } catch (error) {
      logger.error('❌ Error rejecting loan application:', error);
      throw error;
    }
  }

  /**
   * Disburse loan to customer
   */
  async disburseLoan(tenantId, loanId, disbursalData) {
    try {
      const { disbursedBy, disbursementMethod, disbursementReference, disbursementNotes } = disbursalData;

      const [loan] = await knex('money_loan_loans')
        .where({ id: loanId, tenant_id: tenantId })
        .update({
          status: 'active',
          disbursement_date: knex.fn.now(),
          disbursed_by: disbursedBy,
          disbursement_method: disbursementMethod,
          disbursement_reference: disbursementReference,
          disbursement_notes: disbursementNotes,
          updated_at: knex.fn.now(),
        })
        .returning('*');

      if (!loan) {
        throw new Error('Loan not found');
      }

      logger.info(`✅ Loan disbursed: ${loanId}`);
      return loan;
    } catch (error) {
      logger.error('❌ Error disbursing loan:', error);
      throw error;
    }
  }

  /**
   * Get loan by ID
   */
  async getLoan(tenantId, loanId) {
    try {
      const loan = await knex('money_loan_loans')
        .where({ id: loanId, tenant_id: tenantId })
        .first();

      if (!loan) {
        throw new Error('Loan not found');
      }

      return loan;
    } catch (error) {
      logger.error('❌ Error fetching loan:', error);
      throw error;
    }
  }

  /**
   * Get all loans for a customer
   */
  async getCustomerLoans(tenantId, customerId) {
    try {
      const loans = await knex('money_loan_loans')
        .where({ tenant_id: tenantId, customer_id: customerId })
        .orderBy('created_at', 'desc');

      return loans;
    } catch (error) {
      logger.error('❌ Error fetching customer loans:', error);
      throw error;
    }
  }

  /**
   * Get all loans for a product
   */
  async getProductLoans(tenantId, productId, status = null) {
    try {
      let query = knex('money_loan_loans')
        .where({ tenant_id: tenantId, loan_product_id: productId });

      if (status) {
        query = query.where({ status });
      }

      const loans = await query.orderBy('created_at', 'desc');
      return loans;
    } catch (error) {
      logger.error('❌ Error fetching product loans:', error);
      throw error;
    }
  }

  /**
   * Get loans with filters
   */
  async getLoansWithFilters(tenantId, filters) {
    try {
      let query = knex('money_loan_loans as mll')
        .leftJoin('customers as c', 'mll.customer_id', 'c.id')
        .leftJoin('money_loan_products as mlp', 'mll.loan_product_id', 'mlp.id')
        .where('mll.tenant_id', tenantId)
        .select(
          'mll.*',
          'c.first_name',
          'c.last_name',
          'c.email as customer_email',
          'mlp.name as product_name'
        );

      if (filters.status) {
        query = query.where('mll.status', filters.status);
      }

      if (filters.customerId) {
        query = query.where('mll.customer_id', filters.customerId);
      }

      if (filters.loanProductId) {
        query = query.where('mll.loan_product_id', filters.loanProductId);
      }

      if (filters.search) {
        query = query.where(function() {
          this.where('mll.loan_number', 'ilike', `%${filters.search}%`)
            .orWhere('c.first_name', 'ilike', `%${filters.search}%`)
            .orWhere('c.last_name', 'ilike', `%${filters.search}%`);
        });
      }

      if (filters.createdAfter) {
        query = query.where('mll.created_at', '>=', filters.createdAfter);
      }

      if (filters.createdBefore) {
        query = query.where('mll.created_at', '<=', filters.createdBefore);
      }

      // Get total count
      const countQuery = query.clone().clearSelect().clearOrder().count('* as count');
      const [{ count }] = await countQuery;
      const total = parseInt(count);

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;

      // Get paginated data
      const loans = await query
        .orderBy('mll.created_at', 'desc')
        .limit(limit)
        .offset(offset);

      // Map fields properly (Knex postProcessResponse converts to camelCase, but we need snake_case for frontend)
      const mapped = loans.map(loan => ({
        id: loan.id,
        tenant_id: loan.tenantId,
        loan_number: loan.loanNumber,
        customer_id: loan.customerId,
        loan_product_id: loan.loanProductId,
        application_id: loan.applicationId,
        principal_amount: loan.principalAmount,
        interest_rate: loan.interestRate,
        interest_type: loan.interestType,
        term_days: loan.termDays,
        loan_term_months: Math.round(loan.termDays / 30),
        processing_fee: loan.processingFee,
        total_interest: loan.totalInterest,
        total_amount: loan.totalAmount,
        monthly_payment: loan.monthlyPayment,
        disbursement_date: loan.disbursementDate,
        first_payment_date: loan.firstPaymentDate,
        maturity_date: loan.maturityDate,
        amount_paid: loan.amountPaid,
        outstanding_balance: loan.outstandingBalance,
        penalty_amount: loan.penaltyAmount,
        status: loan.status,
        days_overdue: loan.daysOverdue,
        approved_by: loan.approvedBy,
        disbursed_by: loan.disbursedBy,
        created_at: loan.createdAt,
        updated_at: loan.updatedAt,
        customer: {
          fullName: `${loan.firstName || ''} ${loan.lastName || ''}`.trim(),
          customerCode: `CUST-${loan.customerId}`,
          email: loan.customerEmail
        },
        product_name: loan.productName,
        // Frontend expects these for display
        loanNumber: loan.loanNumber,
        principalAmount: loan.principalAmount,
        interestRate: loan.interestRate,
        interestType: loan.interestType,
        loanTermMonths: Math.round(loan.termDays / 30),
        outstandingBalance: loan.outstandingBalance
      }));

      return {
        data: mapped,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('❌ Error fetching loans with filters:', error);
      throw error;
    }
  }

  /**
   * Close a loan
   */
  async closeLoan(tenantId, loanId, closureData) {
    try {
      const { closedBy, closureReason } = closureData;

      const [loan] = await knex('money_loan_loans')
        .where({ id: loanId, tenantId })
        .update({
          status: 'closed',
          closureDate: knex.fn.now(),
          closedBy,
          closureReason,
          outstandingBalance: 0,
          updatedAt: knex.fn.now(),
        })
        .returning('*');

      if (!loan) {
        throw new Error('Loan not found');
      }

      logger.info(`✅ Loan closed: ${loanId}`);
      return loan;
    } catch (error) {
      logger.error('❌ Error closing loan:', error);
      throw error;
    }
  }

  /**
   * Suspend a loan
   */
  async suspendLoan(tenantId, loanId, suspensionData) {
    try {
      const { suspendedBy, suspensionReason } = suspensionData;

      const [loan] = await knex('money_loan_loans')
        .where({ id: loanId, tenantId })
        .update({
          status: 'suspended',
          suspensionDate: knex.fn.now(),
          suspendedBy,
          suspensionReason,
          updatedAt: knex.fn.now(),
        })
        .returning('*');

      if (!loan) {
        throw new Error('Loan not found');
      }

      logger.info(`✅ Loan suspended: ${loanId}`);
      return loan;
    } catch (error) {
      logger.error('❌ Error suspending loan:', error);
      throw error;
    }
  }

  /**
   * Resume a suspended loan
   */
  async resumeLoan(tenantId, loanId) {
    try {
      const [loan] = await knex('money_loan_loans')
        .where({ id: loanId, tenantId })
        .update({
          status: 'active',
          suspensionDate: null,
          suspendedBy: null,
          suspensionReason: null,
          updatedAt: knex.fn.now(),
        })
        .returning('*');

      if (!loan) {
        throw new Error('Loan not found');
      }

      logger.info(`✅ Loan resumed: ${loanId}`);
      return loan;
    } catch (error) {
      logger.error('❌ Error resuming loan:', error);
      throw error;
    }
  }

  /**
   * Get loans dashboard summary
   */
  async getLoansDashboard(tenantId) {
    try {
      const result = await knex('money_loan_loans')
        .where({ tenantId })
        .select(
          knex.raw('COUNT(*) as total_loans'),
          knex.raw("COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_loans"),
          knex.raw("COUNT(CASE WHEN status = 'disbursed' THEN 1 END) as disbursed_loans"),
          knex.raw("COUNT(CASE WHEN status = 'active' THEN 1 END) as active_loans"),
          knex.raw("COUNT(CASE WHEN status = 'paid_off' THEN 1 END) as closed_loans"),
          knex.raw("COUNT(CASE WHEN status = 'defaulted' THEN 1 END) as defaulted_loans"),
          knex.raw('SUM(principal_amount) as total_principal'),
          knex.raw('SUM(outstanding_balance) as total_outstanding'),
          knex.raw('SUM(processing_fee) as total_fees_collected'),
          knex.raw('SUM(total_interest) as total_interest_earned')
        )
        .first();

      return result;
    } catch (error) {
      logger.error('❌ Error fetching loans dashboard:', error);
      throw error;
    }
  }
}

module.exports = new MoneyloanLoanService();
