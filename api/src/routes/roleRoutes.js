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
router.get('/', rbacMiddleware(['roles'], ['view']), RoleController.listRoles);

// Create role
router.post('/', rbacMiddleware(['roles'], ['create']), RoleController.createRole);

// Get role by ID
router.get('/:id', rbacMiddleware(['roles'], ['view']), RoleController.getRole);

// Update role
router.put('/:id', rbacMiddleware(['roles'], ['edit']), RoleController.updateRole);

// Delete role
router.delete('/:id', rbacMiddleware(['roles'], ['delete']), RoleController.deleteRole);

// Permissions
router.get('/:id/permissions', rbacMiddleware(['roles'], ['view']), RoleController.getRolePermissions);
router.post('/:id/permissions', rbacMiddleware(['roles'], ['edit']), RoleController.grantPermission);
router.post('/:id/permissions/bulk', rbacMiddleware(['roles'], ['edit']), RoleController.bulkAssignPermissions);
router.delete('/:id/permissions/:moduleId/:actionKey', rbacMiddleware(['roles'], ['edit']), RoleController.revokePermission);

// Permission matrix
router.get('/:id/permission-matrix', rbacMiddleware(['roles'], ['view']), RoleController.getPermissionMatrix);

module.exports = router;
