/**
 * Reports Controller
 * Handles reporting endpoints
 */

const pool = require('../config/database');
const logger = require('../utils/logger');
const CONSTANTS = require('../config/constants');

class ReportsController {
  /**
   * GET /reports/subscription-history
   * Get complete subscription history (tenant subscriptions + product subscriptions)
   */
  static async getSubscriptionHistory(req, res, next) {
    try {
      // Query combines both tenant_subscriptions (Platform) and product_subscriptions (Money Loan, BNPL, Pawnshop)
      const result = await pool.query(
        `-- Platform subscriptions (tenant_subscriptions)
         SELECT 
          ts.id,
          ts.tenant_id,
          t.name as tenant_name,
          ts.plan_id,
          sp.name as plan_name,
          sp.product_type::text as product_type,
          ts.status::text as status,
          ts.monthly_price,
          ts.started_at,
          ts.expires_at,
          ts.cancelled_at,
          ts.cancellation_reason,
          ts.created_at,
          ts.updated_at
         FROM tenant_subscriptions ts
         JOIN tenants t ON ts.tenant_id = t.id
         JOIN subscription_plans sp ON ts.plan_id = sp.id
         
         UNION ALL
         
         -- Product subscriptions (product_subscriptions: Money Loan, BNPL, Pawnshop)
         SELECT 
          ps.id,
          ps.tenant_id,
          t.name as tenant_name,
          ps.subscription_plan_id as plan_id,
          sp.name as plan_name,
          ps.product_type::text as product_type,
          ps.status::text as status,
          ps.price as monthly_price,
          ps.started_at,
          ps.expires_at,
          NULL as cancelled_at,
          NULL as cancellation_reason,
          ps.created_at,
          ps.updated_at
         FROM product_subscriptions ps
         JOIN tenants t ON ps.tenant_id = t.id
         LEFT JOIN subscription_plans sp ON ps.subscription_plan_id = sp.id
         
         ORDER BY created_at DESC`
      );

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: result.rows,
        message: 'Subscription history retrieved successfully'
      });
    } catch (err) {
      logger.error(`Reports controller subscription history error: ${err.message}`);
      next(err);
    }
  }
}

module.exports = ReportsController;
