const express = require('express');
const RepaymentController = require('../controllers/RepaymentController');

const router = express.Router();

// Loan-specific repayment routes
router.get('/:loanId/payments', RepaymentController.getPaymentHistory);
router.get('/:loanId/schedule', RepaymentController.getRepaymentSchedule);

module.exports = router;
