/**
 * Authentication Middleware
 * Verifies JWT tokens and extracts user information
 */

const { verifyAccessToken } = require('../utils/jwt');
const logger = require('../utils/logger');
const { CONSTANTS } = require('../config/constants');

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
      req.user = decoded;
      req.userId = decoded.userId || decoded.id;
      req.tenantId = decoded.tenantId;
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
