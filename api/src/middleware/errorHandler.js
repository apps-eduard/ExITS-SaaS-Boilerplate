/**
 * Error Handling Middleware
 * Centralizes error handling and response formatting
 */

const logger = require('../utils/logger');
const CONSTANTS = require('../config/constants');

const errorHandlerMiddleware = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });

  // Handle validation errors
  if (err.isJoi) {
    return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.details.map(d => ({
        field: d.context.key,
        message: d.message,
        type: d.type,
      })),
    });
  }

  // Handle database errors
  if (err.code === '23505') {
    // Unique constraint violation
    return res.status(CONSTANTS.HTTP_STATUS.CONFLICT).json({
      error: 'Resource already exists',
      code: 'DUPLICATE_ENTRY',
      message: err.message,
    });
  }

  if (err.code === '23503') {
    // Foreign key constraint violation
    return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
      error: 'Invalid reference',
      code: 'INVALID_REFERENCE',
      message: err.message,
    });
  }

  // Handle custom error messages
  if (err.message.includes('not found')) {
    return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
      error: 'Resource not found',
      code: 'NOT_FOUND',
      message: err.message,
    });
  }

  if (err.message.includes('already exists')) {
    return res.status(CONSTANTS.HTTP_STATUS.CONFLICT).json({
      error: 'Resource already exists',
      code: 'DUPLICATE_ENTRY',
      message: err.message,
    });
  }

  if (err.message.includes('permission')) {
    return res.status(CONSTANTS.HTTP_STATUS.FORBIDDEN).json({
      error: 'Permission denied',
      code: 'PERMISSION_DENIED',
      message: err.message,
    });
  }

  if (err.message.includes('cannot delete')) {
    return res.status(CONSTANTS.HTTP_STATUS.CONFLICT).json({
      error: 'Cannot delete resource',
      code: 'DELETION_CONFLICT',
      message: err.message,
    });
  }

  // Default error response
  const statusCode = err.statusCode || CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR;

  return res.status(statusCode).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { message: err.message, stack: err.stack }),
  });
};

module.exports = errorHandlerMiddleware;
