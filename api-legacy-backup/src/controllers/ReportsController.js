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
   * Get tenant transaction history from payment_history table
   */
  static async getSubscriptionHistory(req, res, next) {
    try {
      // Query payment_history table for all tenant transactions
      const result = await pool.query(
        `SELECT 
          ph.id,
          ph.tenant_id,
          t.name as tenant_name,
          ph.transaction_id as invoice_id,
          INITCAP(ph.transaction_type) as type,
          ph.amount,
          ph.provider as payment_method,
          ph.status,
          ph.processed_at as payment_date,
          ph.created_at,
          ph.updated_at,
          ph.plan_name,
          ph.platform_type,  -- Fixed: was product_type
          CASE 
            WHEN ph.description IS NOT NULL AND ph.description != '' THEN ph.description
            WHEN ph.plan_name IS NOT NULL THEN 
              'Subscribed to ' || COALESCE(ph.platform_type, 'Product') || ' - ' || ph.plan_name ||  -- Fixed: was product_type
              CASE 
                WHEN ph.description LIKE '%monthly%' THEN ' - monthly billing'
                WHEN ph.description LIKE '%yearly%' THEN ' - yearly billing'
                ELSE ''
              END
            ELSE 'Transaction #' || COALESCE(ph.transaction_id, ph.id::text)
          END as description,
          CASE 
            WHEN ph.transaction_id IS NOT NULL AND ph.transaction_id != '' 
            THEN ph.transaction_id
            ELSE 'INV-' || TO_CHAR(ph.created_at, 'YYYYMMDD') || '-' || ph.id
          END as invoice
         FROM payment_history ph
         JOIN tenants t ON ph.tenant_id = t.id
         ORDER BY ph.created_at DESC`,
      );

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: result.rows || [],
        message: result.rows.length > 0 ? 'Transaction history retrieved successfully' : 'No transaction history found',
      });
    } catch (err) {
      logger.error(`Reports controller transaction history error: ${err.message}`);
      logger.error(`Error stack: ${err.stack}`);
      
      // Send user-friendly error message
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to load transaction history. The payment history table may not exist yet.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }
}

module.exports = ReportsController;
