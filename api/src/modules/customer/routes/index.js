/**
 * Customer Portal Routes
 * Main router for all customer-facing endpoints
 */

const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');

// Mount auth routes
router.use('/auth', authRoutes);

module.exports = router;
