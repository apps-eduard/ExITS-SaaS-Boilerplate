const pool = require('../config/database');
const CONSTANTS = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Controller for System Logs and Audit Logs
 */
class SystemLogsController {
  /**
   * Get dashboard statistics for logs
   */
  static async getDashboard(req, res, next) {
    try {
      const { timeRange = '24h' } = req.query;
      
      // Calculate time filter
      let hoursAgo = 24;
      switch (timeRange) {
        case '1h': hoursAgo = 1; break;
        case '6h': hoursAgo = 6; break;
        case '24h': hoursAgo = 24; break;
        case '7d': hoursAgo = 168; break;
        case '30d': hoursAgo = 720; break;
        default: hoursAgo = 24;
      }

      const timeFilter = `timestamp >= NOW() - INTERVAL '${hoursAgo} hours'`;

      // Get system logs stats
      const systemStats = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE level = 'error') as error_count,
          COUNT(*) FILTER (WHERE level = 'warning') as warning_count,
          COUNT(*) FILTER (WHERE level = 'critical') as critical_count,
          COUNT(*) FILTER (WHERE level = 'info') as info_count,
          COUNT(*) as total_logs,
          AVG(response_time_ms) as avg_response_time,
          COUNT(DISTINCT category) as unique_categories
        FROM system_logs
        WHERE ${timeFilter}
      `);

      // Get audit logs stats
      const auditStats = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE action = 'login') as login_count,
          COUNT(*) FILTER (WHERE action = 'create') as create_count,
          COUNT(*) FILTER (WHERE action = 'update') as update_count,
          COUNT(*) FILTER (WHERE action = 'delete') as delete_count,
          COUNT(*) as total_audits,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT tenant_id) as unique_tenants
        FROM audit_logs
        WHERE ${timeFilter}
      `);

      // Get top error categories
      const topErrors = await pool.query(`
        SELECT category, COUNT(*) as count
        FROM system_logs
        WHERE ${timeFilter} AND level IN ('error', 'critical')
        GROUP BY category
        ORDER BY count DESC
        LIMIT 5
      `);

      // Get recent critical errors
      const criticalErrors = await pool.query(`
        SELECT id, timestamp, category, message, level
        FROM system_logs
        WHERE ${timeFilter} AND level = 'critical'
        ORDER BY timestamp DESC
        LIMIT 10
      `);

      // Get top user activities
      const topUsers = await pool.query(`
        SELECT 
          u.email,
          u.first_name,
          u.last_name,
          COUNT(al.id) as action_count
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE ${timeFilter}
        GROUP BY u.id, u.email, u.first_name, u.last_name
        ORDER BY action_count DESC
        LIMIT 10
      `);

