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

// List users
router.get('/', rbacMiddleware(['users'], ['read']), UserController.listUsers);

// Create user
router.post('/', rbacMiddleware(['users'], ['create']), UserController.createUser);

// Get current user
router.get('/me', UserController.getCurrentUser);

// Get user by ID
router.get('/:id', UserController.getUser);

// Update user
router.put('/:id', rbacMiddleware(['users'], ['update']), UserController.updateUser);

// Delete user
router.delete('/:id', rbacMiddleware(['users'], ['delete']), UserController.deleteUser);

// Restore user
router.put('/:id/restore', rbacMiddleware(['users'], ['update']), UserController.restoreUser);

// User roles
router.post('/:id/roles/:roleId', rbacMiddleware(['roles'], ['update']), UserController.assignRole);
router.delete('/:id/roles/:roleId', rbacMiddleware(['roles'], ['update']), UserController.removeRole);
router.get('/:id/permissions', UserController.getUserPermissions);

module.exports = router;
