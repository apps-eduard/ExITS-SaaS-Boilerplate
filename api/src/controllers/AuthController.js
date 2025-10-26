/**
 * Authentication Controller
 * Handles login, logout, token refresh, and password management
 */

const AuthService = require('../services/AuthService');
const { validateLogin } = require('../utils/validators');
const logger = require('../utils/logger');
const CONSTANTS = require('../config/constants');

class AuthController {
  /**
   * POST /auth/login
   * User login endpoint
   */
  static async login(req, res, next) {
    try {
      const { error, value } = validateLogin(req.body);
      if (error) {
        error.isJoi = true;
        return next(error);
      }

      // Debug logging
      logger.info('🔐 Login attempt:', {
        email: value.email,
        passwordLength: value.password?.length,
        hasPassword: !!value.password,
        ip: req.ip
      });

      const result = await AuthService.login(value.email, value.password, req.ip);

      // Check if MFA is required
      if (result.mfaRequired) {
        return res.status(CONSTANTS.HTTP_STATUS.OK).json({
          message: 'MFA verification required',
          data: {
            mfaRequired: true,
            userId: result.userId,
            email: result.email
          },
        });
      }

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Login successful',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /auth/login-mfa
   * Complete login with MFA verification
   */
  static async loginWithMFA(req, res, next) {
    try {
      const { userId, mfaToken } = req.body;

      if (!userId || !mfaToken) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'User ID and MFA token are required',
        });
      }

      logger.info(`🔐 MFA login attempt for user ${userId}`);

      const result = await AuthService.loginWithMFA(userId, mfaToken, req.ip);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Login successful',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /auth/refresh
   * Refresh access token
   */
  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Refresh token required',
        });
      }

      const result = await AuthService.refreshToken(refreshToken, req.ip);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Token refreshed',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /auth/logout
   * User logout
   */
  static async logout(req, res, next) {
    try {
      const result = await AuthService.logout(req.userId, req.ip);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Logout successful',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /auth/change-password
   * Change user password
   */
  static async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword, confirmPassword } = req.body;

      if (!oldPassword || !newPassword || !confirmPassword) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'All password fields are required',
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Passwords do not match',
        });
      }

      const result = await AuthService.changePassword(req.userId, oldPassword, newPassword);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Password changed successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /auth/verify-email/:token
   * Verify email address
   */
  static async verifyEmail(req, res, next) {
    try {
      const result = await AuthService.verifyEmail(req.userId);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Email verified successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /auth/forgot-password
   * Request password reset
   */
  static async requestPasswordReset(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Email is required',
        });
      }

      const result = await AuthService.requestPasswordReset(email);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'If email exists, reset link has been sent',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /auth/validate-token
   * Validate current token and return user info
   */
  static async validateToken(req, res, next) {
    try {
      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Token is valid',
        data: {
          user: req.user,
          permissions: req.permissions,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /auth/me/permissions
   * Get current user's permissions
   */
  static async getMyPermissions(req, res, next) {
    try {
      const pool = require('../config/database');
      const logger = require('../utils/logger');
      
      logger.info('🔎 [getMyPermissions] User ID:', req.user.id);
      logger.info('🔎 [getMyPermissions] User Email:', req.user.email);
      logger.info('🔎 [getMyPermissions] Tenant ID:', req.user.tenant_id);
      
      // First, let's see what roles this user has
      const rolesResult = await pool.query(
        `SELECT r.id, r.name, r.description, r.space, r.status
         FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         WHERE ur.user_id = $1
         ORDER BY r.name`,
        [req.user.id]
      );
      
      logger.info('👤 [getMyPermissions] User has roles:', rolesResult.rows);
      logger.info(`👤 [getMyPermissions] Total roles: ${rolesResult.rows.length}`);
      
      // Now get permissions
      const result = await pool.query(
        `SELECT DISTINCT p.permission_key, p.resource, p.action, p.description, r.name as role_name
         FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         JOIN role_permissions rps ON r.id = rps.role_id
         JOIN permissions p ON rps.permission_id = p.id
         WHERE ur.user_id = $1 AND r.status = $2
         ORDER BY p.resource, p.action`,
        [req.user.id, 'active']
      );
      
      logger.info('🔎 [getMyPermissions] SQL result count:', result.rows.length);
      logger.info('🔎 [getMyPermissions] First 10 permissions:', result.rows.slice(0, 10));
      logger.info('🔎 [getMyPermissions] Permissions by role:', 
        result.rows.reduce((acc, row) => {
          acc[row.role_name] = (acc[row.role_name] || 0) + 1;
          return acc;
        }, {})
      );
      
      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: {
          permissions: result.rows.map(row => row.permission_key),
          details: result.rows,
        },
      });
    } catch (err) {
      logger.error('❌ [getMyPermissions] Error:', err);
      next(err);
    }
  }

  /**
   * POST /auth/platform/money-loan/login
   * Platform-specific login for Money Loan
   */
  static async moneyLoanLogin(req, res, next) {
    try {
      const { error, value } = validateLogin(req.body);
      if (error) {
        error.isJoi = true;
        return next(error);
      }

      logger.info('💰 Money Loan Platform Login attempt:', {
        email: value.email,
        ip: req.ip
      });

      const result = await AuthService.platformLogin(value.email, value.password, 'money_loan', req.ip);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Money Loan login successful',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /auth/platform/bnpl/login
   * Platform-specific login for BNPL
   */
  static async bnplLogin(req, res, next) {
    try {
      const { error, value } = validateLogin(req.body);
      if (error) {
        error.isJoi = true;
        return next(error);
      }

      logger.info('🛒 BNPL Platform Login attempt:', {
        email: value.email,
        ip: req.ip
      });

      const result = await AuthService.platformLogin(value.email, value.password, 'bnpl', req.ip);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'BNPL login successful',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /auth/platform/pawnshop/login
   * Platform-specific login for Pawnshop
   */
  static async pawnshopLogin(req, res, next) {
    try {
      const { error, value } = validateLogin(req.body);
      if (error) {
        error.isJoi = true;
        return next(error);
      }

      logger.info('💎 Pawnshop Platform Login attempt:', {
        email: value.email,
        ip: req.ip
      });

      const result = await AuthService.platformLogin(value.email, value.password, 'pawnshop', req.ip);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Pawnshop login successful',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
