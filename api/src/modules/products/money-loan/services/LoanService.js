const pool = require('../../../../config/database');
const logger = require('../../../../utils/logger');
const LoanCalculator = require('../utils/loanCalculator');

class LoanService {
  /**
   * Transform database row to camelCase
   */
  static transformLoan(dbLoan) {
    if (!dbLoan) return null;

    return {
      id: dbLoan.id,
      tenantId: dbLoan.tenant_id,
      loanNumber: dbLoan.loan_number,
      customerId: dbLoan.customer_id,
      loanProductId: dbLoan.loan_product_id,
      applicationId: dbLoan.application_id,
      principalAmount: parseFloat(dbLoan.principal_amount),
      interestRate: parseFloat(dbLoan.interest_rate),
      interestType: dbLoan.interest_type,
      termDays: dbLoan.term_days,
      processingFee: parseFloat(dbLoan.processing_fee) || 0,
      totalInterest: parseFloat(dbLoan.total_interest),
      totalAmount: parseFloat(dbLoan.total_amount),
      monthlyPayment: parseFloat(dbLoan.monthly_payment) || 0,
      disbursementDate: dbLoan.disbursement_date,
      firstPaymentDate: dbLoan.first_payment_date,
      maturityDate: dbLoan.maturity_date,
      amountPaid: parseFloat(dbLoan.amount_paid) || 0,
      outstandingBalance: parseFloat(dbLoan.outstanding_balance),
      penaltyAmount: parseFloat(dbLoan.penalty_amount) || 0,
      status: dbLoan.status,
      daysOverdue: dbLoan.days_overdue || 0,
      approvedBy: dbLoan.approved_by,
      disbursedBy: dbLoan.disbursed_by,
      metadata: dbLoan.metadata,
      createdAt: dbLoan.created_at,
      updatedAt: dbLoan.updated_at
    };
  }

  /**
   * Generate unique loan number
   */
  static async generateLoanNumber(tenantId) {
    const prefix = 'LN';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${prefix}-${tenantId}-${timestamp}${random}`;
  }

  /**
   * Create loan from approved application
   */
  static async createLoan(tenantId, loanData, userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const {
        customerId,
        loanProductId,
        applicationId,
        principalAmount,
        interestRate,
        interestType,
        termDays,
        processingFeePercent = 0,
        disbursementDate
      } = loanData;

      // Generate loan number
      const loanNumber = await this.generateLoanNumber(tenantId);

      // Calculate loan amounts
      const processingFee = LoanCalculator.calculateProcessingFee(principalAmount, processingFeePercent);
      const totalInterest = LoanCalculator.calculateInterest(principalAmount, interestRate, termDays, interestType);
      const totalAmount = LoanCalculator.calculateTotalAmount(principalAmount, totalInterest, processingFee);
      const monthlyPayment = LoanCalculator.calculateMonthlyPayment(principalAmount, interestRate, termDays);

      // Calculate dates
      const disbDate = new Date(disbursementDate);
      const firstPaymentDate = new Date(disbDate);
      firstPaymentDate.setDate(firstPaymentDate.getDate() + 30); // First payment after 30 days
      
      const maturityDate = new Date(disbDate);
      maturityDate.setDate(maturityDate.getDate() + termDays);

      // Create loan
      const loanResult = await client.query(
        `INSERT INTO loans (
          tenant_id, loan_number, customer_id, loan_product_id, application_id,
          principal_amount, interest_rate, interest_type, term_days, processing_fee,
          total_interest, total_amount, monthly_payment,
          disbursement_date, first_payment_date, maturity_date,
          outstanding_balance, status, approved_by, disbursed_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING *`,
        [
          tenantId, loanNumber, customerId, loanProductId, applicationId,
          principalAmount, interestRate, interestType, termDays, processingFee,
          totalInterest, totalAmount, monthlyPayment,
          disbursementDate, firstPaymentDate, maturityDate,
          totalAmount, 'disbursed', userId, userId
        ]
      );

      const loan = loanResult.rows[0];

      // Generate repayment schedule
      const schedule = LoanCalculator.generateRepaymentSchedule({
        principalAmount,
        interestRate,
        termDays,
        interestType,
        disbursementDate
      });

      // Insert repayment schedule
      for (const installment of schedule) {
        await client.query(
          `INSERT INTO repayment_schedules (
            tenant_id, loan_id, installment_number, due_date,
            principal_amount, interest_amount, total_amount, outstanding_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            tenantId,
            loan.id,
            installment.installmentNumber,
            installment.dueDate,
            installment.principalAmount,
            installment.interestAmount,
            installment.totalAmount,
            installment.outstandingAmount
          ]
        );
      }

      // Update application status if exists
      if (applicationId) {
        await client.query(
          `UPDATE loan_applications 
           SET status = 'approved' 
           WHERE id = $1 AND tenant_id = $2`,
          [applicationId, tenantId]
        );
      }

      await client.query('COMMIT');
      
