/**
 * Tenant Controller
 * Handles tenant management
 */

const TenantService = require('../services/TenantService');
const { validateCreateTenant, validatePagination } = require('../utils/validators');
const logger = require('../utils/logger');
const CONSTANTS = require('../config/constants');

class TenantController {
  /**
   * POST /tenants
   * Create a new tenant (system admin only)
   */
  static async createTenant(req, res, next) {
    try {
      const { error, value } = validateCreateTenant(req.body);
      if (error) {
        error.isJoi = true;
        return next(error);
      }

      const result = await TenantService.createTenant(value, req.userId);

      res.status(CONSTANTS.HTTP_STATUS.CREATED).json({
        message: 'Tenant created successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /tenants/:id
   * Get tenant by ID
   */
  static async getTenant(req, res, next) {
    try {
      const { id } = req.params;

      const result = await TenantService.getTenantById(id);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Tenant retrieved successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /tenants/by-subdomain/:subdomain
   * Get tenant by subdomain
   */
  static async getTenantBySubdomain(req, res, next) {
    try {
      const { subdomain } = req.params;

      const result = await TenantService.getTenantBySubdomain(subdomain);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Tenant retrieved successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /tenants
   * List all tenants
   */
  static async listTenants(req, res, next) {
    try {
      const { page = 1, limit = 20, status = null, plan = null } = req.query;

      const pagination = validatePagination(page, limit);

      const result = await TenantService.listTenants(pagination.page, pagination.limit, status, plan);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Tenants retrieved successfully',
        data: result.tenants,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /tenants/:id
   * Update tenant
   */
  static async updateTenant(req, res, next) {
    try {
      const { id } = req.params;

      const result = await TenantService.updateTenant(id, req.body, req.userId);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Tenant updated successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /tenants/:id/suspend
   * Suspend tenant
   */
  static async suspendTenant(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const result = await TenantService.suspendTenant(id, reason, req.userId);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Tenant suspended successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /tenants/:id/activate
   * Activate a tenant
   */
  static async activateTenant(req, res, next) {
    try {
      const { id } = req.params;

      const result = await TenantService.activateTenant(id, req.userId);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Tenant activated successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /tenants/:id
   * Delete tenant (soft delete)
   */
  static async deleteTenant(req, res, next) {
    try {
      const { id } = req.params;

      const result = await TenantService.deleteTenant(id, req.userId);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Tenant deleted successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /tenants/:id/restore
   * Restore tenant (from soft delete)
   */
  static async restoreTenant(req, res, next) {
    try {
      const { id } = req.params;

      const result = await TenantService.restoreTenant(id, req.userId);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Tenant restored successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /tenants/:id/stats
   * Get tenant statistics
   */
  static async getTenantStats(req, res, next) {
    try {
      const { id } = req.params;

      const result = await TenantService.getTenantStats(id);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'Tenant statistics retrieved successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /tenants/:id/user-limit
   * Check user limit for tenant
   */
  static async checkUserLimit(req, res, next) {
    try {
      const { id } = req.params;

      const result = await TenantService.validateUserLimit(id);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        message: 'User limit validated successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = TenantController;