      // Get activity timeline (hourly)
      const timeline = await pool.query(`
        SELECT 
          DATE_TRUNC('hour', timestamp) as hour,
          COUNT(*) FILTER (WHERE level = 'error') as errors,
          COUNT(*) FILTER (WHERE level = 'warning') as warnings,
          COUNT(*) as total
        FROM system_logs
        WHERE ${timeFilter}
        GROUP BY hour
        ORDER BY hour DESC
        LIMIT 24
      `);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: {
          systemLogs: systemStats.rows[0],
          auditLogs: auditStats.rows[0],
          topErrors: topErrors.rows,
          criticalErrors: criticalErrors.rows,
          topUsers: topUsers.rows,
          timeline: timeline.rows,
        },
        message: 'Dashboard data retrieved successfully',
      });
    } catch (err) {
      logger.error(`System logs dashboard error: ${err.message}`);
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to load dashboard data',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }

  /**
   * Get system logs with filtering and pagination
   */
  static async getSystemLogs(req, res, next) {
    try {
      const {
        page = 1,
        limit = 50,
        level,
        category,
        startDate,
        endDate,
        search,
      } = req.query;

      const offset = (page - 1) * limit;
      const conditions = [];
      const params = [];
      let paramCounter = 1;

      // Build WHERE clause
      if (level) {
        conditions.push(`level = $${paramCounter++}`);
        params.push(level);
      }

      if (category) {
        conditions.push(`category = $${paramCounter++}`);
        params.push(category);
      }

      if (startDate) {
        conditions.push(`timestamp >= $${paramCounter++}`);
        params.push(startDate);
      }

      if (endDate) {
        conditions.push(`timestamp <= $${paramCounter++}`);
        params.push(endDate);
      }

      if (search) {
        conditions.push(`(message ILIKE $${paramCounter++} OR endpoint ILIKE $${paramCounter++})`);
        params.push(`%${search}%`, `%${search}%`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) as total FROM system_logs ${whereClause}`,
        params,
      );

      // Get logs
      const logsResult = await pool.query(
        `SELECT 
          sl.*,
          u.email as user_email,
          t.name as tenant_name
         FROM system_logs sl
         LEFT JOIN users u ON sl.user_id = u.id
         LEFT JOIN tenants t ON sl.tenant_id = t.id
         ${whereClause}
         ORDER BY timestamp DESC
         LIMIT $${paramCounter++} OFFSET $${paramCounter++}`,
        [...params, limit, offset],
      );

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: {
          logs: logsResult.rows,
          pagination: {
            total: parseInt(countResult.rows[0].total),
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(countResult.rows[0].total / limit),
          },
        },
        message: 'System logs retrieved successfully',
      });
    } catch (err) {
      logger.error(`Get system logs error: ${err.message}`);
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to load system logs',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }

  /**
   * Get audit logs with filtering and pagination
   */
  static async getAuditLogs(req, res, next) {
    try {
      const {
        page = 1,
        limit = 50,
        action,
        resourceType,
        userId,
        tenantId,
        startDate,
        endDate,
        search,
      } = req.query;

      const offset = (page - 1) * limit;
      const conditions = [];
      const params = [];
      let paramCounter = 1;

      // Build WHERE clause
      if (action) {
        conditions.push(`action = $${paramCounter++}`);
        params.push(action);
      }

      if (resourceType) {
        conditions.push(`resource_type = $${paramCounter++}`);
        params.push(resourceType);
      }

      if (userId) {
        conditions.push(`user_id = $${paramCounter++}`);
        params.push(userId);
      }

      if (tenantId) {
        conditions.push(`tenant_id = $${paramCounter++}`);
        params.push(tenantId);
      }

      if (startDate) {
        conditions.push(`timestamp >= $${paramCounter++}`);
        params.push(startDate);
      }

      if (endDate) {
        conditions.push(`timestamp <= $${paramCounter++}`);
        params.push(endDate);
      }

      if (search) {
        conditions.push(`(description ILIKE $${paramCounter++} OR resource_id ILIKE $${paramCounter++})`);
        params.push(`%${search}%`, `%${search}%`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`,
        params,
      );

      // Get audit logs
      const logsResult = await pool.query(
        `SELECT 
          al.*,
          u.email as user_email,
          u.first_name,
          u.last_name,
          t.name as tenant_name
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         LEFT JOIN tenants t ON al.tenant_id = t.id
         ${whereClause}
         ORDER BY timestamp DESC
         LIMIT $${paramCounter++} OFFSET $${paramCounter++}`,
        [...params, limit, offset],
      );

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: {
          logs: logsResult.rows,
          pagination: {
            total: parseInt(countResult.rows[0].total),
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(countResult.rows[0].total / limit),
          },
        },
        message: 'Audit logs retrieved successfully',
      });
    } catch (err) {
      logger.error(`Get audit logs error: ${err.message}`);
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to load audit logs',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }

  /**
   * Get available filter options
   */
  static async getFilterOptions(req, res, next) {
    try {
      // Get unique categories from system logs
      const categories = await pool.query(`
        SELECT DISTINCT category 
        FROM system_logs 
        WHERE category IS NOT NULL
        ORDER BY category
      `);

      // Get unique resource types from audit logs
      const resourceTypes = await pool.query(`
        SELECT DISTINCT resource_type 
        FROM audit_logs 
        WHERE resource_type IS NOT NULL
        ORDER BY resource_type
      `);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: {
          logLevels: ['debug', 'info', 'warning', 'error', 'critical'],
          categories: categories.rows.map(r => r.category),
          auditActions: ['login', 'logout', 'create', 'update', 'delete', 'view', 'export', 'import', 'approve', 'reject'],
          resourceTypes: resourceTypes.rows.map(r => r.resource_type),
        },
        message: 'Filter options retrieved successfully',
      });
    } catch (err) {
      logger.error(`Get filter options error: ${err.message}`);
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to load filter options',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }
}

module.exports = SystemLogsController;
