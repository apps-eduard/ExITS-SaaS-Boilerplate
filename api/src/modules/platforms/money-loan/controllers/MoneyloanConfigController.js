/**
 * Money Loan - Platform Configuration Controller
 * Handles HTTP requests for Money Loan configuration management
 */

const moneyloanConfigService = require('../services/MoneyloanConfigService');
const logger = require('../../../../utils/logger');

class MoneyloanConfigController {
  // ═══════════════════════════════════════════════════════════════
  // INTEREST RATE ENDPOINTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * GET: Fetch all interest rate configurations
   * Route: GET /api/tenants/:tenantId/platforms/moneyloan/config/interest-rates/:loanProductId
   */
  async getInterestRates(req, res) {
    try {
      const { tenantId, loanProductId } = req.params;

      const configs = await moneyloanConfigService.getInterestRateConfigs(tenantId, loanProductId);

      return res.status(200).json({
        success: true,
        message: 'Interest rate configurations fetched successfully',
        data: configs,
        count: configs.length,
      });
    } catch (error) {
      logger.error('❌ Error fetching interest rates:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch interest rate configurations',
        error: error.message,
      });
    }
  }

  /**
   * POST: Create new interest rate configuration
   */
  async createInterestRate(req, res) {
    try {
      const { tenantId, loanProductId } = req.params;
      const configData = req.body;

      const config = await moneyloanConfigService.createInterestRateConfig(tenantId, loanProductId, configData);

      return res.status(201).json({
        success: true,
        message: 'Interest rate configuration created successfully',
        data: config,
      });
    } catch (error) {
      logger.error('❌ Error creating interest rate:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to create interest rate configuration',
        error: error.message,
      });
    }
  }

  /**
   * PUT: Update interest rate configuration
   */
  async updateInterestRate(req, res) {
    try {
      const { tenantId, loanProductId, rateId } = req.params;
      const updateData = req.body;

      const config = await moneyloanConfigService.updateInterestRateConfig(tenantId, loanProductId, rateId, updateData);

      return res.status(200).json({
        success: true,
        message: 'Interest rate configuration updated successfully',
        data: config,
      });
    } catch (error) {
      logger.error('❌ Error updating interest rate:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to update interest rate configuration',
        error: error.message,
      });
    }
  }

  /**
   * DELETE: Remove interest rate configuration
   */
  async deleteInterestRate(req, res) {
    try {
      const { tenantId, loanProductId, rateId } = req.params;

      const deleted = await moneyloanConfigService.deleteInterestRateConfig(tenantId, loanProductId, rateId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Interest rate configuration not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Interest rate configuration deleted successfully',
      });
    } catch (error) {
      logger.error('❌ Error deleting interest rate:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete interest rate configuration',
        error: error.message,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PAYMENT SCHEDULE ENDPOINTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * GET: Fetch all payment schedule configurations
   */
  async getPaymentSchedules(req, res) {
    try {
      const { tenantId, loanProductId } = req.params;

      const configs = await moneyloanConfigService.getPaymentScheduleConfigs(tenantId, loanProductId);

      return res.status(200).json({
        success: true,
        message: 'Payment schedule configurations fetched successfully',
        data: configs,
        count: configs.length,
      });
    } catch (error) {
      logger.error('❌ Error fetching payment schedules:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch payment schedule configurations',
        error: error.message,
      });
    }
  }

  /**
   * POST: Create new payment schedule configuration
   */
  async createPaymentSchedule(req, res) {
    try {
      const { tenantId, loanProductId } = req.params;
      const configData = req.body;

      const config = await moneyloanConfigService.createPaymentScheduleConfig(tenantId, loanProductId, configData);

      return res.status(201).json({
        success: true,
        message: 'Payment schedule configuration created successfully',
        data: config,
      });
    } catch (error) {
      logger.error('❌ Error creating payment schedule:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to create payment schedule configuration',
        error: error.message,
      });
    }
  }

  /**
   * PUT: Update payment schedule configuration
   */
  async updatePaymentSchedule(req, res) {
    try {
      const { tenantId, loanProductId, scheduleId } = req.params;
      const updateData = req.body;

      const config = await moneyloanConfigService.updatePaymentScheduleConfig(tenantId, loanProductId, scheduleId, updateData);

      return res.status(200).json({
        success: true,
        message: 'Payment schedule configuration updated successfully',
        data: config,
      });
    } catch (error) {
      logger.error('❌ Error updating payment schedule:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to update payment schedule configuration',
        error: error.message,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // FEE CONFIGURATION ENDPOINTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * GET: Fetch all fee configurations
   */
  async getFeeConfigs(req, res) {
    try {
      const { tenantId, loanProductId } = req.params;

      const configs = await moneyloanConfigService.getFeeConfigs(tenantId, loanProductId);

      return res.status(200).json({
        success: true,
        message: 'Fee configurations fetched successfully',
        data: configs,
        count: configs.length,
      });
    } catch (error) {
      logger.error('❌ Error fetching fee configs:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch fee configurations',
        error: error.message,
      });
    }
  }

  /**
   * POST: Create new fee configuration
   */
  async createFeeConfig(req, res) {
    try {
      const { tenantId, loanProductId } = req.params;
      const configData = req.body;

      const config = await moneyloanConfigService.createFeeConfig(tenantId, loanProductId, configData);

      return res.status(201).json({
        success: true,
        message: 'Fee configuration created successfully',
        data: config,
      });
    } catch (error) {
      logger.error('❌ Error creating fee config:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to create fee configuration',
        error: error.message,
      });
    }
  }

  /**
   * PUT: Update fee configuration
   */
  async updateFeeConfig(req, res) {
    try {
      const { tenantId, loanProductId, feeId } = req.params;
      const updateData = req.body;

      const config = await moneyloanConfigService.updateFeeConfig(tenantId, loanProductId, feeId, updateData);

      return res.status(200).json({
        success: true,
        message: 'Fee configuration updated successfully',
        data: config,
      });
    } catch (error) {
      logger.error('❌ Error updating fee config:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to update fee configuration',
        error: error.message,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // APPROVAL RULES ENDPOINTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * GET: Fetch all approval rule configurations
   */
  async getApprovalRules(req, res) {
    try {
      const { tenantId, loanProductId } = req.params;

      const configs = await moneyloanConfigService.getApprovalRuleConfigs(tenantId, loanProductId);

      return res.status(200).json({
        success: true,
        message: 'Approval rule configurations fetched successfully',
        data: configs,
        count: configs.length,
      });
    } catch (error) {
      logger.error('❌ Error fetching approval rules:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch approval rule configurations',
        error: error.message,
      });
    }
  }

  /**
   * POST: Create new approval rule configuration
   */
  async createApprovalRule(req, res) {
    try {
      const { tenantId, loanProductId } = req.params;
      const configData = req.body;

      const config = await moneyloanConfigService.createApprovalRuleConfig(tenantId, loanProductId, configData);

      return res.status(201).json({
        success: true,
        message: 'Approval rule configuration created successfully',
        data: config,
      });
    } catch (error) {
      logger.error('❌ Error creating approval rule:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to create approval rule configuration',
        error: error.message,
      });
    }
  }

  /**
   * PUT: Update approval rule configuration
   */
  async updateApprovalRule(req, res) {
    try {
      const { tenantId, loanProductId, ruleId } = req.params;
      const updateData = req.body;

      const config = await moneyloanConfigService.updateApprovalRuleConfig(tenantId, loanProductId, ruleId, updateData);

      return res.status(200).json({
        success: true,
        message: 'Approval rule configuration updated successfully',
        data: config,
      });
    } catch (error) {
      logger.error('❌ Error updating approval rule:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to update approval rule configuration',
        error: error.message,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // LOAN MODIFICATIONS ENDPOINTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * GET: Fetch all loan modifications
   */
  async getLoanModifications(req, res) {
    try {
      const { tenantId, loanId } = req.params;

      const modifications = await moneyloanConfigService.getLoanModifications(tenantId, loanId);

      return res.status(200).json({
        success: true,
        message: 'Loan modifications fetched successfully',
        data: modifications,
        count: modifications.length,
      });
    } catch (error) {
      logger.error('❌ Error fetching loan modifications:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch loan modifications',
        error: error.message,
      });
    }
  }

  /**
   * POST: Create new loan modification
   */
  async createLoanModification(req, res) {
    try {
      const { tenantId, loanId } = req.params;
      const modificationData = req.body;

      const modification = await moneyloanConfigService.createLoanModification(tenantId, loanId, modificationData);

      return res.status(201).json({
        success: true,
        message: 'Loan modification created successfully',
        data: modification,
      });
    } catch (error) {
      logger.error('❌ Error creating loan modification:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to create loan modification',
        error: error.message,
      });
    }
  }

  /**
   * PUT: Update loan modification
   */
  async updateLoanModification(req, res) {
    try {
      const { tenantId, modificationId } = req.params;
      const updateData = req.body;

      const modification = await moneyloanConfigService.updateLoanModification(tenantId, modificationId, updateData);

      return res.status(200).json({
        success: true,
        message: 'Loan modification updated successfully',
        data: modification,
      });
    } catch (error) {
      logger.error('❌ Error updating loan modification:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to update loan modification',
        error: error.message,
      });
    }
  }

  /**
   * POST: Approve loan modification
   */
  async approveLoanModification(req, res) {
    try {
      const { tenantId, modificationId } = req.params;
      const { approvedBy, effectiveDate } = req.body;

      const modification = await moneyloanConfigService.approveLoanModification(tenantId, modificationId, {
        approvedBy,
        effectiveDate,
      });

      return res.status(200).json({
        success: true,
        message: 'Loan modification approved successfully',
        data: modification,
      });
    } catch (error) {
      logger.error('❌ Error approving loan modification:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to approve loan modification',
        error: error.message,
      });
    }
  }

  /**
   * POST: Reject loan modification
   */
  async rejectLoanModification(req, res) {
    try {
      const { tenantId, modificationId } = req.params;
      const { reason } = req.body;

      const modification = await moneyloanConfigService.rejectLoanModification(tenantId, modificationId, reason);

      return res.status(200).json({
        success: true,
        message: 'Loan modification rejected successfully',
        data: modification,
      });
    } catch (error) {
      logger.error('❌ Error rejecting loan modification:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to reject loan modification',
        error: error.message,
      });
    }
  }
}

module.exports = new MoneyloanConfigController();
