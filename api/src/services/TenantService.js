/**
 * Tenant Service
 * Handles tenant management and multi-tenancy operations
 */

const pool = require('../config/database');
const logger = require('../utils/logger');

class TenantService {
  /**
   * Transform database tenant object to camelCase
   */
  static transformTenant(dbTenant) {
    if (!dbTenant) return null;
    return {
      id: dbTenant.id,
      name: dbTenant.name,
      subdomain: dbTenant.subdomain,
      plan: dbTenant.plan,
      status: dbTenant.status,
      maxUsers: dbTenant.max_users,
      logoUrl: dbTenant.logo_url,
      primaryColor: dbTenant.primary_color,
      secondaryColor: dbTenant.secondary_color,
      moneyLoanEnabled: dbTenant.money_loan_enabled,
      bnplEnabled: dbTenant.bnpl_enabled,
      pawnshopEnabled: dbTenant.pawnshop_enabled,
      createdAt: dbTenant.created_at,
      updatedAt: dbTenant.updated_at,
      // Include counts if present
      userCount: dbTenant.user_count,
      roleCount: dbTenant.role_count,
    };
  }

  /**
   * Create a new tenant with admin user
   */
  static async createTenant(tenantData, requestingUserId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if subdomain is already taken
      const existingTenant = await client.query(
        `SELECT id FROM tenants WHERE subdomain = $1`,
        [tenantData.subdomain]
      );

      if (existingTenant.rows.length > 0) {
        throw new Error('Subdomain already taken');
      }

      // Check if admin email already exists
      if (tenantData.adminEmail) {
        const existingUser = await client.query(
          `SELECT id FROM users WHERE LOWER(email) = LOWER($1)`,
          [tenantData.adminEmail]
        );

        if (existingUser.rows.length > 0) {
          throw new Error('Admin email already registered');
        }
      }

      // Validate and get plan name (handle both 'plan' and 'subscriptionPlan' fields)
      const requestedPlan = tenantData.plan || tenantData.subscriptionPlan || 'starter';
      
      // Validate plan exists in database (case-insensitive match)
      const planCheck = await client.query(
        `SELECT name FROM subscription_plans WHERE LOWER(name) = LOWER($1) AND status = 'active'`,
        [requestedPlan]
      );

      if (planCheck.rows.length === 0) {
        throw new Error(`Invalid subscription plan: ${requestedPlan}. Plan does not exist or is inactive.`);
      }

      // Use the plan name directly from database (should match tenant_plan ENUM)
      const plan = planCheck.rows[0].name;

      const result = await client.query(
        `INSERT INTO tenants (name, subdomain, plan, status, max_users, logo_url, primary_color, secondary_color, money_loan_enabled, bnpl_enabled, pawnshop_enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id, name, subdomain, plan, status, max_users, created_at`,
        [
          tenantData.name,
          tenantData.subdomain,
          plan,
          tenantData.status || 'active',
          tenantData.maxUsers || 10,
          tenantData.logoUrl || null,
          tenantData.primaryColor || null,
          tenantData.secondaryColor || null,
          tenantData.money_loan_enabled || false,
          tenantData.bnpl_enabled || false,
          tenantData.pawnshop_enabled || false,
        ]
      );

      const tenant = result.rows[0];

      // Create tenant subscription record
      const planResult = await client.query(
        `SELECT id, price FROM subscription_plans WHERE LOWER(name) = LOWER($1) AND status = 'active'`,
        [plan]
      );

      if (planResult.rows.length > 0) {
        const planId = planResult.rows[0].id;
        const monthlyPrice = planResult.rows[0].price;
        
        // Calculate expiration date (1 year from now)
        const startDate = new Date();
        const expirationDate = new Date(startDate);
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);

        await client.query(
          `INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, started_at, expires_at, monthly_price)
           VALUES ($1, $2, 'active', $3, $4, $5)`,
          [tenant.id, planId, startDate, expirationDate, monthlyPrice]
        );

        logger.info(`Tenant subscription created: Tenant ${tenant.id} -> Plan ${planId}`);
      }

      // Create default tenant roles
      const defaultRoles = [
        { name: 'Tenant Admin', description: 'Tenant administrator', space: 'tenant' },
        { name: 'User Manager', description: 'Manage tenant users', space: 'tenant' },
        { name: 'Analyst', description: 'Data analyst access', space: 'tenant' },
        { name: 'Viewer', description: 'Read-only access', space: 'tenant' },
      ];

