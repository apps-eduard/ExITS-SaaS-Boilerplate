/**
 * Role Routes
 */

const express = require('express');
const RoleController = require('../controllers/RoleController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');
const tenantIsolationMiddleware = require('../middleware/tenantIsolation');

const router = express.Router();

// All role routes require authentication and tenant isolation
router.use(authMiddleware, tenantIsolationMiddleware);

// List roles
router.get('/', rbacMiddleware(['roles'], ['read']), RoleController.listRoles);

// Create role
router.post('/', rbacMiddleware(['roles'], ['create']), RoleController.createRole);

// Get role by ID
router.get('/:id', rbacMiddleware(['roles'], ['read']), RoleController.getRole);

// Update role
router.put('/:id', rbacMiddleware(['roles'], ['update']), RoleController.updateRole);

// Delete role
router.delete('/:id', rbacMiddleware(['roles'], ['delete']), RoleController.deleteRole);

// Permissions
router.get('/permissions', RoleController.getAllPermissions);
router.get('/:id/permissions', rbacMiddleware(['roles'], ['read']), RoleController.getRolePermissions);
router.post('/:id/permissions', rbacMiddleware(['roles'], ['update']), RoleController.grantPermission);
router.post('/:id/permissions/bulk', rbacMiddleware(['roles'], ['update']), RoleController.bulkAssignPermissions);
router.delete('/:id/permissions/:permissionKey', rbacMiddleware(['roles'], ['update']), RoleController.revokePermission);

module.exports = router;
