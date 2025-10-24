const RepaymentService = require('../services/RepaymentService');
const CONSTANTS = require('../../../../config/constants');

class RepaymentController {
  /**
   * POST /api/money-loan/payments
   * Record a payment
   */
  static async recordPayment(req, res, next) {
    try {
      const { tenantId, userId } = req;
      const payment = await RepaymentService.recordPayment(tenantId, req.body, userId);

      res.status(CONSTANTS.HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Payment recorded successfully',
        data: payment
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/money-loan/loans/:loanId/payments
   * Get payment history for a loan
   */
  static async getPaymentHistory(req, res, next) {
    try {
      const { tenantId } = req;
      const { loanId } = req.params;

      const payments = await RepaymentService.getPaymentHistory(tenantId, parseInt(loanId));

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: payments
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/money-loan/loans/:loanId/schedule
   * Get repayment schedule for a loan
   */
  static async getRepaymentSchedule(req, res, next) {
    try {
      const { tenantId } = req;
      const { loanId } = req.params;

      const schedule = await RepaymentService.getRepaymentSchedule(tenantId, parseInt(loanId));

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: schedule
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/money-loan/payments/today
   * Get today's collections
   */
  static async getTodayCollections(req, res, next) {
    try {
      const { tenantId } = req;
      const collections = await RepaymentService.getTodayCollections(tenantId);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: collections
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = RepaymentController;