      let tenantAdminRoleId = null;
      for (const role of defaultRoles) {
        const roleResult = await client.query(
          `INSERT INTO roles (tenant_id, name, description, space)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [tenant.id, role.name, role.description, role.space]
        );
        
        // Save the Tenant Admin role ID for assigning to the admin user
        if (role.name === 'Tenant Admin') {
          tenantAdminRoleId = roleResult.rows[0].id;
          
          // Grant all tenant-level permissions to Tenant Admin role
          const permissionsResult = await client.query(
            `SELECT id FROM permissions WHERE space IN ('tenant', 'both')`
          );
          
          if (permissionsResult.rows.length > 0) {
            const permissionValues = permissionsResult.rows
              .map((p, idx) => `(${tenantAdminRoleId}, ${p.id})`)
              .join(', ');
            
            await client.query(
              `INSERT INTO role_permissions (role_id, permission_id) 
               VALUES ${permissionValues}
               ON CONFLICT (role_id, permission_id) DO NOTHING`
            );
            
            logger.info(`Granted ${permissionsResult.rows.length} permissions to Tenant Admin role`);
          }
        }
      }

      // Create admin user if admin details provided
      if (tenantData.adminEmail && tenantData.adminPassword) {
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(tenantData.adminPassword, 10);

        const userResult = await client.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, tenant_id, status)
           VALUES ($1, $2, $3, $4, $5, 'active')
           RETURNING id, email, first_name, last_name`,
          [
            tenantData.adminEmail,
            hashedPassword,
            tenantData.adminFirstName || '',
            tenantData.adminLastName || '',
            tenant.id
          ]
        );

        const adminUser = userResult.rows[0];

        // Assign Tenant Admin role to the admin user
        if (tenantAdminRoleId) {
          await client.query(
            `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
            [adminUser.id, tenantAdminRoleId]
          );
        }

        logger.info(`Tenant admin user created: ${adminUser.email} for tenant ${tenant.name}`);
      }

      await client.query('COMMIT');
      logger.info(`Tenant created: ${tenant.name} (${tenant.id})`);

      return tenant;
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error(`Tenant service create error: ${err.message}`);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get tenant by ID
   */
  static async getTenantById(tenantId) {
    try {
      const result = await pool.query(
        `SELECT t.*, 
                sp.id as plan_id, sp.name as plan_name, sp.description as plan_description,
                sp.price, sp.billing_cycle, sp.features, sp.max_users as plan_max_users,
                sp.max_storage_gb
         FROM tenants t
         LEFT JOIN subscription_plans sp ON LOWER(sp.name) = LOWER(t.plan::text) AND sp.status = 'active'
         WHERE t.id = $1`,
        [tenantId]
      );

      if (result.rows.length === 0) {
        throw new Error('Tenant not found');
      }

      const tenant = result.rows[0];

      // Get tenant stats
      const usersCountResult = await pool.query(
        `SELECT COUNT(*) as count FROM users WHERE tenant_id = $1`,
        [tenantId]
      );

      const rolesCountResult = await pool.query(
        `SELECT COUNT(*) as count FROM roles WHERE tenant_id = $1`,
        [tenantId]
      );

      // Add counts to tenant object
      tenant.user_count = parseInt(usersCountResult.rows[0].count);
      tenant.role_count = parseInt(rolesCountResult.rows[0].count);

      // Use transformTenant to get camelCase response
      const transformedTenant = this.transformTenant(tenant);

      // Add subscription plan details if available
      if (tenant.plan_id) {
        transformedTenant.subscriptionPlan = {
          id: tenant.plan_id,
          name: tenant.plan_name,
          description: tenant.plan_description,
          price: parseFloat(tenant.price),
          billingCycle: tenant.billing_cycle,
          features: tenant.features,
          maxUsers: tenant.plan_max_users,
          maxStorageGb: tenant.max_storage_gb
        };
      }

      return transformedTenant;
    } catch (err) {
      logger.error(`Tenant service get by ID error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get tenant by subdomain
   */
  static async getTenantBySubdomain(subdomain) {
    try {
      const result = await pool.query(
        `SELECT id, name, subdomain, plan, status, max_users, created_at
         FROM tenants
         WHERE subdomain = $1 AND status = 'active'`,
        [subdomain]
      );

      if (result.rows.length === 0) {
        throw new Error('Tenant not found');
      }

      return result.rows[0];
    } catch (err) {
      logger.error(`Tenant service get by subdomain error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get active subscriptions for a tenant
   * Returns both platform and product subscriptions
   * Auto-creates missing product subscriptions based on enabled flags
   */
  static async getActiveSubscriptions(tenantId) {
    const SubscriptionPlanService = require('./SubscriptionPlanService');
    
    try {
      // First, sync product subscriptions to ensure they exist
      await this.syncProductSubscriptions(tenantId);

      // Get tenant enabled products
      const tenantResult = await pool.query(
        `SELECT money_loan_enabled, bnpl_enabled, pawnshop_enabled FROM tenants WHERE id = $1`,
        [tenantId]
      );

      const enabledProducts = [];
      if (tenantResult.rows.length > 0) {
        const tenant = tenantResult.rows[0];
        if (tenant.money_loan_enabled) enabledProducts.push('money_loan');
        if (tenant.bnpl_enabled) enabledProducts.push('bnpl');
        if (tenant.pawnshop_enabled) enabledProducts.push('pawnshop');
      }

      const subscriptions = [];

      // Get platform subscription from tenant_subscriptions
      const platformSubResult = await pool.query(
        `SELECT ts.*, sp.id as plan_id, sp.name, sp.description, 
                sp.price, sp.billing_cycle, sp.features, sp.product_type,
                sp.is_popular, sp.status
         FROM tenant_subscriptions ts
         JOIN subscription_plans sp ON ts.plan_id = sp.id
         WHERE ts.tenant_id = $1 AND ts.status = 'active'
         ORDER BY ts.created_at DESC
         LIMIT 1`,
        [tenantId]
      );

      logger.info(`📊 Platform subscriptions found: ${platformSubResult.rows.length}`);

      if (platformSubResult.rows.length > 0) {
        const sub = platformSubResult.rows[0];
        subscriptions.push(SubscriptionPlanService.transformPlan({
          id: sub.plan_id,
          name: sub.name,
          description: sub.description,
          price: sub.price,
          billing_cycle: sub.billing_cycle,
          features: sub.features,
          product_type: sub.product_type || 'platform',
          is_popular: sub.is_popular,
          status: sub.status
        }));
      }

      // Get product subscriptions from product_subscriptions
      const productSubsResult = await pool.query(
        `SELECT ps.*, sp.id as plan_id, sp.name, sp.description,
                sp.price, sp.billing_cycle, sp.features, sp.product_type,
                sp.is_popular, sp.status
         FROM product_subscriptions ps
         JOIN subscription_plans sp ON ps.subscription_plan_id = sp.id
         WHERE ps.tenant_id = $1 AND ps.status = 'active'
         ORDER BY ps.created_at`,
        [tenantId]
      );

      logger.info(`📊 Product subscriptions found: ${productSubsResult.rows.length}`);

      for (const sub of productSubsResult.rows) {
        subscriptions.push(SubscriptionPlanService.transformPlan({
          id: sub.plan_id,
          name: sub.name,
          description: sub.description,
          price: sub.price,
          billing_cycle: sub.billing_cycle,
          features: sub.features,
          product_type: sub.product_type,
          is_popular: sub.is_popular,
          status: sub.status
        }));
      }

      logger.info(`✅ Total active subscriptions: ${subscriptions.length}`);
      logger.info(`✅ Enabled products: ${enabledProducts.join(', ')}`);
      
      return {
        subscriptions,
        enabledProducts
      };
    } catch (err) {
      logger.error(`Tenant service get active subscriptions error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Sync product subscriptions based on tenant enabled flags
   * Auto-creates missing subscriptions or cancels disabled ones
   */
  static async syncProductSubscriptions(tenantId) {
    try {
      // Get tenant with their enabled products
      const tenantResult = await pool.query(
        `SELECT plan, money_loan_enabled, bnpl_enabled, pawnshop_enabled 
         FROM tenants WHERE id = $1`,
        [tenantId]
      );

      if (tenantResult.rows.length === 0) {
        return;
      }

      const tenant = tenantResult.rows[0];
      const platformPlan = tenant.plan || 'starter';

      // Sync Money Loan
      if (tenant.money_loan_enabled) {
        await this.ensureProductSubscription(tenantId, 'money_loan', platformPlan);
      }

      // Sync BNPL
      if (tenant.bnpl_enabled) {
        await this.ensureProductSubscription(tenantId, 'bnpl', platformPlan);
      }

      // Sync Pawnshop
      if (tenant.pawnshop_enabled) {
        await this.ensureProductSubscription(tenantId, 'pawnshop', platformPlan);
      }

      logger.info(`✅ Synced product subscriptions for tenant ${tenantId}`);
    } catch (err) {
      logger.error(`Error syncing product subscriptions: ${err.message}`);
      // Don't throw - this is a best-effort sync
    }
  }

  /**
   * Ensure a product subscription exists
   * Auto-creates if missing
   */
  static async ensureProductSubscription(tenantId, productType, platformPlanName) {
    try {
      // Check if active subscription exists
      const existing = await pool.query(
        `SELECT id FROM product_subscriptions 
         WHERE tenant_id = $1 AND product_type = $2 AND status = 'active'`,
        [tenantId, productType]
      );

      if (existing.rows.length > 0) {
        return; // Already exists
      }

      // Find matching product plan based on platform tier
      let planResult = await pool.query(
        `SELECT id, price, billing_cycle FROM subscription_plans 
         WHERE product_type = $1 
         AND name ILIKE $2
         AND status = 'active'
         LIMIT 1`,
        [productType, `%${platformPlanName}%`]
      );

      // Fallback to starter if no tier match
      if (planResult.rows.length === 0) {
        planResult = await pool.query(
          `SELECT id, price, billing_cycle FROM subscription_plans 
           WHERE product_type = $1 
           AND name ILIKE '%starter%'
           AND status = 'active'
           LIMIT 1`,
          [productType]
        );
      }

      if (planResult.rows.length === 0) {
        logger.warn(`No ${productType} plan found for tenant ${tenantId}`);
        return;
      }

      const plan = planResult.rows[0];

      // Create the subscription
      await pool.query(
        `INSERT INTO product_subscriptions 
         (tenant_id, product_type, subscription_plan_id, status, started_at, price, billing_cycle)
         VALUES ($1, $2, $3, 'active', NOW(), $4, $5)`,
        [tenantId, productType, plan.id, plan.price, plan.billing_cycle || 'monthly']
      );

      logger.info(`✅ Auto-created ${productType} subscription for tenant ${tenantId}`);
    } catch (err) {
      logger.error(`Error ensuring product subscription: ${err.message}`);
      // Don't throw - best effort
    }
  }

  /**
   * Sync product subscriptions when tenant updates product flags
   * Creates subscriptions for enabled products, cancels for disabled
   */
  static async syncProductSubscriptionsOnUpdate(tenantId, updateData) {
    try {
      // Get current tenant state to know the platform plan
      const tenantResult = await pool.query(
        `SELECT plan FROM tenants WHERE id = $1`,
        [tenantId]
      );

      if (tenantResult.rows.length === 0) {
        return;
      }

      const platformPlan = tenantResult.rows[0].plan || 'starter';

      // Handle Money Loan
      if (updateData.money_loan_enabled !== undefined) {
        if (updateData.money_loan_enabled === true) {
          logger.info(`🔄 Enabling Money Loan for tenant ${tenantId}`);
          await this.ensureProductSubscription(tenantId, 'money_loan', platformPlan);
        } else {
          logger.info(`🔄 Disabling Money Loan for tenant ${tenantId}`);
          await this.cancelProductSubscription(tenantId, 'money_loan');
        }
      }

      // Handle BNPL
      if (updateData.bnpl_enabled !== undefined) {
        if (updateData.bnpl_enabled === true) {
          logger.info(`🔄 Enabling BNPL for tenant ${tenantId}`);
          await this.ensureProductSubscription(tenantId, 'bnpl', platformPlan);
        } else {
          logger.info(`🔄 Disabling BNPL for tenant ${tenantId}`);
          await this.cancelProductSubscription(tenantId, 'bnpl');
        }
      }

      // Handle Pawnshop
      if (updateData.pawnshop_enabled !== undefined) {
        if (updateData.pawnshop_enabled === true) {
          logger.info(`🔄 Enabling Pawnshop for tenant ${tenantId}`);
          await this.ensureProductSubscription(tenantId, 'pawnshop', platformPlan);
        } else {
          logger.info(`🔄 Disabling Pawnshop for tenant ${tenantId}`);
          await this.cancelProductSubscription(tenantId, 'pawnshop');
        }
      }

      logger.info(`✅ Product subscription sync completed for tenant ${tenantId}`);
    } catch (err) {
      logger.error(`Error syncing product subscriptions on update: ${err.message}`);
      // Don't throw - this shouldn't block the main update
    }
  }

  /**
   * Cancel a product subscription
   */
  static async cancelProductSubscription(tenantId, productType) {
    try {
      const result = await pool.query(
        `UPDATE product_subscriptions 
         SET status = 'cancelled', updated_at = NOW()
         WHERE tenant_id = $1 AND product_type = $2 AND status = 'active'
         RETURNING id`,
        [tenantId, productType]
      );

      if (result.rows.length > 0) {
        logger.info(`✅ Cancelled ${productType} subscription for tenant ${tenantId}`);
      } else {
        logger.info(`ℹ️  No active ${productType} subscription to cancel for tenant ${tenantId}`);
      }
    } catch (err) {
      logger.error(`Error cancelling product subscription: ${err.message}`);
      // Don't throw - best effort
    }
  }

  /**
   * List all tenants with pagination
   */
  static async listTenants(page = 1, limit = 20, status = null, plan = null) {
    try {
      const offset = (page - 1) * limit;

      let whereConditions = [];
      let params = [];
      let paramCount = 1;

      if (status) {
        whereConditions.push(`status = $${paramCount++}`);
        params.push(status);
      }

      if (plan) {
        whereConditions.push(`plan = $${paramCount++}`);
        params.push(plan);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const countQuery = `SELECT COUNT(*) as total FROM tenants ${whereClause}`;
      const dataQuery = `
        SELECT id, name, subdomain, plan, status, max_users, created_at,
               money_loan_enabled, bnpl_enabled, pawnshop_enabled
        FROM tenants
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      params.push(limit, offset);

      const [countResult, dataResult] = await Promise.all([
        pool.query(countQuery, params.slice(0, params.length - 2)),
        pool.query(dataQuery, params),
      ]);

      // Transform tenant data to camelCase
      const transformedTenants = dataResult.rows.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        plan: tenant.plan,
        status: tenant.status,
        maxUsers: tenant.max_users,
        createdAt: tenant.created_at,
        moneyLoanEnabled: tenant.money_loan_enabled,
        bnplEnabled: tenant.bnpl_enabled,
        pawnshopEnabled: tenant.pawnshop_enabled
      }));

      return {
        tenants: transformedTenants,
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
        },
      };
    } catch (err) {
      logger.error(`Tenant service list error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Update tenant
   */
  static async updateTenant(tenantId, updateData, requestingUserId) {
    try {
      logger.info('Update tenant data received:', JSON.stringify(updateData));
      
      const fieldsToUpdate = [];
      const values = [];
      let paramCount = 1;

      if (updateData.name !== undefined) {
        fieldsToUpdate.push(`name = $${paramCount++}`);
        values.push(updateData.name);
      }

      if (updateData.plan !== undefined) {
        fieldsToUpdate.push(`plan = $${paramCount++}`);
        values.push(updateData.plan);
      }

      if (updateData.status !== undefined) {
        fieldsToUpdate.push(`status = $${paramCount++}`);
        values.push(updateData.status);
      }

      if (updateData.max_users !== undefined) {
        fieldsToUpdate.push(`max_users = $${paramCount++}`);
        values.push(updateData.max_users);
      }

      // Handle colors object or direct primaryColor/secondaryColor
      if (updateData.colors?.primary !== undefined || updateData.primaryColor !== undefined) {
        fieldsToUpdate.push(`primary_color = $${paramCount++}`);
        values.push(updateData.colors?.primary || updateData.primaryColor);
      }

      if (updateData.colors?.secondary !== undefined || updateData.secondaryColor !== undefined) {
        fieldsToUpdate.push(`secondary_color = $${paramCount++}`);
        values.push(updateData.colors?.secondary || updateData.secondaryColor);
      }

      if (updateData.logo_url !== undefined) {
        fieldsToUpdate.push(`logo_url = $${paramCount++}`);
        values.push(updateData.logo_url);
      }

      if (updateData.contact_person !== undefined) {
        fieldsToUpdate.push(`contact_person = $${paramCount++}`);
        values.push(updateData.contact_person);
      }

      if (updateData.contact_email !== undefined) {
        fieldsToUpdate.push(`contact_email = $${paramCount++}`);
        values.push(updateData.contact_email);
      }

      if (updateData.contact_phone !== undefined) {
        fieldsToUpdate.push(`contact_phone = $${paramCount++}`);
        values.push(updateData.contact_phone);
      }

      // Accept both camelCase and snake_case for product flags
      if (updateData.money_loan_enabled !== undefined || updateData.moneyLoanEnabled !== undefined) {
        fieldsToUpdate.push(`money_loan_enabled = $${paramCount++}`);
        values.push(updateData.money_loan_enabled !== undefined ? updateData.money_loan_enabled : updateData.moneyLoanEnabled);
      }

      if (updateData.bnpl_enabled !== undefined || updateData.bnplEnabled !== undefined) {
        fieldsToUpdate.push(`bnpl_enabled = $${paramCount++}`);
        values.push(updateData.bnpl_enabled !== undefined ? updateData.bnpl_enabled : updateData.bnplEnabled);
      }

      if (updateData.pawnshop_enabled !== undefined || updateData.pawnshopEnabled !== undefined) {
        fieldsToUpdate.push(`pawnshop_enabled = $${paramCount++}`);
        values.push(updateData.pawnshop_enabled !== undefined ? updateData.pawnshop_enabled : updateData.pawnshopEnabled);
      }

      if (fieldsToUpdate.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(tenantId);

      const query = `
        UPDATE tenants
        SET ${fieldsToUpdate.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount}
        RETURNING id, name, subdomain, plan, status, max_users, logo_url, 
                  contact_person, contact_email, contact_phone,
                  money_loan_enabled, bnpl_enabled, pawnshop_enabled
      `;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Tenant not found');
      }

      // If plan was updated, also update tenant_subscriptions
      if (updateData.plan !== undefined) {
        const planResult = await pool.query(
          `SELECT id, price FROM subscription_plans WHERE LOWER(name) = LOWER($1) AND status = 'active'`,
          [updateData.plan]
        );

        if (planResult.rows.length > 0) {
          const planId = planResult.rows[0].id;
          const monthlyPrice = planResult.rows[0].price;

          // Check if tenant has an existing active subscription
          const existingSub = await pool.query(
            `SELECT id, plan_id FROM tenant_subscriptions WHERE tenant_id = $1 AND status = 'active'`,
            [tenantId]
          );

          if (existingSub.rows.length > 0) {
            const existingPlanId = existingSub.rows[0].plan_id;
            
            // If plan changed, cancel old subscription and create new one (preserve history)
            if (existingPlanId !== planId) {
              // Cancel existing subscription
              await pool.query(
                `UPDATE tenant_subscriptions 
                 SET status = 'cancelled', 
                     cancelled_at = CURRENT_TIMESTAMP,
                     cancellation_reason = 'Plan changed',
                     updated_at = CURRENT_TIMESTAMP
                 WHERE tenant_id = $1 AND status = 'active'`,
                [tenantId]
              );
              logger.info(`Cancelled old subscription for tenant ${tenantId} (plan changed)`);

              // Create new subscription
              const startDate = new Date();
              const expirationDate = new Date(startDate);
              expirationDate.setFullYear(expirationDate.getFullYear() + 1);

              await pool.query(
                `INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, started_at, expires_at, monthly_price)
                 VALUES ($1, $2, 'active', $3, $4, $5)`,
                [tenantId, planId, startDate, expirationDate, monthlyPrice]
              );
              logger.info(`Created new subscription for tenant ${tenantId} -> Plan ${planId}`);
            } else {
              // Same plan, just update the price if needed
              await pool.query(
                `UPDATE tenant_subscriptions 
                 SET monthly_price = $1, updated_at = CURRENT_TIMESTAMP
                 WHERE tenant_id = $2 AND status = 'active'`,
                [monthlyPrice, tenantId]
              );
              logger.info(`Updated subscription price for tenant ${tenantId}`);
            }
          } else {
            // No active subscription, create new one
            const startDate = new Date();
            const expirationDate = new Date(startDate);
            expirationDate.setFullYear(expirationDate.getFullYear() + 1);

            await pool.query(
              `INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, started_at, expires_at, monthly_price)
               VALUES ($1, $2, 'active', $3, $4, $5)`,
              [tenantId, planId, startDate, expirationDate, monthlyPrice]
            );
            logger.info(`Created new subscription for tenant ${tenantId} -> Plan ${planId}`);
          }
        }
      }

      logger.info(`Tenant updated: ${tenantId}`);
      return result.rows[0];
    } catch (err) {
      logger.error(`Tenant service update error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Suspend tenant
   */
  static async suspendTenant(tenantId, reason, requestingUserId) {
    try {
      const result = await pool.query(
        `UPDATE tenants SET status = 'suspended', updated_at = NOW() WHERE id = $1
         RETURNING id, name, status`,
        [tenantId]
      );

      if (result.rows.length === 0) {
        throw new Error('Tenant not found');
      }

      logger.info(`Tenant suspended: ${tenantId} - Reason: ${reason}`);
      return result.rows[0];
    } catch (err) {
      logger.error(`Tenant service suspend error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Activate tenant
   */
  static async activateTenant(tenantId, requestingUserId) {
    try {
      const result = await pool.query(
        `UPDATE tenants SET status = 'active', updated_at = NOW() WHERE id = $1
         RETURNING id, name, status`,
        [tenantId]
      );

      if (result.rows.length === 0) {
        throw new Error('Tenant not found');
      }

      logger.info(`Tenant activated: ${tenantId}`);
      return result.rows[0];
    } catch (err) {
      logger.error(`Tenant service activate error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Delete tenant (soft delete)
   */
  static async deleteTenant(tenantId, requestingUserId) {
    try {
      const result = await pool.query(
        `UPDATE tenants SET status = 'deleted', updated_at = NOW() WHERE id = $1 RETURNING id`,
        [tenantId]
      );

      if (result.rows.length === 0) {
        throw new Error('Tenant not found');
      }

      logger.info(`Tenant deleted: ${tenantId}`);
      return { message: 'Tenant deleted successfully' };
    } catch (err) {
      logger.error(`Tenant service delete error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Restore tenant (from soft delete)
   */
  static async restoreTenant(tenantId, requestingUserId) {
    try {
      const result = await pool.query(
        `UPDATE tenants SET status = 'active', updated_at = NOW() WHERE id = $1 AND status = 'deleted' RETURNING *`,
        [tenantId]
      );

      if (result.rows.length === 0) {
        throw new Error('Tenant not found or not deleted');
      }

      const tenant = this.transformTenant(result.rows[0]);

      logger.info(`Tenant restored: ${tenantId}`);
      return tenant;
    } catch (err) {
      logger.error(`Tenant service restore error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get tenant statistics
   */
  static async getTenantStats(tenantId) {
    try {
      const stats = await Promise.all([
        pool.query(`SELECT COUNT(*) as count FROM users WHERE tenant_id = $1`, [tenantId]),
        pool.query(`SELECT COUNT(*) as count FROM roles WHERE tenant_id = $1`, [tenantId]),
        pool.query(`SELECT COUNT(*) as count FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.tenant_id = $1`, [tenantId]),
        pool.query(`SELECT COUNT(*) as count FROM audit_logs WHERE tenant_id = $1`, [tenantId]),
        pool.query(
          `SELECT COUNT(*) as count 
           FROM user_sessions us 
           JOIN users u ON us.user_id = u.id 
           WHERE u.tenant_id = $1 AND us.status = 'active'`,
          [tenantId]
        ),
      ]);

      return {
        totalUsers: parseInt(stats[0].rows[0].count),
        totalRoles: parseInt(stats[1].rows[0].count),
        totalAssignments: parseInt(stats[2].rows[0].count),
        totalAuditLogs: parseInt(stats[3].rows[0].count),
        activeSessions: parseInt(stats[4].rows[0].count),
      };
    } catch (err) {
      logger.error(`Tenant service get stats error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Check user count against plan limit
   */
  static async validateUserLimit(tenantId) {
    try {
      const result = await pool.query(
        `SELECT t.max_users, COUNT(u.id) as user_count
         FROM tenants t
         LEFT JOIN users u ON t.id = u.tenant_id
         WHERE t.id = $1
         GROUP BY t.id, t.max_users`,
        [tenantId]
      );

      if (result.rows.length === 0) {
        throw new Error('Tenant not found');
      }

      const { max_users, user_count } = result.rows[0];

      return {
        allowed: user_count < max_users,
        currentCount: parseInt(user_count),
        maxCount: max_users,
        remaining: max_users - parseInt(user_count),
      };
    } catch (err) {
      logger.error(`Tenant service validate user limit error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Create or update subscription for tenant
   */
  static async createOrUpdateSubscription(tenantId, userId, planId, billingCycle, paymentMethod) {
    try {
      // Get plan details
      const planResult = await pool.query(
        `SELECT * FROM subscription_plans WHERE id = $1 AND status = 'active'`,
        [planId]
      );

      if (planResult.rows.length === 0) {
        throw new Error('Invalid plan selected');
      }

      const plan = planResult.rows[0];
      const isProductPlan = plan.product_type && plan.product_type !== 'platform';
      let transactionType = 'subscription';

      if (isProductPlan) {
        // Create/update product subscription
        // Check for ANY existing subscription (active or inactive) to avoid unique constraint violation
        const existingProductSub = await pool.query(
          `SELECT id, status FROM product_subscriptions 
           WHERE tenant_id = $1 AND product_type = $2`,
          [tenantId, plan.product_type]
        );

        if (existingProductSub.rows.length > 0) {
          // Update existing subscription (reactivate if needed)
          transactionType = existingProductSub.rows[0].status === 'active' ? 'upgrade' : 'subscription';
          await pool.query(
            `UPDATE product_subscriptions 
             SET subscription_plan_id = $1, price = $2, billing_cycle = $3, 
                 status = 'active', started_at = NOW(), updated_at = NOW()
             WHERE id = $4`,
            [planId, plan.price, billingCycle, existingProductSub.rows[0].id]
          );
        } else {
          // Create new product subscription
          await pool.query(
            `INSERT INTO product_subscriptions 
             (tenant_id, product_type, subscription_plan_id, status, started_at, price, billing_cycle)
             VALUES ($1, $2, $3, 'active', NOW(), $4, $5)`,
            [tenantId, plan.product_type, planId, plan.price, billingCycle]
          );
        }

        logger.info(`✅ Created/Updated ${plan.product_type} subscription for tenant ${tenantId}`);
      } else {
        // Create/update platform subscription
        // Check for ANY existing subscription (active or inactive)
        const existingPlatformSub = await pool.query(
          `SELECT id, status FROM tenant_subscriptions WHERE tenant_id = $1`,
          [tenantId]
        );

        if (existingPlatformSub.rows.length > 0) {
          // Update existing subscription (reactivate if needed)
          transactionType = existingPlatformSub.rows[0].status === 'active' ? 'upgrade' : 'subscription';
          await pool.query(
            `UPDATE tenant_subscriptions 
             SET plan_id = $1, price = $2, billing_cycle = $3, 
                 status = 'active', started_at = NOW(), updated_at = NOW()
             WHERE id = $4`,
            [planId, plan.price, billingCycle, existingPlatformSub.rows[0].id]
          );
        } else {
          // Create new platform subscription
          await pool.query(
            `INSERT INTO tenant_subscriptions 
             (tenant_id, plan_id, status, started_at, price, billing_cycle)
             VALUES ($1, $2, 'active', NOW(), $3, $4)`,
            [tenantId, planId, plan.price, billingCycle]
          );
        }

        // Update tenant plan
        await pool.query(
          `UPDATE tenants SET plan = $1, updated_at = NOW() WHERE id = $2`,
          [plan.name.toLowerCase(), tenantId]
        );

        logger.info(`✅ Created/Updated platform subscription for tenant ${tenantId}`);
      }

      // Generate invoice ID (format: INV-YYYYMMDD-XXX)
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const invoiceId = `INV-${today}-${randomSuffix}`;

      // Save payment history record
      await pool.query(
        `INSERT INTO payment_history 
         (tenant_id, user_id, subscription_plan_id, transaction_id, amount, currency, 
          status, provider, transaction_type, plan_name, product_type, description, processed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
        [
          tenantId,
          userId,
          planId,
          invoiceId,
          plan.price,
          'PHP',
          'success', // Since this is a simulated payment
          paymentMethod || 'credit_card',
          transactionType,
          plan.name,
          plan.product_type || 'platform',
          `${transactionType === 'upgrade' ? 'Upgraded to' : 'Subscribed to'} ${plan.name} - ${billingCycle} billing`
        ]
      );

      logger.info(`💳 Payment history recorded: ${invoiceId} for tenant ${tenantId}`);

      return {
        success: true,
        plan: plan.name,
        productType: plan.product_type,
        billingCycle,
        paymentMethod
      };
    } catch (err) {
      logger.error(`Tenant service create subscription error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get payment history for a tenant with optional filters
   */
  static async getPaymentHistory(tenantId, filters = {}) {
    try {
      const { 
        dateRange = 'all', 
        transactionType = 'all', 
        status = 'all',
        page = 1,
        limit = 20
      } = filters;

      let whereClauses = ['tenant_id = $1'];
      let params = [tenantId];
      let paramCounter = 2;

      // Date range filter
      if (dateRange !== 'all') {
        let daysAgo;
        switch (dateRange) {
          case '7days': daysAgo = 7; break;
          case '30days': daysAgo = 30; break;
          case '90days': daysAgo = 90; break;
          default: daysAgo = null;
        }
        if (daysAgo) {
          whereClauses.push(`processed_at >= NOW() - INTERVAL '${daysAgo} days'`);
        }
      }

      // Transaction type filter
      if (transactionType !== 'all') {
        whereClauses.push(`transaction_type = $${paramCounter}`);
        params.push(transactionType);
        paramCounter++;
      }

      // Status filter
      if (status !== 'all') {
        whereClauses.push(`status = $${paramCounter}`);
        params.push(status);
        paramCounter++;
      }

      const whereClause = whereClauses.join(' AND ');
      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM payment_history WHERE ${whereClause}`,
        params
      );

      // Get paginated records
      const historyResult = await pool.query(
        `SELECT 
          id,
          transaction_id as "invoiceId",
          transaction_type as "transactionType",
          amount,
          currency,
          status,
          provider as "paymentMethod",
          plan_name as "planName",
          product_type as "productType",
          description,
          processed_at as "date",
          created_at as "createdAt"
         FROM payment_history 
         WHERE ${whereClause}
         ORDER BY processed_at DESC
         LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`,
        [...params, limit, offset]
      );

      return {
        transactions: historyResult.rows,
        total: parseInt(countResult.rows[0].count),
        page,
        limit,
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      };
    } catch (err) {
      logger.error(`Get payment history error: ${err.message}`);
      throw err;
    }
  }
}

module.exports = TenantService;
