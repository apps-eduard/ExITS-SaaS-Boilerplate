/**
 * Product Subscription Service
 * Manages tenant subscriptions to individual products (Money Loan, BNPL, Pawnshop)
 */

const pool = require('../config/database');
const logger = require('../utils/logger');

class ProductSubscriptionService {
  /**
   * Get all product subscriptions for a tenant
   */
  static async getTenantProductSubscriptions(tenantId) {
    try {
      const result = await pool.query(
        `SELECT 
          ps.id,
          ps.tenant_id,
          ps.product_type,
          ps.status,
          ps.started_at,
          ps.expires_at,
          ps.price,
          ps.billing_cycle,
          ps.metadata,
          ps.created_at,
          ps.updated_at,
          sp.name as plan_name,
          sp.description as plan_description
         FROM product_subscriptions ps
         LEFT JOIN subscription_plans sp ON ps.subscription_plan_id = sp.id
         WHERE ps.tenant_id = $1
         ORDER BY ps.product_type`,
        [tenantId]
      );

      return result.rows;
    } catch (err) {
      logger.error(`Error getting product subscriptions: ${err.message}`);
      throw err;
    }
  }

  /**
   * Subscribe tenant to a product
   */
  static async subscribeToProduct(tenantId, productType, subscriptionData) {
    try {
      const { subscription_plan_id, price, billing_cycle, expires_at } = subscriptionData;

      const result = await pool.query(
        `INSERT INTO product_subscriptions 
          (tenant_id, product_type, subscription_plan_id, price, billing_cycle, expires_at, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'active')
         ON CONFLICT (tenant_id, product_type) 
         DO UPDATE SET
           subscription_plan_id = EXCLUDED.subscription_plan_id,
           price = EXCLUDED.price,
           billing_cycle = EXCLUDED.billing_cycle,
           expires_at = EXCLUDED.expires_at,
           status = 'active',
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [tenantId, productType, subscription_plan_id, price, billing_cycle, expires_at]
      );

      // Update tenant enabled flag
      const enabledField = `${productType}_enabled`;
      await pool.query(
        `UPDATE tenants SET ${enabledField} = true WHERE id = $1`,
        [tenantId]
      );

      logger.info(`Tenant ${tenantId} subscribed to product: ${productType}`);
      return result.rows[0];
    } catch (err) {
      logger.error(`Error subscribing to product: ${err.message}`);
      throw err;
    }
  }

  /**
   * Unsubscribe tenant from a product
   */
  static async unsubscribeFromProduct(tenantId, productType) {
    try {
      const result = await pool.query(
        `UPDATE product_subscriptions 
         SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
         WHERE tenant_id = $1 AND product_type = $2
         RETURNING *`,
        [tenantId, productType]
      );

      // Update tenant enabled flag
      const enabledField = `${productType}_enabled`;
      await pool.query(
        `UPDATE tenants SET ${enabledField} = false WHERE id = $1`,
        [tenantId]
      );

      logger.info(`Tenant ${tenantId} unsubscribed from product: ${productType}`);
      return result.rows[0];
    } catch (err) {
      logger.error(`Error unsubscribing from product: ${err.message}`);
      throw err;
    }
  }

  /**
   * Update product subscription
   */
  static async updateProductSubscription(tenantId, productType, updateData) {
    try {
      const { price, billing_cycle, expires_at, status } = updateData;
      
      const fieldsToUpdate = [];
      const values = [tenantId, productType];
      let paramCount = 3;

      if (price !== undefined) {
        fieldsToUpdate.push(`price = $${paramCount++}`);
        values.push(price);
      }

      if (billing_cycle !== undefined) {
        fieldsToUpdate.push(`billing_cycle = $${paramCount++}`);
        values.push(billing_cycle);
      }

      if (expires_at !== undefined) {
        fieldsToUpdate.push(`expires_at = $${paramCount++}`);
        values.push(expires_at);
      }

      if (status !== undefined) {
        fieldsToUpdate.push(`status = $${paramCount++}`);
        values.push(status);
      }

      if (fieldsToUpdate.length === 0) {
        throw new Error('No fields to update');
      }

      const query = `
        UPDATE product_subscriptions
        SET ${fieldsToUpdate.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = $1 AND product_type = $2
        RETURNING *
      `;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Product subscription not found');
      }

      logger.info(`Product subscription updated: Tenant ${tenantId}, Product ${productType}`);
      return result.rows[0];
    } catch (err) {
      logger.error(`Error updating product subscription: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get available products (all product types)
   */
  static async getAvailableProducts() {
    return [
      {
        type: 'money_loan',
        name: 'Money Loan',
        description: 'Loan management system with automated workflows',
        icon: '💵',
        features: [
          'Loan application processing',
          'Payment tracking',
          'Interest calculation',
          'Credit scoring',
          'Automated reminders'
        ]
      },
      {
        type: 'bnpl',
        name: 'Buy Now Pay Later',
        description: 'Flexible payment plans for customers',
        icon: '💳',
        features: [
          'Installment plans',
          'Payment scheduling',
          'Customer credit limits',
          'Merchant integration',
          'Transaction monitoring'
        ]
      },
      {
        type: 'pawnshop',
        name: 'Pawnshop Management',
        description: 'Complete pawnshop operations management',
        icon: '💎',
        features: [
          'Item appraisal',
          'Pawn ticket management',
          'Inventory tracking',
          'Redemption processing',
          'Auction management'
        ]
      }
    ];
  }
}

module.exports = ProductSubscriptionService;
