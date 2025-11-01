/**
 * Subscription Plan Service
 * Handles subscription plan management
 */

const knex = require('../config/knex');
const logger = require('../utils/logger');

class SubscriptionPlanService {
  /**
   * Transform database plan object to camelCase
   */
  static transformPlan(dbPlan) {
    if (!dbPlan) return null;
    
    // Determine icon based on plan name if not in database
    const iconMap = {
      'trial': '🎯',
      'starter': '📦',
      'pro': '🚀',
      'professional': '🚀',
      'enterprise': '⭐'
    };
    
    const icon = dbPlan.icon || iconMap[dbPlan.name.toLowerCase()] || '📦';
    
    // Features are stored in the database with icons already, just return them as-is
    let features = [];
    if (dbPlan.features) {
      const featuresData = typeof dbPlan.features === 'string' 
        ? JSON.parse(dbPlan.features) 
        : dbPlan.features;
      
      // If features are already an array (with icons), use them directly
      if (Array.isArray(featuresData)) {
        features = featuresData;
      } else {
        // Legacy support: if features are stored as object, convert to array
        // But this shouldn't happen anymore as all features now have icons
        features = Object.entries(featuresData)
          .filter(([key, value]) => value === true)
          .map(([key]) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
      }
    }
    
    return {
      id: dbPlan.id,
      name: dbPlan.name,
      displayName: dbPlan.name.charAt(0).toUpperCase() + dbPlan.name.slice(1), // Capitalize name
      description: dbPlan.description,
      icon: icon,
      price: parseFloat(dbPlan.price),
      billingCycle: dbPlan.billingCycle,  // Already camelCase from Knex
      maxUsers: dbPlan.maxUsers,  // Already camelCase from Knex
      maxStorageGb: dbPlan.maxStorageGb,  // Already camelCase from Knex
      features: features,
      productType: dbPlan.platformType,  // Already camelCase from Knex
      isActive: dbPlan.status === 'active',
      isRecommended: dbPlan.name.toLowerCase() === 'pro' || dbPlan.name.toLowerCase() === 'professional', // Pro is recommended,
      createdAt: dbPlan.createdAt,  // Already camelCase from Knex
      updatedAt: dbPlan.updatedAt  // Already camelCase from Knex
    };
  }

  /**
   * Get all active subscription plans
   */
  static async getAllPlans() {
    try {
      // Only return platform subscription plans (platform_type IS NULL)
      // Platform-specific plans are handled separately
      const plans = await knex('subscriptionPlans')
        .whereNull('platformType')
        .where({ status: 'active' })
        .orderBy('price', 'asc');

      return plans.map(this.transformPlan);
    } catch (err) {
      logger.error(`Error getting all plans: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get ALL subscription plans including product-specific plans
   * Used for admin panel when configuring tenant products
   */
  static async getAllPlansIncludingProducts() {
    try {
      // Return ALL active plans (both platform and platform-specific)
      const plans = await knex('subscriptionPlans')
        .where({ status: 'active' })
        .orderByRaw(`
          CASE 
            WHEN platform_type IS NULL THEN 0 
            ELSE 1 
          END,
          platform_type,
          price ASC
        `);

      return plans.map(this.transformPlan);
    } catch (err) {
      logger.error(`Error getting all plans including products: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get a single plan by name
   */
  static async getPlanByName(planName) {
    try {
      const plan = await knex('subscriptionPlans')
        .whereRaw('LOWER(name) = LOWER(?)', [planName])
        .where({ status: 'active' })
        .first();

      if (!plan) {
        return null;
      }

      return this.transformPlan(plan);
    } catch (err) {
      logger.error(`Error getting plan by name: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get a single plan by ID
   */
  static async getPlanById(planId) {
    try {
      const plan = await knex('subscriptionPlans')
        .where({ id: planId })
        .first();

      if (!plan) {
        return null;
      }

      return this.transformPlan(plan);
    } catch (err) {
      logger.error(`Error getting plan by ID: ${err.message}`);
      throw err;
    }
  }
}

module.exports = SubscriptionPlanService;
