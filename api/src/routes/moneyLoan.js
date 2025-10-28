/**
 * Money Loan Routes - SAMPLE IMPLEMENTATION
 * 
 * Demonstrates complete RBAC + Product Access control
 * 
 * Security Layers:
 * 1. Authentication (authenticate middleware)
 * 2. Product Access (checkProductAccess middleware)
 * 3. RBAC Permissions (checkPermission middleware)
 * 4. Business Rules (amount limits, transaction counts)
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/checkPermission');
const { checkProductAccess } = require('../middleware/checkProductAccess');
const knex = require('../config/knex');

// ============================================
// OVERVIEW DASHBOARD
// ============================================

/**
 * GET /api/money-loan/overview
 * View dashboard overview with all metrics
 */
router.get('/overview',
  authenticate,
  checkProductAccess('money_loan'),
  checkPermission('money-loan:overview:view'),
  async (req, res) => {
    try {
      const { tenant_id } = req.user;

      // Get all metrics
      const metrics = await knex.raw(`
        SELECT
          COUNT(*) FILTER (WHERE status IN ('active', 'overdue')) as active_loans,
          COUNT(*) FILTER (WHERE status = 'overdue') as overdue_loans,
          COUNT(*) FILTER (WHERE status = 'defaulted') as defaulted_loans,
          SUM(loan_amount) FILTER (WHERE status IN ('active', 'overdue')) as total_disbursed,
          SUM(outstanding_balance) FILTER (WHERE status IN ('active', 'overdue')) as total_outstanding,
          SUM(total_paid) as total_collected
        FROM money_loan_loans
        WHERE tenant_id = ?
      `, [tenant_id]);

      const data = metrics.rows[0];

      res.json({
        totalLoans: parseInt(data.active_loans) || 0,
        overdueLoa: parseInt(data.overdue_loans) || 0,
        defaultedLoans: parseInt(data.defaulted_loans) || 0,
        totalDisbursed: parseFloat(data.total_disbursed) || 0,
        totalOutstanding: parseFloat(data.total_outstanding) || 0,
        totalCollected: parseFloat(data.total_collected) || 0,
        collectionRate: data.total_disbursed > 0 
          ? ((data.total_collected / data.total_disbursed) * 100).toFixed(2)
          : 0,
        overduePercentage: data.active_loans > 0
          ? ((data.overdue_loans / data.active_loans) * 100).toFixed(2)
          : 0,
        defaultRate: data.active_loans > 0
          ? ((data.defaulted_loans / data.active_loans) * 100).toFixed(2)
          : 0
      });

    } catch (error) {
      console.error('Error fetching overview:', error);
      res.status(500).json({ error: 'Failed to fetch overview' });
    }
  }
);

// ============================================
// CUSTOMERS
// ============================================

/**
 * GET /api/money-loan/customers
 * View all customers
 */
router.get('/customers',
  authenticate,
  checkProductAccess('money_loan'),
  checkPermission('money-loan:customers:read'),
  async (req, res) => {
    try {
      const { tenant_id } = req.user;
      const { page = 1, limit = 20, status, risk_level } = req.query;

      let query = knex('shared_customers')
        .where({ tenant_id, product_type: 'money_loan' })
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset((page - 1) * limit);

      if (status) query = query.where({ status });
      if (risk_level) query = query.where({ risk_level });

      const customers = await query;
      const total = await knex('shared_customers')
        .where({ tenant_id, product_type: 'money_loan' })
        .count('* as count')
        .first();

      res.json({
        data: customers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.count),
          totalPages: Math.ceil(total.count / limit)
        }
      });

    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  }
);

/**
 * GET /api/money-loan/customers/high-risk
 * View high-risk customers
 * NOTE: This MUST come BEFORE /customers/:id to avoid route conflicts
 */
router.get('/customers/high-risk',
  authenticate,
  checkProductAccess('money_loan'),
  checkPermission('money-loan:customers:view-high-risk'),
  async (req, res) => {
    try {
      const { tenant_id } = req.user;

      const customers = await knex('shared_customers')
        .where({
          tenant_id,
          product_type: 'money_loan',
          risk_level: 'high'
        })
        .orWhere('kyc_flags', 'like', '%high_risk%')
        .orderBy('created_at', 'desc');

      res.json({ data: customers });

    } catch (error) {
      console.error('Error fetching high-risk customers:', error);
      res.status(500).json({ error: 'Failed to fetch high-risk customers' });
    }
  }
);

/**
 * POST /api/money-loan/customers
 * Create a new customer
 */
