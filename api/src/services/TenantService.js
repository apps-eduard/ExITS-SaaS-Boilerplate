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
   * Create a new tenant
   */
  static async createTenant(tenantData, requestingUserId) {
    try {
      // Check if subdomain is already taken
      const existingTenant = await pool.query(
        `SELECT id FROM tenants WHERE subdomain = $1`,
        [tenantData.subdomain]
      );

      if (existingTenant.rows.length > 0) {
        throw new Error('Subdomain already taken');
      }

      const result = await pool.query(
        `INSERT INTO tenants (name, subdomain, plan, status, max_users, logo_url, primary_color, secondary_color)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, name, subdomain, plan, status, max_users, created_at`,
        [
          tenantData.name,
          tenantData.subdomain,
          tenantData.plan || 'basic',
          tenantData.status || 'active',
          tenantData.maxUsers || 10,
          tenantData.logoUrl || null,
          tenantData.primaryColor || null,
          tenantData.secondaryColor || null,
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

      for (const role of defaultRoles) {
        await pool.query(
          `INSERT INTO roles (tenant_id, name, description, space)
           VALUES ($1, $2, $3, $4)`,
          [tenant.id, role.name, role.description, role.space]
        );
      }

      logger.info(`Tenant created: ${tenant.name} (${tenant.id})`);

      return tenant;
    } catch (err) {
      logger.error(`Tenant service create error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get tenant by ID
   */
  static async getTenantById(tenantId) {
    try {
      const result = await pool.query(
        `SELECT id, name, subdomain, plan, status, max_users, logo_url, primary_color, secondary_color, created_at, updated_at
         FROM tenants
         WHERE id = $1`,
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
        ...tenant,
        user_count: parseInt(usersCountResult.rows[0].count),
        role_count: parseInt(rolesCountResult.rows[0].count),
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

      if (updateData.primaryColor !== undefined) {
        fieldsToUpdate.push(`primary_color = $${paramCount++}`);
        values.push(updateData.primaryColor);
      }

      if (updateData.secondaryColor !== undefined) {
        fieldsToUpdate.push(`secondary_color = $${paramCount++}`);
        values.push(updateData.secondaryColor);
      }

      values.push(tenantId);

      const query = `
        UPDATE tenants
        SET ${fieldsToUpdate.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount}
        RETURNING id, name, subdomain, plan, status, max_users
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
