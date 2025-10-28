/**
 * Money Loan - Loan Service
 * Handles loan origination, updates, retrieval, and lifecycle management
 */

const knex = require('../../../../config/database');
const logger = require('../../../../utils/logger');

class MoneyloanLoanService {
  /**
   * Create a new loan application
   */
  async createLoanApplication(tenantId, applicationData) {
    try {
      const [applicationId] = await knex('loan_applications').insert({
        tenant_id: tenantId,
        customer_id: applicationData.customerId,
        loan_product_id: applicationData.loanProductId,
        requested_amount: applicationData.requestedAmount,
        requested_term_days: applicationData.requestedTermDays,
        purpose: applicationData.purpose,
        employment_status: applicationData.employmentStatus,
        annual_income: applicationData.annualIncome,
        credit_score: applicationData.creditScore,
        status: 'submitted',
        application_date: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });

      logger.info(`✅ Loan application created: ${applicationId}`);

      return knex('loan_applications').where({ id: applicationId }).first();
    } catch (error) {
      logger.error('❌ Error creating loan application:', error);
      throw error;
    }
  }

  /**
   * Get loan application details
   */
  async getLoanApplication(tenantId, applicationId) {
    try {
      const application = await knex('loan_applications')
        .where({ tenant_id: tenantId, id: applicationId })
        .first();

      if (!application) {
        throw new Error('Loan application not found');
      }

      return application;
    } catch (error) {
      logger.error('❌ Error fetching loan application:', error);
      throw error;
    }
  }

  /**
   * Update loan application
   */
  async updateLoanApplication(tenantId, applicationId, updateData) {
    try {
      const updates = {
        requested_amount: updateData.requestedAmount,
        requested_term_days: updateData.requestedTermDays,
        purpose: updateData.purpose,
        employment_status: updateData.employmentStatus,
        annual_income: updateData.annualIncome,
        credit_score: updateData.creditScore,
        status: updateData.status,
        updated_at: new Date(),
      };

      Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

      await knex('loan_applications')
        .where({ tenant_id: tenantId, id: applicationId })
        .update(updates);

      logger.info(`✅ Loan application ${applicationId} updated`);

      return knex('loan_applications').where({ id: applicationId }).first();
    } catch (error) {
      logger.error('❌ Error updating loan application:', error);
      throw error;
    }
  }

