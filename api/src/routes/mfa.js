const express = require('express');
const router = express.Router();
const MFAController = require('../controllers/MFAController');
const { authenticate } = require('../middleware/auth');

/**
 * MFA Routes
 * All routes require authentication
 */

// Generate MFA setup (QR code + secret)
router.post('/setup', authenticate, MFAController.generateSetup);

// Enable MFA
router.post('/enable', authenticate, MFAController.enable);

// Verify MFA token
router.post('/verify', authenticate, MFAController.verify);

// Disable MFA
router.post('/disable', authenticate, MFAController.disable);

// Regenerate backup codes
router.post('/regenerate-backup-codes', authenticate, MFAController.regenerateBackupCodes);

// Get MFA status
router.get('/status', authenticate, MFAController.getStatus);

module.exports = router;
