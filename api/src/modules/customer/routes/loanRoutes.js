/**
 * Customer Money Loan Routes
 * Routes for customer-facing Money Loan operations
 */

const express = require('express');
const router = express.Router();
const customerAuth = require('../../../middleware/customerAuth');
// const LoanController = require('../controllers/LoanController');

// All routes require customer authentication
router.use(customerAuth);

// TODO: Implement customer Money Loan routes
// These routes are currently disabled pending controller implementation
// 
// Routes planned:
// - GET /dashboard - Get customer dashboard stats
// - GET /applications - Get my loan applications
// - POST /applications - Submit new loan application
// - GET /loans - Get my loans
// - GET /loans/:loanId - Get loan details by ID
// - GET /loans/:loanId/schedules - Get payment schedules
// - GET /loans/:loanId/payments - Get payment history
// - POST /loans/:loanId/payments - Make a payment

module.exports = router;
