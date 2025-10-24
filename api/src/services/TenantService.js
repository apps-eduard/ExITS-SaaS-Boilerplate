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
              `INSERT INTO role_permissions_standard (role_id, permission_id) 
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
        `SELECT t.id, t.name, t.subdomain, t.plan, t.status, t.max_users, t.logo_url, 
                t.primary_color, t.secondary_color, t.created_at, t.updated_at,
                t.contact_person, t.contact_email, t.contact_phone,
                t.money_loan_enabled, t.bnpl_enabled, t.pawnshop_enabled,
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

      return {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        plan: tenant.plan,
        status: tenant.status,
        max_users: tenant.max_users,
        logo_url: tenant.logo_url,
        primary_color: tenant.primary_color,
        secondary_color: tenant.secondary_color,
        contact_person: tenant.contact_person,
        contact_email: tenant.contact_email,
        contact_phone: tenant.contact_phone,
        created_at: tenant.created_at,
        updated_at: tenant.updated_at,
        money_loan_enabled: tenant.money_loan_enabled,
        bnpl_enabled: tenant.bnpl_enabled,
        pawnshop_enabled: tenant.pawnshop_enabled,
        user_count: parseInt(usersCountResult.rows[0].count),
        role_count: parseInt(rolesCountResult.rows[0].count),
        subscription_plan: tenant.plan_id ? {
          id: tenant.plan_id,
          name: tenant.plan_name,
          description: tenant.plan_description,
          price: parseFloat(tenant.price),
          billing_cycle: tenant.billing_cycle,
          features: tenant.features,
          max_users: tenant.plan_max_users,
          max_storage_gb: tenant.max_storage_gb
        } : null
      };
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
        SELECT id, name, subdomain, plan, status, max_users, created_at
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

      return {
        tenants: dataResult.rows,
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

      if (updateData.money_loan_enabled !== undefined) {
        fieldsToUpdate.push(`money_loan_enabled = $${paramCount++}`);
        values.push(updateData.money_loan_enabled);
      }

      if (updateData.bnpl_enabled !== undefined) {
        fieldsToUpdate.push(`bnpl_enabled = $${paramCount++}`);
        values.push(updateData.bnpl_enabled);
      }

      if (updateData.pawnshop_enabled !== undefined) {
        fieldsToUpdate.push(`pawnshop_enabled = $${paramCount++}`);
        values.push(updateData.pawnshop_enabled);
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
          `SELECT COUNT(*) as count FROM sessions WHERE tenant_id = $1 AND status = 'active'`,
          [tenantId]
        ),
      ]);

      return {
        total_users: parseInt(stats[0].rows[0].count),
        total_roles: parseInt(stats[1].rows[0].count),
        total_assignments: parseInt(stats[2].rows[0].count),
        total_audit_logs: parseInt(stats[3].rows[0].count),
        active_sessions: parseInt(stats[4].rows[0].count),
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
        current_count: parseInt(user_count),
        max_count: max_users,
        remaining: max_users - parseInt(user_count),
      };
    } catch (err) {
      logger.error(`Tenant service validate user limit error: ${err.message}`);
      throw err;
    }
  }
}

module.exports = TenantService;
