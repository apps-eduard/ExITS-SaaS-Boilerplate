/**
 * User Controller
 * Handles user management operations
 */

const UserService = require('../services/UserService');
const { validateCreateUser, validatePagination } = require('../utils/validators');
const logger = require('../utils/logger');
const { HTTP_STATUS } = require('../config/constants');

class UserController {
  /**
   * POST /users
   * Create a new user
   */
  static async createUser(req, res, next) {
    try {
      const { error, value } = validateCreateUser(req.body);
      if (error) {
        error.isJoi = true;
        return next(error);
      }

      const result = await UserService.createUser(value, req.userId, req.tenantId);

      res.status(HTTP_STATUS.CREATED).json({
        message: 'User created successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /users/:id
   * Get user by ID
   */
  static async getUser(req, res, next) {
    try {
      const { id } = req.params;

      const result = await UserService.getUserById(id, req.tenantId);

      res.status(HTTP_STATUS.OK).json({
        message: 'User retrieved successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /users
   * List all users with pagination
   */
  static async listUsers(req, res, next) {
    try {
      const { page = 1, limit = 20, search = '' } = req.query;

      const pagination = validatePagination(page, limit);

      const result = await UserService.listUsers(req.tenantId, pagination.page, pagination.limit, search);

      res.status(HTTP_STATUS.OK).json({
        message: 'Users retrieved successfully',
        data: result.users,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /users/:id
   * Update user
   */
  static async updateUser(req, res, next) {
    try {
      const { id } = req.params;

      const result = await UserService.updateUser(id, req.body, req.userId, req.tenantId);

      res.status(HTTP_STATUS.OK).json({
        message: 'User updated successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /users/:id
   * Delete user (soft delete)
   */
  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      const result = await UserService.deleteUser(id, req.userId, req.tenantId);

      res.status(HTTP_STATUS.OK).json({
        message: 'User deleted successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /users/:id/roles/:roleId
   * Assign role to user
   */
  static async assignRole(req, res, next) {
    try {
      const { id, roleId } = req.params;

      const result = await UserService.assignRole(id, roleId, req.userId, req.tenantId);

      res.status(HTTP_STATUS.OK).json({
        message: 'Role assigned successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /users/:id/roles/:roleId
   * Remove role from user
   */
  static async removeRole(req, res, next) {
    try {
      const { id, roleId } = req.params;

      const result = await UserService.removeRole(id, roleId, req.userId, req.tenantId);

      res.status(HTTP_STATUS.OK).json({
        message: 'Role removed successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /users/:id/permissions
   * Get user permissions
   */
  static async getUserPermissions(req, res, next) {
    try {
      const { id } = req.params;

      const result = await UserService.getUserPermissions(id);

      res.status(HTTP_STATUS.OK).json({
        message: 'Permissions retrieved successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /me
   * Get current authenticated user
   */
  static async getCurrentUser(req, res, next) {
    try {
      const result = await UserService.getUserById(req.userId, req.tenantId);

      res.status(HTTP_STATUS.OK).json({
        message: 'Current user retrieved successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = UserController;
