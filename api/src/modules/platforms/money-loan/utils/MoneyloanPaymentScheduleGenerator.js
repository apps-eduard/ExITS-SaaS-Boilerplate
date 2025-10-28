/**
 * Money Loan - Payment Schedule Generator
 * Generates repayment schedules based on loan parameters
 */

const knex = require('../../../../config/database');
const logger = require('../../../../utils/logger');

class MoneyloanPaymentScheduleGenerator {
  /**
   * Generate payment schedule for a loan
   * @param {object} loan - Loan object
   * @param {string} frequency - Payment frequency: daily, weekly, monthly, quarterly
   * @param {string} type - Schedule type: fixed, flexible
   */
  async generatePaymentSchedule(tenantId, loan, frequency = 'monthly', type = 'fixed') {
    try {
      const schedule = [];
      const disbursalDate = new Date(loan.disbursed_date || new Date());
      let currentDate = new Date(disbursalDate);
      let remainingPrincipal = loan.loan_amount;

      // Calculate number of installments
      const installmentDays = this.getDaysPerPeriod(frequency);
      const totalInstallments = Math.ceil(loan.loan_term_days / installmentDays);

      // Calculate EMI (monthly payment)
      const emi = this.calculateEMI(loan.loan_amount, loan.interest_rate, totalInstallments);

      logger.info(`Generating ${totalInstallments} installments with EMI: ${emi}`);

      for (let i = 1; i <= totalInstallments; i++) {
        // Move to next payment date
        currentDate = this.addDays(currentDate, installmentDays);

        // Calculate interest for this period
        const daysInPeriod = installmentDays;
        const periodInterest = this.calculatePeriodInterest(remainingPrincipal, loan.interest_rate, daysInPeriod);

        // Calculate principal portion
        const principalDue = i === totalInstallments ? remainingPrincipal : emi - periodInterest;

        const totalDue = principalDue + periodInterest;
        remainingPrincipal -= principalDue;

        schedule.push({
          tenantId,
          loanId: loan.id,
          installmentNumber: i,
          scheduledDate: currentDate,
          principalDue: Math.round(principalDue * 100) / 100,
          interestDue: Math.round(periodInterest * 100) / 100,
          feesDue: 0,
          totalDue: Math.round(totalDue * 100) / 100,
          status: 'pending',
          remainingBalance: Math.max(0, remainingPrincipal),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Save schedule to database
      await knex('repayment_schedules').insert(schedule);

      logger.info(`✅ Payment schedule generated for loan ${loan.id} with ${schedule.length} installments`);

      return {
        loanId: loan.id,
        totalInstallments: schedule.length,
        emiPerInstallment: Math.round(emi * 100) / 100,
        totalPayable: Math.round(schedule.reduce((sum, s) => sum + s.totalDue, 0) * 100) / 100,
        schedule,
      };
    } catch (error) {
      logger.error('❌ Error generating payment schedule:', error);
      throw error;
    }
  }

  /**
   * Generate flexible payment schedule
   * Allows variable payment amounts based on borrower capacity
   */
  async generateFlexiblePaymentSchedule(tenantId, loan, milestones = []) {
    try {
      const schedule = [];
      const disbursalDate = new Date(loan.disbursed_date || new Date());
      let currentDate = new Date(disbursalDate);
      let remainingPrincipal = loan.loan_amount;

      // Use provided milestones or create default monthly ones
      const paymentMilestones = milestones.length > 0 ? milestones : this.generateDefaultMilestones(loan.loan_term_days);

      for (let i = 0; i < paymentMilestones.length; i++) {
        const milestone = paymentMilestones[i];

        // Calculate interest for this period
        const daysInPeriod = i === 0 ? milestone.days : milestone.days - paymentMilestones[i - 1].days;
        const periodInterest = this.calculatePeriodInterest(remainingPrincipal, loan.interest_rate, daysInPeriod);

        // Calculate principal due (flexible based on milestone)
        const principalDue = milestone.principalPercentage ? (remainingPrincipal * milestone.principalPercentage) / 100 : milestone.principalAmount || 0;

        const totalDue = principalDue + periodInterest;
        remainingPrincipal -= principalDue;

        currentDate = this.addDays(disbursalDate, milestone.days);

        schedule.push({
          tenantId,
          loanId: loan.id,
          installmentNumber: i + 1,
          scheduledDate: currentDate,
          principalDue: Math.round(principalDue * 100) / 100,
          interestDue: Math.round(periodInterest * 100) / 100,
          feesDue: 0,
          totalDue: Math.round(totalDue * 100) / 100,
          status: 'pending',
          remainingBalance: Math.max(0, remainingPrincipal),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Save schedule
      await knex('repayment_schedules').insert(schedule);

      logger.info(`✅ Flexible payment schedule generated for loan ${loan.id}`);

      return {
        loanId: loan.id,
        scheduleType: 'flexible',
        totalInstallments: schedule.length,
        totalPayable: Math.round(schedule.reduce((sum, s) => sum + s.totalDue, 0) * 100) / 100,
        schedule,
      };
    } catch (error) {
      logger.error('❌ Error generating flexible payment schedule:', error);
      throw error;
    }
  }

  /**
   * Generate default monthly milestones
   */
  generateDefaultMilestones(loanTermDays) {
    const milestones = [];
    const daysPerMonth = 30;
    const months = Math.ceil(loanTermDays / daysPerMonth);

    for (let i = 1; i <= months; i++) {
      milestones.push({
        days: i * daysPerMonth,
        principalPercentage: 100 / months, // Equal principal portions
      });
    }

    return milestones;
  }

  /**
   * Calculate interest for a period
   */
  calculatePeriodInterest(principal, annualRate, days) {
    const dailyRate = annualRate / 365 / 100;
    return principal * dailyRate * days;
  }

  /**
   * Calculate EMI (Equated Monthly Installment)
   */
  calculateEMI(principal, annualRate, months) {
    const monthlyRate = annualRate / 12 / 100;

    if (monthlyRate === 0) {
      return principal / months;
    }

    const numerator = monthlyRate * Math.pow(1 + monthlyRate, months);
    const denominator = Math.pow(1 + monthlyRate, months) - 1;

    return principal * (numerator / denominator);
  }

  /**
   * Add days to a date
   */
  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Get days per period
   */
  getDaysPerPeriod(frequency) {
    const frequencyMap = {
      daily: 1,
      weekly: 7,
      monthly: 30,
      quarterly: 90,
      yearly: 365,
    };

    return frequencyMap[frequency] || 30;
  }

  /**
   * Generate amortization table
   * Shows principal and interest breakdown for each payment
   */
  generateAmortizationTable(principal, annualRate, months) {
    const table = [];
    const monthlyRate = annualRate / 12 / 100;
    const emi = this.calculateEMI(principal, annualRate, months);

    let balance = principal;

    for (let i = 1; i <= months; i++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = emi - interestPayment;
      balance -= principalPayment;

      table.push({
        month: i,
        payment: Math.round(emi * 100) / 100,
        principal: Math.round(principalPayment * 100) / 100,
        interest: Math.round(interestPayment * 100) / 100,
        balance: Math.round(Math.max(0, balance) * 100) / 100,
      });
    }

    return table;
  }

  /**
   * Recalculate payment schedule after modification
   */
  async recalculatePaymentSchedule(tenantId, loan, modificationData) {
    try {
      // Delete existing schedule
      await knex('repayment_schedules').where({ loan_id: loan.id }).delete();

      // Generate new schedule with modified terms
      const newLoan = {
        ...loan,
        loan_amount: modificationData.newPrincipal || loan.loan_amount,
        interest_rate: modificationData.newInterestRate || loan.interest_rate,
        loan_term_days: modificationData.newTermDays || loan.loan_term_days,
      };

      const frequency = modificationData.frequency || 'monthly';
      const scheduleType = modificationData.scheduleType || 'fixed';

      if (scheduleType === 'flexible' && modificationData.milestones) {
        return await this.generateFlexiblePaymentSchedule(tenantId, newLoan, modificationData.milestones);
      } else {
        return await this.generatePaymentSchedule(tenantId, newLoan, frequency, scheduleType);
      }
    } catch (error) {
      logger.error('❌ Error recalculating payment schedule:', error);
      throw error;
    }
  }

  /**
   * Calculate remaining balance at a specific date
   */
  async calculateBalanceAtDate(loanId, targetDate) {
    try {
      const schedule = await knex('repayment_schedules')
        .where('loan_id', loanId)
        .where('scheduled_date', '<=', targetDate)
        .orderBy('scheduled_date', 'desc')
        .first();

      return schedule ? schedule.remainingBalance : 0;
    } catch (error) {
      logger.error('❌ Error calculating balance at date:', error);
      throw error;
    }
  }

  /**
   * Get next payment due
   */
  async getNextPaymentDue(loanId) {
    try {
      const nextPayment = await knex('repayment_schedules')
        .where('loan_id', loanId)
        .where('status', 'pending')
        .orderBy('scheduled_date', 'asc')
        .first();

      return nextPayment || null;
    } catch (error) {
      logger.error('❌ Error getting next payment due:', error);
      throw error;
    }
  }
}

module.exports = new MoneyloanPaymentScheduleGenerator();
