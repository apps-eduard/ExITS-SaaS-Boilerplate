const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const pool = require('../config/database');
const logger = require('../utils/logger');

const ENCRYPTION_KEY = process.env.MFA_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

class MFAService {
  /**
   * Encrypt sensitive data (MFA secret)
   */
  static encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32),
      iv
    );
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  /**
   * Decrypt sensitive data (MFA secret)
   */
  static decrypt(text) {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32),
      iv
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  /**
   * Generate MFA secret and QR code for setup
   */
  static async generateMFASetup(userId, userEmail) {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `ExITS SaaS (${userEmail})`,
        issuer: 'ExITS Platform',
        length: 32
      });

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      logger.info(`MFA setup generated for user ${userId}`);

      return {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        backupCodes: backupCodes.plain // Return plain codes to show user
      };
    } catch (err) {
      logger.error(`Error generating MFA setup: ${err.message}`);
      throw err;
    }
  }

  /**
   * Generate backup codes for MFA recovery
   */
  static generateBackupCodes(count = 10) {
    const codes = [];
    const hashedCodes = [];

    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
      
      // Hash the code for storage
      const hash = crypto.createHash('sha256').update(code).digest('hex');
      hashedCodes.push({
        hash,
        used: false,
        usedAt: null
      });
    }

    return {
      plain: codes,
      hashed: hashedCodes
    };
  }

  /**
   * Enable MFA for a user
   */
  static async enableMFA(userId, secret, token) {
    try {
      // Verify the token first
      const isValid = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 2 // Allow 2 time steps before/after
      });

      if (!isValid) {
        throw new Error('Invalid verification token');
      }

      // Encrypt the secret
      const encryptedSecret = this.encrypt(secret);

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Update user record
      await pool.query(
        `UPDATE users 
         SET mfa_enabled = true, 
             mfa_secret = $1, 
             mfa_backup_codes = $2,
             mfa_enabled_at = NOW(),
             updated_at = NOW()
         WHERE id = $3`,
        [encryptedSecret, JSON.stringify(backupCodes.hashed), userId]
      );

      logger.info(`MFA enabled for user ${userId}`);

      return {
        success: true,
        backupCodes: backupCodes.plain
      };
    } catch (err) {
      logger.error(`Error enabling MFA: ${err.message}`);
      throw err;
    }
  }

  /**
   * Verify MFA token during login
   */
  static async verifyMFAToken(userId, token) {
    try {
      // Get user's MFA secret
      const result = await pool.query(
        'SELECT mfa_secret, mfa_backup_codes FROM users WHERE id = $1 AND mfa_enabled = true',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('MFA not enabled for this user');
      }

      const { mfa_secret, mfa_backup_codes } = result.rows[0];

      // Try TOTP verification first
      const decryptedSecret = this.decrypt(mfa_secret);
      const isValidTOTP = speakeasy.totp.verify({
        secret: decryptedSecret,
        encoding: 'base32',
        token: token,
        window: 2
      });

      if (isValidTOTP) {
        logger.info(`MFA token verified for user ${userId}`);
        return { valid: true, method: 'totp' };
      }

      // If TOTP fails, try backup codes
      if (mfa_backup_codes) {
        const backupCodes = JSON.parse(mfa_backup_codes);
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        
        const codeIndex = backupCodes.findIndex(
          bc => bc.hash === tokenHash && !bc.used
        );

        if (codeIndex !== -1) {
          // Mark backup code as used
          backupCodes[codeIndex].used = true;
          backupCodes[codeIndex].usedAt = new Date().toISOString();

          await pool.query(
            'UPDATE users SET mfa_backup_codes = $1, updated_at = NOW() WHERE id = $2',
            [JSON.stringify(backupCodes), userId]
          );

          logger.info(`Backup code used for user ${userId}`);
          return { valid: true, method: 'backup', remainingCodes: backupCodes.filter(bc => !bc.used).length };
        }
      }

      logger.warn(`Invalid MFA token for user ${userId}`);
      return { valid: false };
    } catch (err) {
      logger.error(`Error verifying MFA token: ${err.message}`);
      throw err;
    }
  }

  /**
   * Disable MFA for a user
   */
  static async disableMFA(userId, password) {
    try {
      // Verify password before disabling
      const result = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const bcrypt = require('bcryptjs');
      const isValidPassword = await bcrypt.compare(password, result.rows[0].password_hash);

      if (!isValidPassword) {
        throw new Error('Invalid password');
      }

      // Disable MFA
      await pool.query(
        `UPDATE users 
         SET mfa_enabled = false, 
             mfa_secret = NULL, 
             mfa_backup_codes = NULL,
             updated_at = NOW()
         WHERE id = $1`,
        [userId]
      );

      logger.info(`MFA disabled for user ${userId}`);
      return { success: true };
    } catch (err) {
      logger.error(`Error disabling MFA: ${err.message}`);
      throw err;
    }
  }

  /**
   * Regenerate backup codes
   */
  static async regenerateBackupCodes(userId) {
    try {
      const backupCodes = this.generateBackupCodes();

      await pool.query(
        'UPDATE users SET mfa_backup_codes = $1, updated_at = NOW() WHERE id = $2 AND mfa_enabled = true',
        [JSON.stringify(backupCodes.hashed), userId]
      );

      logger.info(`Backup codes regenerated for user ${userId}`);
      
      return {
        success: true,
        backupCodes: backupCodes.plain
      };
    } catch (err) {
      logger.error(`Error regenerating backup codes: ${err.message}`);
      throw err;
    }
  }

  /**
   * Check if user has MFA enabled
   */
  static async isMFAEnabled(userId) {
    try {
      const result = await pool.query(
        'SELECT mfa_enabled FROM users WHERE id = $1',
        [userId]
      );

      return result.rows.length > 0 && result.rows[0].mfa_enabled === true;
    } catch (err) {
      logger.error(`Error checking MFA status: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get MFA status and statistics
   */
  static async getMFAStatus(userId) {
    try {
      const result = await pool.query(
        'SELECT mfa_enabled, mfa_enabled_at, mfa_backup_codes FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const { mfa_enabled, mfa_enabled_at, mfa_backup_codes } = result.rows[0];

      let backupCodesRemaining = 0;
      if (mfa_backup_codes) {
        const codes = JSON.parse(mfa_backup_codes);
        backupCodesRemaining = codes.filter(bc => !bc.used).length;
      }

      return {
        enabled: mfa_enabled,
        enabledAt: mfa_enabled_at,
        backupCodesRemaining
      };
    } catch (err) {
      logger.error(`Error getting MFA status: ${err.message}`);
      throw err;
    }
  }
}

module.exports = MFAService;
