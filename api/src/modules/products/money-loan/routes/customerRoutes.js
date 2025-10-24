const express = require('express');
const CustomerController = require('../controllers/CustomerController');

const router = express.Router();

// Customer routes
router.post('/', CustomerController.createCustomer);
router.get('/', CustomerController.listCustomers);
router.get('/:id', CustomerController.getCustomer);
router.put('/:id', CustomerController.updateCustomer);
router.get('/:id/stats', CustomerController.getCustomerStats);

module.exports = router;
