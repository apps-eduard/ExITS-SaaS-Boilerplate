// src/config/constants.js

module.exports = {
  // HTTP Status Codes
  HTTP_OK: 200,
  HTTP_CREATED: 201,
  HTTP_BAD_REQUEST: 400,
  HTTP_UNAUTHORIZED: 401,
  HTTP_FORBIDDEN: 403,
  HTTP_NOT_FOUND: 404,
  HTTP_CONFLICT: 409,
  HTTP_INTERNAL_SERVER_ERROR: 500,

  // User Statuses
  USER_STATUS_ACTIVE: 'active',
  USER_STATUS_SUSPENDED: 'suspended',
  USER_STATUS_DELETED: 'deleted',

  // Role Spaces
  SPACE_SYSTEM: 'system',
  SPACE_TENANT: 'tenant',

  // Permission Actions
  ACTION_VIEW: 'view',
  ACTION_CREATE: 'create',
  ACTION_EDIT: 'edit',
  ACTION_DELETE: 'delete',
  ACTION_APPROVE: 'approve',
  ACTION_EXPORT: 'export',

  // Audit Actions
  AUDIT_LOGIN: 'login',
  AUDIT_LOGOUT: 'logout',
  AUDIT_CREATE: 'create',
  AUDIT_UPDATE: 'update',
  AUDIT_DELETE: 'delete',
  AUDIT_APPROVE: 'approve',
  AUDIT_DELEGATE: 'delegate',

  // Audit Status
  AUDIT_SUCCESS: 'success',
  AUDIT_FAILURE: 'failure',
  AUDIT_PENDING: 'pending',

  // Session Status
  SESSION_ACTIVE: 'active',
  SESSION_REVOKED: 'revoked',
  SESSION_EXPIRED: 'expired',

  // Tenant Plans
  PLAN_BASIC: 'basic',
  PLAN_PRO: 'pro',
  PLAN_ENTERPRISE: 'enterprise',

  // Tenant Status
  TENANT_ACTIVE: 'active',
  TENANT_SUSPENDED: 'suspended',
  TENANT_DELETED: 'deleted',

  // Error Messages
  ERROR_UNAUTHORIZED: 'Unauthorized: No valid token provided',
  ERROR_FORBIDDEN: 'Forbidden: Permission denied',
  ERROR_NOT_FOUND: 'Resource not found',
  ERROR_INVALID_CREDENTIALS: 'Invalid email or password',
  ERROR_EMAIL_EXISTS: 'Email already exists',
  ERROR_TENANT_NOT_FOUND: 'Tenant not found',
  ERROR_USER_NOT_FOUND: 'User not found',
  ERROR_ROLE_NOT_FOUND: 'Role not found',
  ERROR_PERMISSION_DENIED: 'You do not have permission to access this resource',

  // Default Pagination
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,

  // Cache TTL (in seconds)
  CACHE_TTL_SHORT: 300, // 5 minutes
  CACHE_TTL_MEDIUM: 3600, // 1 hour
  CACHE_TTL_LONG: 86400, // 24 hours

  // BCrypt
  BCRYPT_ROUNDS: 10,

  // Token Duration (in seconds)
  TOKEN_EXPIRY_ACCESS: 24 * 60 * 60, // 24 hours
  TOKEN_EXPIRY_REFRESH: 7 * 24 * 60 * 60, // 7 days
};
