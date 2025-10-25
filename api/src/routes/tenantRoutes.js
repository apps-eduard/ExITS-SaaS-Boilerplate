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
router.post('/create', TenantController.createTenant); // Public tenant registration

// Protected routes (system admin only)
router.use(authMiddleware, tenantIsolationMiddleware);

// Get current user's tenant (no special permissions required - any authenticated user)
router.get('/current', TenantController.getMyTenant);

// Get current user's active subscriptions
router.get('/current/subscriptions', TenantController.getMyActiveSubscriptions);

// Create/update subscription for current tenant
router.post('/current/subscribe', TenantController.createSubscription);

// Update current user's tenant products (tenant-settings permission)
router.put('/current/products', rbacMiddleware(['tenant-settings', 'tenants'], ['update']), TenantController.updateMyTenantProducts);

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

// Restore tenant
router.put('/:id/restore', rbacMiddleware(['tenants'], ['update']), TenantController.restoreTenant);

// Get tenant stats
router.get('/:id/stats', rbacMiddleware(['tenants'], ['read']), TenantController.getTenantStats);

// Check user limit
router.get('/:id/user-limit', TenantController.checkUserLimit);

module.exports = router;
