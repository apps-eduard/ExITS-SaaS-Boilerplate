const express = require('express');
const customerRoutes = require('./customerRoutes');
const loanRoutes = require('./loanRoutes');
const paymentRoutes = require('./paymentRoutes');
const loanRepaymentRoutes = require('./loanRepaymentRoutes');

const router = express.Router();

// Mount routes
router.use('/customers', customerRoutes);
router.use('/loans', loanRoutes);
router.use('/loans', loanRepaymentRoutes); // /loans/:loanId/payments, /loans/:loanId/schedule
router.use('/payments', paymentRoutes);

module.exports = router;
