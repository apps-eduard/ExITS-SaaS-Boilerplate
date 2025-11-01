/**
 * Billing Controller
 * Handles subscription plans, tenant subscriptions, and invoices
 */

const BillingService = require('../services/BillingService');
const CONSTANTS = require('../config/constants');

class BillingController {
  /**
   * GET /api/billing/plans
   * Get all subscription plans
   */
  static async getPlans(req, res, next) {
    try {
      const plans = await BillingService.getPlans();
      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: plans
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/billing/plans/:id
   * Get plan by ID
   */
  static async getPlanById(req, res, next) {
    try {
      const { id } = req.params;
      const plan = await BillingService.getPlanById(id);
      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: plan
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/billing/plans
   * Create new subscription plan
   */
  static async createPlan(req, res, next) {
    try {
      const planData = req.body;
      const plan = await BillingService.createPlan(planData);
      res.status(CONSTANTS.HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Plan created successfully',
        data: plan
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/billing/plans/:id
   * Update subscription plan
   */
  static async updatePlan(req, res, next) {
    try {
      const { id } = req.params;
      const planData = req.body;
      const plan = await BillingService.updatePlan(id, planData);
      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: 'Plan updated successfully',
        data: plan
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/billing/plans/:id
   * Delete (archive) subscription plan
   */
  static async deletePlan(req, res, next) {
    try {
      const { id } = req.params;
      await BillingService.deletePlan(id);
      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: 'Plan deleted successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/billing/subscriptions
   * Get all tenant subscriptions
   */
  static async getSubscriptions(req, res, next) {
    try {
      const subscriptions = await BillingService.getSubscriptions();
      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: subscriptions
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/billing/subscriptions/tenant/:tenantId
   * Get subscription for specific tenant
   */
  static async getSubscriptionByTenant(req, res, next) {
    try {
      const { tenantId } = req.params;
      const subscription = await BillingService.getSubscriptionByTenant(tenantId);
      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: subscription
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/billing/subscriptions
   * Create new subscription
   */
  static async createSubscription(req, res, next) {
    try {
      const subscriptionData = req.body;
      const subscription = await BillingService.createSubscription(subscriptionData);
      res.status(CONSTANTS.HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Subscription created successfully',
        data: subscription
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/billing/subscriptions/:id
   * Update subscription
   */
  static async updateSubscription(req, res, next) {
    try {
      const { id } = req.params;
      const subscriptionData = req.body;
      const subscription = await BillingService.updateSubscription(id, subscriptionData);
      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: 'Subscription updated successfully',
        data: subscription
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/billing/subscriptions/:id/cancel
   * Cancel subscription
   */
  static async cancelSubscription(req, res, next) {
    try {
      const { id } = req.params;
      const subscription = await BillingService.cancelSubscription(id);
      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: 'Subscription cancelled successfully',
        data: subscription
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/billing/invoices
   * Get all invoices
   */
  static async getInvoices(req, res, next) {
    try {
      const { tenantId, status } = req.query;
      const invoices = await BillingService.getInvoices({ tenantId, status });
      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: invoices
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/billing/invoices/:id
   * Get invoice by ID
   */
  static async getInvoiceById(req, res, next) {
    try {
      const { id } = req.params;
      const invoice = await BillingService.getInvoiceById(id);
      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: invoice
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/billing/invoices
   * Create new invoice
   */
  static async createInvoice(req, res, next) {
    try {
      const invoiceData = req.body;
      const invoice = await BillingService.createInvoice(invoiceData);
      res.status(CONSTANTS.HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Invoice created successfully',
        data: invoice
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/billing/invoices/:id/pay
   * Mark invoice as paid
   */
  static async payInvoice(req, res, next) {
    try {
      const { id } = req.params;
      const paymentData = req.body;
      const invoice = await BillingService.payInvoice(id, paymentData);
      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: 'Invoice marked as paid',
        data: invoice
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/billing/stats
   * Get billing statistics
   */
  static async getStats(req, res, next) {
    try {
      const stats = await BillingService.getStats();
      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: stats
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/tenants/current/billing/overview
   * Get billing overview for current tenant
   */
  static async getBillingOverview(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const overview = await BillingService.getBillingOverview(tenantId);
      res.status(CONSTANTS.HTTP_STATUS.OK).json(overview);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/tenants/current/billing/info
   * Get billing information for current tenant
   */
  static async getBillingInfo(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const info = await BillingService.getBillingInfo(tenantId);
      res.status(CONSTANTS.HTTP_STATUS.OK).json(info);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/tenants/current/billing/info
   * Update billing information
   */
  static async updateBillingInfo(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const data = req.body;
      const result = await BillingService.updateBillingInfo(tenantId, data);
      res.status(CONSTANTS.HTTP_STATUS.OK).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/tenants/current/billing/auto-renewal
   * Update auto-renewal setting
   */
  static async updateAutoRenewal(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { enabled } = req.body;
      const result = await BillingService.updateAutoRenewal(tenantId, enabled);
      res.status(CONSTANTS.HTTP_STATUS.OK).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/payment-methods
   * Get all available payment methods
   */
  static async getPaymentMethods(req, res, next) {
    try {
      const methods = await BillingService.getPaymentMethods();
      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: methods
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/tenants/current/payment-method
   * Get tenant's current payment method
   */
  static async getTenantPaymentMethod(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const method = await BillingService.getTenantPaymentMethod(tenantId);
      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: method
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/tenants/current/payment-method
   * Update tenant's payment method
   */
  static async updateTenantPaymentMethod(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { paymentMethodId, details } = req.body;
      const result = await BillingService.updateTenantPaymentMethod(tenantId, paymentMethodId, details);
      res.status(CONSTANTS.HTTP_STATUS.OK).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = BillingController;