router.post('/customers',
  authenticate,
  checkProductAccess('money_loan'),
  checkPermission('money-loan:customers:create'),
  async (req, res) => {
    try {
      const { tenant_id, id: user_id } = req.user;

      // Create customer
      const [customer] = await knex('shared_customers')
        .insert({
          ...req.body,
          tenant_id,
          product_type: 'money_loan',
          created_by: user_id,
          updated_by: user_id
        })
        .returning('*');

      res.status(201).json({ 
        success: true,
        message: 'Customer created successfully',
        data: customer 
      });

    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to create customer' 
      });
    }
  }
);

/**
 * GET /api/money-loan/customers/:id
 * Get a single customer by ID
 */
router.get('/customers/:id',
  authenticate,
  checkProductAccess('money_loan'),
  checkPermission('money-loan:customers:read'),
  async (req, res) => {
    try {
      const { tenant_id } = req.user;
      const { id } = req.params;

      console.log('🔍 GET /customers/:id - ID:', id, 'Tenant:', tenant_id);

      const customer = await knex('shared_customers')
        .where({
          id,
          tenant_id,
          product_type: 'money_loan'
        })
        .first();

      console.log('🔍 Customer found:', customer ? 'YES' : 'NO');

      if (!customer) {
        return res.status(404).json({ 
          success: false,
          error: 'Customer not found' 
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
        error: 'Failed to fetch customer' 
      });
    }
  }
);

/**
 * PUT /api/money-loan/customers/:id
 * Update a customer
 */
router.put('/customers/:id',
  authenticate,
  checkProductAccess('money_loan'),
  checkPermission('money-loan:customers:update'),
  async (req, res) => {
    try {
      const { tenant_id } = req.user;
      const { id } = req.params;

      // Check if customer exists and belongs to tenant
      const existing = await knex('shared_customers')
        .where({
          id,
          tenant_id,
          product_type: 'money_loan'
        })
        .first();

      if (!existing) {
        return res.status(404).json({ 
          success: false,
          error: 'Customer not found' 
        });
      }

      // Update customer
      const [updated] = await knex('shared_customers')
        .where({ id })
        .update({
          ...req.body,
          updated_at: knex.fn.now()
        })
        .returning('*');

      res.json({ 
        success: true,
        message: 'Customer updated successfully',
        data: updated 
      });

    } catch (error) {
      console.error('Error updating customer:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to update customer' 
      });
    }
  }
);

// ============================================
// LOANS
// ============================================

/**
 * GET /api/money-loan/loans
 * View all loans
 */
router.get('/loans',
  authenticate,
  checkProductAccess('money_loan'),
  checkPermission('money-loan:loans:read'),
  async (req, res) => {
    try {
      const { tenant_id } = req.user;
      const { page = 1, limit = 20, status } = req.query;

      let query = knex('money_loan_loans as l')
        .leftJoin('shared_customers as c', 'l.customer_id', 'c.id')
        .where('l.tenant_id', tenant_id)
        .select(
          'l.*',
          'c.first_name',
          'c.last_name',
          'c.email',
          'c.phone'
        )
        .orderBy('l.created_at', 'desc')
        .limit(limit)
        .offset((page - 1) * limit);

      if (status) query = query.where('l.status', status);

      const loans = await query;
      const total = await knex('money_loan_loans')
        .where({ tenant_id })
        .count('* as count')
        .first();

      res.json({
        data: loans,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.count),
          totalPages: Math.ceil(total.count / limit)
        }
      });

    } catch (error) {
      console.error('Error fetching loans:', error);
      res.status(500).json({ error: 'Failed to fetch loans' });
    }
  }
);

/**
 * POST /api/money-loan/loans/:id/approve
 * Approve a loan application
 * 
 * FULL SECURITY IMPLEMENTATION:
 * - Authentication required
 * - Product access required
 * - RBAC permission required
 * - Amount limit check
 * - Audit logging
 */
