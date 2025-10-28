/**
 * Money Loan - Payment Processing Routes
 * API endpoints for payment operations and schedule management
 */

const express = require('express');
const moneyloanPaymentController = require('../controllers/MoneyloanPaymentController');

const router = express.Router({ mergeParams: true });

// ═══════════════════════════════════════════════════════════════
// PAYMENT PROCESSING ROUTES
// Base: /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId
// ═══════════════════════════════════════════════════════════════

router.post('/payments', moneyloanPaymentController.processPayment);
router.get('/payments', moneyloanPaymentController.getPaymentHistory);
router.get('/balance', moneyloanPaymentController.getLoanBalance);
router.post('/penalties', moneyloanPaymentController.applyLatePenalty);

// ═══════════════════════════════════════════════════════════════
// PAYMENT SCHEDULE ROUTES
// ═══════════════════════════════════════════════════════════════

router.get('/schedule', moneyloanPaymentController.getPaymentSchedule);
router.post('/schedule/generate', moneyloanPaymentController.generateSchedule);
router.post('/schedule/recalculate', moneyloanPaymentController.recalculateSchedule);
router.get('/schedule/next-due', moneyloanPaymentController.getNextPaymentDue);
router.get('/amortization', moneyloanPaymentController.getAmortizationTable);

// ═══════════════════════════════════════════════════════════════
// PAYMENT REVERSAL ROUTES
// Base: /api/tenants/:tenantId/platforms/moneyloan/payments/:paymentId
// ═══════════════════════════════════════════════════════════════

router.post('/:paymentId/reverse', moneyloanPaymentController.reversePayment);

module.exports = router;
