const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * PaymentHistoryController
 * Handles invoice and payment history operations for tenants
 */

/**
 * Get all invoices/payments for current tenant
 */
async function getTenantInvoices(req, res) {
  try {
    const tenantId = req.user.tenantId;
    const { status, year, limit = 100, offset = 0 } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        error: 'Tenant ID required',
        code: 'MISSING_TENANT_ID',
      });
    }

    let query = `
      SELECT 
        ph.id,
        ph.transaction_id as "invoiceNumber",
        ph.amount,
        ph.currency,
        ph.status,
        ph.description,
        ph.transaction_type as "transactionType",
        ph.plan_name as "planName",
        ph.platform_type as "platformType",
        ph.processed_at as "processedAt",
        ph.created_at as "date",
        ph.provider,
        ph.failure_reason as "failureReason",
        sp.billing_cycle as "billingCycle",
        u.email as "paidBy"
      FROM payment_history ph
      LEFT JOIN subscription_plans sp ON ph.subscription_plan_id = sp.id
      LEFT JOIN users u ON ph.user_id = u.id
      WHERE ph.tenant_id = $1
    `;

    const params = [tenantId];
    let paramIndex = 2;

    // Filter by status
    if (status && status !== 'all') {
      query += ` AND ph.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Filter by year
    if (year && year !== 'all') {
      query += ` AND EXTRACT(YEAR FROM ph.created_at) = $${paramIndex}`;
      params.push(parseInt(year));
      paramIndex++;
    }

    query += ` ORDER BY ph.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM payment_history
      WHERE tenant_id = $1
      ${status && status !== 'all' ? `AND status = '${status}'` : ''}
      ${year && year !== 'all' ? `AND EXTRACT(YEAR FROM created_at) = ${parseInt(year)}` : ''}
    `;
    const countResult = await pool.query(countQuery, [tenantId]);

    // Transform data for frontend
    const invoices = result.rows.map(row => ({
      id: row.id.toString(),
      invoiceNumber: row.invoiceNumber,
      date: row.date,
      dueDate: calculateDueDate(row.date, row.billingCycle),
      amount: parseFloat(row.amount),
      currency: row.currency || 'PHP',
      status: mapPaymentStatusToInvoiceStatus(row.status),
      description: row.description || `${row.planName} - ${row.transactionType || 'Payment'}`,
      platformType: row.platformType,
      planName: row.planName,
      transactionType: row.transactionType,
      processedAt: row.processedAt,
      provider: row.provider,
      paidBy: row.paidBy,
      failureReason: row.failureReason,
    }));

    logger.info(`📄 Retrieved ${invoices.length} invoices for tenant ${tenantId}`);

    res.json({
      invoices,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + invoices.length < parseInt(countResult.rows[0].total),
      },
    });
  } catch (error) {
    logger.error('❌ Error fetching tenant invoices:', error);
    res.status(500).json({
      error: 'Failed to fetch invoices',
      code: 'FETCH_INVOICES_ERROR',
      message: error.message,
    });
  }
}

/**
 * Get invoice statistics for current tenant
 */
async function getTenantInvoiceStats(req, res) {
  try {
    const tenantId = req.user.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        error: 'Tenant ID required',
        code: 'MISSING_TENANT_ID',
      });
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as paid,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        SUM(amount) FILTER (WHERE status = 'completed') as total_paid,
        SUM(amount) FILTER (WHERE status = 'pending') as total_pending
      FROM payment_history
      WHERE tenant_id = $1
    `;

    const result = await pool.query(statsQuery, [tenantId]);
    const stats = result.rows[0];

    res.json({
      total: parseInt(stats.total) || 0,
      paid: parseInt(stats.paid) || 0,
      pending: parseInt(stats.pending) || 0,
      overdue: 0, // We'll calculate overdue based on due dates if needed
      failed: parseInt(stats.failed) || 0,
      totalPaidAmount: parseFloat(stats.total_paid) || 0,
      totalPendingAmount: parseFloat(stats.total_pending) || 0,
    });
  } catch (error) {
    logger.error('❌ Error fetching invoice stats:', error);
    res.status(500).json({
      error: 'Failed to fetch invoice statistics',
      code: 'FETCH_STATS_ERROR',
      message: error.message,
    });
  }
}

/**
 * Get single invoice details
 */
async function getInvoiceById(req, res) {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        error: 'Tenant ID required',
        code: 'MISSING_TENANT_ID',
      });
    }

    const query = `
      SELECT 
        ph.*,
        sp.name as plan_name,
        sp.billing_cycle,
        u.email as paid_by,
        u.first_name,
        u.last_name,
        t.name as tenant_name,
        t.email as tenant_email
      FROM payment_history ph
      LEFT JOIN subscription_plans sp ON ph.subscription_plan_id = sp.id
      LEFT JOIN users u ON ph.user_id = u.id
      LEFT JOIN tenants t ON ph.tenant_id = t.id
      WHERE ph.id = $1 AND ph.tenant_id = $2
    `;

    const result = await pool.query(query, [id, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Invoice not found',
        code: 'INVOICE_NOT_FOUND',
      });
    }

    const invoice = result.rows[0];

    res.json({
      id: invoice.id,
      invoiceNumber: invoice.transaction_id,
      date: invoice.created_at,
      dueDate: calculateDueDate(invoice.created_at, invoice.billing_cycle),
      processedAt: invoice.processed_at,
      amount: parseFloat(invoice.amount),
      currency: invoice.currency,
      status: mapPaymentStatusToInvoiceStatus(invoice.status),
      description: invoice.description,
      planName: invoice.plan_name,
      transactionType: invoice.transaction_type,
      platformType: invoice.platform_type,
      provider: invoice.provider,
      failureReason: invoice.failure_reason,
      paidBy: {
        email: invoice.paid_by,
        firstName: invoice.first_name,
        lastName: invoice.last_name,
      },
      tenant: {
        name: invoice.tenant_name,
        email: invoice.tenant_email,
      },
    });
  } catch (error) {
    logger.error('❌ Error fetching invoice details:', error);
    res.status(500).json({
      error: 'Failed to fetch invoice',
      code: 'FETCH_INVOICE_ERROR',
      message: error.message,
    });
  }
}

// Helper functions

/**
 * Calculate due date based on creation date and billing cycle
 */
function calculateDueDate(createdDate, billingCycle) {
  if (!createdDate) return null;
  
  const date = new Date(createdDate);
  
  // Default: 15 days from creation
  let daysToAdd = 15;
  
  // Adjust based on billing cycle
  if (billingCycle === 'monthly') {
    daysToAdd = 15;
  } else if (billingCycle === 'annual') {
    daysToAdd = 30;
  }
  
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString();
}

/**
 * Map payment_history status to invoice status
 * payment_history: pending, completed, failed, refunded
 * invoice: paid, pending, overdue, cancelled
 */
function mapPaymentStatusToInvoiceStatus(paymentStatus) {
  const statusMap = {
    'completed': 'paid',
    'pending': 'pending',
    'failed': 'cancelled',
    'refunded': 'cancelled',
  };
  
  return statusMap[paymentStatus] || 'pending';
}

module.exports = {
  getTenantInvoices,
  getTenantInvoiceStats,
  getInvoiceById,
};
