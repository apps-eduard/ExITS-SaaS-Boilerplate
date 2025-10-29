/**
 * Product Subscription Service
 * Manages tenant subscriptions to individual products (Money Loan, BNPL, Pawnshop)
 */

const knex = require('../config/knex');
const logger = require('../utils/logger');

class ProductSubscriptionService {
  /**
   * Get all product subscriptions for a tenant
   */
  static async getTenantProductSubscriptions(tenantId) {
    try {
      const subscriptions = await knex('platformSubscriptions as ps')
        .leftJoin('subscriptionPlans as sp', 'ps.subscriptionPlanId', 'sp.id')
        .select(
          'ps.id',
          'ps.tenantId',
          'ps.platformType',
          'ps.subscriptionPlanId',
          'ps.status',
          'ps.startedAt as startsAt',
          'ps.expiresAt',
          'ps.price',
          'ps.billingCycle',
          'ps.metadata',
          'ps.createdAt',
          'ps.updatedAt',
          knex.raw(`json_build_object(
            'id', sp.id,
            'name', sp.name,
            'description', sp.description,
            'price', sp.price,
            'billingCycle', sp.billing_cycle,
            'features', sp.features,
            'maxUsers', sp.max_users,
            'maxStorageGb', sp.max_storage_gb
          ) as subscriptionPlan`),
        )
        .where('ps.tenantId', tenantId)
        .orderBy('ps.platformType');

      return subscriptions;
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
      const { subscriptionPlanId, billingCycle, startsAt, expiresAt } = subscriptionData;

      // Fetch the price from subscription plan
      const plan = await knex('subscriptionPlans')
        .select('price')
        .where({ id: subscriptionPlanId })
        .first();

      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      const price = plan.price;

      // Calculate expires_at if not provided based on billing cycle
      let expiresAtValue = expiresAt;
      if (!expiresAtValue) {
        const startDate = startsAt || knex.fn.now();
        switch (billingCycle) {
          case 'monthly':
            expiresAtValue = knex.raw("COALESCE(?, CURRENT_TIMESTAMP) + INTERVAL '1 month'", [startsAt]);
            break;
          case 'quarterly':
            expiresAtValue = knex.raw("COALESCE(?, CURRENT_TIMESTAMP) + INTERVAL '3 months'", [startsAt]);
            break;
          case 'yearly':
            expiresAtValue = knex.raw("COALESCE(?, CURRENT_TIMESTAMP) + INTERVAL '1 year'", [startsAt]);
            break;
          default:
            expiresAtValue = knex.raw("COALESCE(?, CURRENT_TIMESTAMP) + INTERVAL '1 month'", [startsAt]);
        }
      }

      const [subscription] = await knex('platformSubscriptions')
        .insert({
          tenantId,
          platformType: productType,
          subscriptionPlanId,
          price,
          billingCycle,
          startedAt: startsAt || knex.fn.now(),
          expiresAt: expiresAtValue,
          status: 'active',
        })
        .onConflict(['tenantId', 'platformType'])
        .merge({
          subscriptionPlanId,
          price,
          billingCycle,
          startedAt: startsAt || knex.fn.now(),
          expiresAt: expiresAtValue,
          status: 'active',
          updatedAt: knex.fn.now(),
        })
        .returning('*');

      // Update tenant enabled flag
      const enabledField = `${productType}Enabled`;
      await knex('tenants')
        .where({ id: tenantId })
        .update({ [enabledField]: true });

      logger.info(`Tenant ${tenantId} subscribed to product: ${productType}`);
      return subscription;
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
      const [subscription] = await knex('platformSubscriptions')
        .where({ tenantId, platformType: productType })
        .update({
          status: 'cancelled',
          updatedAt: knex.fn.now()
        })
        .returning('*');

      // Update tenant enabled flag
      await knex('tenants')
        .where({ id: tenantId })
        .update({ [`${productType}Enabled`]: false });

      logger.info(`Tenant ${tenantId} unsubscribed from product: ${productType}`);
      return subscription;
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
      console.log('🔄 Updating product subscription:', { tenantId, productType, updateData });
      
      const { subscription_plan_id, billing_cycle, expires_at, status } = updateData;
      
      const fieldsToUpdate = {};

      // If subscription_plan_id is being updated, fetch the new price
      if (subscription_plan_id !== undefined) {
        const plan = await knex('subscriptionPlans')
          .select('price')
          .where({ id: subscription_plan_id })
          .first();

        if (!plan) {
          throw new Error('Subscription plan not found');
        }

        fieldsToUpdate.subscriptionPlanId = subscription_plan_id;
        fieldsToUpdate.price = plan.price;
      }

      if (billing_cycle !== undefined) {
        fieldsToUpdate.billingCycle = billing_cycle;
      }

      if (expires_at !== undefined) {
        fieldsToUpdate.expiresAt = expires_at;
      }

      if (status !== undefined) {
        fieldsToUpdate.status = status;
      }

      if (Object.keys(fieldsToUpdate).length === 0) {
        throw new Error('No fields to update');
      }

      // Add updatedAt
      fieldsToUpdate.updatedAt = knex.fn.now();

      console.log('📝 Fields to update:', fieldsToUpdate);

      const [subscription] = await knex('platformSubscriptions')
        .where({ tenantId, platformType: productType })
        .update(fieldsToUpdate)
        .returning('*');

      console.log('✅ Update result:', subscription);

      if (!subscription) {
        throw new Error('Product subscription not found');
      }

      logger.info(`Product subscription updated: Tenant ${tenantId}, Product ${productType}`);
      return subscription;
    } catch (err) {
      logger.error(`Error updating product subscription: ${err.message}`);
      console.error('❌ Update error:', err);
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
