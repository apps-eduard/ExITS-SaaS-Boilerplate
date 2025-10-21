/**
 * Tenant Isolation Middleware
 * Ensures users only access their own tenant data
 */

const logger = require('../utils/logger');
const { CONSTANTS } = require('../config/constants');

const tenantIsolationMiddleware = (req, res, next) => {
  try {
    if (!req.user || !req.tenantId) {
      return res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
        error: 'Tenant context required',
      });
    }

    // Get tenant ID from different sources: URL param, body, query
    let requestedTenantId = req.params.tenantId || req.body?.tenant_id || req.query?.tenant_id;

    // If requesting specific tenant, verify ownership
    if (requestedTenantId && requestedTenantId !== req.tenantId) {
      // Check if user is system admin (null tenant_id means system admin)
      if (req.tenantId !== null) {
        logger.warn(`Tenant isolation violation: User ${req.userId} attempted to access tenant ${requestedTenantId}`);

        return res.status(CONSTANTS.HTTP_STATUS.FORBIDDEN).json({
          error: 'Tenant access denied',
          code: 'TENANT_ISOLATION_VIOLATION',
        });
      }
    }

    // Attach resolved tenant ID to request
    req.tenantIdFromContext = requestedTenantId || req.tenantId;

    next();
  } catch (err) {
    logger.error(`Tenant isolation middleware error: ${err.message}`);
    return res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
      error: 'Tenant validation failed',
    });
  }
};

module.exports = tenantIsolationMiddleware;
