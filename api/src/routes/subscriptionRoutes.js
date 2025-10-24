/**
 * Subscription Routes
 */

const express = require('express');
const SubscriptionController = require('../controllers/SubscriptionController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

const router = express.Router();

// Public routes (no auth required for viewing plans during signup)
router.get('/plans', SubscriptionController.getPlans);
router.get('/plans/by-name/:name', SubscriptionController.getPlanByName);

// Protected routes - require authentication and permissions
// Note: Specific routes MUST come before parameterized routes
router.post('/plans', authMiddleware, rbacMiddleware(['subscription_plans'], ['create']), SubscriptionController.createPlan);
router.get('/plans/:id/subscribers', SubscriptionController.getPlanSubscriberCount); // No auth required for now
router.get('/plans/:id', SubscriptionController.getPlan); // No auth required for now
router.put('/plans/:id', authMiddleware, rbacMiddleware(['subscription_plans'], ['update']), SubscriptionController.updatePlan);
router.delete('/plans/:id', authMiddleware, rbacMiddleware(['subscription_plans'], ['delete']), SubscriptionController.deletePlan);

module.exports = router;
