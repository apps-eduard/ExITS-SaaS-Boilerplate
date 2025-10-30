/**
 * Money Loan - Loan Service
 * Business logic for loan applications and management
 */

const pool = require('../../../../config/database');
const logger = require('../../../../utils/logger');

class MoneyloanLoanService {
  /**
   * Create a new loan application
   */
  async createLoanApplication(tenantId, applicationData) {
    try {
      const {
        customerId,
        loanProductId,
        requestedAmount,
        requestedTermDays,
        purpose,
        creditScore,
        annualIncome,
        employmentStatus,
        collateralDescription,
      } = applicationData;

      // Generate application number
      const appNumber = `APP-${tenantId}-${Date.now()}`;

      // Store optional fields in application_data JSONB column
      const appData = {};
      if (creditScore) appData.creditScore = creditScore;
      if (annualIncome) appData.annualIncome = annualIncome;
      if (employmentStatus) appData.employmentStatus = employmentStatus;
      if (collateralDescription) appData.collateralDescription = collateralDescription;

      const query = `
        INSERT INTO money_loan_applications (
          tenant_id, customer_id, loan_product_id, application_number,
          requested_amount, requested_term_days, purpose, 
          status, application_data, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *
      `;

      const values = [
        tenantId,
        customerId,
        loanProductId,
        appNumber,
        requestedAmount,
        requestedTermDays,
        purpose || 'Loan application',
        'submitted',
        JSON.stringify(appData),
      ];

      const result = await pool.query(query, values);
      const application = result.rows[0];

      logger.info(`✅ Loan application created: ${application.id}`);
      return application;
    } catch (error) {
      logger.error('❌ Error creating loan application:', error);
      throw error;
    }
  }

  /**
   * Get loan application by ID
   */
  async getLoanApplication(tenantId, applicationId) {
    try {
      const query = `
        SELECT * FROM money_loan_applications
        WHERE id = $1 AND tenant_id = $2
      `;

      const result = await pool.query(query, [applicationId, tenantId]);

      if (result.rows.length === 0) {
        throw new Error('Loan application not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('❌ Error fetching loan application:', error);
      throw error;
    }
  }

  /**
   * Get all loan applications for a customer
   */
  async getCustomerApplications(tenantId, customerId) {
    try {
      const query = `
        SELECT * FROM money_loan_applications
        WHERE tenant_id = $1 AND customer_id = $2
        ORDER BY created_at DESC
      `;

      const result = await pool.query(query, [tenantId, customerId]);
      return result.rows;
    } catch (error) {
      logger.error('❌ Error fetching customer applications:', error);
      throw error;
    }
  }

  /**
   * Get all loan applications for a tenant (with optional filters)
   */
  async getAllApplications(tenantId, filters = {}) {
    try {
      const conditions = ['tenant_id = $1'];
      const values = [tenantId];
      let paramCount = 2;

      if (filters.status) {
        conditions.push(`status = $${paramCount}`);
        values.push(filters.status);
        paramCount++;
      }

      if (filters.product_id) {
        conditions.push(`loan_product_id = $${paramCount}`);
        values.push(filters.product_id);
        paramCount++;
      }

      if (filters.customer_id) {
        conditions.push(`customer_id = $${paramCount}`);
        values.push(filters.customer_id);
        paramCount++;
      }

      if (filters.search) {
        conditions.push(`(application_number ILIKE $${paramCount} OR customer_id::text ILIKE $${paramCount})`);
        values.push(`%${filters.search}%`);
        paramCount++;
      }

      const query = `
        SELECT * FROM money_loan_applications
        WHERE ${conditions.join(' AND ')}
        ORDER BY created_at DESC
      `;

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      logger.error('❌ Error fetching all applications:', error);
      throw error;
    }
  }

  /**
   * Update loan application
   */
  async updateLoanApplication(tenantId, applicationId, updateData) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updateData).forEach((key) => {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      });

      fields.push('updated_at = NOW()');
      values.push(applicationId);
      values.push(tenantId);

      const query = `
        UPDATE money_loan_applications
        SET ${fields.join(', ')}
        WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1}
        RETURNING *
      `;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Loan application not found');
      }

