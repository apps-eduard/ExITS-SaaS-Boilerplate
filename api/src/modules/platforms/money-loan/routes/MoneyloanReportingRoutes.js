/**
 * Money Loan - Reporting & Analytics Routes
 * API endpoints for reports and business intelligence
 */

const express = require('express');
const moneyloanReportingController = require('../controllers/MoneyloanReportingController');

const router = express.Router({ mergeParams: true });

// ═══════════════════════════════════════════════════════════════
// REPORTING ROUTES
// Base: /api/tenants/:tenantId/platforms/moneyloan/reports
// ═══════════════════════════════════════════════════════════════

router.get('/portfolio', moneyloanReportingController.getPortfolioSummary);
router.get('/performance', moneyloanReportingController.getPerformanceReport);
router.get('/collections', moneyloanReportingController.getCollectionsReport);
router.get('/arrears', moneyloanReportingController.getArrearsReport);
router.get('/write-offs', moneyloanReportingController.getWriteOffReport);
router.get('/products', moneyloanReportingController.getProductPerformanceReport);
router.get('/revenue', moneyloanReportingController.getRevenueReport);
router.get('/aging', moneyloanReportingController.getAgingAnalysis);

// ═══════════════════════════════════════════════════════════════
// EXPORT ROUTES
// ═══════════════════════════════════════════════════════════════

router.post('/export', moneyloanReportingController.exportReport);

module.exports = router;
