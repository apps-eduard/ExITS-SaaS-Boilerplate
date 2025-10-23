/**
 * Subscription Routes
 */

const express = require('express');
const SubscriptionController = require('../controllers/SubscriptionController');

const router = express.Router();

// Public routes (no auth required for viewing plans during signup)
router.get('/plans', SubscriptionController.getPlans);
router.get('/plans/:id', SubscriptionController.getPlan);
router.get('/plans/by-name/:name', SubscriptionController.getPlanByName);

module.exports = router;
