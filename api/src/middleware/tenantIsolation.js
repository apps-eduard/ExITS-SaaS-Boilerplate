/**
 * Tenant Isolation Middleware
 * Ensures users only access their own tenant data
 */

const logger = require('../utils/logger');
const CONSTANTS = require('../config/constants');

const tenantIsolationMiddleware = (req, res, next) => {
  try {
    // System admins have null tenantId, so check for req.user instead
    if (!req.user) {
      return res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
        error: 'Authentication required',
      });
    }

    // Attach resolved tenant ID to request
    // For system admins: null (they can access all tenants)
    // For tenant users: their tenant_id
    req.tenantIdFromContext = req.tenantId;

    next();
  } catch (err) {
    logger.error(`Tenant isolation middleware error: ${err.message}`);
    return res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Tenant validation failed',
    });
  }
};

module.exports = tenantIsolationMiddleware;
