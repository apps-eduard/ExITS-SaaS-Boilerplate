/**
 * Authentication Middleware
 * Verifies JWT tokens and extracts user information
 */

const { verifyAccessToken } = require('../utils/jwt');
const logger = require('../utils/logger');
const CONSTANTS = require('../config/constants');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
        error: 'No token provided',
        code: 'NO_TOKEN',
      });
    }

    const token = authHeader.slice(7);

    try {
      const decoded = verifyAccessToken(token);
      logger.info('🔐 Auth middleware - decoded token:', { 
        id: decoded.id, 
        userId: decoded.userId,
        email: decoded.email,
        tenant_id: decoded.tenant_id,
        hasPermissions: !!decoded.permissions
      });
      
      // Normalize the user object - ensure 'id' property exists
      req.user = {
        ...decoded,
        id: decoded.id || decoded.userId,
        userId: decoded.userId || decoded.id
      };
      req.userId = decoded.userId || decoded.id;
      req.tenantId = decoded.tenantId || decoded.tenant_id;
      req.permissions = decoded.permissions || {};
      next();
    } catch (err) {
      if (err.message.includes('expired')) {
        return res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
          error: 'Token expired',
          code: 'TOKEN_EXPIRED',
        });
      }

      return res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
      });
    }
  } catch (err) {
    logger.error(`Auth middleware error: ${err.message}`);
    return res.status(CONSTANTS.HTTP_STATUS.INTERNAL_ERROR).json({
      error: 'Authentication failed',
    });
  }
};

module.exports = authMiddleware;