      logger.info(`Loan created: ${loanNumber}`);
      return this.transformLoan(loan);
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error(`Error creating loan: ${err.message}`);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get loan by ID with customer and product details
   */
  static async getLoanById(tenantId, loanId) {
    try {
      const result = await pool.query(
        `SELECT 
          l.*,
          c.customer_code, c.first_name, c.middle_name, c.last_name, c.email, c.phone,
          lp.name as product_name, lp.product_code
        FROM loans l
        LEFT JOIN loan_customers c ON l.customer_id = c.id
        LEFT JOIN loan_products lp ON l.loan_product_id = lp.id
        WHERE l.tenant_id = $1 AND l.id = $2`,
        [tenantId, loanId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const loan = this.transformLoan(result.rows[0]);
      const row = result.rows[0];

      // Add customer and product info
      loan.customer = {
        customerCode: row.customer_code,
        firstName: row.first_name,
        middleName: row.middle_name,
        lastName: row.last_name,
        fullName: `${row.first_name} ${row.middle_name || ''} ${row.last_name}`.trim(),
        email: row.email,
        phone: row.phone
      };

      loan.product = {
        name: row.product_name,
        productCode: row.product_code
      };

      return loan;
    } catch (err) {
      logger.error(`Error getting loan: ${err.message}`);
      throw err;
    }
  }

  /**
   * List loans with filters and pagination
   */
  static async listLoans(tenantId, filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        customerId,
        search
      } = filters;

      const offset = (page - 1) * limit;
      let whereConditions = ['l.tenant_id = $1'];
      let params = [tenantId];
      let paramCount = 2;

      if (status) {
        whereConditions.push(`l.status = $${paramCount++}`);
        params.push(status);
      }

      if (customerId) {
        whereConditions.push(`l.customer_id = $${paramCount++}`);
        params.push(customerId);
      }

      if (search) {
        whereConditions.push(`(
          l.loan_number ILIKE $${paramCount} OR 
          c.first_name ILIKE $${paramCount} OR 
          c.last_name ILIKE $${paramCount} OR
          c.customer_code ILIKE $${paramCount}
        )`);
        params.push(`%${search}%`);
        paramCount++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) as total 
         FROM loans l
         LEFT JOIN loan_customers c ON l.customer_id = c.id
         WHERE ${whereClause}`,
        params
      );

      // Get paginated data
      const dataQuery = `
        SELECT 
          l.*,
          c.customer_code, c.first_name, c.middle_name, c.last_name,
          lp.name as product_name
        FROM loans l
        LEFT JOIN loan_customers c ON l.customer_id = c.id
        LEFT JOIN loan_products lp ON l.loan_product_id = lp.id
        WHERE ${whereClause}
        ORDER BY l.created_at DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;
      params.push(limit, offset);

      const dataResult = await pool.query(dataQuery, params);

      const loans = dataResult.rows.map(row => {
        const loan = this.transformLoan(row);
        loan.customer = {
          customerCode: row.customer_code,
          firstName: row.first_name,
          middleName: row.middle_name,
          lastName: row.last_name,
          fullName: `${row.first_name} ${row.middle_name || ''} ${row.last_name}`.trim()
        };
        loan.productName = row.product_name;
        return loan;
      });

      return {
        loans,
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
        }
      };
    } catch (err) {
      logger.error(`Error listing loans: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get loan overview statistics
   */
  static async getLoanOverview(tenantId) {
    try {
      const result = await pool.query(
        `SELECT 
          COUNT(*) as total_loans,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_loans,
          COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_loans,
          COUNT(CASE WHEN status = 'defaulted' THEN 1 END) as defaulted_loans,
          COUNT(CASE WHEN status = 'paid_off' THEN 1 END) as paid_off_loans,
          COALESCE(SUM(CASE WHEN status IN ('active', 'overdue') THEN outstanding_balance ELSE 0 END), 0) as total_outstanding,
          COALESCE(SUM(amount_paid), 0) as total_collected,
          COALESCE(SUM(penalty_amount), 0) as total_penalties,
          COALESCE(SUM(CASE WHEN status IN ('active', 'overdue') THEN principal_amount ELSE 0 END), 0) as total_principal_outstanding
        FROM loans
        WHERE tenant_id = $1`,
        [tenantId]
      );

      const stats = result.rows[0];

      // Calculate collection rate
      const totalLoaned = parseFloat(stats.total_collected) + parseFloat(stats.total_outstanding);
      const collectionRate = totalLoaned > 0 ? (parseFloat(stats.total_collected) / totalLoaned) * 100 : 0;

      // Calculate default rate
      const totalLoans = parseInt(stats.total_loans) || 1;
      const defaultRate = (parseInt(stats.defaulted_loans) / totalLoans) * 100;

      // Calculate overdue percentage
      const activeLoans = parseInt(stats.active_loans) + parseInt(stats.overdue_loans) || 1;
      const overduePercent = (parseInt(stats.overdue_loans) / activeLoans) * 100;

      return {
        totalLoans: parseInt(stats.total_loans) || 0,
        activeLoans: parseInt(stats.active_loans) || 0,
        overdueLoans: parseInt(stats.overdue_loans) || 0,
        defaultedLoans: parseInt(stats.defaulted_loans) || 0,
        paidOffLoans: parseInt(stats.paid_off_loans) || 0,
        totalOutstanding: parseFloat(stats.total_outstanding) || 0,
        totalCollected: parseFloat(stats.total_collected) || 0,
        totalPenalties: parseFloat(stats.total_penalties) || 0,
        collectionRate: Math.round(collectionRate * 100) / 100,
        defaultRate: Math.round(defaultRate * 100) / 100,
        overduePercent: Math.round(overduePercent * 100) / 100
      };
    } catch (err) {
      logger.error(`Error getting loan overview: ${err.message}`);
      throw err;
    }
  }

  /**
   * Update loan status
   */
  static async updateLoanStatus(tenantId, loanId, status, userId) {
    try {
      const result = await pool.query(
        `UPDATE loans 
         SET status = $1, updated_at = NOW()
         WHERE tenant_id = $2 AND id = $3
         RETURNING *`,
        [status, tenantId, loanId]
      );

      if (result.rows.length === 0) {
        throw new Error('Loan not found');
      }

      logger.info(`Loan ${loanId} status updated to ${status}`);
      return this.transformLoan(result.rows[0]);
    } catch (err) {
      logger.error(`Error updating loan status: ${err.message}`);
      throw err;
    }
  }
}

module.exports = LoanService;
