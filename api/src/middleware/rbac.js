/**
 * RBAC Middleware
 * Checks if user has required permissions for route
 */

const PermissionService = require('../services/PermissionService');
const logger = require('../utils/logger');
const { CONSTANTS } = require('../config/constants');

const rbacMiddleware = (requiredModules = [], requiredActions = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.userId) {
        return res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
          error: 'User not authenticated',
        });
      }

      // If no specific permissions required, proceed
      if (requiredModules.length === 0 && requiredActions.length === 0) {
        return next();
      }

      // Check permissions
      let hasPermission = false;

      for (const module of requiredModules) {
        for (const action of requiredActions) {
          const hasAccess = await PermissionService.hasPermission(req.userId, module, action);
          if (hasAccess) {
            hasPermission = true;
            break;
          }
        }
        if (hasPermission) break;
      }

      if (!hasPermission) {
        logger.warn(
          `User ${req.userId} denied access to ${requiredModules.join(',')} - ${requiredActions.join(',')}`
        );

        return res.status(CONSTANTS.HTTP_STATUS.FORBIDDEN).json({
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required_modules: requiredModules,
          required_actions: requiredActions,
        });
      }

      next();
    } catch (err) {
      logger.error(`RBAC middleware error: ${err.message}`);
      return res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
        error: 'Permission check failed',
      });
    }
  };
};

module.exports = rbacMiddleware;
