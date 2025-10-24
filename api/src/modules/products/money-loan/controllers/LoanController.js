const LoanService = require('../services/LoanService');
const CONSTANTS = require('../../../../config/constants');

class LoanController {
  /**
   * POST /api/money-loan/loans
   * Create new loan
   */
  static async createLoan(req, res, next) {
    try {
      const { tenantId, userId } = req;
      const loan = await LoanService.createLoan(tenantId, req.body, userId);

      res.status(CONSTANTS.HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Loan created successfully',
        data: loan
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/money-loan/loans
   * List all loans
   */
  static async listLoans(req, res, next) {
    try {
      const { tenantId } = req;
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        status: req.query.status,
        customerId: req.query.customerId,
        search: req.query.search
      };

      const result = await LoanService.listLoans(tenantId, filters);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: 'Loans retrieved successfully',
        data: result.loans,
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/money-loan/loans/overview
   * Get loan overview statistics
   */
  static async getLoanOverview(req, res, next) {
    try {
      const { tenantId } = req;
      const overview = await LoanService.getLoanOverview(tenantId);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: overview
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/money-loan/loans/:id
   * Get loan by ID
   */
  static async getLoan(req, res, next) {
    try {
      const { tenantId } = req;
      const { id } = req.params;

      const loan = await LoanService.getLoanById(tenantId, parseInt(id));

      if (!loan) {
        return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Loan not found'
        });
      }

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: loan
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/money-loan/loans/:id/status
   * Update loan status
   */
  static async updateLoanStatus(req, res, next) {
    try {
      const { tenantId, userId } = req;
      const { id } = req.params;
      const { status } = req.body;

      const loan = await LoanService.updateLoanStatus(tenantId, parseInt(id), status, userId);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: 'Loan status updated successfully',
        data: loan
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = LoanController;
