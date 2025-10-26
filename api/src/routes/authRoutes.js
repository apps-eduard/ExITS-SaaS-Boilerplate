/**
 * Authentication Routes
 */

const express = require('express');
const AuthController = require('../controllers/AuthController');
const UserController = require('../controllers/UserController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Public routes (no auth required)
router.post('/login', AuthController.login);
router.post('/login-mfa', AuthController.loginWithMFA);
router.post('/forgot-password', AuthController.requestPasswordReset);
router.post('/refresh', AuthController.refreshToken);
// Email existence check for registration (public - no auth required)
router.get('/check-email', UserController.checkEmail);

// Platform-specific login routes (public - no auth required)
router.post('/platform/money-loan/login', AuthController.moneyLoanLogin);
router.post('/platform/bnpl/login', AuthController.bnplLogin);
router.post('/platform/pawnshop/login', AuthController.pawnshopLogin);

// Protected routes (auth required)
router.post('/logout', authMiddleware, AuthController.logout);
router.post('/change-password', authMiddleware, AuthController.changePassword);
router.post('/verify-email', authMiddleware, AuthController.verifyEmail);
router.post('/validate-token', authMiddleware, AuthController.validateToken);
router.get('/me/permissions', authMiddleware, AuthController.getMyPermissions);

module.exports = router;
