/**
 * Role Routes
 */

const express = require('express');
const RoleController = require('../controllers/RoleController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');
const tenantIsolationMiddleware = require('../middleware/tenantIsolation');

const router = express.Router();

// All routes require authentication and tenant isolation
router.use(authMiddleware, tenantIsolationMiddleware);

// List roles - accepts both system roles:read and tenant-roles:read
router.get('/', rbacMiddleware(['roles', 'tenant-roles'], ['read']), RoleController.listRoles);

// Create role - accepts both system roles:create and tenant-roles:create
router.post('/', rbacMiddleware(['roles', 'tenant-roles'], ['create']), RoleController.createRole);

// Get role - accepts both system roles:read and tenant-roles:read
router.get('/:id', rbacMiddleware(['roles', 'tenant-roles'], ['read']), RoleController.getRole);

// Update role - accepts both system roles:update and tenant-roles:update
router.put('/:id', rbacMiddleware(['roles', 'tenant-roles'], ['update']), RoleController.updateRole);

// Delete role - accepts both system roles:delete and tenant-roles:delete
router.delete('/:id', rbacMiddleware(['roles', 'tenant-roles'], ['delete']), RoleController.deleteRole);

// Permissions
router.get('/permissions', RoleController.getAllPermissions);
router.get('/:id/permissions', rbacMiddleware(['roles', 'tenant-roles'], ['read']), RoleController.getRolePermissions);
router.post('/:id/permissions', rbacMiddleware(['roles', 'tenant-roles'], ['update']), RoleController.grantPermission);
router.post('/:id/permissions/bulk', rbacMiddleware(['roles', 'tenant-roles'], ['update']), RoleController.bulkAssignPermissions);
router.delete('/:id/permissions/:permissionKey', rbacMiddleware(['roles', 'tenant-roles'], ['update']), RoleController.revokePermission);

module.exports = router;
