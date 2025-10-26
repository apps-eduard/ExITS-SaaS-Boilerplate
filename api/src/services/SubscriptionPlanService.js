/**
 * Subscription Plan Service
 * Handles subscription plan management
 */

const pool = require('../config/database');
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
      billingCycle: dbPlan.billing_cycle,
      maxUsers: dbPlan.max_users,
      maxStorageGb: dbPlan.max_storage_gb,
      features: features,
      productType: dbPlan.platform_type, // Add platform_type
      isActive: dbPlan.status === 'active',
      isRecommended: dbPlan.name.toLowerCase() === 'pro' || dbPlan.name.toLowerCase() === 'professional', // Pro is recommended,
      createdAt: dbPlan.created_at,
      updatedAt: dbPlan.updated_at
    };
  }

  /**
   * Get all active subscription plans
   */
  static async getAllPlans() {
    const client = await pool.connect();
    try {
      // Only return platform subscription plans (platform_type IS NULL)
      // Platform-specific plans are handled separately
      const result = await client.query(
        `SELECT * FROM subscription_plans 
         WHERE status = 'active' AND platform_type IS NULL 
         ORDER BY price ASC`
      );

      return result.rows.map(this.transformPlan);
    } finally {
      client.release();
    }
  }

  /**
   * Get ALL subscription plans including product-specific plans
   * Used for admin panel when configuring tenant products
   */
  static async getAllPlansIncludingProducts() {
    const client = await pool.connect();
    try {
      // Return ALL active plans (both platform and platform-specific)
      const result = await client.query(
        `SELECT * FROM subscription_plans 
         WHERE status = 'active' 
         ORDER BY 
           CASE 
             WHEN platform_type IS NULL THEN 0 
             ELSE 1 
           END,
           platform_type,
           price ASC`
      );

      return result.rows.map(this.transformPlan);
    } finally {
      client.release();
    }
  }

  /**
   * Get a single plan by name
   */
  static async getPlanByName(planName) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM subscription_plans WHERE LOWER(name) = LOWER($1) AND status = 'active'`,
        [planName]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.transformPlan(result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Get a single plan by ID
   */
  static async getPlanById(planId) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM subscription_plans WHERE id = $1`,
        [planId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.transformPlan(result.rows[0]);
    } finally {
      client.release();
    }
  }
}

module.exports = SubscriptionPlanService;
