const pool = require('../../../../config/database');
const logger = require('../../../../utils/logger');

class RepaymentService {
  /**
   * Transform payment to camelCase
   */
  static transformPayment(dbPayment) {
    if (!dbPayment) return null;

    return {
      id: dbPayment.id,
      tenantId: dbPayment.tenant_id,
      paymentReference: dbPayment.payment_reference,
      loanId: dbPayment.loan_id,
      customerId: dbPayment.customer_id,
      amount: parseFloat(dbPayment.amount),
      principalAmount: parseFloat(dbPayment.principal_amount),
      interestAmount: parseFloat(dbPayment.interest_amount),
      penaltyAmount: parseFloat(dbPayment.penalty_amount) || 0,
      paymentMethod: dbPayment.payment_method,
      transactionId: dbPayment.transaction_id,
      paymentDate: dbPayment.payment_date,
      status: dbPayment.status,
      receivedBy: dbPayment.received_by,
      notes: dbPayment.notes,
      metadata: dbPayment.metadata,
      createdAt: dbPayment.created_at,
      updatedAt: dbPayment.updated_at
    };
  }

  /**
   * Generate payment reference
   */
  static async generatePaymentReference(tenantId) {
    const prefix = 'PAY';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${tenantId}-${timestamp}${random}`;
  }

  /**
   * Record payment
   */
  static async recordPayment(tenantId, paymentData, userId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const {
        loanId,
        amount,
        paymentMethod,
        paymentDate,
        transactionId,
        notes
      } = paymentData;

      // Get loan details
      const loanResult = await client.query(
        `SELECT * FROM loans WHERE tenant_id = $1 AND id = $2`,
        [tenantId, loanId]
      );

      if (loanResult.rows.length === 0) {
        throw new Error('Loan not found');
      }

      const loan = loanResult.rows[0];

      // Get pending schedule items
      const scheduleResult = await client.query(
        `SELECT * FROM repayment_schedules 
         WHERE tenant_id = $1 AND loan_id = $2 AND status != 'paid'
         ORDER BY due_date ASC`,
        [tenantId, loanId]
      );

      let remainingAmount = amount;
      let totalPrincipal = 0;
      let totalInterest = 0;
      let totalPenalty = 0;

      // Apply payment to schedule items
      for (const schedule of scheduleResult.rows) {
        if (remainingAmount <= 0) break;

        const outstandingAmount = parseFloat(schedule.outstanding_amount);
        const penaltyAmount = parseFloat(schedule.penalty_amount) || 0;
        const totalDue = outstandingAmount + penaltyAmount;

        if (remainingAmount >= totalDue) {
          // Full payment of this installment
          await client.query(
            `UPDATE repayment_schedules 
             SET amount_paid = $1, outstanding_amount = 0, status = 'paid', 
                 paid_date = $2, updated_at = NOW()
             WHERE id = $3`,
            [outstandingAmount, paymentDate, schedule.id]
          );

          totalPrincipal += parseFloat(schedule.principal_amount);
          totalInterest += parseFloat(schedule.interest_amount);
          totalPenalty += penaltyAmount;
          remainingAmount -= totalDue;
        } else {
          // Partial payment
          const paymentForSchedule = Math.min(remainingAmount, outstandingAmount);
          const newOutstanding = outstandingAmount - paymentForSchedule;
          const newPaid = parseFloat(schedule.amount_paid) + paymentForSchedule;

          // Calculate proportion of principal and interest
          const totalScheduleAmount = parseFloat(schedule.total_amount);
          const principalProportion = parseFloat(schedule.principal_amount) / totalScheduleAmount;
          const interestProportion = parseFloat(schedule.interest_amount) / totalScheduleAmount;

          const principalPaid = paymentForSchedule * principalProportion;
          const interestPaid = paymentForSchedule * interestProportion;

          await client.query(
            `UPDATE repayment_schedules 
             SET amount_paid = $1, outstanding_amount = $2, 
                 status = CASE WHEN $2 = 0 THEN 'paid' ELSE 'partially_paid' END,
                 updated_at = NOW()
             WHERE id = $3`,
            [newPaid, newOutstanding, schedule.id]
          );

          totalPrincipal += principalPaid;
          totalInterest += interestPaid;
          remainingAmount = 0;
        }
      }

      // Generate payment reference
      const paymentReference = await this.generatePaymentReference(tenantId);

      // Record payment
      const paymentResult = await client.query(
        `INSERT INTO loan_payments (
          tenant_id, payment_reference, loan_id, customer_id,
          amount, principal_amount, interest_amount, penalty_amount,
          payment_method, transaction_id, payment_date, status,
          received_by, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          tenantId, paymentReference, loanId, loan.customer_id,
          amount, totalPrincipal, totalInterest, totalPenalty,
          paymentMethod, transactionId, paymentDate, 'completed',
          userId, notes
        ]
      );

