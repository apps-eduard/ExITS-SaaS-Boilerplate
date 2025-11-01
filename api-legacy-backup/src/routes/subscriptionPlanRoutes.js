/**
 * Subscription Plan Routes
 * Routes for managing subscription plans
 */

const express = require('express');
const router = express.Router();
const SubscriptionPlanController = require('../controllers/SubscriptionPlanController');
const authMiddleware = require('../middleware/auth');

// Public route - no auth required for viewing available plans
router.get('/', SubscriptionPlanController.getAllPlans);

// Get ALL plans including product-specific plans (for admin panel)
router.get('/all/including-products', SubscriptionPlanController.getAllPlansIncludingProducts);

// Get single plan by name
router.get('/:name', SubscriptionPlanController.getPlanByName);

module.exports = router;
