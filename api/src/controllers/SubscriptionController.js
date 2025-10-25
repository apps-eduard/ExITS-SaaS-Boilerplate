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
   * Get all subscription plans with subscriber counts from both tables
   */
  static async getPlans(req, res, next) {
    try {
      const result = await pool.query(
        `SELECT sp.id, sp.name, sp.description, sp.price, sp.billing_cycle, sp.features, 
                sp.max_users, sp.max_storage_gb, sp.status, sp.product_type, 
                sp.trial_days, sp.is_featured, sp.custom_pricing,
                sp.created_at, sp.updated_at,
                (
                  -- Count from tenant_subscriptions (Platform plans)
                  SELECT COUNT(*) 
                  FROM tenant_subscriptions ts 
                  WHERE ts.plan_id = sp.id AND ts.status = 'active'
                ) + (
                  -- Count from product_subscriptions (Money Loan, BNPL, Pawnshop plans)
                  SELECT COUNT(*) 
                  FROM product_subscriptions ps 
                  WHERE ps.subscription_plan_id = sp.id AND ps.status::text = 'active'
                ) as subscriber_count
         FROM subscription_plans sp
         WHERE sp.status = 'active'
         ORDER BY sp.price ASC`
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

  /**
   * GET /subscriptions/plans/:id/subscribers
   * Get subscriber count for a plan
   */
  static async getPlanSubscriberCount(req, res, next) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT COUNT(*) as count
         FROM product_subscriptions
         WHERE subscription_plan_id = $1 AND status = 'active'`,
        [id]
      );

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        count: parseInt(result.rows[0].count) || 0,
        message: 'Subscriber count retrieved successfully'
      });
    } catch (err) {
      logger.error(`Subscription controller get subscriber count error: ${err.message}`);
      next(err);
    }
  }

  /**
   * POST /subscriptions/plans
   * Create a new subscription plan
   */
  static async createPlan(req, res, next) {
    try {
      const {
        name,
        description,
        price,
        billing_cycle,
        features,
        max_users,
        max_storage_gb,
        status,
        product_type,
        trial_days,
        is_featured,
        custom_pricing
      } = req.body;

      // Validate required fields
      if (!name || !description || price === undefined || !billing_cycle) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Missing required fields: name, description, price, billing_cycle'
        });
      }

      // Check if plan with same name exists
      const existingPlan = await pool.query(
        'SELECT id FROM subscription_plans WHERE LOWER(name) = LOWER($1)',
        [name]
      );

      if (existingPlan.rows.length > 0) {
        return res.status(CONSTANTS.HTTP_STATUS.CONFLICT).json({
          success: false,
          message: 'A plan with this name already exists'
        });
      }

      const result = await pool.query(
        `INSERT INTO subscription_plans 
         (name, description, price, billing_cycle, features, max_users, max_storage_gb, status, 
          product_type, trial_days, is_featured, custom_pricing)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id, name, description, price, billing_cycle, features, max_users, max_storage_gb, 
                   status, product_type, trial_days, is_featured, custom_pricing, created_at, updated_at`,
        [
          name,
          description,
          price,
          billing_cycle,
          JSON.stringify(features || []),
          max_users || null,
          max_storage_gb || null,
          status || 'active',
          product_type || 'platform',
          trial_days || 0,
          is_featured || false,
          custom_pricing || false
        ]
      );

      logger.info(`New subscription plan created: ${name}`);

      res.status(CONSTANTS.HTTP_STATUS.CREATED).json({
        success: true,
        data: result.rows[0],
        message: 'Subscription plan created successfully'
      });
    } catch (err) {
      logger.error(`Subscription controller create plan error: ${err.message}`);
      next(err);
    }
  }

  /**
   * PUT /subscriptions/plans/:id
   * Update a subscription plan
   */
  static async updatePlan(req, res, next) {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        price,
        billing_cycle,
        features,
        max_users,
        max_storage_gb,
        status,
        product_type,
        trial_days,
        is_featured,
        custom_pricing
      } = req.body;

      // Check if plan exists
      const existingPlan = await pool.query(
        'SELECT id FROM subscription_plans WHERE id = $1',
        [id]
      );

      if (existingPlan.rows.length === 0) {
        return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Subscription plan not found'
        });
      }

      // Check if new name conflicts with another plan
      if (name) {
        const nameCheck = await pool.query(
          'SELECT id FROM subscription_plans WHERE LOWER(name) = LOWER($1) AND id != $2',
          [name, id]
        );

        if (nameCheck.rows.length > 0) {
          return res.status(CONSTANTS.HTTP_STATUS.CONFLICT).json({
            success: false,
            message: 'A plan with this name already exists'
          });
        }
      }

      const result = await pool.query(
        `UPDATE subscription_plans
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             price = COALESCE($3, price),
             billing_cycle = COALESCE($4, billing_cycle),
             features = COALESCE($5, features),
             max_users = COALESCE($6, max_users),
             max_storage_gb = COALESCE($7, max_storage_gb),
             status = COALESCE($8, status),
             product_type = COALESCE($9, product_type),
             trial_days = COALESCE($10, trial_days),
             is_featured = COALESCE($11, is_featured),
             custom_pricing = COALESCE($12, custom_pricing),
             updated_at = NOW()
         WHERE id = $13
         RETURNING id, name, description, price, billing_cycle, features, max_users, max_storage_gb, 
                   status, product_type, trial_days, is_featured, custom_pricing, created_at, updated_at`,
        [
          name, 
          description, 
          price, 
          billing_cycle, 
          features ? JSON.stringify(features) : undefined, 
          max_users, 
          max_storage_gb, 
          status,
          product_type,
          trial_days,
          is_featured,
          custom_pricing,
          id
        ]
      );

      logger.info(`Subscription plan updated: ${id}`);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: result.rows[0],
        message: 'Subscription plan updated successfully'
      });
    } catch (err) {
      logger.error(`Subscription controller update plan error: ${err.message}`);
      next(err);
    }
  }

  /**
   * DELETE /subscriptions/plans/:id
   * Delete (soft delete) a subscription plan
   */
  static async deletePlan(req, res, next) {
    try {
      const { id } = req.params;

      // Check if plan exists
      const existingPlan = await pool.query(
        'SELECT id, name FROM subscription_plans WHERE id = $1',
        [id]
      );

      if (existingPlan.rows.length === 0) {
        return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Subscription plan not found'
        });
      }

      // Check if plan has active subscriptions
      const activeSubscriptions = await pool.query(
        'SELECT COUNT(*) as count FROM product_subscriptions WHERE subscription_plan_id = $1 AND status = $2',
        [id, 'active']
      );

      if (parseInt(activeSubscriptions.rows[0].count) > 0) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Cannot delete plan with active subscriptions. Please deactivate it instead.'
        });
      }

      // Soft delete by setting status to inactive
      await pool.query(
        `UPDATE subscription_plans
         SET status = 'inactive', updated_at = NOW()
         WHERE id = $1`,
        [id]
      );

      logger.info(`Subscription plan deleted: ${existingPlan.rows[0].name}`);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: 'Subscription plan deleted successfully'
      });
    } catch (err) {
      logger.error(`Subscription controller delete plan error: ${err.message}`);
      next(err);
    }
  }

  /**
   * GET /subscriptions/plans/all/including-products
   * Get ALL subscription plans including product-specific plans
   * Used for admin panel when editing tenants
   */
  static async getAllPlansIncludingProducts(req, res, next) {
    try {
      const result = await pool.query(
        `SELECT id, name, description, price, billing_cycle, features, 
                max_users, max_storage_gb, product_type, status, created_at, updated_at
         FROM subscription_plans
         WHERE status = 'active'
         ORDER BY 
           CASE 
             WHEN product_type IS NULL THEN 0 
             ELSE 1 
           END,
           product_type,
           price ASC`
      );

      // Transform to camelCase
      const transformedPlans = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        price: parseFloat(row.price),
        billing_cycle: row.billing_cycle,
        billingCycle: row.billing_cycle, // Add camelCase version
        features: row.features,
        maxUsers: row.max_users,
        maxStorageGb: row.max_storage_gb,
        productType: row.product_type, // Transform to camelCase
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      logger.info(`All subscription plans retrieved (including products): ${transformedPlans.length} plans`);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: transformedPlans,
        message: 'All subscription plans retrieved successfully'
      });
    } catch (err) {
      logger.error(`Subscription controller get all plans error: ${err.message}`);
      next(err);
    }
  }
}

module.exports = SubscriptionController;
