/**
 * User Routes
 */

const express = require('express');
const UserController = require('../controllers/UserController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');
const tenantIsolationMiddleware = require('../middleware/tenantIsolation');

const router = express.Router();

// All user routes require authentication and tenant isolation
router.use(authMiddleware, tenantIsolationMiddleware);

// List users - accepts both system users:read and tenant-users:read permissions
router.get('/', rbacMiddleware(['users', 'tenant-users'], ['read']), UserController.listUsers);

// Email existence check (non-auth required? keep with auth to get tenant scope)
router.get('/check-email', UserController.checkEmail);

// Create user - accepts both system users:create and tenant-users:create permissions
router.post('/', rbacMiddleware(['users', 'tenant-users'], ['create']), UserController.createUser);

// Get current user
router.get('/me', UserController.getCurrentUser);

// Get user by ID
router.get('/:id', UserController.getUser);

// Update user - accepts both system users:update and tenant-users:update permissions
router.put('/:id', rbacMiddleware(['users', 'tenant-users'], ['update']), UserController.updateUser);

// Delete user - accepts both system users:delete and tenant-users:delete permissions
router.delete('/:id', rbacMiddleware(['users', 'tenant-users'], ['delete']), UserController.deleteUser);

// Reset password - accepts both system users:update and tenant-users:update permissions
router.put('/:id/reset-password', rbacMiddleware(['users', 'tenant-users'], ['update']), UserController.resetPassword);

// Restore user - accepts both system users:update and tenant-users:update permissions
router.put('/:id/restore', rbacMiddleware(['users', 'tenant-users'], ['update']), UserController.restoreUser);

// User roles - accepts both system roles:update and tenant-roles:update permissions
router.post('/:id/roles/:roleId', rbacMiddleware(['roles', 'tenant-roles'], ['update']), UserController.assignRole);
router.delete('/:id/roles/:roleId', rbacMiddleware(['roles', 'tenant-roles'], ['update']), UserController.removeRole);
router.get('/:id/permissions', UserController.getUserPermissions);

// Product access management (tenant users only)
router.post('/:id/products', rbacMiddleware(['tenant-users'], ['update']), UserController.assignProductAccess);
router.get('/:id/products', UserController.getUserProducts);

module.exports = router;
