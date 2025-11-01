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

  // Handle database trigger errors (permission space validation)
  if (err.code === 'P0001' || (err.message && err.message.includes('SECURITY VIOLATION'))) {
    // PostgreSQL RAISE EXCEPTION from trigger
    // Extract the user-friendly message from the trigger error
    let userMessage = err.message;
    
    // Check if it's a space mismatch error from our trigger
    if (userMessage.includes('Cannot assign') && userMessage.includes('space')) {
      // Parse trigger message: "🚫 SECURITY VIOLATION: Cannot assign tenant-space permission (ID: 123) to system-space role (ID: 1). Permission space must match role space."
      const match = userMessage.match(/Cannot assign (\w+)-space permission.*to (\w+)-space role/);
      if (match) {
        const [, permSpace, roleSpace] = match;
        userMessage = `🚫 Permission Denied: You cannot assign ${permSpace}-space permissions to ${roleSpace}-space roles. ` +
                     `For security reasons, ${roleSpace === 'system' ? 'system roles can only have system permissions' : 'tenant roles can only have tenant permissions'}.`;
      }
    }
    
    return res.status(CONSTANTS.HTTP_STATUS.FORBIDDEN).json({
      error: 'Security Violation',
      code: 'PERMISSION_SPACE_MISMATCH',
      message: userMessage,
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

  if (err.message.includes('permission') || err.message.includes('PERMISSION')) {
    // Extract more context from permission errors
    let errorCode = 'PERMISSION_DENIED';
    let errorTitle = 'Permission Denied';
    
    // Check for specific permission error types
    if (err.message.includes('cannot modify tenant-space roles')) {
      errorCode = 'CANNOT_MODIFY_TENANT_ROLE';
      errorTitle = 'Cannot Modify Tenant Role';
    } else if (err.message.includes('cannot modify system-space roles')) {
      errorCode = 'CANNOT_MODIFY_SYSTEM_ROLE';
      errorTitle = 'Cannot Modify System Role';
    } else if (err.message.includes('cannot delete tenant-space roles')) {
      errorCode = 'CANNOT_DELETE_TENANT_ROLE';
      errorTitle = 'Cannot Delete Tenant Role';
    } else if (err.message.includes('cannot delete system-space roles')) {
      errorCode = 'CANNOT_DELETE_SYSTEM_ROLE';
      errorTitle = 'Cannot Delete System Role';
    } else if (err.message.includes('cannot modify permissions for tenant-space roles')) {
      errorCode = 'CANNOT_MODIFY_TENANT_PERMISSIONS';
      errorTitle = 'Cannot Modify Tenant Permissions';
    } else if (err.message.includes('cannot modify permissions for system-space roles')) {
      errorCode = 'CANNOT_MODIFY_SYSTEM_PERMISSIONS';
      errorTitle = 'Cannot Modify System Permissions';
    } else if (err.message.includes('only modify roles within your own tenant')) {
      errorCode = 'CROSS_TENANT_ACCESS_DENIED';
      errorTitle = 'Cross-Tenant Access Denied';
    }
    
    return res.status(CONSTANTS.HTTP_STATUS.FORBIDDEN).json({
      error: errorTitle,
      code: errorCode,
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
