/**
 * Money Loan - Payment Processing Service
 * Handles payment processing, allocation, schedules, and tracking
 */

const knex = require('../../../../config/database');
const logger = require('../../../../utils/logger');

class MoneyloanPaymentService {
  /**
   * Process a payment for a loan
   */
  async processPayment(tenantId, loanId, paymentData) {
    try {
      // Fetch loan details
      const loan = await knex('loans')
        .where({ tenant_id: tenantId, id: loanId })
        .first();

      if (!loan) {
        throw new Error('Loan not found');
      }

      // Get loan's pending balance and breakdown
      const loanBalance = await this.calculateLoanBalance(tenantId, loanId);

      // Validate payment amount
      if (paymentData.amount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      if (paymentData.amount > loanBalance.totalOutstanding) {
        throw new Error(`Payment amount exceeds outstanding balance (${loanBalance.totalOutstanding})`);
      }

      // Record payment
      const [paymentId] = await knex('loan_payments').insert({
        tenant_id: tenantId,
        loan_id: loanId,
        payment_date: new Date(),
        amount: paymentData.amount,
        payment_method: paymentData.paymentMethod || 'bank_transfer',
        reference_number: paymentData.referenceNumber,
        status: 'completed',
        description: paymentData.description,
        recorded_by: paymentData.recordedBy,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Allocate payment to loan components
      await this.allocatePayment(tenantId, loanId, paymentData.amount, paymentId);

      logger.info(`✅ Payment processed: ${paymentId} for loan ${loanId}`);

      return {
        paymentId,
        loanId,
        amount: paymentData.amount,
        status: 'completed',
        message: 'Payment processed successfully',
      };
    } catch (error) {
      logger.error('❌ Error processing payment:', error);
      throw error;
    }
  }

  /**
   * Allocate payment across principal, interest, fees, and penalties
   * Default allocation order: penalties → fees → interest → principal
   */
  async allocatePayment(tenantId, loanId, paymentAmount, paymentId, allocationOrder = null) {
    try {
      const order = allocationOrder || ['penalties', 'fees', 'interest', 'principal'];
      let remainingAmount = paymentAmount;

      const balance = await this.calculateLoanBalance(tenantId, loanId);

      // Allocate in specified order
      for (const component of order) {
        if (remainingAmount <= 0) break;

        const componentBalance = balance[`outstanding${this.capitalizeFirst(component)}`] || 0;

        if (componentBalance > 0) {
          const allocatedAmount = Math.min(remainingAmount, componentBalance);

          // Record allocation
          await knex('loan_payment_allocations').insert({
            payment_id: paymentId,
            loan_id: loanId,
            tenant_id: tenantId,
            component_type: component,
            allocated_amount: allocatedAmount,
            created_at: new Date(),
          });

          remainingAmount -= allocatedAmount;

          logger.info(`Allocated ${allocatedAmount} to ${component}`);
        }
      }

      return {
        paymentId,
        totalAllocated: paymentAmount - remainingAmount,
        remainingAmount,
      };
    } catch (error) {
      logger.error('❌ Error allocating payment:', error);
      throw error;
    }
  }

  /**
   * Calculate current balance on a loan (principal, interest, fees, penalties)
   */
  async calculateLoanBalance(tenantId, loanId) {
    try {
      const loan = await knex('loans')
        .where({ tenant_id: tenantId, id: loanId })
        .first();

      if (!loan) {
        throw new Error('Loan not found');
      }

      // Calculate paid amounts
      const payments = await knex('loan_payments')
        .where({ tenant_id: tenantId, loan_id: loanId, status: 'completed' });

      const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

      // Calculate interest accrued
      const loanAge = Math.ceil((Date.now() - new Date(loan.disbursed_date)) / (1000 * 60 * 60 * 24));
      const accruedInterest = this.calculateAccruedInterest(loan.loan_amount, loan.interest_rate, loanAge);

      // Calculate outstanding components
      const outstandingPrincipal = Math.max(0, loan.loan_amount - this.calculatePrincipalPaid(totalPaid, loan));
      const outstandingInterest = Math.max(0, accruedInterest - this.calculateInterestPaid(totalPaid, loan));
      const outstandingFees = Math.max(0, (loan.total_fees || 0) - this.calculateFeesPaid(totalPaid, loan));
      const outstandingPenalties = await this.calculateOutstandingPenalties(tenantId, loanId);

      return {
        loanId,
        loanAmount: loan.loan_amount,
        principalPaid: this.calculatePrincipalPaid(totalPaid, loan),
        interestPaid: this.calculateInterestPaid(totalPaid, loan),
        feesPaid: this.calculateFeesPaid(totalPaid, loan),
        penaltiesPaid: 0,
        totalPaid,
        outstandingPrincipal: Math.round(outstandingPrincipal * 100) / 100,
        outstandingInterest: Math.round(outstandingInterest * 100) / 100,
        outstandingFees: Math.round(outstandingFees * 100) / 100,
        outstandingPenalties: Math.round(outstandingPenalties * 100) / 100,
        totalOutstanding: Math.round((outstandingPrincipal + outstandingInterest + outstandingFees + outstandingPenalties) * 100) / 100,
        accruedInterest: Math.round(accruedInterest * 100) / 100,
      };
    } catch (error) {
      logger.error('❌ Error calculating loan balance:', error);
      throw error;
    }
  }

  /**
   * Get payment history for a loan
   */
  async getPaymentHistory(tenantId, loanId, limit = 50) {
    try {
      const payments = await knex('loan_payments')
        .where({ tenant_id: tenantId, loan_id: loanId })
        .orderBy('payment_date', 'desc')
        .limit(limit);

      // Enrich with allocation data
      const enrichedPayments = await Promise.all(
        payments.map(async (payment) => {
          const allocations = await knex('loan_payment_allocations')
            .where({ payment_id: payment.id });

          return {
            ...payment,
            allocations,
          };
        })
      );

      return enrichedPayments;
    } catch (error) {
      logger.error('❌ Error fetching payment history:', error);
      throw error;
    }
  }

  /**
   * Generate payment schedule for a loan
   */
  async generatePaymentSchedule(tenantId, loanId) {
    try {
      const loan = await knex('loans')
        .where({ tenant_id: tenantId, id: loanId })
        .first();

      if (!loan) {
        throw new Error('Loan not found');
      }

      const schedule = await knex('repayment_schedules')
        .where({ tenant_id: tenantId, loan_id: loanId })
        .orderBy('scheduled_date', 'asc');

      return {
        loanId,
        principalAmount: loan.loan_amount,
        interestRate: loan.interest_rate,
        loanTerm: loan.loan_term_days,
        disbursedDate: loan.disbursed_date,
        schedule: schedule.map((s) => ({
          installmentNumber: s.installment_number,
          scheduledDate: s.scheduled_date,
          principalDue: s.principal_due,
          interestDue: s.interest_due,
          totalDue: s.total_due,
          status: s.status,
        })),
      };
    } catch (error) {
      logger.error('❌ Error generating payment schedule:', error);
      throw error;
    }
  }

  /**
   * Apply late payment penalty
   */
  async applyLatePenalty(tenantId, loanId, scheduleId) {
    try {
      const schedule = await knex('repayment_schedules')
        .where({ tenant_id: tenantId, id: scheduleId })
        .first();

      if (!schedule || schedule.status !== 'overdue') {
        throw new Error('Only overdue payments can have penalties applied');
      }

      const daysOverdue = Math.floor((Date.now() - new Date(schedule.scheduled_date)) / (1000 * 60 * 60 * 24));
      const penaltyAmount = this.calculateLatePenalty(schedule.total_due, daysOverdue);

      // Record penalty
      const [penaltyId] = await knex('loan_penalties').insert({
        tenant_id: tenantId,
        loan_id: loanId,
        schedule_id: scheduleId,
        penalty_type: 'late_payment',
        penalty_amount: penaltyAmount,
        days_overdue: daysOverdue,
        status: 'active',
        created_at: new Date(),
      });

      logger.info(`✅ Late penalty applied: ${penaltyId}`);

      return {
        penaltyId,
        daysOverdue,
        penaltyAmount: Math.round(penaltyAmount * 100) / 100,
      };
    } catch (error) {
      logger.error('❌ Error applying late penalty:', error);
      throw error;
    }
  }

  /**
   * Helper: Calculate late penalty
   * Default: 1% per day overdue up to 10% max
   */
  calculateLatePenalty(amount, daysOverdue, dailyPenaltyRate = 0.01, maxPenaltyPercentage = 10) {
    const penaltyPercentage = Math.min(daysOverdue * (dailyPenaltyRate * 100), maxPenaltyPercentage);
    return amount * (penaltyPercentage / 100);
  }

  /**
   * Helper: Calculate accrued interest
   */
  calculateAccruedInterest(principal, annualRate, days) {
    const dailyRate = annualRate / 365 / 100;
    return principal * dailyRate * days;
  }

  /**
   * Helper: Calculate principal portion of payments
   */
  calculatePrincipalPaid(totalPaid, loan) {
    // In real implementation, this would use allocation data
    return Math.min(totalPaid * 0.7, loan.loan_amount); // Simplified
  }

  /**
   * Helper: Calculate interest portion of payments
   */
  calculateInterestPaid(totalPaid, loan) {
    return Math.min(totalPaid * 0.25, loan.total_interest || 0); // Simplified
  }

  /**
   * Helper: Calculate fees portion of payments
   */
  calculateFeesPaid(totalPaid, loan) {
    return Math.min(totalPaid * 0.05, loan.total_fees || 0); // Simplified
  }

  /**
   * Helper: Calculate outstanding penalties
   */
  async calculateOutstandingPenalties(tenantId, loanId) {
    try {
      const penalties = await knex('loan_penalties')
        .where({ tenant_id: tenantId, loan_id: loanId, status: 'active' });

      return penalties.reduce((sum, p) => sum + (p.penalty_amount || 0), 0);
    } catch (error) {
      logger.error('❌ Error calculating outstanding penalties:', error);
      return 0;
    }
  }

  /**
   * Helper: Capitalize first letter
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Record payment reversal
   */
  async reversePayment(tenantId, paymentId, reason) {
    try {
      const payment = await knex('loan_payments')
        .where({ tenant_id: tenantId, id: paymentId })
        .first();

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Update payment status
      await knex('loan_payments')
        .where({ id: paymentId })
        .update({
          status: 'reversed',
          updated_at: new Date(),
        });

      // Record reversal
      await knex('loan_payment_reversals').insert({
        tenant_id: tenantId,
        payment_id: paymentId,
        loan_id: payment.loan_id,
        reason,
        reversed_date: new Date(),
      });

      logger.info(`✅ Payment ${paymentId} reversed`);

      return {
        paymentId,
        status: 'reversed',
        reason,
      };
    } catch (error) {
      logger.error('❌ Error reversing payment:', error);
      throw error;
    }
  }
}

module.exports = new MoneyloanPaymentService();