      // Update loan amounts
      const newAmountPaid = parseFloat(loan.amount_paid) + amount;
      const newOutstanding = parseFloat(loan.outstanding_balance) - amount;

      let newStatus = loan.status;
      if (newOutstanding <= 0) {
        newStatus = 'paid_off';
      } else if (loan.status === 'overdue' && newOutstanding < parseFloat(loan.outstanding_balance)) {
        newStatus = 'active'; // Payment made, no longer overdue
      }

      await client.query(
        `UPDATE loans 
         SET amount_paid = $1, outstanding_balance = $2, status = $3, updated_at = NOW()
         WHERE id = $4`,
        [newAmountPaid, Math.max(0, newOutstanding), newStatus, loanId]
      );

      await client.query('COMMIT');

      logger.info(`Payment recorded: ${paymentReference} for loan ${loanId}`);
      return this.transformPayment(paymentResult.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error(`Error recording payment: ${err.message}`);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get payment history for a loan
   */
  static async getPaymentHistory(tenantId, loanId) {
    try {
      const result = await pool.query(
        `SELECT * FROM loan_payments 
         WHERE tenant_id = $1 AND loan_id = $2
         ORDER BY payment_date DESC, created_at DESC`,
        [tenantId, loanId]
      );

      return result.rows.map(row => this.transformPayment(row));
    } catch (err) {
      logger.error(`Error getting payment history: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get repayment schedule for a loan
   */
  static async getRepaymentSchedule(tenantId, loanId) {
    try {
      const result = await pool.query(
        `SELECT * FROM repayment_schedules 
         WHERE tenant_id = $1 AND loan_id = $2
         ORDER BY installment_number ASC`,
        [tenantId, loanId]
      );

      return result.rows.map(row => ({
        id: row.id,
        installmentNumber: row.installment_number,
        dueDate: row.due_date,
        principalAmount: parseFloat(row.principal_amount),
        interestAmount: parseFloat(row.interest_amount),
        totalAmount: parseFloat(row.total_amount),
        amountPaid: parseFloat(row.amount_paid) || 0,
        outstandingAmount: parseFloat(row.outstanding_amount),
        penaltyAmount: parseFloat(row.penalty_amount) || 0,
        status: row.status,
        paidDate: row.paid_date,
        daysOverdue: row.days_overdue || 0
      }));
    } catch (err) {
      logger.error(`Error getting repayment schedule: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get today's collections
   */
  static async getTodayCollections(tenantId) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const result = await pool.query(
        `SELECT 
          COUNT(*) as total_payments,
          COALESCE(SUM(amount), 0) as total_amount,
          COALESCE(SUM(principal_amount), 0) as principal_collected,
          COALESCE(SUM(interest_amount), 0) as interest_collected,
          COALESCE(SUM(penalty_amount), 0) as penalty_collected
         FROM loan_payments
         WHERE tenant_id = $1 AND payment_date = $2 AND status = 'completed'`,
        [tenantId, today]
      );

      const stats = result.rows[0];

      return {
        date: today,
        totalPayments: parseInt(stats.total_payments) || 0,
        totalAmount: parseFloat(stats.total_amount) || 0,
        principalCollected: parseFloat(stats.principal_collected) || 0,
        interestCollected: parseFloat(stats.interest_collected) || 0,
        penaltyCollected: parseFloat(stats.penalty_collected) || 0
      };
    } catch (err) {
      logger.error(`Error getting today's collections: ${err.message}`);
      throw err;
    }
  }
}

module.exports = RepaymentService;
