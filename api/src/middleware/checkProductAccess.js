/**
 * Product Access Middleware
 * 
 * Validates user access to specific products (Money Loan, BNPL, Pawnshop)
 * Combines employee_product_access with RBAC permissions for layered security
 */

const knex = require('../config/knex');

/**
 * Check if user has access to a specific product
 * 
 * @param {string} productType - 'money_loan', 'bnpl', or 'pawnshop'
 * @param {string} action - The action being performed (e.g., 'approve', 'disburse')
 * @param {object} options - Additional options like amount limits
 */
function checkProductAccess(productType, action = null, options = {}) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      // Step 1: Check if tenant has this product enabled
      const tenant = await knex('tenants')
        .where({ id: req.user.tenant_id })
        .first();

      const productEnabledField = `${productType}_enabled`;
      if (!tenant || !tenant[productEnabledField]) {
        return res.status(403).json({
          error: 'Product Not Available',
          message: `${productType} is not enabled for your organization`,
          productType
        });
      }

      // Step 2: Get employee profile
      const employee = await knex('employee_profiles')
        .where({
          user_id: userId,
          tenant_id: req.user.tenant_id,
          employment_status: 'active'
        })
        .whereNull('deleted_at')
        .first();

      if (!employee) {
        return res.status(403).json({
          error: 'No Employee Profile',
          message: 'You do not have an employee profile to access this product',
          hint: 'Contact your administrator to set up your employee profile'
        });
      }

      // Step 3: Check product access
      const productAccess = await knex('employee_product_access')
        .where({
          employee_id: employee.id,
          user_id: userId,
          product_type: productType,
          status: 'active'
        })
        .whereNull('deleted_at')
        .first();

      if (!productAccess) {
        return res.status(403).json({
          error: 'No Product Access',
          message: `You do not have access to ${productType}`,
          productType,
          hint: 'Contact your administrator to request access'
        });
      }

      // Step 4: Check action-specific permissions
      if (action) {
        const actionChecks = {
          approve: {
            field: 'can_approve_loans',
            message: 'You do not have permission to approve loans'
          },
          disburse: {
            field: 'can_disburse_funds',
            message: 'You do not have permission to disburse funds'
          },
          'view-reports': {
            field: 'can_view_reports',
            message: 'You do not have permission to view reports'
          },
          'modify-interest': {
            field: 'can_modify_interest',
            message: 'You do not have permission to modify interest rates'
          },
          'waive-penalties': {
            field: 'can_waive_penalties',
            message: 'You do not have permission to waive penalties'
          }
        };

        const check = actionChecks[action];
        if (check && !productAccess[check.field]) {
          return res.status(403).json({
            error: 'Insufficient Permissions',
            message: check.message,
            action,
            productType
          });
        }
      }

      // Step 5: Check amount limits (if applicable)
      if (options.checkAmount && req.body.amount) {
        const amount = parseFloat(req.body.amount);

        // Check approval limit
        if (action === 'approve' && productAccess.max_approval_amount) {
          if (amount > productAccess.max_approval_amount) {
            return res.status(403).json({
              error: 'Amount Exceeds Limit',
              message: 'Loan amount exceeds your approval limit',
              requestedAmount: amount,
              yourLimit: productAccess.max_approval_amount,
              action: 'escalate'
            });
          }
        }

        // Check daily transaction limit
        if (productAccess.daily_transaction_limit) {
          const today = new Date().toISOString().split('T')[0];
          const dailyTotal = await knex('audit_logs')
            .where({
              user_id: userId,
              resource_type: `${productType}_transaction`,
              status: 'success'
            })
            .whereBetween('created_at', [
              `${today} 00:00:00`,
              `${today} 23:59:59`
            ])
            .sum('new_values->amount as total')
            .first();

          const currentDailyTotal = parseFloat(dailyTotal?.total || 0);
          if (currentDailyTotal + amount > productAccess.daily_transaction_limit) {
            return res.status(403).json({
              error: 'Daily Limit Exceeded',
              message: 'This transaction would exceed your daily limit',
              dailyLimit: productAccess.daily_transaction_limit,
              currentTotal: currentDailyTotal,
              requestedAmount: amount,
              remaining: productAccess.daily_transaction_limit - currentDailyTotal
            });
          }
        }

        // Check monthly transaction limit
        if (productAccess.monthly_transaction_limit) {
          const now = new Date();
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

          const monthlyTotal = await knex('audit_logs')
            .where({
              user_id: userId,
              resource_type: `${productType}_transaction`,
              status: 'success'
            })
            .whereBetween('created_at', [firstDay, lastDay])
            .sum('new_values->amount as total')
            .first();

          const currentMonthlyTotal = parseFloat(monthlyTotal?.total || 0);
          if (currentMonthlyTotal + amount > productAccess.monthly_transaction_limit) {
            return res.status(403).json({
              error: 'Monthly Limit Exceeded',
              message: 'This transaction would exceed your monthly limit',
              monthlyLimit: productAccess.monthly_transaction_limit,
              currentTotal: currentMonthlyTotal,
              requestedAmount: amount,
              remaining: productAccess.monthly_transaction_limit - currentMonthlyTotal
            });
          }
        }
      }

      // Step 6: Attach product access data to request
      req.productAccess = productAccess;
      req.employee = employee;

      // Success - proceed to next middleware
      next();

    } catch (error) {
      console.error('❌ Product access check error:', error);
      return res.status(500).json({
        error: 'Access Check Failed',
        message: 'Unable to verify product access',
        details: error.message
      });
    }
  };
}

/**
 * Get user's product access summary
 */
async function getUserProductAccess(userId, tenantId) {
  try {
    const employee = await knex('employee_profiles')
      .where({
        user_id: userId,
        tenant_id: tenantId,
        employment_status: 'active'
      })
      .whereNull('deleted_at')
      .first();

    if (!employee) {
      return { hasAccess: false, products: [] };
    }

    const productAccess = await knex('employee_product_access')
      .where({
        employee_id: employee.id,
        user_id: userId,
        status: 'active'
      })
      .whereNull('deleted_at')
      .select('*');

    return {
      hasAccess: productAccess.length > 0,
      employee,
      products: productAccess.map(pa => ({
        productType: pa.product_type,
        accessLevel: pa.access_level,
        isPrimary: pa.is_primary,
        permissions: {
          canApproveLoan: pa.can_approve_loans,
          canDisburseFunds: pa.can_disburse_funds,
          canViewReports: pa.can_view_reports,
          canModifyInterest: pa.can_modify_interest,
          canWaivePenalties: pa.can_waive_penalties
        },
        limits: {
          maxApprovalAmount: pa.max_approval_amount,
          dailyTransactionLimit: pa.daily_transaction_limit,
          monthlyTransactionLimit: pa.monthly_transaction_limit,
          maxDailyTransactions: pa.max_daily_transactions
        },
        assignedBy: pa.assigned_by,
        assignedDate: pa.assigned_date
      }))
    };

  } catch (error) {
    console.error('Error fetching product access:', error);
    throw error;
  }
}

module.exports = {
  checkProductAccess,
  getUserProductAccess
};
