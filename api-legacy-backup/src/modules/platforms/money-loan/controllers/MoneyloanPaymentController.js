/**
 * Money Loan - Payment Processing Controller
 * Handles HTTP requests for payment operations
 */

const moneyloanPaymentService = require('../services/MoneyloanPaymentService');
const moneyloanValidators = require('../utils/MoneyloanValidators');
const paymentScheduleGenerator = require('../utils/MoneyloanPaymentScheduleGenerator');
const logger = require('../../../../utils/logger');

class MoneyloanPaymentController {
  /**
   * POST: Process a payment
   * Route: POST /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId/payments
   */
  async processPayment(req, res) {
    try {
      const { tenantId, loanId } = req.params;
      const paymentData = req.body;

      // Get loan balance first
      const balance = await moneyloanPaymentService.calculateLoanBalance(tenantId, loanId);

      // Validate payment
      const validation = moneyloanValidators.validatePayment(paymentData, balance);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
        });
      }

      const result = await moneyloanPaymentService.processPayment(tenantId, loanId, paymentData);

      return res.status(201).json({
        success: true,
        message: 'Payment processed successfully',
        data: result,
      });
    } catch (error) {
      logger.error('❌ Error processing payment:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to process payment',
        error: error.message,
      });
    }
  }

  /**
   * GET: Fetch payment history for a loan
   * Route: GET /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId/payments
   */
  async getPaymentHistory(req, res) {
    try {
      const { tenantId, loanId } = req.params;
      const limit = parseInt(req.query.limit) || 50;

      const payments = await moneyloanPaymentService.getPaymentHistory(tenantId, loanId, limit);

      return res.status(200).json({
        success: true,
        message: 'Payment history fetched successfully',
        data: payments,
        count: payments.length,
      });
    } catch (error) {
      logger.error('❌ Error fetching payment history:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch payment history',
        error: error.message,
      });
    }
  }

  /**
   * GET: Calculate current balance on a loan
   * Route: GET /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId/balance
   */
  async getLoanBalance(req, res) {
    try {
      const { tenantId, loanId } = req.params;

      const balance = await moneyloanPaymentService.calculateLoanBalance(tenantId, loanId);

      return res.status(200).json({
        success: true,
        message: 'Loan balance calculated successfully',
        data: balance,
      });
    } catch (error) {
      logger.error('❌ Error calculating loan balance:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to calculate loan balance',
        error: error.message,
      });
    }
  }

  /**
   * GET: Fetch payment schedule for a loan
   * Route: GET /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId/schedule
   */
  async getPaymentSchedule(req, res) {
    try {
      const { tenantId, loanId } = req.params;

      const schedule = await moneyloanPaymentService.generatePaymentSchedule(tenantId, loanId);

      return res.status(200).json({
        success: true,
        message: 'Payment schedule fetched successfully',
        data: schedule,
      });
    } catch (error) {
      logger.error('❌ Error fetching payment schedule:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch payment schedule',
        error: error.message,
      });
    }
  }

  /**
   * POST: Apply late payment penalty
   * Route: POST /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId/penalties
   */
  async applyLatePenalty(req, res) {
    try {
      const { tenantId, loanId } = req.params;
      const { scheduleId } = req.body;

      if (!scheduleId) {
        return res.status(400).json({
          success: false,
          message: 'Schedule ID is required',
        });
      }

      const penalty = await moneyloanPaymentService.applyLatePenalty(tenantId, loanId, scheduleId);

      return res.status(201).json({
        success: true,
        message: 'Late payment penalty applied successfully',
        data: penalty,
      });
    } catch (error) {
      logger.error('❌ Error applying late penalty:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to apply late payment penalty',
        error: error.message,
      });
    }
  }

  /**
   * POST: Reverse a payment
   * Route: POST /api/tenants/:tenantId/platforms/moneyloan/payments/:paymentId/reverse
   */
  async reversePayment(req, res) {
    try {
      const { tenantId, paymentId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Reversal reason is required',
        });
      }

      const result = await moneyloanPaymentService.reversePayment(tenantId, paymentId, reason);

      return res.status(200).json({
        success: true,
        message: 'Payment reversed successfully',
        data: result,
      });
    } catch (error) {
      logger.error('❌ Error reversing payment:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to reverse payment',
        error: error.message,
      });
    }
  }

  /**
   * POST: Generate new payment schedule
   * Route: POST /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId/schedule/generate
   */
  async generateSchedule(req, res) {
    try {
      const { tenantId, loanId } = req.params;
      const { frequency, type } = req.body;

      // Get loan details from service
      const loan = await require('../services/MoneyloanLoanService').getLoan(tenantId, loanId);

      const schedule = await paymentScheduleGenerator.generatePaymentSchedule(
        tenantId,
        loan,
        frequency || 'monthly',
        type || 'fixed'
      );

      return res.status(201).json({
        success: true,
        message: 'Payment schedule generated successfully',
        data: schedule,
      });
    } catch (error) {
      logger.error('❌ Error generating payment schedule:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to generate payment schedule',
        error: error.message,
      });
    }
  }

  /**
   * POST: Recalculate payment schedule after modification
   * Route: POST /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId/schedule/recalculate
   */
  async recalculateSchedule(req, res) {
    try {
      const { tenantId, loanId } = req.params;
      const modificationData = req.body;

      // Get loan details
      const loan = await require('../services/MoneyloanLoanService').getLoan(tenantId, loanId);

      const schedule = await paymentScheduleGenerator.recalculatePaymentSchedule(
        tenantId,
        loan,
        modificationData
      );

      return res.status(200).json({
        success: true,
        message: 'Payment schedule recalculated successfully',
        data: schedule,
      });
    } catch (error) {
      logger.error('❌ Error recalculating payment schedule:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to recalculate payment schedule',
        error: error.message,
      });
    }
  }

  /**
   * GET: Get next payment due
   * Route: GET /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId/schedule/next-due
   */
  async getNextPaymentDue(req, res) {
    try {
      const { tenantId, loanId } = req.params;

      const nextPayment = await paymentScheduleGenerator.getNextPaymentDue(loanId);

      if (!nextPayment) {
        return res.status(200).json({
          success: true,
          message: 'No pending payments',
          data: null,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Next payment due fetched successfully',
        data: nextPayment,
      });
    } catch (error) {
      logger.error('❌ Error fetching next payment due:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch next payment due',
        error: error.message,
      });
    }
  }

  /**
   * GET: Calculate amortization table
   * Route: GET /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId/amortization
   */
  async getAmortizationTable(req, res) {
    try {
      const { tenantId, loanId } = req.params;

      // Get loan details
      const loan = await require('../services/MoneyloanLoanService').getLoan(tenantId, loanId);

      const months = Math.ceil(loan.loan_term_days / 30);
      const table = paymentScheduleGenerator.generateAmortizationTable(
        loan.loan_amount,
        loan.interest_rate,
        months
      );

      return res.status(200).json({
        success: true,
        message: 'Amortization table generated successfully',
        data: {
          loanId,
          principal: loan.loan_amount,
          interestRate: loan.interest_rate,
          months,
          table,
        },
      });
    } catch (error) {
      logger.error('❌ Error generating amortization table:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate amortization table',
        error: error.message,
      });
    }
  }
}

module.exports = new MoneyloanPaymentController();
