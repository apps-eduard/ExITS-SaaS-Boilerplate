/**
 * Money Loan Platform - Master Routes Index
 * 
 * Organizes all Money Loan routes by category:
 * - Configuration routes (interest rates, fees, schedules, etc.)
 * - Loan management routes (applications, disbursement, lifecycle)
 * - Payment processing routes (payments, schedules, balance)
 * - Reporting routes (analytics, exports)
 * 
 * Base URL: /api/tenants/:tenantId/platforms/moneyloan
 */

const express = require('express');
const router = express.Router({ mergeParams: true });

// Import route modules
const configRoutes = require('./MoneyloanConfigRoutes');
const loanRoutes = require('./MoneyloanLoanRoutes');
const paymentRoutes = require('./MoneyloanPaymentRoutes');
const reportingRoutes = require('./MoneyloanReportingRoutes');

// ═══════════════════════════════════════════════════════════════
// ROUTE MOUNTING
// ═══════════════════════════════════════════════════════════════

// Configuration routes: /config/*
router.use('/config', configRoutes);

// Loan management routes: /loans/*
router.use('/loans', loanRoutes);

// Payment routes: /loans/:loanId/* and /payments/*
router.use('/loans/:loanId', paymentRoutes);

// Reporting routes: /reports/*
router.use('/reports', reportingRoutes);

// ═══════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════

router.get('/health', (req, res) => {
  res.json({
    platform: 'money-loan',
    status: 'active',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
