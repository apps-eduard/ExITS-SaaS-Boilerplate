const CustomerService = require('../services/CustomerService');
const CONSTANTS = require('../../../../config/constants');

class CustomerController {
  /**
   * POST /api/money-loan/customers
   * Create new customer
   */
  static async createCustomer(req, res, next) {
    try {
      const { tenantId } = req;
      const customer = await CustomerService.createCustomer(tenantId, req.body);

      res.status(CONSTANTS.HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Customer created successfully',
        data: customer
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/money-loan/customers
   * List all customers
   */
  static async listCustomers(req, res, next) {
    try {
      const { tenantId } = req;
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        status: req.query.status,
        kycStatus: req.query.kycStatus,
        riskLevel: req.query.riskLevel,
        search: req.query.search
      };

      const result = await CustomerService.listCustomers(tenantId, filters);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: 'Customers retrieved successfully',
        data: result.customers,
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/money-loan/customers/:id
   * Get customer by ID
   */
  static async getCustomer(req, res, next) {
    try {
      const { tenantId } = req;
      const { id } = req.params;

      const customer = await CustomerService.getCustomerById(tenantId, parseInt(id));

      if (!customer) {
        return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Customer not found'
        });
      }

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: customer
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/money-loan/customers/:id
   * Update customer
   */
  static async updateCustomer(req, res, next) {
    try {
      const { tenantId } = req;
      const { id } = req.params;

      const customer = await CustomerService.updateCustomer(tenantId, parseInt(id), req.body);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: 'Customer updated successfully',
        data: customer
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/money-loan/customers/:id/stats
   * Get customer statistics
   */
  static async getCustomerStats(req, res, next) {
    try {
      const { tenantId } = req;
      const { id } = req.params;

      const stats = await CustomerService.getCustomerStats(tenantId, parseInt(id));

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: stats
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CustomerController;
