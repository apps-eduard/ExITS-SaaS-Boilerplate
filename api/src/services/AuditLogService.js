/**
 * Audit Log Service
 * Handles audit trail management and compliance logging
 */

const pool = require('../config/database');
const logger = require('../utils/logger');

class AuditLogService {
  /**
   * Transform database audit log to camelCase
   */
  static transformAuditLog(dbLog) {
    return {
      id: dbLog.id,
      userId: dbLog.user_id,
      userEmail: dbLog.email,
      userName: dbLog.first_name && dbLog.last_name 
        ? `${dbLog.first_name} ${dbLog.last_name}` 
        : null,
      action: dbLog.action,
      entityType: dbLog.entity_type,
      entityId: dbLog.entity_id,
      changes: typeof dbLog.changes === 'string' ? JSON.parse(dbLog.changes) : dbLog.changes,
      ipAddress: dbLog.ip_address,
      requestId: dbLog.request_id,
      createdAt: dbLog.created_at,
    };
  }

  /**
   * Create audit log entry
   */
  static async log(userId, tenantId, action, entityType, entityId, changes = {}, ipAddress = '', requestId = '') {
    try {
      await pool.query(
        `INSERT INTO audit_logs (user_id, tenant_id, action, entity_type, entity_id, changes, status, ip_address, request_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [userId, tenantId, action, entityType, entityId, JSON.stringify(changes), 'active', ipAddress, requestId]
      );
    } catch (err) {
      logger.error(`Audit log error: ${err.message}`);
    }
  }

  /**
   * Get audit logs with filtering
   */
  static async getAuditLogs(tenantId, filters = {}, page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;
      let whereConditions = ['a.tenant_id = $1'];
      let params = [tenantId];
      let paramCount = 2;

      if (filters.userId) {
        whereConditions.push(`a.user_id = $${paramCount++}`);
        params.push(filters.userId);
      }

      if (filters.action) {
        whereConditions.push(`a.action = $${paramCount++}`);
        params.push(filters.action);
      }

      if (filters.entityType) {
        whereConditions.push(`a.entity_type = $${paramCount++}`);
        params.push(filters.entityType);
      }

      if (filters.startDate) {
        whereConditions.push(`a.created_at >= $${paramCount++}`);
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        whereConditions.push(`a.created_at <= $${paramCount++}`);
        params.push(filters.endDate);
      }

      const whereClause = whereConditions.join(' AND ');

      const countQuery = `SELECT COUNT(*) as total FROM audit_logs a WHERE ${whereClause}`;
      const dataQuery = `
        SELECT a.id, a.user_id, a.action, a.entity_type, a.entity_id, a.changes, a.ip_address, a.created_at,
               u.email, u.first_name, u.last_name
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE ${whereClause}
        ORDER BY a.created_at DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      params.push(limit, offset);

      const [countResult, dataResult] = await Promise.all([
        pool.query(countQuery, params.slice(0, params.length - 2)),
        pool.query(dataQuery, params),
      ]);

      const logs = dataResult.rows.map(row => this.transformAuditLog(row));

      return {
        logs,
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
        },
      };
    } catch (err) {
      logger.error(`Audit log service get logs error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get audit log by ID
   */
  static async getAuditLogById(logId, tenantId) {
    try {
      const result = await pool.query(
        `SELECT a.id, a.user_id, a.tenant_id, a.action, a.entity_type, a.entity_id, a.changes, 
                a.ip_address, a.request_id, a.created_at,
                u.email, u.first_name, u.last_name
         FROM audit_logs a
         LEFT JOIN users u ON a.user_id = u.id
         WHERE a.id = $1 AND a.tenant_id = $2`,
        [logId, tenantId]
      );

      if (result.rows.length === 0) {
        throw new Error('Audit log not found');
      }

      return this.transformAuditLog(result.rows[0]);
    } catch (err) {
      logger.error(`Audit log service get by ID error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get user's audit history
   */
  static async getUserAuditHistory(userId, tenantId, limit = 100) {
    try {
      const result = await pool.query(
        `SELECT id, action, entity_type, entity_id, changes, ip_address, created_at
         FROM audit_logs
         WHERE user_id = $1 AND tenant_id = $2
         ORDER BY created_at DESC
         LIMIT $3`,
        [userId, tenantId, limit]
      );

      return result.rows.map(row => ({
        id: row.id,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        changes: typeof row.changes === 'string' ? JSON.parse(row.changes) : row.changes,
        ipAddress: row.ip_address,
        createdAt: row.created_at,
      }));
    } catch (err) {
      logger.error(`Audit log service get user history error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Export audit logs (CSV format)
   */
  static async exportAuditLogs(tenantId, filters = {}) {
    try {
      const auditData = await this.getAuditLogs(tenantId, filters, 1, 10000);

      // Convert to CSV format
      const headers = ['Log ID', 'User Email', 'Action', 'Entity Type', 'Entity ID', 'Changes', 'IP Address', 'Timestamp'];
      const rows = auditData.logs.map(log => [
        log.id,
        log.user_email || 'N/A',
        log.action,
        log.entity_type,
        log.entity_id,
        JSON.stringify(log.changes),
        log.ip_address,
        log.created_at,
      ]);

      const csv = [headers, ...rows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      return csv;
    } catch (err) {
      logger.error(`Audit log service export error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get audit statistics
   */
  static async getAuditStats(tenantId, startDate, endDate) {
    try {
      const result = await pool.query(
        `SELECT
          action,
          entity_type,
          COUNT(*) as count
         FROM audit_logs
         WHERE tenant_id = $1 AND created_at BETWEEN $2 AND $3
         GROUP BY action, entity_type
         ORDER BY count DESC`,
        [tenantId, startDate, endDate]
      );

      return result.rows;
    } catch (err) {
      logger.error(`Audit log service get stats error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get suspicious activities (multiple failed logins, permission changes, etc.)
   */
  static async getSuspiciousActivities(tenantId, hoursSince = 24) {
    try {
      const result = await pool.query(
        `SELECT
          user_id,
          email,
          COUNT(CASE WHEN action = 'login' THEN 1 END) as login_attempts,
          COUNT(CASE WHEN action IN ('grant_permission', 'revoke_permission', 'assign_role', 'remove_role') THEN 1 END) as permission_changes,
          COUNT(*) as total_actions
         FROM audit_logs a
         LEFT JOIN users u ON a.user_id = u.id
         WHERE a.tenant_id = $1 AND a.created_at > NOW() - INTERVAL '${hoursSince} hours'
         GROUP BY user_id, email
         HAVING COUNT(CASE WHEN action = 'login' THEN 1 END) > 5
            OR COUNT(CASE WHEN action IN ('grant_permission', 'revoke_permission') THEN 1 END) > 10
         ORDER BY total_actions DESC`,
        [tenantId]
      );

      return result.rows;
    } catch (err) {
      logger.error(`Audit log service get suspicious activities error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Archive old audit logs (for compliance)
   */
  static async archiveOldLogs(tenantId, daysOld = 90) {
    try {
      const result = await pool.query(
        `UPDATE audit_logs SET status = 'archived'
         WHERE tenant_id = $1 AND created_at < NOW() - INTERVAL '${daysOld} days' AND status = 'active'
         RETURNING COUNT(*) as archived_count`,
        [tenantId]
      );

      logger.info(`Archived ${result.rowCount} audit logs for tenant ${tenantId}`);
      return { archivedCount: result.rowCount };
    } catch (err) {
      logger.error(`Audit log service archive error: ${err.message}`);
      throw err;
    }
  }
}

module.exports = AuditLogService;
