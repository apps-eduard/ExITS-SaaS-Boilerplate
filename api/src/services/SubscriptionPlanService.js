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
    
    // Transform features from JSON object to array of feature strings
    let features = [];
    if (dbPlan.features) {
      const featuresObj = typeof dbPlan.features === 'string' 
        ? JSON.parse(dbPlan.features) 
        : dbPlan.features;
      
      // Convert feature object to array of human-readable strings
      const featureMap = {
        basic_support: 'Basic Support',
        priority_support: 'Priority Support',
        api_access: 'API Access',
        advanced_reporting: 'Advanced Reporting',
        custom_branding: 'Custom Branding',
        integrations: 'Third-party Integrations',
        dedicated_support: 'Dedicated Support Team',
        sla_99_uptime: '99.9% Uptime SLA',
        custom_integrations: 'Custom Integrations',
        trial_duration_days: null // Skip this one
      };
      
      features = Object.entries(featuresObj)
        .filter(([key, value]) => value === true && featureMap[key] !== null)
        .map(([key]) => featureMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
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
      productType: dbPlan.product_type, // Add product_type
      isActive: dbPlan.status === 'active',
      isRecommended: dbPlan.name.toLowerCase() === 'pro' || dbPlan.name.toLowerCase() === 'professional', // Pro is recommended
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
      // Only return platform subscription plans (product_type IS NULL)
      // Product-specific plans are handled separately
      const result = await client.query(
        `SELECT * FROM subscription_plans 
         WHERE status = 'active' AND product_type IS NULL 
         ORDER BY price ASC`
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