  /**
   * Approve loan application and create loan
   */
  async approveLoanApplication(tenantId, applicationId, approvalData) {
    try {
      // Get application
      const application = await this.getLoanApplication(tenantId, applicationId);

      // Create loan from approved application
      const [loanId] = await knex('loans').insert({
        tenant_id: tenantId,
        application_id: applicationId,
        customer_id: application.customer_id,
        loan_product_id: application.loan_product_id,
        loan_amount: approvalData.approvedAmount || application.requested_amount,
        interest_rate: approvalData.interestRate,
        loan_term_days: approvalData.loanTermDays || application.requested_term_days,
        total_fees: approvalData.totalFees || 0,
        total_interest: approvalData.totalInterest || 0,
        status: 'approved',
        approval_date: new Date(),
        approved_by: approvalData.approvedBy,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Update application status
      await knex('loan_applications')
        .where({ id: applicationId })
        .update({
          status: 'approved',
          loan_id: loanId,
          updated_at: new Date(),
        });

      logger.info(`✅ Loan created from approved application: ${loanId}`);

      return knex('loans').where({ id: loanId }).first();
    } catch (error) {
      logger.error('❌ Error approving loan application:', error);
      throw error;
    }
  }

  /**
   * Reject loan application
   */
  async rejectLoanApplication(tenantId, applicationId, rejectionData) {
    try {
      await knex('loan_applications')
        .where({ tenant_id: tenantId, id: applicationId })
        .update({
          status: 'rejected',
          rejection_reason: rejectionData.reason,
          rejected_by: rejectionData.rejectedBy,
          rejection_date: new Date(),
          updated_at: new Date(),
        });

      logger.info(`✅ Loan application ${applicationId} rejected`);

      return knex('loan_applications').where({ id: applicationId }).first();
    } catch (error) {
      logger.error('❌ Error rejecting loan application:', error);
      throw error;
    }
  }

  /**
   * Disburse loan (make funds available to customer)
   */
  async disburseLoan(tenantId, loanId, disbursalData) {
    try {
      const loan = await knex('loans')
        .where({ tenant_id: tenantId, id: loanId })
        .first();

      if (!loan) {
        throw new Error('Loan not found');
      }

      if (loan.status !== 'approved') {
        throw new Error('Only approved loans can be disbursed');
      }

      await knex('loans')
        .where({ id: loanId })
        .update({
          status: 'active',
          disbursed_date: new Date(),
          disbursed_amount: disbursalData.amount || loan.loan_amount,
          disbursed_by: disbursalData.disbursedBy,
          updated_at: new Date(),
        });

      logger.info(`✅ Loan ${loanId} disbursed`);

      return knex('loans').where({ id: loanId }).first();
    } catch (error) {
      logger.error('❌ Error disbursing loan:', error);
      throw error;
    }
  }

  /**
   * Get loan details
   */
  async getLoan(tenantId, loanId) {
    try {
      const loan = await knex('loans')
        .where({ tenant_id: tenantId, id: loanId })
        .first();

      if (!loan) {
        throw new Error('Loan not found');
      }

      return loan;
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
      const loans = await knex('loans')
        .where({ tenant_id: tenantId, customer_id: customerId })
        .orderBy('created_at', 'desc');

      return loans;
    } catch (error) {
      logger.error('❌ Error fetching customer loans:', error);
      throw error;
    }
  }

  /**
   * Get all loans for a product
   */
  async getProductLoans(tenantId, loanProductId, status = null) {
    try {
      let query = knex('loans')
        .where({ tenant_id: tenantId, loan_product_id: loanProductId });

      if (status) {
        query = query.where({ status });
      }

      const loans = await query.orderBy('created_at', 'desc');

      return loans;
    } catch (error) {
      logger.error('❌ Error fetching product loans:', error);
      throw error;
    }
  }

  /**
   * Close/Settle a loan
   */
  async closeLoan(tenantId, loanId, closureData) {
    try {
      const loan = await this.getLoan(tenantId, loanId);

      if (!['active', 'suspended'].includes(loan.status)) {
        throw new Error(`Cannot close loan with status: ${loan.status}`);
      }

      await knex('loans')
        .where({ id: loanId })
        .update({
          status: 'closed',
          closure_date: new Date(),
          closure_reason: closureData.reason,
          closure_type: closureData.closureType, // 'fully_paid', 'written_off', 'foreclosed'
          closed_by: closureData.closedBy,
          updated_at: new Date(),
        });

      logger.info(`✅ Loan ${loanId} closed`);

      return knex('loans').where({ id: loanId }).first();
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
      await knex('loans')
        .where({ tenant_id: tenantId, id: loanId })
        .update({
          status: 'suspended',
          suspension_reason: suspensionData.reason,
          suspended_by: suspensionData.suspendedBy,
          suspension_date: new Date(),
          updated_at: new Date(),
        });

      logger.info(`✅ Loan ${loanId} suspended`);

      return knex('loans').where({ id: loanId }).first();
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
      const loan = await this.getLoan(tenantId, loanId);

      if (loan.status !== 'suspended') {
        throw new Error('Only suspended loans can be resumed');
      }

      await knex('loans')
        .where({ id: loanId })
        .update({
          status: 'active',
          updated_at: new Date(),
        });

      logger.info(`✅ Loan ${loanId} resumed`);

      return knex('loans').where({ id: loanId }).first();
    } catch (error) {
      logger.error('❌ Error resuming loan:', error);
      throw error;
    }
  }

  /**
   * Get all loan applications with pagination
   */
  async getLoansWithFilters(tenantId, filters = {}) {
    try {
      let query = knex('loans').where({ tenant_id: tenantId });

      if (filters.status) {
        query = query.where({ status: filters.status });
      }

      if (filters.customerId) {
        query = query.where({ customer_id: filters.customerId });
      }

      if (filters.loanProductId) {
        query = query.where({ loan_product_id: filters.loanProductId });
      }

      if (filters.createdAfter) {
        query = query.where('created_at', '>=', filters.createdAfter);
      }

      if (filters.createdBefore) {
        query = query.where('created_at', '<=', filters.createdBefore);
      }

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;

      const total = await knex('loans').where({ tenant_id: tenantId }).count('* as count').first();
      const loans = await query
        .orderBy(filters.orderBy || 'created_at', filters.orderDirection || 'desc')
        .offset(offset)
        .limit(limit);

      return {
        data: loans,
        pagination: {
          page,
          limit,
          total: total.count,
          pages: Math.ceil(total.count / limit),
        },
      };
    } catch (error) {
      logger.error('❌ Error fetching loans with filters:', error);
      throw error;
    }
  }

  /**
   * Get loan summary dashboard data
   */
  async getLoansDashboard(tenantId) {
    try {
      const statuses = ['submitted', 'approved', 'active', 'suspended', 'closed', 'rejected'];
      const statusCounts = {};

      for (const status of statuses) {
        const result = await knex('loans')
          .where({ tenant_id: tenantId, status })
          .count('* as count')
          .first();
        statusCounts[status] = result.count;
      }

      // Get total amounts
      const activeLoans = await knex('loans')
        .where({ tenant_id: tenantId, status: 'active' })
        .sum('loan_amount as total')
        .first();

      const disbursedLoans = await knex('loans')
        .where({ tenant_id: tenantId })
        .whereNotNull('disbursed_date')
        .sum('disbursed_amount as total')
        .first();

      return {
        statusCounts,
        activeLoansAmount: activeLoans.total || 0,
        totalDisbursedAmount: disbursedLoans.total || 0,
      };
    } catch (error) {
      logger.error('❌ Error fetching loans dashboard:', error);
      throw error;
    }
  }
}

module.exports = new MoneyloanLoanService();
