/**
 * Billing Routes
 * Routes for subscription plans, tenant subscriptions, and invoices
 */

const express = require('express');
const router = express.Router();
const BillingController = require('../controllers/BillingController');
const authMiddleware = require('../middleware/auth');

// Subscription Plans
router.get('/plans', authMiddleware, BillingController.getPlans);
router.get('/plans/:id', authMiddleware, BillingController.getPlanById);
router.post('/plans', authMiddleware, BillingController.createPlan);
router.put('/plans/:id', authMiddleware, BillingController.updatePlan);
router.delete('/plans/:id', authMiddleware, BillingController.deletePlan);

// Tenant Subscriptions
router.get('/subscriptions', authMiddleware, BillingController.getSubscriptions);
router.get('/subscriptions/tenant/:tenantId', authMiddleware, BillingController.getSubscriptionByTenant);
router.post('/subscriptions', authMiddleware, BillingController.createSubscription);
router.put('/subscriptions/:id', authMiddleware, BillingController.updateSubscription);
router.post('/subscriptions/:id/cancel', authMiddleware, BillingController.cancelSubscription);

// Invoices
router.get('/invoices', authMiddleware, BillingController.getInvoices);
router.get('/invoices/:id', authMiddleware, BillingController.getInvoiceById);
router.post('/invoices', authMiddleware, BillingController.createInvoice);
router.post('/invoices/:id/pay', authMiddleware, BillingController.payInvoice);

// Statistics
router.get('/stats', authMiddleware, BillingController.getStats);

// Payment Methods
router.get('/payment-methods', authMiddleware, BillingController.getPaymentMethods);
router.get('/tenants/current/payment-method', authMiddleware, BillingController.getTenantPaymentMethod);
router.put('/tenants/current/payment-method', authMiddleware, BillingController.updateTenantPaymentMethod);

module.exports = router;
