const MFAService = require('../services/MFAService');
const logger = require('../utils/logger');
const CONSTANTS = require('../config/constants');

class MFAController {
  /**
   * Generate MFA setup (QR code and secret)
   * POST /api/mfa/setup
   */
  static async generateSetup(req, res, next) {
    try {
      const userId = req.user.id;
      const userEmail = req.user.email;

      // Check if MFA is already enabled
      const isEnabled = await MFAService.isMFAEnabled(userId);
      if (isEnabled) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'MFA is already enabled for this account'
        });
      }

      const setup = await MFAService.generateMFASetup(userId, userEmail);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: {
          secret: setup.secret,
          qrCode: setup.qrCode,
          backupCodes: setup.backupCodes
        }
      });
    } catch (err) {
      logger.error(`Error generating MFA setup: ${err.message}`);
      next(err);
    }
  }

  /**
   * Enable MFA after verifying token
   * POST /api/mfa/enable
   * Body: { secret, token }
   */
  static async enable(req, res, next) {
    try {
      const userId = req.user.id;
      const { secret, token } = req.body;

      if (!secret || !token) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Secret and verification token are required'
        });
      }

      const result = await MFAService.enableMFA(userId, secret, token);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: 'MFA enabled successfully',
        data: {
          backupCodes: result.backupCodes
        }
      });
    } catch (err) {
      if (err.message === 'Invalid verification token') {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Invalid verification token. Please try again.'
        });
      }
      logger.error(`Error enabling MFA: ${err.message}`);
      next(err);
    }
  }

  /**
   * Verify MFA token
   * POST /api/mfa/verify
   * Body: { token }
   */
  static async verify(req, res, next) {
    try {
      const userId = req.user.id;
      const { token } = req.body;

      if (!token) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Verification token is required'
        });
      }

      const result = await MFAService.verifyMFAToken(userId, token);

      if (result.valid) {
        res.status(CONSTANTS.HTTP_STATUS.OK).json({
          success: true,
          message: 'Token verified successfully',
          data: {
            method: result.method,
            remainingBackupCodes: result.remainingCodes
          }
        });
      } else {
        res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
          error: 'Invalid verification token'
        });
      }
    } catch (err) {
      logger.error(`Error verifying MFA token: ${err.message}`);
      next(err);
    }
  }

  /**
   * Disable MFA
   * POST /api/mfa/disable
   * Body: { password }
   */
  static async disable(req, res, next) {
    try {
      const userId = req.user.id;
      const { password } = req.body;

      if (!password) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Password is required to disable MFA'
        });
      }

      await MFAService.disableMFA(userId, password);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: 'MFA disabled successfully'
      });
    } catch (err) {
      if (err.message === 'Invalid password') {
        return res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
          error: 'Invalid password'
        });
      }
      logger.error(`Error disabling MFA: ${err.message}`);
      next(err);
    }
  }

  /**
   * Regenerate backup codes
   * POST /api/mfa/regenerate-backup-codes
   */
  static async regenerateBackupCodes(req, res, next) {
    try {
      const userId = req.user.id;

      const result = await MFAService.regenerateBackupCodes(userId);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: 'Backup codes regenerated successfully',
        data: {
          backupCodes: result.backupCodes
        }
      });
    } catch (err) {
      logger.error(`Error regenerating backup codes: ${err.message}`);
      next(err);
    }
  }

  /**
   * Get MFA status
   * GET /api/mfa/status
   */
  static async getStatus(req, res, next) {
    try {
      const userId = req.user.id;

      const status = await MFAService.getMFAStatus(userId);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: status
      });
    } catch (err) {
      logger.error(`Error getting MFA status: ${err.message}`);
      next(err);
    }
  }
}

module.exports = MFAController;
