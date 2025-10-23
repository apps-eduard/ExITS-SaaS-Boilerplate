/**
 * Product Subscription Routes
 * API endpoints for managing tenant product subscriptions
 */

const express = require('express');
const ProductSubscriptionController = require('../controllers/ProductSubscriptionController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get available products (public for authenticated users)
router.get('/products', ProductSubscriptionController.getAvailableProducts);

// Get tenant product subscriptions
router.get(
  '/tenant/:tenantId',
  rbacMiddleware(['tenants', 'billing'], ['read']),
  ProductSubscriptionController.getTenantProductSubscriptions
);

// Subscribe to a product
router.post(
  '/tenant/:tenantId/subscribe',
  rbacMiddleware(['tenants', 'billing'], ['create', 'update']),
  ProductSubscriptionController.subscribeToProduct
);

// Unsubscribe from a product
router.delete(
  '/tenant/:tenantId/unsubscribe/:productType',
  rbacMiddleware(['tenants', 'billing'], ['delete', 'update']),
  ProductSubscriptionController.unsubscribeFromProduct
);

// Update product subscription
router.put(
  '/tenant/:tenantId/product/:productType',
  rbacMiddleware(['tenants', 'billing'], ['update']),
  ProductSubscriptionController.updateProductSubscription
);

module.exports = router;
