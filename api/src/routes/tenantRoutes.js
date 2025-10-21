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
router.get('/', rbacMiddleware(['tenants'], ['view']), TenantController.listTenants);

// Create tenant
router.post('/', rbacMiddleware(['tenants'], ['create']), TenantController.createTenant);

// Get tenant by ID
router.get('/:id', rbacMiddleware(['tenants'], ['view']), TenantController.getTenant);

// Update tenant
router.put('/:id', rbacMiddleware(['tenants'], ['edit']), TenantController.updateTenant);

// Suspend tenant
router.put('/:id/suspend', rbacMiddleware(['tenants'], ['edit']), TenantController.suspendTenant);

// Get tenant stats
router.get('/:id/stats', rbacMiddleware(['tenants'], ['view']), TenantController.getTenantStats);

// Check user limit
router.get('/:id/user-limit', TenantController.checkUserLimit);

module.exports = router;
