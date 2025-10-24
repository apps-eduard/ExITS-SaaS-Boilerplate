/**
 * Subscription Plan Controller
 * Handles HTTP requests for subscription plan operations
 */

const SubscriptionPlanService = require('../services/SubscriptionPlanService');
const logger = require('../utils/logger');

class SubscriptionPlanController {
  /**
   * Get all active subscription plans
   * GET /api/subscription-plans
   */
  static async getAllPlans(req, res, next) {
    try {
      logger.info('📋 Fetching all subscription plans');
      
      const plans = await SubscriptionPlanService.getAllPlans();

      res.json({
        success: true,
        data: plans,
        count: plans.length
      });
    } catch (error) {
      logger.error('❌ Error fetching subscription plans:', error);
      next(error);
    }
  }

  /**
   * Get a single plan by name
   * GET /api/subscription-plans/:name
   */
  static async getPlanByName(req, res, next) {
    try {
      const { name } = req.params;
      logger.info(`📋 Fetching subscription plan: ${name}`);

      const plan = await SubscriptionPlanService.getPlanByName(name);

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Subscription plan not found'
        });
      }

      res.json({
        success: true,
        data: plan
      });
    } catch (error) {
      logger.error('❌ Error fetching subscription plan:', error);
      next(error);
    }
  }
}

module.exports = SubscriptionPlanController;
