/**
 * Tenant Routes
 */

const express = require('express');
const TenantController = require('../controllers/TenantController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');
const tenantIsolationMiddleware = require('../middleware/tenantIsolation');

const router = express.Router();

// Public routes
router.get('/by-subdomain/:subdomain', TenantController.getTenantBySubdomain);

// Protected routes (system admin only)
router.use(authMiddleware, tenantIsolationMiddleware);

// List tenants
router.get('/', rbacMiddleware(['tenants'], ['read']), TenantController.listTenants);

// Create tenant
router.post('/', rbacMiddleware(['tenants'], ['create']), TenantController.createTenant);

// Get tenant
router.get('/:id', rbacMiddleware(['tenants'], ['read']), TenantController.getTenant);

// Update tenant
router.put('/:id', rbacMiddleware(['tenants'], ['update']), TenantController.updateTenant);

// Suspend tenant
router.put('/:id/suspend', rbacMiddleware(['tenants'], ['update']), TenantController.suspendTenant);

// Activate tenant
router.put('/:id/activate', rbacMiddleware(['tenants'], ['update']), TenantController.activateTenant);

// Delete tenant
router.delete('/:id', rbacMiddleware(['tenants'], ['delete']), TenantController.deleteTenant);

// Get tenant stats
router.get('/:id/stats', rbacMiddleware(['tenants'], ['read']), TenantController.getTenantStats);

// Check user limit
router.get('/:id/user-limit', TenantController.checkUserLimit);

module.exports = router;
