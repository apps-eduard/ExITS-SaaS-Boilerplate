/**
 * Customer Authentication Routes
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const customerAuthMiddleware = require('../../../middleware/customerAuth');

// Public routes
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);

// Protected routes (require customer authentication)
router.get('/profile', customerAuthMiddleware, AuthController.getProfile);

module.exports = router;
