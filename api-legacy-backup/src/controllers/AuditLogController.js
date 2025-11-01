/**
 * Audit Log Controller
 * Handles audit log retrieval and export
 */

const AuditLogService = require('../services/AuditLogService');
const { validatePagination } = require('../utils/validators');
const logger = require('../utils/logger');
const { CONSTANTS } = require('../config/constants');

class AuditLogController {
  /**
   * GET /audit-logs
   * Get audit logs with filtering
   */
  static async getAuditLogs(req, res, next) {
    try {
      const { page = 1, limit = 50, userId, action, entityType, startDate, endDate } = req.query;

      const { error, value } = validatePagination({ page: parseInt(page), limit: parseInt(limit) });
      if (error) {
        error.isJoi = true;
        return next(error);
      }

      const filters = {
        userId: userId ? parseInt(userId) : undefined,
        action,
        entityType,
        startDate,
        endDate,
      };

      const result = await AuditLogService.getAuditLogs(req.tenantId, filters, value.page, value.limit);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Audit logs retrieved successfully',
        data: result.logs,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /audit-logs/:id
   * Get specific audit log entry
   */
  static async getAuditLogById(req, res, next) {
    try {
      const { id } = req.params;

      const result = await AuditLogService.getAuditLogById(id, req.tenantId);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Audit log retrieved successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /audit-logs/user/:userId/history
   * Get user's audit history
   */
  static async getUserAuditHistory(req, res, next) {
    try {
      const { userId } = req.params;
      const { limit = 100 } = req.query;

      const result = await AuditLogService.getUserAuditHistory(userId, req.tenantId, parseInt(limit));

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'User audit history retrieved successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /audit-logs/export
   * Export audit logs as CSV
   */
  static async exportAuditLogs(req, res, next) {
    try {
      const { userId, action, entityType, startDate, endDate } = req.query;

      const filters = {
        userId: userId ? parseInt(userId) : undefined,
        action,
        entityType,
        startDate,
        endDate,
      };

      const csv = await AuditLogService.exportAuditLogs(req.tenantId, filters);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString()}.csv"`);
      res.send(csv);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /audit-logs/stats
   * Get audit statistics
   */
  static async getAuditStats(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Start date and end date are required',
        });
      }

      const result = await AuditLogService.getAuditStats(req.tenantId, startDate, endDate);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Audit statistics retrieved successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /audit-logs/suspicious
   * Get suspicious activities
   */
  static async getSuspiciousActivities(req, res, next) {
    try {
      const { hoursSince = 24 } = req.query;

      const result = await AuditLogService.getSuspiciousActivities(req.tenantId, parseInt(hoursSince));

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Suspicious activities retrieved successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuditLogController;
