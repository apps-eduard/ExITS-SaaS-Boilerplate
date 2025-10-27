const express = require('express');
const router = express.Router();
const knex = require('../config/database');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

/**
 * GET /api/customers
 * Get all customers for the tenant
 */
router.get('/',
  authMiddleware,
  rbacMiddleware(['tenant-customers'], ['read']),
  async (req, res) => {
    try {
      const { tenantId } = req.user;

      if (!tenantId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Tenant context required.'
        });
      }

      // Get all customers for this tenant
      const customers = await knex('customers')
        .where('tenant_id', tenantId)
        .orderBy('created_at', 'desc');

      res.json({
        success: true,
        data: customers,
        meta: {
          total: customers.length
        }
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customers',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/customers/:id
 * Get a specific customer by ID
 */
router.get('/:id',
  authMiddleware,
  rbacMiddleware(['tenant-customers'], ['read']),
  async (req, res) => {
    try {
      const { tenantId } = req.user;
      const { id } = req.params;

      const customer = await knex('customers')
        .where({ id, tenant_id: tenantId })
        .first();

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      res.json({
        success: true,
        data: customer
      });
    } catch (error) {
      console.error('Error fetching customer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer',
        error: error.message
      });
    }
  }
);

/**
 * POST /api/customers
 * Create a new customer
 */
router.post('/',
  authMiddleware,
  rbacMiddleware(['tenant-customers'], ['create']),
  async (req, res) => {
    try {
      const { tenantId } = req.user;
      const customerData = {
        ...req.body,
        tenant_id: tenantId
      };

      const [customer] = await knex('customers')
        .insert(customerData)
        .returning('*');

      res.status(201).json({
        success: true,
        data: customer,
        message: 'Customer created successfully'
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create customer',
        error: error.message
      });
    }
  }
);

/**
 * PUT /api/customers/:id
 * Update a customer
 */
router.put('/:id',
  authMiddleware,
  rbacMiddleware(['tenant-customers'], ['update']),
  async (req, res) => {
    try {
      const { tenantId } = req.user;
      const { id } = req.params;

      // Check if customer exists and belongs to tenant
      const existingCustomer = await knex('customers')
        .where({ id, tenant_id: tenantId })
        .first();

      if (!existingCustomer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      const [updatedCustomer] = await knex('customers')
        .where({ id, tenant_id: tenantId })
        .update({
          ...req.body,
          updated_at: knex.fn.now()
        })
        .returning('*');

      res.json({
        success: true,
        data: updatedCustomer,
        message: 'Customer updated successfully'
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update customer',
        error: error.message
      });
    }
  }
);

/**
 * DELETE /api/customers/:id
 * Delete a customer (soft delete - set status to inactive)
 */
router.delete('/:id',
  authMiddleware,
  rbacMiddleware(['tenant-customers'], ['delete']),
  async (req, res) => {
    try {
      const { tenantId } = req.user;
      const { id } = req.params;

      // Check if customer exists and belongs to tenant
      const existingCustomer = await knex('customers')
        .where({ id, tenant_id: tenantId })
        .first();

      if (!existingCustomer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      // Soft delete - set status to inactive
      await knex('customers')
        .where({ id, tenant_id: tenantId })
        .update({
          status: 'inactive',
          updated_at: knex.fn.now()
        });

      res.json({
        success: true,
        message: 'Customer deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete customer',
        error: error.message
      });
    }
  }
);

module.exports = router;
