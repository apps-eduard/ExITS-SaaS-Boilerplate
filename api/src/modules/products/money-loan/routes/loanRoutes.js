const express = require('express');
const LoanController = require('../controllers/LoanController');

const router = express.Router();

// Loan routes
router.post('/', LoanController.createLoan);
router.get('/', LoanController.listLoans);
router.get('/overview', LoanController.getLoanOverview);
router.get('/:id', LoanController.getLoan);
router.put('/:id/status', LoanController.updateLoanStatus);

module.exports = router;
