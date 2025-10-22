/**
 * Role Controller
 * Handles role management and permission assignment
 */

const RoleService = require('../services/RoleService');
const { validateCreateRole, validatePagination } = require('../utils/validators');
const logger = require('../utils/logger');
const { CONSTANTS } = require('../config/constants');

class RoleController {
  /**
   * POST /roles
   * Create a new role
   */
  static async createRole(req, res, next) {
    try {
      const { error, value } = validateCreateRole(req.body);
      if (error) {
        error.isJoi = true;
        return next(error);
      }

      const result = await RoleService.createRole(value, req.userId, req.tenantId);

      res.status(CONSTANTS.HTTP_STATUS.CREATED).json({
        message: 'Role created successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /roles/:id
   * Get role by ID with permissions
   */
  static async getRole(req, res, next) {
    try {
      const { id } = req.params;

      const result = await RoleService.getRoleById(id, req.tenantId);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: 'Role retrieved successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /roles
   * List all roles with pagination
   */
  static async listRoles(req, res, next) {
    try {
      const { page = 1, limit = 20, space = null } = req.query;

      const { error, value } = validatePagination({ page: parseInt(page), limit: parseInt(limit) });
      if (error) {
        error.isJoi = true;
        return next(error);
      }

      const result = await RoleService.listRoles(req.tenantId, value.page, value.limit, space);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Roles retrieved successfully',
        data: result.roles,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /roles/:id
   * Update role
   */
  static async updateRole(req, res, next) {
    try {
      const { id } = req.params;

      const result = await RoleService.updateRole(id, req.body, req.userId, req.tenantId);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Role updated successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /roles/:id
   * Delete role
   */
  static async deleteRole(req, res, next) {
    try {
      const { id } = req.params;

      const result = await RoleService.deleteRole(id, req.userId, req.tenantId);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Role deleted successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /roles/:id/permissions
   * Grant permission to role (standard RBAC)
   */
  static async grantPermission(req, res, next) {
    try {
      const { id } = req.params;
      const { permissionKey } = req.body;

      if (!permissionKey) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Permission key is required (e.g., users:create)',
        });
      }

      const result = await RoleService.grantPermission(id, permissionKey, req.userId, req.tenantId);

      res.status(CONSTANTS.HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Permission granted successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /roles/:id/permissions/bulk
   * Bulk assign permissions to role (replaces existing) - Standard RBAC
   */
  static async bulkAssignPermissions(req, res, next) {
    try {
      const { id } = req.params;
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          error: 'Permissions must be an array of {permissionKey} objects',
        });
      }

      const result = await RoleService.bulkAssignPermissions(id, permissions, req.userId, req.tenantId);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: `${result.count} permissions assigned successfully`,
        count: result.count,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /roles/:id/permissions/:permissionKey
   * Revoke permission from role (standard RBAC)
   */
  static async revokePermission(req, res, next) {
    try {
      const { id, permissionKey } = req.params;

      const result = await RoleService.revokePermission(id, permissionKey, req.userId, req.tenantId);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: 'Permission revoked successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /roles/permissions
   * Get all available permissions
   */
  static async getAllPermissions(req, res, next) {
    try {
      const { space } = req.query;

      const result = await RoleService.getAllPermissions(space);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: 'Permissions retrieved successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /roles/:id/permissions
   * Get role permissions with inheritance
   */
  static async getRolePermissions(req, res, next) {
    try {
      const { id } = req.params;

      const result = await RoleService.getRolePermissionsWithInheritance(id);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Permissions retrieved successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /roles/:id/permission-matrix
   * Get permission matrix for role
   */
  static async getPermissionMatrix(req, res, next) {
    try {
      const { id } = req.params;

      const result = await PermissionService.getRolePermissionMatrix(id, req.tenantId);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Permission matrix retrieved successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = RoleController;
