/**
 * Money Loan - Loan Management Routes
 * API endpoints for loan lifecycle operations
 */

const express = require('express');
const moneyloanLoanController = require('../controllers/MoneyloanLoanController');

const router = express.Router({ mergeParams: true });

// ═══════════════════════════════════════════════════════════════
// LOAN PRODUCTS ROUTES
// Base: /api/tenants/:tenantId/platforms/moneyloan/loans/products
// ═══════════════════════════════════════════════════════════════

router.get('/products', moneyloanLoanController.getLoanProducts);
router.post('/products', moneyloanLoanController.createLoanProduct);
router.put('/products/:productId', moneyloanLoanController.updateLoanProduct);
router.delete('/products/:productId', moneyloanLoanController.deleteLoanProduct);

// ═══════════════════════════════════════════════════════════════
// LOAN APPLICATION ROUTES
// Base: /api/tenants/:tenantId/platforms/moneyloan/loans/applications
// ═══════════════════════════════════════════════════════════════

router.post('/applications', moneyloanLoanController.createLoanApplication);
router.get('/applications/:applicationId', moneyloanLoanController.getLoanApplication);
router.put('/applications/:applicationId', moneyloanLoanController.updateLoanApplication);
router.post('/applications/:applicationId/approve', moneyloanLoanController.approveLoanApplication);
router.post('/applications/:applicationId/reject', moneyloanLoanController.rejectLoanApplication);

// ═══════════════════════════════════════════════════════════════
// LOAN MANAGEMENT ROUTES
// Base: /api/tenants/:tenantId/platforms/moneyloan/loans
// ═══════════════════════════════════════════════════════════════

router.get('/dashboard', moneyloanLoanController.getLoansDashboard);
router.get('/', moneyloanLoanController.getLoansWithFilters);
router.get('/:loanId', moneyloanLoanController.getLoan);
router.post('/:loanId/disburse', moneyloanLoanController.disburseLoan);
router.post('/:loanId/close', moneyloanLoanController.closeLoan);
router.post('/:loanId/suspend', moneyloanLoanController.suspendLoan);
router.post('/:loanId/resume', moneyloanLoanController.resumeLoan);

// ═══════════════════════════════════════════════════════════════
// CUSTOMER & PRODUCT LOAN ROUTES
// ═══════════════════════════════════════════════════════════════

router.get('/customers/:customerId/loans', moneyloanLoanController.getCustomerLoans);
router.get('/products/:productId/loans', moneyloanLoanController.getProductLoans);

module.exports = router;