      logger.info(`✅ Loan application updated: ${applicationId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('❌ Error updating loan application:', error);
      throw error;
    }
  }

  /**
   * Approve loan application and create active loan
   */
  async approveLoanApplication(tenantId, applicationId, approvalData) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const {
        approvedBy,
        approvedAmount,
        interestRate,
        loanTermDays,
        totalFees,
        totalInterest,
        monthlyPayment,
        notes,
      } = approvalData;

      // Get application details
      const appQuery = `
        SELECT * FROM money_loan_applications
        WHERE id = $1 AND tenant_id = $2
      `;
      const appResult = await client.query(appQuery, [applicationId, tenantId]);

      if (appResult.rows.length === 0) {
        throw new Error('Loan application not found');
      }

      const application = appResult.rows[0];

      // Update application status
      const updateAppQuery = `
        UPDATE money_loan_applications
        SET status = 'approved',
            approved_by = $1,
            approved_amount = $2,
            approval_date = NOW(),
            approval_notes = $3,
            updated_at = NOW()
        WHERE id = $4 AND tenant_id = $5
      `;

      await client.query(updateAppQuery, [
        approvedBy,
        approvedAmount,
        notes,
        applicationId,
        tenantId,
      ]);

      // Create active loan record
      const loanQuery = `
        INSERT INTO money_loans (
          tenant_id, application_id, loan_product_id, customer_id,
          principal_amount, interest_rate, loan_term_days, total_fees,
          total_interest, total_repayment, monthly_payment, outstanding_balance,
          status, approval_date, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW(), NOW())
        RETURNING *
      `;

      const totalRepayment = approvedAmount + totalFees + totalInterest;

      const loanResult = await client.query(loanQuery, [
        tenantId,
        applicationId,
        application.loan_product_id,
        application.customer_id,
        approvedAmount,
        interestRate,
        loanTermDays,
        totalFees,
        totalInterest,
        totalRepayment,
        monthlyPayment,
        totalRepayment,
        'approved',
      ]);

      await client.query('COMMIT');
      logger.info(`✅ Loan application approved and loan created: ${loanResult.rows[0].id}`);
      return loanResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('❌ Error approving loan application:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Reject loan application
   */
  async rejectLoanApplication(tenantId, applicationId, rejectionData) {
    try {
      const { rejectedBy, rejectionReason } = rejectionData;

      const query = `
        UPDATE money_loan_applications
        SET status = 'rejected',
            rejected_by = $1,
            rejection_date = NOW(),
            rejection_reason = $2,
            updated_at = NOW()
        WHERE id = $3 AND tenant_id = $4
        RETURNING *
      `;

      const result = await pool.query(query, [
        rejectedBy,
        rejectionReason,
        applicationId,
        tenantId,
      ]);

      if (result.rows.length === 0) {
        throw new Error('Loan application not found');
      }

      logger.info(`✅ Loan application rejected: ${applicationId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('❌ Error rejecting loan application:', error);
      throw error;
    }
  }

