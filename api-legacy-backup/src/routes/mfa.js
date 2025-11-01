const express = require('express');
const router = express.Router();
const MFAController = require('../controllers/MFAController');
const authMiddleware = require('../middleware/auth');

/**
 * MFA Routes
 * All routes require authentication
 */

// Generate MFA setup (QR code + secret)
router.post('/setup', authMiddleware, MFAController.generateSetup);

// Enable MFA
router.post('/enable', authMiddleware, MFAController.enable);

// Verify MFA token
router.post('/verify', authMiddleware, MFAController.verify);

// Disable MFA
router.post('/disable', authMiddleware, MFAController.disable);

// Regenerate backup codes
router.post('/regenerate-backup-codes', authMiddleware, MFAController.regenerateBackupCodes);

// Get MFA status
router.get('/status', authMiddleware, MFAController.getStatus);

module.exports = router;
