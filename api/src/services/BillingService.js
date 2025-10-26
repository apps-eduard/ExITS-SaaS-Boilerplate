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
    console.log('🔍 BillingService.getPlans - Row count:', result.rows.length);
    if (result.rows.length > 0) {
      console.log('📋 First plan columns:', Object.keys(result.rows[0]));
      console.log('📋 First plan platform_type:', result.rows[0].platform_type);
      console.log('📋 Sample plans:', result.rows.slice(0, 3).map(p => ({ 
        id: p.id, 
        name: p.name, 
        platform_type: p.platform_type 
      })));
    }
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
    const { 
      name, 
      description, 
      price, 
      billing_cycle, 
      features, 
      max_users, 
      max_storage_gb,
      platform_type,
      trial_days,
      is_featured,
      custom_pricing,
      status
    } = planData;
    
    const result = await pool.query(
      `INSERT INTO subscription_plans (
        name, description, price, billing_cycle, features, max_users, max_storage_gb,
        platform_type, trial_days, is_featured, custom_pricing, status
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [name, description, price, billing_cycle, features, max_users, max_storage_gb,
       platform_type, trial_days || 0, is_featured || false, custom_pricing || false, 
       status || 'active']
    );
    
    return result.rows[0];
  }

  /**
   * Update subscription plan
   */
  static async updatePlan(id, planData) {
    const { 
      name, 
      description, 
      price, 
      billing_cycle, 
      features, 
      max_users, 
      max_storage_gb, 
      status,
      platform_type,
      trial_days,
      is_featured,
      custom_pricing
    } = planData;
    
    console.log('🔍 Updating plan:', id);
    console.log('📦 Plan data received:', { platform_type, name });
    console.log('📝 Full planData:', planData);
    
    const result = await pool.query(
      `UPDATE subscription_plans 
       SET name = $1, description = $2, price = $3, billing_cycle = $4, 
           features = $5, max_users = $6, max_storage_gb = $7, status = $8,
           platform_type = $9, trial_days = $10, is_featured = $11, custom_pricing = $12,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $13 RETURNING *`,
      [name, description, price, billing_cycle, features, max_users, max_storage_gb, status, 
       platform_type, trial_days, is_featured, custom_pricing, id]
    );
    
    console.log('✅ Plan updated in DB:', result.rows[0].platform_type);
    
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
   * Get all product subscriptions (used by All Subscriptions admin page)
   */
  static async getSubscriptions() {
    const result = await pool.query(
      `SELECT 
        ts.id,
        ts.tenant_id,
        ts.status,
        ts.start_date,
        ts.end_date,
        ts.created_at,
        ts.updated_at,
        t.name as tenant_name,
        sp.name as plan_name,
        sp.price,
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

  /**
   * Get billing overview for a tenant
   */
  static async getBillingOverview(tenantId) {
    const client = await pool.connect();
    try {
      // Get current subscription with plan details - check both tenant_subscriptions and platform_subscriptions
      // First try tenant_subscriptions (platform-level)
      let subscriptionQuery = `
        SELECT 
          ts.next_billing_date,
          ts.status as subscription_status,
          ts.monthly_price,
          ts.metadata,
          sp.price as plan_price,
          sp.billing_cycle,
          sp.name as plan_name
        FROM tenant_subscriptions ts
        JOIN subscription_plans sp ON ts.plan_id = sp.id
        WHERE ts.tenant_id = $1 AND ts.status IN ('active', 'trial')
        ORDER BY ts.created_at DESC
        LIMIT 1
      `;
      let subscriptionResult = await client.query(subscriptionQuery, [tenantId]);

      // If no tenant subscription found, check platform_subscriptions
      if (subscriptionResult.rows.length === 0) {
        subscriptionQuery = `
          SELECT 
            COALESCE(
              ps.expires_at,
              CASE 
                WHEN sp.billing_cycle = 'monthly' THEN ps.started_at + INTERVAL '1 month'
                WHEN sp.billing_cycle = 'quarterly' THEN ps.started_at + INTERVAL '3 months'
                WHEN sp.billing_cycle = 'yearly' THEN ps.started_at + INTERVAL '1 year'
                ELSE ps.started_at + INTERVAL '1 month'
              END
            ) as next_billing_date,
            ps.status as subscription_status,
            ps.price as monthly_price,
            ps.metadata,
            sp.price as plan_price,
            sp.billing_cycle,
            sp.name as plan_name
          FROM platform_subscriptions ps
          JOIN subscription_plans sp ON ps.subscription_plan_id = sp.id
          WHERE ps.tenant_id = $1 AND ps.status IN ('active', 'trial')
          ORDER BY ps.created_at DESC
          LIMIT 1
        `;
        subscriptionResult = await client.query(subscriptionQuery, [tenantId]);
      }

      // Get last completed payment
      const lastPaymentQuery = `
        SELECT 
          ph.amount,
          ph.processed_at,
          ph.created_at,
          i.invoice_number
        FROM payment_history ph
        LEFT JOIN invoices i ON ph.invoice_id = i.id
        WHERE ph.tenant_id = $1 AND ph.status = 'completed'
        ORDER BY ph.processed_at DESC NULLS LAST, ph.created_at DESC
        LIMIT 1
      `;
      const lastPaymentResult = await client.query(lastPaymentQuery, [tenantId]);

      // Get outstanding balance (pending + overdue invoices)
      const balanceQuery = `
        SELECT 
          COALESCE(SUM(total_amount), 0) as pending_amount
        FROM invoices
        WHERE tenant_id = $1 AND status IN ('pending', 'overdue')
      `;
      const balanceResult = await client.query(balanceQuery, [tenantId]);

      // Calculate next billing amount (use subscription monthly_price or plan price)
      const subscription = subscriptionResult.rows[0];
      let nextBillingAmount = 0;
      
      if (subscription) {
        // Prefer monthly_price from subscription, fallback to plan price
        nextBillingAmount = subscription.monthly_price 
          ? parseFloat(subscription.monthly_price)
          : (subscription.plan_price ? parseFloat(subscription.plan_price) : 0);
      }

      // Get auto_renew and payment method from metadata (default to true for auto_renew)
      const metadata = subscription?.metadata || {};
      const autoRenewal = metadata.auto_renew !== undefined ? metadata.auto_renew : true;
      const paymentMethodId = metadata.payment_method_id || null;

      // Fetch payment method details if payment_method_id exists
      let paymentMethod = null;
      if (paymentMethodId) {
        const paymentMethodQuery = `
          SELECT id, type, last_four, expiry_month, expiry_year, card_brand, is_default
          FROM payment_methods
          WHERE id = $1 AND tenant_id = $2
          LIMIT 1
        `;
        const paymentMethodResult = await client.query(paymentMethodQuery, [paymentMethodId, tenantId]);
        if (paymentMethodResult.rows.length > 0) {
          const pm = paymentMethodResult.rows[0];
          paymentMethod = {
            id: pm.id,
            type: pm.type,
            last4: pm.last_four,
            brand: pm.card_brand,
            expiryMonth: pm.expiry_month,
            expiryYear: pm.expiry_year,
            isDefault: pm.is_default
          };
        }
      }

      console.log('📊 Billing Overview Debug:', {
        hasSubscription: !!subscription,
        nextBillingDate: subscription?.next_billing_date,
        subscriptionStatus: subscription?.subscription_status,
        planName: subscription?.plan_name,
        paymentMethodId: paymentMethodId,
        paymentMethod: paymentMethod
      });

      return {
        currentBalance: -parseFloat(balanceResult.rows[0].pending_amount || 0),
        nextBillingDate: subscription?.next_billing_date || null,
        nextBillingAmount: nextBillingAmount,
        billingCycle: subscription?.billing_cycle || 'monthly',
        planName: subscription?.plan_name || null,
        lastPaymentDate: lastPaymentResult.rows[0]?.processed_at || lastPaymentResult.rows[0]?.created_at || null,
        lastPaymentAmount: lastPaymentResult.rows[0]?.amount ? parseFloat(lastPaymentResult.rows[0].amount) : 0,
        lastInvoiceNumber: lastPaymentResult.rows[0]?.invoice_number || null,
        paymentMethod: paymentMethod,
        autoRenewal: autoRenewal,
        subscriptionStatus: subscription?.subscription_status || 'none',
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get billing information for a tenant
   */
  static async getBillingInfo(tenantId) {
    const client = await pool.connect();
    try {
      // Get tenant basic info
      const tenantQuery = `
        SELECT 
          name as company_name,
          billing_email,
          contact_email,
          contact_person,
          contact_phone,
          metadata
        FROM tenants
        WHERE id = $1
      `;
      const tenantResult = await client.query(tenantQuery, [tenantId]);

      if (tenantResult.rows.length === 0) {
        throw new Error('Tenant not found');
      }

      const tenant = tenantResult.rows[0];
      const metadata = tenant.metadata || {};

      // Get billing address from addresses table
      const addressQuery = `
        SELECT 
          unit_number,
          house_number,
          street_name,
          subdivision,
          barangay,
          city_municipality,
          province,
          region,
          zip_code,
          country,
          landmark,
          contact_person,
          contact_phone
        FROM addresses
        WHERE tenant_id = $1 
          AND addressable_type = 'tenant'
          AND addressable_id = $1
          AND address_type = 'billing'
          AND status = 'active'
        ORDER BY is_primary DESC, created_at DESC
        LIMIT 1
      `;
      const addressResult = await client.query(addressQuery, [tenantId]);

      let formattedAddress = 'No address provided';
      let addressDetails = null;

      if (addressResult.rows.length > 0) {
        const addr = addressResult.rows[0];
        const parts = [
          addr.unit_number,
          addr.house_number,
          addr.street_name,
          addr.subdivision,
          addr.barangay,
          addr.city_municipality,
          addr.province,
          addr.zip_code
        ].filter(Boolean);
        
        formattedAddress = parts.join(', ');
        addressDetails = {
          unitNumber: addr.unit_number,
          houseNumber: addr.house_number,
          street: addr.street_name,
          subdivision: addr.subdivision,
          barangay: addr.barangay,
          city: addr.city_municipality,
          province: addr.province,
          region: addr.region,
          zipCode: addr.zip_code,
          country: addr.country || 'Philippines',
          landmark: addr.landmark,
          contactPerson: addr.contact_person,
          contactPhone: addr.contact_phone
        };
      }

      return {
        companyName: tenant.company_name,
        taxId: metadata.tax_id || null,
        email: tenant.billing_email || tenant.contact_email,
        address: formattedAddress,
        addressDetails: addressDetails,
        contactPerson: tenant.contact_person,
        contactPhone: tenant.contact_phone,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Update billing information for a tenant
   */
  static async updateBillingInfo(tenantId, data) {
    const client = await pool.connect();
    try {
      const { companyName, taxId, email, address, contactPerson, contactPhone } = data;

      // First, get current metadata
      const metadataQuery = 'SELECT metadata FROM tenants WHERE id = $1';
      const metadataResult = await client.query(metadataQuery, [tenantId]);
      const currentMetadata = metadataResult.rows[0]?.metadata || {};

      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (companyName !== undefined) {
        updates.push(`name = $${paramIndex}`);
        values.push(companyName);
        paramIndex++;
      }
      if (email !== undefined) {
        updates.push(`billing_email = $${paramIndex}`);
        values.push(email);
        paramIndex++;
      }
      if (contactPerson !== undefined) {
        updates.push(`contact_person = $${paramIndex}`);
        values.push(contactPerson);
        paramIndex++;
      }
      if (contactPhone !== undefined) {
        updates.push(`contact_phone = $${paramIndex}`);
        values.push(contactPhone);
        paramIndex++;
      }

      // Update metadata with tax_id and address
      const updatedMetadata = { ...currentMetadata };
      if (taxId !== undefined) {
        updatedMetadata.tax_id = taxId;
      }
      if (address !== undefined) {
        updatedMetadata.billing_address = address;
      }

      updates.push(`metadata = $${paramIndex}`);
      values.push(JSON.stringify(updatedMetadata));
      paramIndex++;

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(tenantId);
      const query = `
        UPDATE tenants
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      await client.query(query, values);

      return {
        success: true,
        message: 'Billing information updated successfully',
      };
    } finally {
      client.release();
    }
  }

  /**
   * Update auto-renewal setting for a tenant
   * Stores in metadata since auto_renew column doesn't exist in tenant_subscriptions
   */
  static async updateAutoRenewal(tenantId, enabled) {
    const client = await pool.connect();
    try {
      // Get current metadata
      const getQuery = `
        SELECT metadata FROM tenant_subscriptions
        WHERE tenant_id = $1 AND status = 'active'
        LIMIT 1
      `;
      const getResult = await client.query(getQuery, [tenantId]);

      if (getResult.rows.length === 0) {
        throw new Error('No active subscription found');
      }

      const currentMetadata = getResult.rows[0].metadata || {};
      const updatedMetadata = { ...currentMetadata, auto_renew: enabled };

      // Update metadata with auto_renew setting
      const updateQuery = `
        UPDATE tenant_subscriptions
        SET metadata = $1, updated_at = NOW()
        WHERE tenant_id = $2 AND status = 'active'
        RETURNING *
      `;

      const result = await client.query(updateQuery, [JSON.stringify(updatedMetadata), tenantId]);

      return {
        success: true,
        message: `Auto-renewal ${enabled ? 'enabled' : 'disabled'} successfully`,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get all available payment methods
   */
  static async getPaymentMethods() {
    const result = await pool.query(
      `SELECT id, name, display_name, description, is_active 
       FROM payment_method_types 
       WHERE is_active = true 
       ORDER BY display_name ASC`
    );
    return result.rows;
  }

  /**
   * Get tenant's current payment method
   */
  static async getTenantPaymentMethod(tenantId) {
    const client = await pool.connect();
    try {
      // Get payment method details from metadata
      const query = `
        SELECT 
          ts.metadata,
          pmt.id as payment_method_id,
          pmt.name as payment_method_name,
          pmt.display_name as payment_method_display_name
        FROM tenant_subscriptions ts
        LEFT JOIN payment_method_types pmt ON pmt.id = (ts.metadata->>'payment_method_id')::bigint
        WHERE ts.tenant_id = $1 AND ts.status = 'active'
        LIMIT 1
      `;
      
      const result = await client.query(query, [tenantId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const metadata = row.metadata || {};
      const paymentDetails = metadata.payment_details || {};

      return {
        paymentMethodId: row.payment_method_id,
        paymentMethodName: row.payment_method_name,
        paymentMethodDisplayName: row.payment_method_display_name,
        details: paymentDetails,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Update tenant's payment method
   */
  static async updateTenantPaymentMethod(tenantId, paymentMethodId, details = {}) {
    const client = await pool.connect();
    try {
      // Verify payment method exists
      const pmCheck = await client.query(
        'SELECT id, name FROM payment_method_types WHERE id = $1 AND is_active = true',
        [paymentMethodId]
      );

      if (pmCheck.rows.length === 0) {
        throw new Error('Invalid payment method');
      }

      // Check for active subscription in tenant_subscriptions first
      let getQuery = `
        SELECT metadata FROM tenant_subscriptions
        WHERE tenant_id = $1 AND status = 'active'
        LIMIT 1
      `;
      let getResult = await client.query(getQuery, [tenantId]);

      // If not found, check platform_subscriptions
      if (getResult.rows.length === 0) {
        getQuery = `
          SELECT metadata FROM platform_subscriptions
          WHERE tenant_id = $1 AND status = 'active'
          LIMIT 1
        `;
        getResult = await client.query(getQuery, [tenantId]);
      }

      if (getResult.rows.length === 0) {
        throw new Error('No active subscription found');
      }

      const currentMetadata = getResult.rows[0].metadata || {};
      const updatedMetadata = {
        ...currentMetadata,
        payment_method_id: paymentMethodId,
        payment_details: details,
      };

      // Update metadata in tenant_subscriptions
      let updateQuery = `
        UPDATE tenant_subscriptions
        SET metadata = $1, updated_at = NOW()
        WHERE tenant_id = $2 AND status = 'active'
        RETURNING *
      `;

      let updateResult = await client.query(updateQuery, [JSON.stringify(updatedMetadata), tenantId]);

      // If no rows updated, update platform_subscriptions instead
      if (updateResult.rowCount === 0) {
        updateQuery = `
          UPDATE platform_subscriptions
          SET metadata = $1, updated_at = NOW()
          WHERE tenant_id = $2 AND status = 'active'
          RETURNING *
        `;
        await client.query(updateQuery, [JSON.stringify(updatedMetadata), tenantId]);
      }

      return {
        success: true,
        message: 'Payment method updated successfully',
        data: {
          paymentMethodId,
          paymentMethodName: pmCheck.rows[0].name,
        },
      };
    } finally {
      client.release();
    }
  }
}

module.exports = BillingService;