  /**
   * Disburse loan to customer
   */
  async disburseLoan(tenantId, loanId, disbursalData) {
    try {
      const { disbursedBy, disbursementMethod, disbursementReference } = disbursalData;

      const query = `
        UPDATE money_loans
        SET status = 'active',
            disbursement_date = NOW(),
            disbursed_by = $1,
            disbursement_method = $2,
            disbursement_reference = $3,
            updated_at = NOW()
        WHERE id = $4 AND tenant_id = $5
        RETURNING *
      `;

      const result = await pool.query(query, [
        disbursedBy,
        disbursementMethod,
        disbursementReference,
        loanId,
        tenantId,
      ]);

      if (result.rows.length === 0) {
        throw new Error('Loan not found');
      }

      logger.info(`✅ Loan disbursed: ${loanId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('❌ Error disbursing loan:', error);
      throw error;
    }
  }

  /**
   * Get loan by ID
   */
  async getLoan(tenantId, loanId) {
    try {
      const query = `
        SELECT * FROM money_loans
        WHERE id = $1 AND tenant_id = $2
      `;

      const result = await pool.query(query, [loanId, tenantId]);

      if (result.rows.length === 0) {
        throw new Error('Loan not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('❌ Error fetching loan:', error);
      throw error;
    }
  }

  /**
   * Get all loans for a customer
   */
  async getCustomerLoans(tenantId, customerId) {
    try {
      const query = `
        SELECT * FROM money_loans
        WHERE tenant_id = $1 AND customer_id = $2
        ORDER BY created_at DESC
      `;

      const result = await pool.query(query, [tenantId, customerId]);
      return result.rows;
    } catch (error) {
      logger.error('❌ Error fetching customer loans:', error);
      throw error;
    }
  }

  /**
   * Get all loans for a product
   */
  async getProductLoans(tenantId, productId, status = null) {
    try {
      let query = `
        SELECT * FROM money_loans
        WHERE tenant_id = $1 AND loan_product_id = $2
      `;
      const values = [tenantId, productId];

      if (status) {
        query += ' AND status = $3';
        values.push(status);
      }

      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      logger.error('❌ Error fetching product loans:', error);
      throw error;
    }
  }

  /**
   * Get loans with filters
   */
  async getLoansWithFilters(tenantId, filters) {
    try {
      const conditions = ['tenant_id = $1'];
      const values = [tenantId];
      let paramCount = 2;

      if (filters.status) {
        conditions.push(`status = $${paramCount}`);
        values.push(filters.status);
        paramCount++;
      }

      if (filters.customerId) {
        conditions.push(`customer_id = $${paramCount}`);
        values.push(filters.customerId);
        paramCount++;
      }

      if (filters.productId) {
        conditions.push(`loan_product_id = $${paramCount}`);
        values.push(filters.productId);
        paramCount++;
      }

      if (filters.minAmount) {
        conditions.push(`principal_amount >= $${paramCount}`);
        values.push(filters.minAmount);
        paramCount++;
      }

      if (filters.maxAmount) {
        conditions.push(`principal_amount <= $${paramCount}`);
        values.push(filters.maxAmount);
        paramCount++;
      }

      if (filters.startDate) {
        conditions.push(`created_at >= $${paramCount}`);
        values.push(filters.startDate);
        paramCount++;
      }

      if (filters.endDate) {
        conditions.push(`created_at <= $${paramCount}`);
        values.push(filters.endDate);
        paramCount++;
      }

      const query = `
        SELECT * FROM money_loans
        WHERE ${conditions.join(' AND ')}
        ORDER BY created_at DESC
      `;

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      logger.error('❌ Error fetching loans with filters:', error);
      throw error;
    }
  }

  /**
   * Close a loan
   */
  async closeLoan(tenantId, loanId, closureData) {
    try {
      const { closedBy, closureReason } = closureData;

      const query = `
        UPDATE money_loans
        SET status = 'closed',
            closure_date = NOW(),
            closed_by = $1,
            closure_reason = $2,
            outstanding_balance = 0,
            updated_at = NOW()
        WHERE id = $3 AND tenant_id = $4
        RETURNING *
      `;

      const result = await pool.query(query, [
        closedBy,
        closureReason,
        loanId,
        tenantId,
      ]);

      if (result.rows.length === 0) {
        throw new Error('Loan not found');
      }

      logger.info(`✅ Loan closed: ${loanId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('❌ Error closing loan:', error);
      throw error;
    }
  }

  /**
   * Suspend a loan
   */
  async suspendLoan(tenantId, loanId, suspensionData) {
    try {
      const { suspendedBy, suspensionReason } = suspensionData;

      const query = `
        UPDATE money_loans
        SET status = 'suspended',
            suspension_date = NOW(),
            suspended_by = $1,
            suspension_reason = $2,
            updated_at = NOW()
        WHERE id = $3 AND tenant_id = $4
        RETURNING *
      `;

      const result = await pool.query(query, [
        suspendedBy,
        suspensionReason,
        loanId,
        tenantId,
      ]);

      if (result.rows.length === 0) {
        throw new Error('Loan not found');
      }

      logger.info(`✅ Loan suspended: ${loanId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('❌ Error suspending loan:', error);
      throw error;
    }
  }

  /**
   * Resume a suspended loan
   */
  async resumeLoan(tenantId, loanId) {
    try {
      const query = `
        UPDATE money_loans
        SET status = 'active',
            suspension_date = NULL,
            suspended_by = NULL,
            suspension_reason = NULL,
            updated_at = NOW()
        WHERE id = $1 AND tenant_id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [loanId, tenantId]);

      if (result.rows.length === 0) {
        throw new Error('Loan not found');
      }

      logger.info(`✅ Loan resumed: ${loanId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('❌ Error resuming loan:', error);
      throw error;
    }
  }

  /**
   * Get loans dashboard summary
   */
  async getLoansDashboard(tenantId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_loans,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_loans,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_loans,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_loans,
          COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_loans,
          COUNT(CASE WHEN status = 'defaulted' THEN 1 END) as defaulted_loans,
          SUM(principal_amount) as total_principal,
          SUM(outstanding_balance) as total_outstanding,
          SUM(total_fees) as total_fees_collected,
          SUM(total_interest) as total_interest_earned
        FROM money_loans
        WHERE tenant_id = $1
      `;

      const result = await pool.query(query, [tenantId]);
      return result.rows[0];
    } catch (error) {
      logger.error('❌ Error fetching loans dashboard:', error);
      throw error;
    }
  }
}

module.exports = new MoneyloanLoanService();
