const express = require('express');
const router = express.Router();
const knex = require('../config/knex');
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
      
      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender'];
      const missingFields = requiredFields.filter(field => !req.body[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
      
      // Generate customer code
      // Get tenant subdomain for customer code prefix
      const tenant = await knex('tenants')
        .where('id', tenantId)
        .first();
      
      const tenantPrefix = tenant?.subdomain?.toUpperCase() || 'CUST';
      
      // Get the count of existing customers for this tenant to generate sequential number
      const customerCount = await knex('customers')
        .where('tenant_id', tenantId)
        .count('id as count')
        .first();
      
      const nextNumber = (parseInt(customerCount?.count || 0) + 1).toString().padStart(4, '0');
      const customerCode = `CUST-${tenantPrefix}-${nextNumber}`;
      
      // Map camelCase to snake_case for database (only non-address fields)
      const customerData = {
        tenant_id: tenantId,
        customer_code: customerCode,
        first_name: req.body.firstName,
        last_name: req.body.lastName,
        date_of_birth: req.body.dateOfBirth,
        gender: req.body.gender,
        email: req.body.email,
        phone: req.body.phone,
        employment_status: req.body.employmentStatus,
        employer_name: req.body.employerName,
        monthly_income: req.body.monthlyIncome,
        source_of_income: req.body.sourceOfIncome,
        id_type: req.body.idType,
        id_number: req.body.idNumber,
        kyc_status: req.body.kycStatus || 'pending',
        credit_score: req.body.creditScore || 650,
        status: req.body.status || 'active'
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

      // Validate email format if provided
      if (req.body.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(req.body.email)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid email format'
          });
        }
      }

      // Map camelCase to snake_case for database (only non-address fields)
      const updateData = {};
      if (req.body.firstName !== undefined) updateData.first_name = req.body.firstName;
      if (req.body.lastName !== undefined) updateData.last_name = req.body.lastName;
      if (req.body.dateOfBirth !== undefined) updateData.date_of_birth = req.body.dateOfBirth;
      if (req.body.gender !== undefined) updateData.gender = req.body.gender;
      if (req.body.email !== undefined) updateData.email = req.body.email;
      if (req.body.phone !== undefined) updateData.phone = req.body.phone;
      if (req.body.employmentStatus !== undefined) updateData.employment_status = req.body.employmentStatus;
      if (req.body.employerName !== undefined) updateData.employer_name = req.body.employerName;
      if (req.body.monthlyIncome !== undefined) updateData.monthly_income = req.body.monthlyIncome;
      if (req.body.sourceOfIncome !== undefined) updateData.source_of_income = req.body.sourceOfIncome;
      if (req.body.idType !== undefined) updateData.id_type = req.body.idType;
      if (req.body.idNumber !== undefined) updateData.id_number = req.body.idNumber;
      if (req.body.kycStatus !== undefined) updateData.kyc_status = req.body.kycStatus;
      if (req.body.creditScore !== undefined) updateData.credit_score = req.body.creditScore;
      if (req.body.status !== undefined) updateData.status = req.body.status;

      const [updatedCustomer] = await knex('customers')
        .where({ id, tenant_id: tenantId })
        .update({
          ...updateData,
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
