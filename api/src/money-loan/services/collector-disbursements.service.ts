import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { KnexService } from '../../database/knex.service';
import { CollectorAssignmentService } from './collector-assignment.service';

@Injectable()
export class CollectorDisbursementsService {
  constructor(
    private knexService: KnexService,
    private collectorAssignmentService: CollectorAssignmentService,
  ) {}

  /**
   * Disburse an approved loan (with limit check)
   */
  async disburseLoan(
    collectorId: number,
    tenantId: number,
    loanId: number,
    disburseDto: {
      disbursementMethod: 'cash' | 'bank_transfer' | 'mobile_money';
      referenceNumber?: string;
      notes?: string;
    },
  ) {
    const knex = this.knexService.instance;

    // Get loan
    const loan = await knex('money_loan_loans')
      .where({ id: loanId, tenant_id: tenantId })
      .first();

    if (!loan) {
      throw new BadRequestException('Loan not found');
    }

    if (loan.status !== 'approved') {
      throw new BadRequestException(`Loan is ${loan.status}, not ready for disbursement`);
    }

    // Verify customer is assigned to this collector
    await this.collectorAssignmentService.verifyCustomerAccess(
      loan.customer_id,
      collectorId,
      tenantId,
    );

    // Check disbursement limit
    const canDisburse = await this.collectorAssignmentService.canDisburse(
      collectorId,
      tenantId,
      loan.principal_amount,
    );

    if (!canDisburse.canDisburse) {
      throw new ForbiddenException(canDisburse.reason);
    }

    // Calculate net disbursement amount
    const netDisbursementAmount = loan.principal_amount - loan.processing_fee - loan.platform_fee;

    // Update loan status to 'active'
    const [updatedLoan] = await knex('money_loan_loans')
      .where({ id: loanId })
      .update({
        status: 'active',
        disbursed_by: collectorId,
        disbursed_at: knex.fn.now(),
        disbursed_amount: netDisbursementAmount,
        disbursement_method: disburseDto.disbursementMethod,
        disbursement_reference: disburseDto.referenceNumber,
        start_date: knex.fn.now(),
        updated_at: knex.fn.now(),
      })
      .returning('*');

    // Update corresponding application status to 'disbursed'
    if (loan.application_id) {
      await knex('money_loan_applications')
        .where({ id: loan.application_id, tenant_id: tenantId })
        .update({
          status: 'disbursed',
          updated_at: knex.fn.now(),
        });
    }

    // Generate repayment schedule
    await this.generateRepaymentSchedule(loanId, updatedLoan, tenantId);

    // Create payment record for fees (if any)
    if (loan.processing_fee > 0 || loan.platform_fee > 0) {
      await knex('money_loan_payments').insert({
        tenant_id: tenantId,
        loan_id: loanId,
        payment_type: 'fee_deduction',
        amount: loan.processing_fee + loan.platform_fee,
        payment_method: disburseDto.disbursementMethod,
        reference_number: disburseDto.referenceNumber,
        collected_by: collectorId,
        payment_date: knex.fn.now(),
        notes: `Processing fee: ${loan.processing_fee}, Platform fee: ${loan.platform_fee}`,
      });
    }

    // Log action
    await this.collectorAssignmentService.logAction({
      tenantId,
      collectorId,
      customerId: loan.customer_id,
      actionType: 'disburse_loan',
      loanId,
      amount: loan.principal_amount,
      previousValue: { status: 'approved' },
      newValue: {
        status: 'active',
        netDisbursed: netDisbursementAmount,
        method: disburseDto.disbursementMethod,
      },
      status: 'success',
      notes: disburseDto.notes,
    });

    return {
      loan: updatedLoan,
      netDisbursementAmount,
      deductions: {
        processingFee: loan.processing_fee,
        platformFee: loan.platform_fee,
        total: loan.processing_fee + loan.platform_fee,
      },
    };
  }

  /**
   * Generate repayment schedule for a loan
   */
  private async generateRepaymentSchedule(loanId: number, loan: any, tenantId: number) {
    const knex = this.knexService.instance;

    // Get product to determine payment frequency
    const product = await knex('money_loan_products')
      .where({ id: loan.loan_product_id })
      .first();

    const paymentFrequency = product.payment_frequency || 'monthly';
    const interestType = loan.interest_type || 'reducing_balance';

    // Calculate total interest
    let totalInterest: number;
    if (interestType === 'flat') {
      totalInterest = (loan.principal_amount * loan.interest_rate * loan.term_days) / 36500;
    } else {
      // Simple reducing balance approximation
      totalInterest = (loan.principal_amount * loan.interest_rate * loan.term_days) / 73000;
    }

    const totalAmount = loan.principal_amount + totalInterest;

    // Determine number of installments
    let numberOfInstallments: number;
    switch (paymentFrequency) {
      case 'daily':
        numberOfInstallments = loan.term_days;
        break;
      case 'weekly':
        numberOfInstallments = Math.ceil(loan.term_days / 7);
        break;
      case 'bi-weekly':
        numberOfInstallments = Math.ceil(loan.term_days / 14);
        break;
      case 'monthly':
        numberOfInstallments = Math.ceil(loan.term_days / 30);
        break;
      default:
        numberOfInstallments = Math.ceil(loan.term_days / 30);
    }

    const installmentAmount = totalAmount / numberOfInstallments;

    // Create schedule entries
    const scheduleEntries = [];
    let currentDate = new Date(loan.start_date);

    for (let i = 0; i < numberOfInstallments; i++) {
      // Calculate due date
      let dueDate = new Date(currentDate);
      switch (paymentFrequency) {
        case 'daily':
          dueDate.setDate(dueDate.getDate() + 1);
          break;
        case 'weekly':
          dueDate.setDate(dueDate.getDate() + 7);
          break;
        case 'bi-weekly':
          dueDate.setDate(dueDate.getDate() + 14);
          break;
        case 'monthly':
          dueDate.setMonth(dueDate.getMonth() + 1);
          break;
      }

      const principalPortion = loan.principal_amount / numberOfInstallments;
      const interestPortion = totalInterest / numberOfInstallments;

      scheduleEntries.push({
        tenant_id: tenantId,
        loan_id: loanId,
        installment_number: i + 1,
        due_date: dueDate,
        principal_amount: principalPortion,
        interest_amount: interestPortion,
        total_amount: installmentAmount,
        status: 'pending',
      });

      currentDate = dueDate;
    }

    await knex('money_loan_repayment_schedules').insert(scheduleEntries);
  }

  /**
   * Request manager approval for disbursement above limit
   */
  async requestDisbursementApproval(
    collectorId: number,
    tenantId: number,
    loanId: number,
    requestDto: {
      notes: string;
    },
  ) {
    const knex = this.knexService.instance;

    // Get loan
    const loan = await knex('money_loan_loans')
      .where({ id: loanId, tenant_id: tenantId })
      .first();

    if (!loan) {
      throw new BadRequestException('Loan not found');
    }

    // Verify customer is assigned to this collector
    await this.collectorAssignmentService.verifyCustomerAccess(
      loan.customer_id,
      collectorId,
      tenantId,
    );

    // Log action
    await this.collectorAssignmentService.logAction({
      tenantId,
      collectorId,
      customerId: loan.customer_id,
      actionType: 'request_disbursement_approval',
      loanId,
      amount: loan.principal_amount,
      status: 'pending_approval',
      notes: requestDto.notes,
    });

    return {
      message: 'Disbursement approval requested',
      loanId,
      amount: loan.principal_amount,
    };
  }
}
