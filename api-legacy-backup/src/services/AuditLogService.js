/**
 * Audit Log Service
 * Handles audit trail management and compliance logging
 */

const knex = require('../config/knex');
const logger = require('../utils/logger');

class AuditLogService {
  /**
   * Create audit log entry
   */
  static async log(userId, tenantId, action, entityType, entityId, changes = {}, ipAddress = '', requestId = '') {
    try {
      await knex('auditLogs').insert({
        userId,
        tenantId,
        action,
        entityType,
        entityId,
        changes: JSON.stringify(changes),
        status: 'active',
        ipAddress,
        requestId,
      });
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

      let query = knex('auditLogs as a')
        .leftJoin('users as u', 'a.userId', 'u.id')
        .select(
          'a.id',
          'a.userId',
          'a.action',
          'a.entityType',
          'a.entityId',
          'a.changes',
          'a.ipAddress',
          'a.createdAt',
          'u.email',
          'u.firstName',
          'u.lastName',
        )
        .where('a.tenantId', tenantId);

      // Apply filters
      if (filters.userId) {
        query = query.where('a.userId', filters.userId);
      }

      if (filters.action) {
        query = query.where('a.action', filters.action);
      }

      if (filters.entityType) {
        query = query.where('a.entityType', filters.entityType);
      }

      if (filters.startDate) {
        query = query.where('a.createdAt', '>=', filters.startDate);
      }

      if (filters.endDate) {
        query = query.where('a.createdAt', '<=', filters.endDate);
      }

      // Get total count
      const countQuery = query.clone().count('* as total').first();

      // Get data with pagination
      const dataQuery = query
        .orderBy('a.createdAt', 'desc')
        .limit(limit)
        .offset(offset);

      const [countResult, logs] = await Promise.all([
        countQuery,
        dataQuery,
      ]);

      // Parse changes field if needed
      const parsedLogs = logs.map((log) => ({
        ...log,
        changes: typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes,
        userName: log.firstName && log.lastName ? `${log.firstName} ${log.lastName}` : null,
      }));

      return {
        logs: parsedLogs,
        pagination: {
          page,
          limit,
          total: parseInt(countResult.total),
          pages: Math.ceil(parseInt(countResult.total) / limit),
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
      const log = await knex('auditLogs as a')
        .leftJoin('users as u', 'a.userId', 'u.id')
        .select(
          'a.id',
          'a.userId',
          'a.tenantId',
          'a.action',
          'a.entityType',
          'a.entityId',
          'a.changes',
          'a.ipAddress',
          'a.requestId',
          'a.createdAt',
          'u.email',
          'u.firstName',
          'u.lastName',
        )
        .where({ 'a.id': logId, 'a.tenantId': tenantId })
        .first();

      if (!log) {
        throw new Error('Audit log not found');
      }

      return {
        ...log,
        changes: typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes,
        userName: log.firstName && log.lastName ? `${log.firstName} ${log.lastName}` : null,
      };
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
      const logs = await knex('auditLogs')
        .select('id', 'action', 'entityType', 'entityId', 'changes', 'ipAddress', 'createdAt')
        .where({ userId, tenantId })
        .orderBy('createdAt', 'desc')
        .limit(limit);

      return logs.map((log) => ({
        ...log,
        changes: typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes,
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
      const rows = auditData.logs.map((log) => [
        log.id,
        log.email || 'N/A',
        log.action,
        log.entityType,
        log.entityId,
        JSON.stringify(log.changes),
        log.ipAddress,
        log.createdAt,
      ]);

      const csv = [headers, ...rows]
        .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
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
      const stats = await knex('auditLogs')
        .select('action', 'entityType')
        .count('* as count')
        .where('tenantId', tenantId)
        .whereBetween('createdAt', [startDate, endDate])
        .groupBy('action', 'entityType')
        .orderBy('count', 'desc');

      return stats;
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
      const activities = await knex('auditLogs as a')
        .leftJoin('users as u', 'a.userId', 'u.id')
        .select('a.userId', 'u.email')
        .count(knex.raw('CASE WHEN action = \'login\' THEN 1 END as loginAttempts'))
        .count(knex.raw('CASE WHEN action IN (\'grant_permission\', \'revoke_permission\', \'assign_role\', \'remove_role\') THEN 1 END as permissionChanges'))
        .count('* as totalActions')
        .where('a.tenantId', tenantId)
        .where('a.createdAt', '>', knex.raw(`NOW() - INTERVAL '${hoursSince} hours'`))
        .groupBy('a.userId', 'u.email')
        .havingRaw('COUNT(CASE WHEN action = \'login\' THEN 1 END) > 5 OR COUNT(CASE WHEN action IN (\'grant_permission\', \'revoke_permission\') THEN 1 END) > 10')
        .orderBy('totalActions', 'desc');

      return activities;
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
      const archived = await knex('auditLogs')
        .where('tenantId', tenantId)
        .where('createdAt', '<', knex.raw(`NOW() - INTERVAL '${daysOld} days'`))
        .where('status', 'active')
        .update({ status: 'archived' });

      logger.info(`Archived ${archived} audit logs for tenant ${tenantId}`);
      return { archivedCount: archived };
    } catch (err) {
      logger.error(`Audit log service archive error: ${err.message}`);
      throw err;
    }
  }
}

module.exports = AuditLogService;
