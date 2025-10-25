/**
 * Reports Routes
 */

const express = require('express');
const ReportsController = require('../controllers/ReportsController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

const router = express.Router();

// All reports require authentication and billing/system permissions
router.get(
  '/subscription-history',
  authMiddleware,
  rbacMiddleware(['billing', 'system'], ['read']),
  ReportsController.getSubscriptionHistory
);

module.exports = router;
