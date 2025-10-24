const express = require('express');
const RepaymentController = require('../controllers/RepaymentController');

const router = express.Router();

// Payment routes
router.post('/', RepaymentController.recordPayment);
router.get('/today', RepaymentController.getTodayCollections);

module.exports = router;
