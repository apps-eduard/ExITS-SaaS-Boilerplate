const express = require('express');
const router = express.Router();
const PaymentHistoryController = require('../controllers/PaymentHistoryController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

/**
 * Payment History / Invoice Routes
 * Prefix: /api/payment-history
 */

// Get all invoices for current tenant
router.get(
  '/invoices',
  authMiddleware,
  rbacMiddleware(['tenant-billing:read']),
  PaymentHistoryController.getTenantInvoices
);

// Get invoice statistics
router.get(
  '/invoices/stats',
  authMiddleware,
  rbacMiddleware(['tenant-billing:read']),
  PaymentHistoryController.getTenantInvoiceStats
);

// Get single invoice by ID
router.get(
  '/invoices/:id',
  authMiddleware,
  rbacMiddleware(['tenant-billing:read']),
  PaymentHistoryController.getInvoiceById
);

module.exports = router;
