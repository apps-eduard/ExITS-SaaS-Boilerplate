/**
 * Authentication Service
 * Handles user login, registration, token refresh, and password management
 */

const bcrypt = require('bcryptjs');
const knex = require('../config/knex');
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
      
      // Use Knex with automatic camelCase conversion
      const user = await knex('users')
        .select(
          'users.id',
          'users.email',
          'users.passwordHash',
          'users.firstName',
          'users.lastName',
          'users.status',
          'users.tenantId',
          'users.mfaEnabled',
          'roles.name as roleName'
        )
        .leftJoin('userRoles', 'users.id', 'userRoles.userId')
        .leftJoin('roles', 'userRoles.roleId', 'roles.id')
        .where({ 'users.email': email, 'users.status': 'active' })
        .first();

      logger.info('📊 Database query result:', {
        email,
        foundUser: !!user,
        userId: user?.id,
        userStatus: user?.status
      });

      if (!user) {
        logger.warn(`Login attempt failed for non-existent user: ${email}`);
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        logger.warn(`Login attempt with invalid password for user: ${email}`);
        throw new Error('Invalid credentials');
      }

      // Check if MFA is enabled - require MFA token before completing login
      if (user.mfaEnabled) {
        logger.info(`MFA required for user ${user.id}`);
        return {
          mfaRequired: true,
          userId: user.id,
          email: user.email
        };
      }

      // Fetch user permissions (standard RBAC format: resource:action)
      const permissions = await knex('userRoles')
        .select('permissions.permissionKey')
        .join('roles', 'userRoles.roleId', 'roles.id')
        .join('rolePermissions', 'roles.id', 'rolePermissions.roleId')
        .join('permissions', 'rolePermissions.permissionId', 'permissions.id')
        .where({ 'userRoles.userId': user.id, 'roles.status': 'active' })
        .distinct()
        .pluck('permissionKey');

      // Generate tokens
      const accessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        tenant_id: user.tenantId,
        permissions,
      });

      const refreshToken = generateRefreshToken({
        id: user.id,
        email: user.email,
        tenant_id: user.tenantId,
      });

      // Store session
      const sessionHash = require('crypto')
        .createHash('sha256')
        .update(accessToken)
        .digest('hex');

      await knex('userSessions').insert({
        userId: user.id,
        tokenHash: sessionHash,
        refreshTokenHash: refreshToken,
        ipAddress,
        status: 'active',
        expiresAt: knex.raw('NOW() + INTERVAL \'24 hours\'')
      });

      // Update last login
      await knex('users')
        .where({ id: user.id })
        .update({ lastLogin: knex.fn.now() });

      // Audit log
      await this.auditLog(user.id, user.tenantId, 'login', 'user', user.id, {}, ipAddress);

      // Fetch user's roles (for role-based login checks)
      const roles = await knex('userRoles')
        .select('roles.id', 'roles.name', 'roles.description', 'roles.space', 'roles.status', 'roles.tenantId')
        .join('roles', 'userRoles.roleId', 'roles.id')
        .where({ 'userRoles.userId': user.id })
        .orderBy('roles.name');
      
      logger.info(`✅ Fetched ${roles.length} roles for user ${user.id}`);

      // Fetch user's platforms if tenant user (from employee_product_access table)
      let platforms = [];
      if (user.tenantId) {
        try {
          platforms = await knex('employeeProductAccess')
            .select('productType', 'accessLevel', 'isPrimary')
            .where({ userId: user.id, status: 'active' })
            .orderBy([
              { column: 'isPrimary', order: 'desc' },
              { column: 'productType', order: 'asc' }
            ]);
          
          logger.info(`✅ Fetched ${platforms.length} platforms for user ${user.id}`);
        } catch (platformErr) {
          // employee_product_access table might not exist yet - that's okay for admin logins
          logger.warn(`Could not fetch platforms for user ${user.id}: ${platformErr.message}`);
          platforms = [];
        }
      }

      // Return user data (already in camelCase from Knex)
      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          tenantId: user.tenantId,
          role: user.roleName,
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
      const users = await knex('users as u')
        .leftJoin('userRoles as ur', 'u.id', 'ur.userId')
        .leftJoin('roles as r', 'ur.roleId', 'r.id')
        .select(
          'u.id',
          'u.email',
          'u.firstName',
          'u.lastName',
          'u.status',
          'u.tenantId',
          'r.name as roleName'
        )
        .where('u.id', userId)
        .where('u.status', 'active');

      if (users.length === 0) {
        throw new Error('User not found');
      }

      const user = users[0];

      // Fetch user permissions
      const permissionsData = await knex('userRoles as ur')
        .join('roles as r', 'ur.roleId', 'r.id')
        .join('rolePermissions as rps', 'r.id', 'rps.roleId')
        .join('permissions as p', 'rps.permissionId', 'p.id')
        .select('p.permissionKey')
        .where('ur.userId', user.id)
        .where('r.status', 'active')
        .distinct();

      const permissions = permissionsData.map(row => row.permissionKey);

      // Generate tokens
      const accessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        tenant_id: user.tenantId,
        permissions,
      });

      const refreshToken = generateRefreshToken({
        id: user.id,
        email: user.email,
        tenant_id: user.tenantId,
      });

      // Store session
      const sessionHash = require('crypto')
        .createHash('sha256')
        .update(accessToken)
        .digest('hex');

      await knex('userSessions').insert({
        userId: user.id,
        tokenHash: sessionHash,
        refreshTokenHash: refreshToken,
        ipAddress,
        status: 'active',
        expiresAt: knex.raw('NOW() + INTERVAL \'24 hours\''),
      });

      // Update last login
      await knex('users')
        .where({ id: user.id })
        .update({ lastLogin: knex.fn.now() });

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
  static async refreshToken(refreshToken, _ipAddress) {
    try {
      const decoded = verifyRefreshToken(refreshToken);

      // Verify session still exists
      const session = await knex('userSessions')
        .select('id')
        .where({
          userId: decoded.id,
          refreshTokenHash: refreshToken,
          status: 'active',
        })
        .first();

      if (!session) {
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
  static async logout(userId, _ipAddress) {
    try {
      const updated = await knex('userSessions')
        .where({ userId, status: 'active' })
        .update({ status: 'revoked' })
        .returning(['userId']);  // Fixed: removed tenantId - doesn't exist in user_sessions

      if (updated.length > 0) {
        // Get tenantId from users table instead
        const user = await knex('users').select('tenantId').where({ id: userId }).first();
        const tenantId = user?.tenantId || null;
        await this.auditLog(userId, tenantId, 'logout', 'user', userId, {}, _ipAddress);
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
      const user = await knex('users')
        .select('passwordHash', 'tenantId')
        .where({ id: userId })
        .first();

      if (!user) {
        throw new Error('User not found');
      }

      // Verify old password
      const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
      if (!isValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await knex('users')
        .where({ id: userId })
        .update({ passwordHash: hashedPassword });

      await this.auditLog(userId, user.tenantId, 'update', 'user', userId, {
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
      await knex('users')
        .where({ id: userId })
        .update({ emailVerified: true });

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
      const user = await knex('users')
        .select('id', 'email')
        .where({ email })
        .first();

      if (!user) {
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
      await knex('auditLogs').insert({
        userId,
        tenantId,
        action,
        resourceType,
        resourceId,
        newValues: JSON.stringify(changes),
        status: 'success',
        ipAddress,
      });
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
      const platformAccess = await knex('employeeProductAccess')
        .where({
          userId: user.id,
          productType: platformType,
          status: 'active',
        })
        .first();

      if (!platformAccess) {
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
          accessLevel: platformAccess.accessLevel,
        },
      };
    } catch (err) {
      logger.error('❌ Platform login error:', err);
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
      'pawnshop': 'Pawnshop',
    };
    return names[platformType] || platformType;
  }
}

module.exports = AuthService;
