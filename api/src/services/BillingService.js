/**
 * Billing Service
 * Handles business logic for subscription plans, tenant subscriptions, and invoices
 */

const pool = require('../config/database');

class BillingService {
  /**
   * Get all subscription plans
   */
  static async getPlans() {
    const result = await pool.query(
      `SELECT * FROM subscription_plans WHERE status != 'archived' ORDER BY price ASC`
    );
    return result.rows;
  }

  /**
   * Get plan by ID
   */
  static async getPlanById(id) {
    const result = await pool.query(
      'SELECT * FROM subscription_plans WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      throw new Error('Plan not found');
    }
    return result.rows[0];
  }

  /**
   * Create new subscription plan
   */
  static async createPlan(planData) {
    const { name, description, price, billing_cycle, features, max_users, max_storage_gb } = planData;
    
    const result = await pool.query(
      `INSERT INTO subscription_plans (name, description, price, billing_cycle, features, max_users, max_storage_gb)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, description, price, billing_cycle, features, max_users, max_storage_gb]
    );
    
    return result.rows[0];
  }

  /**
   * Update subscription plan
   */
  static async updatePlan(id, planData) {
    const { name, description, price, billing_cycle, features, max_users, max_storage_gb, status } = planData;
    
    const result = await pool.query(
      `UPDATE subscription_plans 
       SET name = $1, description = $2, price = $3, billing_cycle = $4, 
           features = $5, max_users = $6, max_storage_gb = $7, status = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 RETURNING *`,
      [name, description, price, billing_cycle, features, max_users, max_storage_gb, status, id]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Plan not found');
    }
    
    return result.rows[0];
  }

  /**
   * Delete (archive) subscription plan
   */
  static async deletePlan(id) {
    const result = await pool.query(
      `UPDATE subscription_plans SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Plan not found');
    }
    
    return { success: true };
  }

  /**
   * Get all tenant subscriptions
   */
  static async getSubscriptions() {
    const result = await pool.query(
      `SELECT 
        ts.*, 
        t.name as tenant_name,
        sp.name as plan_name,
        sp.price as plan_price,
        sp.billing_cycle
       FROM tenant_subscriptions ts
       JOIN tenants t ON ts.tenant_id = t.id
       JOIN subscription_plans sp ON ts.plan_id = sp.id
       ORDER BY ts.created_at DESC`
    );
    return result.rows;
  }

  /**
   * Get subscription by tenant ID
   */
  static async getSubscriptionByTenant(tenantId) {
    const result = await pool.query(
      `SELECT 
        ts.*, 
        sp.name as plan_name,
        sp.price as plan_price,
        sp.billing_cycle,
        sp.features,
        sp.max_users,
        sp.max_storage_gb
       FROM tenant_subscriptions ts
       JOIN subscription_plans sp ON ts.plan_id = sp.id
       WHERE ts.tenant_id = $1 AND ts.status = 'active'
       ORDER BY ts.created_at DESC
       LIMIT 1`,
      [tenantId]
    );
    
    return result.rows[0] || null;
  }

  /**
   * Create new subscription
   */
  static async createSubscription(subscriptionData) {
    const { tenant_id, plan_id, start_date, end_date, trial_ends_at, auto_renew } = subscriptionData;
    
    const result = await pool.query(
      `INSERT INTO tenant_subscriptions (tenant_id, plan_id, start_date, end_date, trial_ends_at, auto_renew)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tenant_id, plan_id, start_date, end_date, trial_ends_at, auto_renew !== false]
    );
    
    return result.rows[0];
  }

  /**
   * Update subscription
   */
  static async updateSubscription(id, subscriptionData) {
    const { plan_id, status, end_date, auto_renew } = subscriptionData;
    
    const result = await pool.query(
      `UPDATE tenant_subscriptions 
       SET plan_id = $1, status = $2, end_date = $3, auto_renew = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [plan_id, status, end_date, auto_renew, id]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Subscription not found');
    }
    
    return result.rows[0];
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(id) {
    const result = await pool.query(
      `UPDATE tenant_subscriptions 
       SET status = 'cancelled', auto_renew = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Subscription not found');
    }
    
    return result.rows[0];
  }

  /**
   * Get invoices with filters
   */
  static async getInvoices(filters = {}) {
    let query = `
      SELECT 
        i.*,
        t.name as tenant_name
      FROM invoices i
      JOIN tenants t ON i.tenant_id = t.id
      WHERE 1=1
    `;
    const params = [];
    
    if (filters.tenantId) {
      params.push(filters.tenantId);
      query += ` AND i.tenant_id = $${params.length}`;
    }
    
    if (filters.status) {
      params.push(filters.status);
      query += ` AND i.status = $${params.length}`;
    }
    
    query += ' ORDER BY i.created_at DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get invoice by ID
   */
  static async getInvoiceById(id) {
    const result = await pool.query(
      `SELECT 
        i.*,
        t.name as tenant_name,
        t.billing_email
       FROM invoices i
       JOIN tenants t ON i.tenant_id = t.id
       WHERE i.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Invoice not found');
    }
    
    return result.rows[0];
  }

  /**
   * Create new invoice
   */
  static async createInvoice(invoiceData) {
    const { tenant_id, subscription_id, invoice_number, amount, tax, total, due_date, notes } = invoiceData;
    
    const result = await pool.query(
      `INSERT INTO invoices (tenant_id, subscription_id, invoice_number, amount, tax, total, due_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [tenant_id, subscription_id, invoice_number, amount, tax || 0, total, due_date, notes]
    );
    
    return result.rows[0];
  }

  /**
   * Mark invoice as paid
   */
  static async payInvoice(id, paymentData) {
    const { payment_method, transaction_id, amount } = paymentData;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update invoice
      const invoiceResult = await client.query(
        `UPDATE invoices 
         SET status = 'paid', paid_date = CURRENT_TIMESTAMP, payment_method = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 RETURNING *`,
        [payment_method, id]
      );
      
      if (invoiceResult.rows.length === 0) {
        throw new Error('Invoice not found');
      }
      
      const invoice = invoiceResult.rows[0];
      
      // Create payment history record
      await client.query(
        `INSERT INTO payment_history (tenant_id, invoice_id, amount, payment_method, transaction_id, status)
         VALUES ($1, $2, $3, $4, $5, 'completed')`,
        [invoice.tenant_id, id, amount || invoice.total, payment_method, transaction_id]
      );
      
      await client.query('COMMIT');
      return invoice;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get billing statistics
   */
  static async getStats() {
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM subscription_plans WHERE status = 'active') as active_plans,
        (SELECT COUNT(*) FROM tenant_subscriptions WHERE status = 'active') as active_subscriptions,
        (SELECT COUNT(*) FROM invoices WHERE status = 'pending') as pending_invoices,
        (SELECT COUNT(*) FROM invoices WHERE status = 'overdue') as overdue_invoices,
        (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE status = 'paid' AND EXTRACT(MONTH FROM paid_date) = EXTRACT(MONTH FROM CURRENT_DATE)) as monthly_revenue,
        (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE status = 'pending') as pending_revenue
    `);
    
    return result.rows[0];
  }
}

module.exports = BillingService;