router.post('/loans/:id/approve',
  authenticate,
  checkProductAccess('money_loan', 'approve', { checkAmount: true }),
  checkPermission('money-loan:loans:approve'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { approved, notes } = req.body;
      const { tenant_id, id: user_id } = req.user;
      const productAccess = req.productAccess;

      // Get loan details
      const loan = await knex('money_loan_loans')
        .where({ id, tenant_id })
        .first();

      if (!loan) {
        return res.status(404).json({ error: 'Loan not found' });
      }

      // Check if loan is in pending status
      if (loan.status !== 'pending') {
        return res.status(400).json({
          error: 'Invalid Status',
          message: 'Only pending loans can be approved',
          currentStatus: loan.status
        });
      }

      // Check approval amount limit
      if (loan.loan_amount > productAccess.max_approval_amount) {
        return res.status(403).json({
          error: 'Amount Exceeds Your Limit',
          message: 'This loan requires higher approval authority',
          loanAmount: loan.loan_amount,
          yourLimit: productAccess.max_approval_amount,
          action: 'Escalate to supervisor'
        });
      }

      // Update loan status
      const newStatus = approved ? 'approved' : 'rejected';
      await knex('money_loan_loans')
        .where({ id })
        .update({
          status: newStatus,
          approved_by: user_id,
          approved_at: knex.fn.now(),
          approval_notes: notes,
          updated_at: knex.fn.now()
        });

      // Log audit trail
      await knex('audit_logs').insert({
        tenant_id,
        user_id,
        action: approved ? 'approve_loan' : 'reject_loan',
        resource_type: 'money_loan_loan',
        resource_id: id,
        old_values: JSON.stringify({ status: loan.status }),
        new_values: JSON.stringify({
          status: newStatus,
          amount: loan.loan_amount,
          approved_by: user_id,
          notes
        }),
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success'
      });

      res.json({
        success: true,
        message: `Loan ${approved ? 'approved' : 'rejected'} successfully`,
        loan: {
          id: loan.id,
          status: newStatus,
          amount: loan.loan_amount,
          approvedBy: user_id
        }
      });

    } catch (error) {
      console.error('Error approving loan:', error);
      res.status(500).json({ error: 'Failed to approve loan' });
    }
  }
);

/**
 * POST /api/money-loan/loans/:id/disburse
 * Disburse approved loan funds
 */
router.post('/loans/:id/disburse',
  authenticate,
  checkProductAccess('money_loan', 'disburse'),
  checkPermission('money-loan:loans:disburse'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { disbursement_method, account_details } = req.body;
      const { tenant_id, id: user_id } = req.user;

      const loan = await knex('money_loan_loans')
        .where({ id, tenant_id })
        .first();

      if (!loan) {
        return res.status(404).json({ error: 'Loan not found' });
      }

      if (loan.status !== 'approved') {
        return res.status(400).json({
          error: 'Invalid Status',
          message: 'Only approved loans can be disbursed',
          currentStatus: loan.status
        });
      }

      // Update loan to disbursed
      await knex('money_loan_loans')
        .where({ id })
        .update({
          status: 'active',
          disbursed_by: user_id,
          disbursed_at: knex.fn.now(),
          disbursement_method,
          disbursement_account: account_details,
          updated_at: knex.fn.now()
        });

      // Create disbursement record
      await knex('money_loan_disbursements').insert({
        tenant_id,
        loan_id: id,
        amount: loan.loan_amount,
        method: disbursement_method,
        account_details,
        disbursed_by: user_id,
        disbursed_at: knex.fn.now(),
        status: 'completed'
      });

      // Audit log
      await knex('audit_logs').insert({
        tenant_id,
        user_id,
        action: 'disburse_loan',
        resource_type: 'money_loan_loan',
        resource_id: id,
        new_values: JSON.stringify({
          amount: loan.loan_amount,
          method: disbursement_method
        }),
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success'
      });

      res.json({
        success: true,
        message: 'Loan disbursed successfully',
        loan: { id, amount: loan.loan_amount, status: 'active' }
      });

    } catch (error) {
      console.error('Error disbursing loan:', error);
      res.status(500).json({ error: 'Failed to disburse loan' });
    }
  }
);

// ============================================
// PAYMENTS
// ============================================

/**
 * GET /api/money-loan/payments/today
 * View today's collections
 */
router.get('/payments/today',
  authenticate,
  checkProductAccess('money_loan'),
  checkPermission('money-loan:payments:view-today'),
  async (req, res) => {
    try {
      const { tenant_id } = req.user;
      const today = new Date().toISOString().split('T')[0];

      const payments = await knex('money_loan_payments as p')
        .leftJoin('money_loan_loans as l', 'p.loan_id', 'l.id')
        .leftJoin('shared_customers as c', 'l.customer_id', 'c.id')
        .where('p.tenant_id', tenant_id)
        .whereBetween('p.payment_date', [`${today} 00:00:00`, `${today} 23:59:59`])
        .select(
          'p.*',
          'l.loan_number',
          'c.first_name',
          'c.last_name'
        )
        .orderBy('p.payment_date', 'desc');

      const total = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

      res.json({
        data: payments,
        summary: {
          totalCollections: total,
          count: payments.length,
          date: today
        }
      });

    } catch (error) {
      console.error('Error fetching today collections:', error);
      res.status(500).json({ error: 'Failed to fetch collections' });
    }
  }
);

// ============================================
// SETTINGS
// ============================================

/**
 * GET /api/money-loan/settings
 * View Money Loan settings
 */
router.get('/settings',
  authenticate,
  checkProductAccess('money_loan'),
  checkPermission('money-loan:settings:read'),
  async (req, res) => {
    try {
      const { tenant_id } = req.user;

      const settings = await knex('money_loan_settings')
        .where({ tenant_id })
        .first();

      res.json({ data: settings });

    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }
);

module.exports = router;
