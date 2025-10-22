/**
 * Permission Check Middleware
 * Standard RBAC implementation using resource:action format
 */

const logger = require('../utils/logger');

/**
 * Check if user has specific permission
 * @param {string} permissionKey - Permission in format "resource:action" (e.g., "users:create")
 * @returns {Function} Express middleware
 */
const checkPermission = (permissionKey) => {
  return (req, res, next) => {
    try {
      // Get permissions from JWT token (set by auth middleware)
      const userPermissions = req.user?.permissions || [];

      // Check if user has the required permission
      if (!userPermissions.includes(permissionKey)) {
        logger.warn(`Permission denied: User ${req.user?.id} attempted ${permissionKey}`);
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          required: permissionKey,
        });
      }

      next();
    } catch (err) {
      logger.error(`Permission check error: ${err.message}`);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed',
      });
    }
  };
};

/**
 * Check if user has any of the specified permissions
 * @param {string[]} permissionKeys - Array of permissions
 * @returns {Function} Express middleware
 */
const checkAnyPermission = (permissionKeys) => {
  return (req, res, next) => {
    try {
      const userPermissions = req.user?.permissions || [];

      const hasAnyPermission = permissionKeys.some(permission =>
        userPermissions.includes(permission)
      );

      if (!hasAnyPermission) {
        logger.warn(`Permission denied: User ${req.user?.id} needs one of: ${permissionKeys.join(', ')}`);
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          required: permissionKeys,
        });
      }

      next();
    } catch (err) {
      logger.error(`Permission check error: ${err.message}`);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed',
      });
    }
  };
};

/**
 * Check if user has all specified permissions
 * @param {string[]} permissionKeys - Array of permissions
 * @returns {Function} Express middleware
 */
const checkAllPermissions = (permissionKeys) => {
  return (req, res, next) => {
    try {
      const userPermissions = req.user?.permissions || [];

      const hasAllPermissions = permissionKeys.every(permission =>
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        logger.warn(`Permission denied: User ${req.user?.id} needs all of: ${permissionKeys.join(', ')}`);
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          required: permissionKeys,
        });
      }

      next();
    } catch (err) {
      logger.error(`Permission check error: ${err.message}`);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed',
      });
    }
  };
};

/**
 * Check permission based on resource and action
 * @param {string} resource - Resource name (e.g., "users")
 * @param {string} action - Action name (e.g., "create")
 * @returns {Function} Express middleware
 */
const checkResourceAction = (resource, action) => {
  return checkPermission(`${resource}:${action}`);
};

module.exports = {
  checkPermission,
  checkAnyPermission,
  checkAllPermissions,
  checkResourceAction,
};
