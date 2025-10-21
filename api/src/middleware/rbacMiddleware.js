/**
 * RBAC Middleware
 * Handles permission checking for routes and actions
 */

const RBACService = require('../services/RBACService');
const logger = require('../utils/logger');

/**
 * Check if user has access to a menu/module
 */
const checkMenuAccess = (menuKey) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const hasAccess = await RBACService.hasMenuAccess(req.user.id, menuKey);
      if (!hasAccess) {
        logger.warn(`❌ Access denied: User ${req.user.id} accessing menu ${menuKey}`);
        return res.status(403).json({ error: 'Access denied to this module' });
      }

      req.user.menuKey = menuKey;
      next();
    } catch (error) {
      logger.error('❌ Error checking menu access:', error.message);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

/**
 * Check if user has specific action on a menu
 */
const checkAction = (menuKey, actionKey) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const hasAction = await RBACService.hasAction(req.user.id, menuKey, actionKey);
      if (!hasAction) {
        logger.warn(`❌ Action denied: User ${req.user.id}, Menu ${menuKey}, Action ${actionKey}`);
        return res.status(403).json({ error: `Not authorized to ${actionKey} this resource` });
      }

      req.user.action = actionKey;
      next();
    } catch (error) {
      logger.error('❌ Error checking action:', error.message);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

/**
 * Combined check for menu + action
 */
const checkPermission = (menuKey, actionKey) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const hasPermission = await RBACService.hasAction(req.user.id, menuKey, actionKey);
      if (!hasPermission) {
        logger.warn(`❌ Permission denied: User ${req.user.id}, Menu ${menuKey}, Action ${actionKey}`);
        return res.status(403).json({ error: 'Access denied' });
      }

      req.user.permission = { menuKey, actionKey };
      next();
    } catch (error) {
      logger.error('❌ Error checking permission:', error.message);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

/**
 * Tenant isolation middleware
 * Ensures user can only access their own tenant
 */
const checkTenantAccess = (req, res, next) => {
  try {
    const userTenantId = req.user?.tenant_id;
    const requestedTenantId = parseInt(req.params.tenantId) || req.user?.tenant_id;

    // System users (tenant_id = null) can access any tenant
    if (userTenantId === null) {
      return next();
    }

    // Tenant users can only access their own tenant
    if (userTenantId !== requestedTenantId) {
      logger.warn(`❌ Tenant isolation violation: User ${req.user.id} from tenant ${userTenantId} attempting to access tenant ${requestedTenantId}`);
      return res.status(403).json({ error: 'Access denied - tenant isolation violation' });
    }

    next();
  } catch (error) {
    logger.error('❌ Error checking tenant access:', error.message);
    res.status(500).json({ error: 'Tenant check failed' });
  }
};

module.exports = {
  checkMenuAccess,
  checkAction,
  checkPermission,
  checkTenantAccess
};
