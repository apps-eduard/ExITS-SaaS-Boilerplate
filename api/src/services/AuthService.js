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
      logger.info('🔍 Querying database for user:', { email });
      
      const result = await pool.query(
        `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.status, u.tenant_id, u.mfa_enabled, r.name as role_name
         FROM users u
         LEFT JOIN user_roles ur ON u.id = ur.user_id
         LEFT JOIN roles r ON ur.role_id = r.id
         WHERE u.email = $1 AND u.status = $2`,
        [email, 'active']
      );

      logger.info('📊 Database query result:', {
        email,
        rowCount: result.rows.length,
        foundUser: result.rows.length > 0,
        userId: result.rows[0]?.id,
        userStatus: result.rows[0]?.status
      });

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

      // Check if MFA is enabled - require MFA token before completing login
      if (user.mfa_enabled) {
        logger.info(`MFA required for user ${user.id}`);
        return {
          mfaRequired: true,
          userId: user.id,
          email: user.email
        };
      }

      // Fetch user permissions (standard RBAC format: resource:action)
      const permissionsResult = await pool.query(
        `SELECT DISTINCT p.permission_key
         FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         JOIN role_permissions rps ON r.id = rps.role_id
         JOIN permissions p ON rps.permission_id = p.id
         WHERE ur.user_id = $1 AND r.status = $2`,
        [user.id, 'active']
      );

      const permissions = permissionsResult.rows.map(row => row.permission_key);

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
        `INSERT INTO user_sessions (user_id, token_hash, refresh_token_hash, ip_address, status, expires_at)
         VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '24 hours')`,
        [user.id, sessionHash, refreshToken, ipAddress, 'active']
      );

      // Update last login
      await pool.query(
        `UPDATE users SET last_login = NOW() WHERE id = $1`,
        [user.id]
      );

      // Audit log
      await this.auditLog(user.id, user.tenant_id, 'login', 'user', user.id, {}, ipAddress);

      // Fetch user's roles (for role-based login checks)
      const rolesResult = await pool.query(
        `SELECT 
           r.id, 
           r.name, 
           r.description, 
           r.space, 
           r.status, 
           r.tenant_id as "tenantId"
         FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         WHERE ur.user_id = $1
         ORDER BY r.name`,
        [user.id]
      );
      const roles = rolesResult.rows;
      logger.info(`✅ Fetched ${roles.length} roles for user ${user.id}`);

      // Fetch user's platforms if tenant user (from employee_product_access table)
      let platforms = [];
      if (user.tenant_id) {
        try {
          const platformsResult = await pool.query(
            `SELECT product_type as "productType", access_level as "accessLevel", is_primary as "isPrimary"
             FROM employee_product_access
             WHERE user_id = $1 AND status = 'active'
             ORDER BY is_primary DESC, product_type`,
            [user.id]
          );
          platforms = platformsResult.rows;
          logger.info(`✅ Fetched ${platforms.length} platforms for user ${user.id}`);
        } catch (platformErr) {
          // employee_product_access table might not exist yet - that's okay for admin logins
          logger.warn(`Could not fetch platforms for user ${user.id}: ${platformErr.message}`);
          platforms = [];
        }
      }

      // Transform user to camelCase for frontend
      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          tenantId: user.tenant_id,
          role: user.role_name,
        },
        tokens: { accessToken, refreshToken },
        session: { created: true, tokenHash: sessionHash },
        permissions,
        roles,       // Include roles array for login checks
        platforms,   // Include platforms array
      };
    } catch (err) {
      logger.error(`Auth service login error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Complete login after MFA verification
   */
  static async loginWithMFA(userId, mfaToken, ipAddress) {
    try {
      const MFAService = require('./MFAService');

      // Verify MFA token
      const mfaResult = await MFAService.verifyMFAToken(userId, mfaToken);
      
      if (!mfaResult.valid) {
        throw new Error('Invalid MFA token');
      }

      // Get user data
      const result = await pool.query(
        `SELECT u.id, u.email, u.first_name, u.last_name, u.status, u.tenant_id, r.name as role_name
         FROM users u
         LEFT JOIN user_roles ur ON u.id = ur.user_id
         LEFT JOIN roles r ON ur.role_id = r.id
         WHERE u.id = $1 AND u.status = $2`,
        [userId, 'active']
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];

      // Fetch user permissions
      const permissionsResult = await pool.query(
        `SELECT DISTINCT p.permission_key
         FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         JOIN role_permissions rps ON r.id = rps.role_id
         JOIN permissions p ON rps.permission_id = p.id
         WHERE ur.user_id = $1 AND r.status = $2`,
        [user.id, 'active']
      );

      const permissions = permissionsResult.rows.map(row => row.permission_key);

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
        `INSERT INTO user_sessions (user_id, token_hash, refresh_token_hash, ip_address, status, expires_at)
         VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '24 hours')`,
        [user.id, sessionHash, refreshToken, ipAddress, 'active']
      );

      // Update last login
      await pool.query(
        `UPDATE users SET last_login = NOW() WHERE id = $1`,
        [user.id]
      );

      // Audit log
      await this.auditLog(user.id, user.tenant_id, 'login_mfa', 'user', user.id, { mfaMethod: mfaResult.method }, ipAddress);

      logger.info(`User ${user.id} logged in successfully with MFA (${mfaResult.method})`);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          tenantId: user.tenant_id,
          role: user.role_name,
        },
        tokens: { accessToken, refreshToken },
        session: { created: true, tokenHash: sessionHash },
        permissions,
        mfaUsed: mfaResult.method,
        remainingBackupCodes: mfaResult.remainingCodes
      };
    } catch (err) {
      logger.error(`Auth service MFA login error: ${err.message}`);
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
        `SELECT id FROM user_sessions
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
        `UPDATE user_sessions SET status = $1 WHERE user_id = $2 AND status = $3
         RETURNING user_id`,
        ['revoked', userId, 'active']
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
  static async auditLog(userId, tenantId, action, resourceType, resourceId, changes, ipAddress) {
    try {
      await pool.query(
        `INSERT INTO audit_logs (user_id, tenant_id, action, resource_type, resource_id, new_values, status, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [userId, tenantId, action, resourceType, resourceId, JSON.stringify(changes), 'success', ipAddress]
      );
    } catch (err) {
      logger.error(`Audit log error: ${err.message}`);
    }
  }

  /**
   * Platform-specific login - validate user has access to the platform
   */
  static async platformLogin(email, password, platformType, ipAddress) {
    try {
      logger.info(`🔍 Platform login attempt for ${platformType}:`, { email });

      // First, perform standard login
      const loginResult = await this.login(email, password, ipAddress);

      // If MFA required, return that
      if (loginResult.mfaRequired) {
        return loginResult;
      }

      const user = loginResult.user;

      // Platform login is only for tenant users
      if (!user.tenantId) {
        logger.warn(`Platform login attempt by system admin: ${email}`);
        throw new Error('Platform login is only available for tenant users. Please use the admin login.');
      }

      // Check if user has access to this specific platform
      const platformAccess = await pool.query(
        `SELECT * FROM employee_product_access 
         WHERE user_id = $1 AND product_type = $2 AND status = 'active'`,
        [user.id, platformType]
      );

      if (platformAccess.rows.length === 0) {
        logger.warn(`User ${email} attempted to access ${platformType} platform without permission`);
        throw new Error(`You do not have access to the ${this.getPlatformName(platformType)} platform. Please contact your administrator.`);
      }

      logger.info(`✅ Platform login successful for ${email} on ${platformType}`);

      // Add platform info to the result
      return {
        ...loginResult,
        platform: {
          type: platformType,
          name: this.getPlatformName(platformType),
          accessLevel: platformAccess.rows[0].access_level
        }
      };
    } catch (err) {
      logger.error(`❌ Platform login error:`, err);
      throw err;
    }
  }

  /**
   * Helper to get platform display name
   */
  static getPlatformName(platformType) {
    const names = {
      'money_loan': 'Money Loan',
      'bnpl': 'Buy Now Pay Later',
      'pawnshop': 'Pawnshop'
    };
    return names[platformType] || platformType;
  }
}

module.exports = AuthService;
