/**
 * Customer Money Loan Routes
 * Routes for customer-facing Money Loan operations
 */

const express = require('express');
const router = express.Router();
const customerAuth = require('../../../middleware/customerAuth');
const LoanController = require('../controllers/LoanController');

// All routes require customer authentication
router.use(customerAuth);

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════

/**
 * Get customer dashboard stats
 * GET /api/customer/money-loan/dashboard
 */
router.get('/dashboard', LoanController.getDashboardStats);

// ═══════════════════════════════════════════════════════════════
// LOAN APPLICATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get my loan applications
 * GET /api/customer/money-loan/applications
 * Query params: ?status=pending&page=1&limit=10
 */
router.get('/applications', LoanController.getMyApplications);

/**
 * Submit new loan application
 * POST /api/customer/money-loan/applications
 */
router.post('/applications', LoanController.submitApplication);

// ═══════════════════════════════════════════════════════════════
// LOANS
// ═══════════════════════════════════════════════════════════════

/**
 * Get my loans
 * GET /api/customer/money-loan/loans
 * Query params: ?status=active
 */
router.get('/loans', LoanController.getMyLoans);

/**
 * Get loan details by ID
 * GET /api/customer/money-loan/loans/:loanId
 */
router.get('/loans/:loanId', LoanController.getLoanDetails);

/**
 * Get payment schedules for a loan
 * GET /api/customer/money-loan/loans/:loanId/schedules
 */
router.get('/loans/:loanId/schedules', LoanController.getPaymentSchedules);

/**
 * Get payment history for a loan
 * GET /api/customer/money-loan/loans/:loanId/payments
 */
router.get('/loans/:loanId/payments', LoanController.getPaymentHistory);

/**
 * Make a payment
 * POST /api/customer/money-loan/loans/:loanId/payments
 */
router.post('/loans/:loanId/payments', LoanController.makePayment);

module.exports = router;
