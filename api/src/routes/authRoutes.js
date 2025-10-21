/**
 * Authentication Routes
 */

const express = require('express');
const AuthController = require('../controllers/AuthController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Public routes (no auth required)
router.post('/login', AuthController.login);
router.post('/forgot-password', AuthController.requestPasswordReset);
router.post('/refresh', AuthController.refreshToken);

// Protected routes (auth required)
router.post('/logout', authMiddleware, AuthController.logout);
router.post('/change-password', authMiddleware, AuthController.changePassword);
router.post('/verify-email', authMiddleware, AuthController.verifyEmail);
router.post('/validate-token', authMiddleware, AuthController.validateToken);

module.exports = router;
