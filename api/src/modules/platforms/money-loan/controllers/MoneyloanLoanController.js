/**
 * Money Loan - Loan Management Controller
 * Handles HTTP requests for loan lifecycle operations
 */

const moneyloanLoanService = require('../services/MoneyloanLoanService');
const moneyloanValidators = require('../utils/MoneyloanValidators');
const logger = require('../../../../utils/logger');

class MoneyloanLoanController {
  // ═══════════════════════════════════════════════════════════════
  // LOAN APPLICATION ENDPOINTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * POST: Create new loan application
   * Route: POST /api/tenants/:tenantId/platforms/moneyloan/loans/applications
   */
  async createLoanApplication(req, res) {
    try {
      const { tenantId } = req.params;
      const applicationData = req.body;

      // Validate input
      const validation = moneyloanValidators.validateLoanApplication(applicationData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
        });
      }

      const application = await moneyloanLoanService.createLoanApplication(tenantId, applicationData);

      return res.status(201).json({
        success: true,
        message: 'Loan application created successfully',
        data: application,
      });
    } catch (error) {
      logger.error('❌ Error creating loan application:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to create loan application',
        error: error.message,
      });
    }
  }

  /**
   * GET: Fetch loan application details
   * Route: GET /api/tenants/:tenantId/platforms/moneyloan/loans/applications/:applicationId
   */
  async getLoanApplication(req, res) {
    try {
      const { tenantId, applicationId } = req.params;

      const application = await moneyloanLoanService.getLoanApplication(tenantId, applicationId);

      return res.status(200).json({
        success: true,
        message: 'Loan application fetched successfully',
        data: application,
      });
    } catch (error) {
      logger.error('❌ Error fetching loan application:', error);
      return res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        message: 'Failed to fetch loan application',
        error: error.message,
      });
    }
  }

  /**
   * PUT: Update loan application
   * Route: PUT /api/tenants/:tenantId/platforms/moneyloan/loans/applications/:applicationId
   */
  async updateLoanApplication(req, res) {
    try {
      const { tenantId, applicationId } = req.params;
      const updateData = req.body;

      const application = await moneyloanLoanService.updateLoanApplication(tenantId, applicationId, updateData);

      return res.status(200).json({
        success: true,
        message: 'Loan application updated successfully',
        data: application,
      });
    } catch (error) {
      logger.error('❌ Error updating loan application:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to update loan application',
        error: error.message,
      });
    }
  }

  /**
   * POST: Approve loan application
   * Route: POST /api/tenants/:tenantId/platforms/moneyloan/loans/applications/:applicationId/approve
   */
  async approveLoanApplication(req, res) {
    try {
      const { tenantId, applicationId } = req.params;
      const approvalData = req.body;

      // Validate approval data
      const validation = moneyloanValidators.validateLoanApproval(approvalData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
        });
      }

      const loan = await moneyloanLoanService.approveLoanApplication(tenantId, applicationId, approvalData);

      return res.status(200).json({
        success: true,
        message: 'Loan application approved and loan created successfully',
        data: loan,
      });
    } catch (error) {
      logger.error('❌ Error approving loan application:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to approve loan application',
        error: error.message,
      });
    }
  }

  /**
   * POST: Reject loan application
   * Route: POST /api/tenants/:tenantId/platforms/moneyloan/loans/applications/:applicationId/reject
   */
  async rejectLoanApplication(req, res) {
    try {
      const { tenantId, applicationId } = req.params;
      const { reason, rejectedBy } = req.body;

      if (!reason || !rejectedBy) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason and rejectedBy are required',
        });
      }

      const application = await moneyloanLoanService.rejectLoanApplication(tenantId, applicationId, {
        reason,
        rejectedBy,
      });

      return res.status(200).json({
        success: true,
        message: 'Loan application rejected successfully',
        data: application,
      });
    } catch (error) {
      logger.error('❌ Error rejecting loan application:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to reject loan application',
        error: error.message,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // LOAN MANAGEMENT ENDPOINTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * POST: Disburse loan (make funds available)
   * Route: POST /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId/disburse
   */
  async disburseLoan(req, res) {
    try {
      const { tenantId, loanId } = req.params;
      const disbursalData = req.body;

      // Validate disbursement
      const validation = moneyloanValidators.validateDisbursement(disbursalData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
        });
      }

      const loan = await moneyloanLoanService.disburseLoan(tenantId, loanId, disbursalData);

      return res.status(200).json({
        success: true,
        message: 'Loan disbursed successfully',
        data: loan,
      });
    } catch (error) {
      logger.error('❌ Error disbursing loan:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to disburse loan',
        error: error.message,
      });
    }
  }

  /**
   * GET: Fetch loan details
   * Route: GET /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId
   */
  async getLoan(req, res) {
    try {
      const { tenantId, loanId } = req.params;

      const loan = await moneyloanLoanService.getLoan(tenantId, loanId);

      return res.status(200).json({
        success: true,
        message: 'Loan details fetched successfully',
        data: loan,
      });
    } catch (error) {
      logger.error('❌ Error fetching loan:', error);
      return res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        message: 'Failed to fetch loan details',
        error: error.message,
      });
    }
  }

  /**
   * GET: Fetch all loans for a customer
   * Route: GET /api/tenants/:tenantId/platforms/moneyloan/customers/:customerId/loans
   */
  async getCustomerLoans(req, res) {
    try {
      const { tenantId, customerId } = req.params;

      const loans = await moneyloanLoanService.getCustomerLoans(tenantId, customerId);

      return res.status(200).json({
        success: true,
        message: 'Customer loans fetched successfully',
        data: loans,
        count: loans.length,
      });
    } catch (error) {
      logger.error('❌ Error fetching customer loans:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch customer loans',
        error: error.message,
      });
    }
  }

  /**
   * GET: Fetch all loans for a product
   * Route: GET /api/tenants/:tenantId/platforms/moneyloan/products/:productId/loans
   */
  async getProductLoans(req, res) {
    try {
      const { tenantId, productId } = req.params;
      const { status } = req.query;

      const loans = await moneyloanLoanService.getProductLoans(tenantId, productId, status);

      return res.status(200).json({
        success: true,
        message: 'Product loans fetched successfully',
        data: loans,
        count: loans.length,
      });
    } catch (error) {
      logger.error('❌ Error fetching product loans:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch product loans',
        error: error.message,
      });
    }
  }

  /**
   * GET: Fetch loans with filters and pagination
   * Route: GET /api/tenants/:tenantId/platforms/moneyloan/loans
   */
  async getLoansWithFilters(req, res) {
    try {
      const { tenantId } = req.params;
      const filters = {
        status: req.query.status,
        customerId: req.query.customerId,
        loanProductId: req.query.loanProductId,
        createdAfter: req.query.createdAfter,
        createdBefore: req.query.createdBefore,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        orderBy: req.query.orderBy,
        orderDirection: req.query.orderDirection,
      };

      const result = await moneyloanLoanService.getLoansWithFilters(tenantId, filters);

      return res.status(200).json({
        success: true,
        message: 'Loans fetched successfully',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('❌ Error fetching loans with filters:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch loans',
        error: error.message,
      });
    }
  }

  /**
   * POST: Close/Settle a loan
   * Route: POST /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId/close
   */
  async closeLoan(req, res) {
    try {
      const { tenantId, loanId } = req.params;
      const closureData = req.body;

      if (!closureData.closureType || !closureData.closedBy) {
        return res.status(400).json({
          success: false,
          message: 'Closure type and closedBy are required',
        });
      }

      const loan = await moneyloanLoanService.closeLoan(tenantId, loanId, closureData);

      return res.status(200).json({
        success: true,
        message: 'Loan closed successfully',
        data: loan,
      });
    } catch (error) {
      logger.error('❌ Error closing loan:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to close loan',
        error: error.message,
      });
    }
  }

  /**
   * POST: Suspend a loan
   * Route: POST /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId/suspend
   */
  async suspendLoan(req, res) {
    try {
      const { tenantId, loanId } = req.params;
      const { reason, suspendedBy } = req.body;

      if (!reason || !suspendedBy) {
        return res.status(400).json({
          success: false,
          message: 'Suspension reason and suspendedBy are required',
        });
      }

      const loan = await moneyloanLoanService.suspendLoan(tenantId, loanId, {
        reason,
        suspendedBy,
      });

      return res.status(200).json({
        success: true,
        message: 'Loan suspended successfully',
        data: loan,
      });
    } catch (error) {
      logger.error('❌ Error suspending loan:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to suspend loan',
        error: error.message,
      });
    }
  }

  /**
   * POST: Resume a suspended loan
   * Route: POST /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId/resume
   */
  async resumeLoan(req, res) {
    try {
      const { tenantId, loanId } = req.params;

      const loan = await moneyloanLoanService.resumeLoan(tenantId, loanId);

      return res.status(200).json({
        success: true,
        message: 'Loan resumed successfully',
        data: loan,
      });
    } catch (error) {
      logger.error('❌ Error resuming loan:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to resume loan',
        error: error.message,
      });
    }
  }

  /**
   * GET: Dashboard summary
   * Route: GET /api/tenants/:tenantId/platforms/moneyloan/loans/dashboard
   */
  async getLoansDashboard(req, res) {
    try {
      const { tenantId } = req.params;

      const dashboard = await moneyloanLoanService.getLoansDashboard(tenantId);

      return res.status(200).json({
        success: true,
        message: 'Dashboard data fetched successfully',
        data: dashboard,
      });
    } catch (error) {
      logger.error('❌ Error fetching loans dashboard:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data',
        error: error.message,
      });
    }
  }
}

module.exports = new MoneyloanLoanController();
