/**
 * Customer Portal Routes
 * Main router for all customer-facing endpoints
 */

const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const loanRoutes = require('./loanRoutes');

// Mount auth routes
router.use('/auth', authRoutes);

// Mount money loan routes
router.use('/money-loan', loanRoutes);

module.exports = router;
