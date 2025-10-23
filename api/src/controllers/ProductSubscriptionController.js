/**
 * Product Subscription Controller
 * Handles HTTP requests for product subscription management
 */

const ProductSubscriptionService = require('../services/ProductSubscriptionService');
const CONSTANTS = require('../config/constants');

class ProductSubscriptionController {
  /**
   * GET /product-subscriptions/tenant/:tenantId
   * Get all product subscriptions for a tenant
   */
  static async getTenantProductSubscriptions(req, res, next) {
    try {
      const { tenantId } = req.params;

      const subscriptions = await ProductSubscriptionService.getTenantProductSubscriptions(tenantId);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: subscriptions
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /product-subscriptions/products
   * Get available products
   */
  static async getAvailableProducts(req, res, next) {
    try {
      const products = await ProductSubscriptionService.getAvailableProducts();

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        data: products
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /product-subscriptions/tenant/:tenantId/subscribe
   * Subscribe tenant to a product
   */
  static async subscribeToProduct(req, res, next) {
    try {
      const { tenantId } = req.params;
      const { product_type, subscription_plan_id, price, billing_cycle, expires_at } = req.body;

      if (!product_type) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Product type is required'
        });
      }

      const subscription = await ProductSubscriptionService.subscribeToProduct(
        tenantId,
        product_type,
        { subscription_plan_id, price, billing_cycle, expires_at }
      );

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: 'Successfully subscribed to product',
        data: subscription
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /product-subscriptions/tenant/:tenantId/unsubscribe/:productType
   * Unsubscribe tenant from a product
   */
  static async unsubscribeFromProduct(req, res, next) {
    try {
      const { tenantId, productType } = req.params;

      const subscription = await ProductSubscriptionService.unsubscribeFromProduct(tenantId, productType);

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: 'Successfully unsubscribed from product',
        data: subscription
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /product-subscriptions/tenant/:tenantId/product/:productType
   * Update product subscription
   */
  static async updateProductSubscription(req, res, next) {
    try {
      const { tenantId, productType } = req.params;
      const updateData = req.body;

      const subscription = await ProductSubscriptionService.updateProductSubscription(
        tenantId,
        productType,
        updateData
      );

      res.status(CONSTANTS.HTTP_STATUS.OK).json({
        success: true,
        message: 'Product subscription updated successfully',
        data: subscription
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ProductSubscriptionController;
