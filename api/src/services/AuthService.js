/**
 * Authentication Service
 * Handles user login, registration, token refresh, and password management
 */

const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const logger = require('../utils/logger');
const { CONSTANTS } = require('../config/constants');

class AuthService {
  /**
   * User login - validate credentials and generate tokens
   */
  static async login(email, password, ipAddress) {
    try {
      const result = await pool.query(
        `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.status, u.tenant_id
         FROM users u
         WHERE u.email = $1 AND u.status = $2`,
        [email, 'active']
      );

      if (result.rows.length === 0) {
        logger.warn(`Login attempt failed for non-existent user: ${email}`);
        throw new Error('Invalid credentials');
      }

      const user = result.rows[0];

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        logger.warn(`Login attempt with invalid password for user: ${email}`);
        throw new Error('Invalid credentials');
      }

      // Fetch user permissions
      const permissionsResult = await pool.query(
        `SELECT DISTINCT m.menu_key, rp.action_key
         FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         JOIN role_permissions rp ON r.id = rp.role_id
         JOIN modules m ON rp.module_id = m.id
         WHERE ur.user_id = $1 AND rp.status = $2`,
        [user.id, 'active']
      );

      const permissions = permissionsResult.rows.reduce((acc, row) => {
        if (!acc[row.menu_key]) acc[row.menu_key] = [];
        acc[row.menu_key].push(row.action_key);
        return acc;
      }, {});

      // Generate tokens
      const accessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        tenant_id: user.tenant_id,
        permissions,
      });

      const refreshToken = generateRefreshToken({
        id: user.id,
        email: user.email,
        tenant_id: user.tenant_id,
      });

      // Store session
      const sessionHash = require('crypto')
        .createHash('sha256')
        .update(accessToken)
        .digest('hex');

      await pool.query(
        `INSERT INTO sessions (user_id, tenant_id, access_token_hash, refresh_token_hash, ip_address, status, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '24 hours')`,
        [user.id, user.tenant_id, sessionHash, refreshToken, ipAddress, 'active']
      );

      // Update last login
      await pool.query(
        `UPDATE users SET last_login_at = NOW() WHERE id = $1`,
        [user.id]
      );

      // Audit log
      await this.auditLog(user.id, user.tenant_id, 'login', 'user', user.id, {}, ipAddress);

      return {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          tenant_id: user.tenant_id,
        },
        tokens: { accessToken, refreshToken },
        permissions,
      };
    } catch (err) {
      logger.error(`Auth service login error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(refreshToken, ipAddress) {
    try {
      const decoded = verifyRefreshToken(refreshToken);

      // Verify session still exists
      const sessionResult = await pool.query(
        `SELECT id FROM sessions
         WHERE user_id = $1 AND refresh_token_hash = $2 AND status = $3`,
        [decoded.id, refreshToken, 'active']
      );

      if (sessionResult.rows.length === 0) {
        throw new Error('Invalid refresh token');
      }

      // Generate new access token
      const user = {
        id: decoded.id,
        email: decoded.email,
        tenant_id: decoded.tenant_id,
      };

      const newAccessToken = generateAccessToken(user);

      return { accessToken: newAccessToken };
    } catch (err) {
      logger.error(`Auth service refresh error: ${err.message}`);
      throw new Error('Token refresh failed');
    }
  }

  /**
   * Logout - invalidate session
   */
  static async logout(userId, ipAddress) {
    try {
      const result = await pool.query(
        `UPDATE sessions SET status = $1 WHERE user_id = $2 AND status = $3
         RETURNING user_id, tenant_id`,
        ['inactive', userId, 'active']
      );

      if (result.rows.length > 0) {
        const { tenant_id } = result.rows[0];
        await this.auditLog(userId, tenant_id, 'logout', 'user', userId, {}, ipAddress);
      }

      return { message: 'Logout successful' };
    } catch (err) {
      logger.error(`Auth service logout error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Change password
   */
  static async changePassword(userId, oldPassword, newPassword) {
    try {
      const userResult = await pool.query(
        `SELECT password_hash, tenant_id FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];

      // Verify old password
      const isValid = await bcrypt.compare(oldPassword, user.password_hash);
      if (!isValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await pool.query(
        `UPDATE users SET password_hash = $1 WHERE id = $2`,
        [hashedPassword, userId]
      );

      await this.auditLog(userId, user.tenant_id, 'update', 'user', userId, {
        field: 'password',
      }, '');

      return { message: 'Password changed successfully' };
    } catch (err) {
      logger.error(`Auth service password change error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Verify email address
   */
  static async verifyEmail(userId) {
    try {
      await pool.query(
        `UPDATE users SET email_verified = true WHERE id = $1`,
        [userId]
      );

      return { message: 'Email verified successfully' };
    } catch (err) {
      logger.error(`Auth service email verification error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email) {
    try {
      const result = await pool.query(
        `SELECT id, email FROM users WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        // Don't reveal if email exists
        return { message: 'If email exists, reset link has been sent' };
      }

      // In production, generate a token and send via email
      logger.info(`Password reset requested for: ${email}`);

      return { message: 'If email exists, reset link has been sent' };
    } catch (err) {
      logger.error(`Auth service password reset request error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Audit log helper
   */
  static async auditLog(userId, tenantId, action, entityType, entityId, changes, ipAddress) {
    try {
      await pool.query(
        `INSERT INTO audit_logs (user_id, tenant_id, action, entity_type, entity_id, changes, status, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [userId, tenantId, action, entityType, entityId, JSON.stringify(changes), 'success', ipAddress]
      );
    } catch (err) {
      logger.error(`Audit log error: ${err.message}`);
    }
  }
}

module.exports = AuthService;
