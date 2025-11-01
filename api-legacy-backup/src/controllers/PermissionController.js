/**
 * Permission Controller
 * Handles permission checks and delegation
 */

const PermissionService = require('../services/PermissionService');
const logger = require('../utils/logger');
const { CONSTANTS } = require('../config/constants');

class PermissionController {
  /**
   * GET /permissions/check
   * Check if user has permission
   */
  static async checkPermission(req, res, next) {
    try {
      const { moduleKey, actionKey } = req.query;

      if (!moduleKey || !actionKey) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Module key and action key are required',
        });
      }

      const hasPermission = await PermissionService.hasPermission(req.userId, moduleKey, actionKey);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Permission check completed',
        data: {
          has_permission: hasPermission,
          module_key: moduleKey,
          action_key: actionKey,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /permissions/my-permissions
   * Get current user's permissions
   */
  static async getMyPermissions(req, res, next) {
    try {
      const result = await PermissionService.getUserPermissions(req.userId);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Permissions retrieved successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /permissions/delegate
   * Delegate temporary permission to another user
   */
  static async delegatePermission(req, res, next) {
    try {
      const { delegatedToUserId, roleId, expiresAt, reason } = req.body;

      if (!delegatedToUserId || !roleId) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Delegated user ID and role ID are required',
        });
      }

      const result = await PermissionService.delegatePermission(
        req.userId,
        delegatedToUserId,
        roleId,
        req.tenantId,
        expiresAt,
        reason
      );

      res.status(CONSTANTS.HTTP_STATUS.CREATED).json({
        message: 'Permission delegated successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /permissions/delegations/:delegationId
   * Revoke delegated permission
   */
  static async revokeDelegation(req, res, next) {
    try {
      const { delegationId } = req.params;

      const result = await PermissionService.revokeDelegation(delegationId, req.userId, req.tenantId);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Delegation revoked successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /permissions/delegations
   * Get user's delegated permissions
   */
  static async getDelegatedPermissions(req, res, next) {
    try {
      const result = await PermissionService.getUserDelegatedPermissions(req.userId, req.tenantId);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Delegated permissions retrieved successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /permissions/check-constraints
   * Check permission with constraints
   */
  static async checkPermissionWithConstraints(req, res, next) {
    try {
      const { moduleKey, actionKey, context = {} } = req.body;

      if (!moduleKey || !actionKey) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Module key and action key are required',
        });
      }

      const context_with_ip = { ...context, ip: req.ip };

      const result = await PermissionService.checkPermissionWithConstraints(
        req.userId,
        moduleKey,
        actionKey,
        context_with_ip
      );

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Permission check completed',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = PermissionController;
