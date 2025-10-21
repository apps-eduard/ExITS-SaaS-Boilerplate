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

      const result = await AuthService.login(value.email, value.password, req.ip);

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
}

module.exports = AuthController;
