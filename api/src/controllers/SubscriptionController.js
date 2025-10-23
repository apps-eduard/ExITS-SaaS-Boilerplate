/**
 * Subscription Controller
 * Handles subscription plans and tenant subscriptions
 */

const pool = require('../config/database');
const logger = require('../utils/logger');
const CONSTANTS = require('../config/constants');

class SubscriptionController {
  /**
   * GET /subscriptions/plans
   * Get all subscription plans
   */
  static async getPlans(req, res, next) {
    try {
      const result = await pool.query(
        `SELECT id, name, description, price, billing_cycle, features, max_users, max_storage_gb, status, created_at, updated_at
         FROM subscription_plans
         WHERE status = 'active'
         ORDER BY price ASC`
      );

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: result.rows,
        message: 'Subscription plans retrieved successfully'
      });
    } catch (err) {
      logger.error(`Subscription controller get plans error: ${err.message}`);
      next(err);
    }
  }

  /**
   * GET /subscriptions/plans/:id
   * Get a specific plan by ID
   */
  static async getPlan(req, res, next) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT id, name, description, price, billing_cycle, features, max_users, max_storage_gb, status, created_at, updated_at
         FROM subscription_plans
         WHERE id = $1 AND status = 'active'`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Subscription plan not found'
        });
      }

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: result.rows[0],
        message: 'Subscription plan retrieved successfully'
      });
    } catch (err) {
      logger.error(`Subscription controller get plan error: ${err.message}`);
      next(err);
    }
  }

  /**
   * GET /subscriptions/plans/by-name/:name
   * Get a plan by name (case-insensitive)
   */
  static async getPlanByName(req, res, next) {
    try {
      const { name } = req.params;

      const result = await pool.query(
        `SELECT id, name, description, price, billing_cycle, features, max_users, max_storage_gb, status, created_at, updated_at
         FROM subscription_plans
         WHERE LOWER(name) = LOWER($1) AND status = 'active'`,
        [name]
      );

      if (result.rows.length === 0) {
        return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Subscription plan not found'
        });
      }

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: result.rows[0],
        message: 'Subscription plan retrieved successfully'
      });
    } catch (err) {
      logger.error(`Subscription controller get plan by name error: ${err.message}`);
      next(err);
    }
  }
}

module.exports = SubscriptionController;
