/**
 * RBAC Routes
 * Handles all RBAC-related endpoints
 */

const express = require('express');
const router = express.Router();
const RBACController = require('../controllers/RBACController');
const { checkPermission, checkMenuAccess } = require('../middleware/rbacMiddleware');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// ==================== USER PERMISSIONS ====================
/**
 * GET /api/rbac/my-permissions
 * Get all permissions for logged-in user
 */
router.get('/my-permissions', RBACController.getMyPermissions);

// ==================== MODULES (Menu Registry) ====================
/**
 * GET /api/rbac/modules
 * Get all available modules
 * Query: ?space=system|tenant
 */
router.get('/modules', RBACController.getModules);

/**
 * POST /api/rbac/modules
 * Create new module (System Admin only)
 * Body: { menuKey, displayName, space, actionKeys, icon, routePath, componentName, description }
 */
router.post('/modules', checkPermission('rbac-admin', 'create'), RBACController.createModule);

// ==================== ROLES ====================
/**
 * GET /api/rbac/roles
 * Get all roles
 */
router.get('/roles', RBACController.getRoles);

/**
 * POST /api/rbac/roles
 * Create new role
 * Body: { name, description, space }
 */
router.post('/roles', RBACController.createRole);

/**
 * GET /api/rbac/roles/:roleId
 * Get role with permissions
 */
router.get('/roles/:roleId', RBACController.getRole);

/**
 * PUT /api/rbac/roles/:roleId
 * Update role
 * Body: { name, description }
 */
router.put('/roles/:roleId', RBACController.updateRole);

/**
 * PATCH /api/rbac/roles/:roleId/toggle-status
 * Toggle role status (enable/disable)
 */
router.patch('/roles/:roleId/toggle-status', RBACController.toggleRoleStatus);

// ==================== PERMISSIONS ====================
/**
 * POST /api/rbac/roles/:roleId/permissions
 * Assign permission to role
 * Body: { menuKey, actionKey }
 */
router.post('/roles/:roleId/permissions', RBACController.assignPermission);

/**
 * POST /api/rbac/roles/:roleId/permissions/bulk
 * Bulk assign permissions to role (replaces all existing permissions)
 * Body: { permissions: [{ menuKey, actionKey }] }
 */
router.post('/roles/:roleId/permissions/bulk', RBACController.bulkAssignPermissions);

/**
 * DELETE /api/rbac/roles/:roleId/permissions
 * Revoke permission from role
 * Body: { menuKey, actionKey }
 */
router.delete('/roles/:roleId/permissions', RBACController.revokePermission);

// ==================== USER-ROLE ASSIGNMENTS ====================
/**
 * GET /api/rbac/users/:userId/roles
 * Get user roles
 */
router.get('/users/:userId/roles', RBACController.getUserRoles);

/**
 * POST /api/rbac/users/:userId/roles
 * Assign role to user
 * Body: { roleId }
 */
router.post('/users/:userId/roles', checkPermission('user-admin', 'edit'), RBACController.assignRoleToUser);

/**
 * DELETE /api/rbac/users/:userId/roles
 * Remove role from user
 * Body: { roleId }
 */
router.delete('/users/:userId/roles', checkPermission('user-admin', 'edit'), RBACController.removeRoleFromUser);

module.exports = router;
