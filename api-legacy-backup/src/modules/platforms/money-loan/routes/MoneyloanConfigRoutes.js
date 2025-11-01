/**
 * Money Loan - Platform Configuration Routes
 * API endpoints for Money Loan configuration management
 */

const express = require('express');
const moneyloanConfigController = require('../controllers/MoneyloanConfigController');

const router = express.Router({ mergeParams: true });

// Middleware to verify tenant authorization (should be added to parent router)

// ═══════════════════════════════════════════════════════════════
// INTEREST RATE CONFIGURATION ROUTES
// Base: /api/tenants/:tenantId/platforms/moneyloan/config/interest-rates
// ═══════════════════════════════════════════════════════════════

router.get('/interest-rates/:loanProductId', moneyloanConfigController.getInterestRates);
router.post('/interest-rates/:loanProductId', moneyloanConfigController.createInterestRate);
router.put('/interest-rates/:loanProductId/:rateId', moneyloanConfigController.updateInterestRate);
router.delete('/interest-rates/:loanProductId/:rateId', moneyloanConfigController.deleteInterestRate);

// ═══════════════════════════════════════════════════════════════
// PAYMENT SCHEDULE CONFIGURATION ROUTES
// Base: /api/tenants/:tenantId/platforms/moneyloan/config/payment-schedules
// ═══════════════════════════════════════════════════════════════

router.get('/payment-schedules/:loanProductId', moneyloanConfigController.getPaymentSchedules);
router.post('/payment-schedules/:loanProductId', moneyloanConfigController.createPaymentSchedule);
router.put('/payment-schedules/:loanProductId/:scheduleId', moneyloanConfigController.updatePaymentSchedule);

// ═══════════════════════════════════════════════════════════════
// FEE CONFIGURATION ROUTES
// Base: /api/tenants/:tenantId/platforms/moneyloan/config/fees
// ═══════════════════════════════════════════════════════════════

router.get('/fees/:loanProductId', moneyloanConfigController.getFeeConfigs);
router.post('/fees/:loanProductId', moneyloanConfigController.createFeeConfig);
router.put('/fees/:loanProductId/:feeId', moneyloanConfigController.updateFeeConfig);

// ═══════════════════════════════════════════════════════════════
// APPROVAL RULES CONFIGURATION ROUTES
// Base: /api/tenants/:tenantId/platforms/moneyloan/config/approval-rules
// ═══════════════════════════════════════════════════════════════

router.get('/approval-rules/:loanProductId', moneyloanConfigController.getApprovalRules);
router.post('/approval-rules/:loanProductId', moneyloanConfigController.createApprovalRule);
router.put('/approval-rules/:loanProductId/:ruleId', moneyloanConfigController.updateApprovalRule);

// ═══════════════════════════════════════════════════════════════
// LOAN MODIFICATIONS ROUTES
// Base: /api/tenants/:tenantId/platforms/moneyloan/modifications
// ═══════════════════════════════════════════════════════════════

router.get('/loans/:loanId/modifications', moneyloanConfigController.getLoanModifications);
router.post('/loans/:loanId/modifications', moneyloanConfigController.createLoanModification);
router.put('/modifications/:modificationId', moneyloanConfigController.updateLoanModification);
router.post('/modifications/:modificationId/approve', moneyloanConfigController.approveLoanModification);
router.post('/modifications/:modificationId/reject', moneyloanConfigController.rejectLoanModification);

module.exports = router;
