import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { KnexService } from '../../database/knex.service';
import { CollectorAssignmentService } from './collector-assignment.service';

@Injectable()
export class CollectorPenaltyWaiversService {
  constructor(
    private knexService: KnexService,
    private collectorAssignmentService: CollectorAssignmentService,
  ) {}

  /**
   * Request a penalty waiver
   */
  async requestWaiver(
    collectorId: number,
    tenantId: number,
    requestDto: {
      loanId: number;
      installmentId?: number;
      waiveType: 'full' | 'partial';
      requestedWaiverAmount: number;
      reason: string;
      notes?: string;
    },
  ) {
    const knex = this.knexService.instance;

    // Get loan
    const loan = await knex('money_loan_loans')
      .where({ id: requestDto.loanId, tenant_id: tenantId })
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

    // Calculate total current penalties
    let totalPenalties = 0;
    if (requestDto.installmentId) {
      const installment = await knex('money_loan_repayment_schedules')
        .where({ id: requestDto.installmentId })
        .first();
      totalPenalties = installment?.penalty_amount || 0;
    } else {
      const result = await knex('money_loan_repayment_schedules')
        .where({ loan_id: requestDto.loanId })
        .sum('penalty_amount as total')
        .first();
      totalPenalties = result?.total || 0;
    }

    // Validate waiver amount
    if (requestDto.requestedWaiverAmount > totalPenalties) {
      throw new BadRequestException(
        `Requested waiver amount (${requestDto.requestedWaiverAmount}) exceeds total penalties (${totalPenalties})`,
      );
    }

    // Check if collector can waive directly
    const canWaive = await this.collectorAssignmentService.canWaivePenalty(
      collectorId,
      tenantId,
      totalPenalties,
      requestDto.requestedWaiverAmount,
    );

    let status: 'pending' | 'approved' | 'auto_approved' = 'pending';
    let approvedBy: number | null = null;
    let approvedAt: Date | null = null;

    if (canWaive.canWaive) {
      // Auto-approve within limit
      status = 'auto_approved';
      approvedBy = collectorId;
      approvedAt = new Date();
    }

    // Create waiver request
    const [waiver] = await knex('money_loan_penalty_waivers')
      .insert({
        tenant_id: tenantId,
        loan_id: requestDto.loanId,
        installment_id: requestDto.installmentId,
        requested_by: collectorId,
        waive_type: requestDto.waiveType,
        original_penalty_amount: totalPenalties,
        requested_waiver_amount: requestDto.requestedWaiverAmount,
        approved_waiver_amount: canWaive.canWaive ? requestDto.requestedWaiverAmount : null,
        reason: requestDto.reason,
        status,
        approved_by: approvedBy,
        approved_at: approvedAt,
        notes: requestDto.notes,
      })
      .returning('*');

    // If auto-approved, apply the waiver
    if (status === 'auto_approved') {
      await this.applyWaiver(waiver, tenantId);
    }

    // Log action
    await this.collectorAssignmentService.logAction({
      tenantId,
      collectorId,
      customerId: loan.customer_id,
      actionType: 'request_penalty_waiver',
      loanId: requestDto.loanId,
      amount: requestDto.requestedWaiverAmount,
      status: canWaive.canWaive ? 'success' : 'pending_approval',
      notes: `${requestDto.reason}${requestDto.notes ? ` - ${requestDto.notes}` : ''}`,
    });

    return {
      waiver,
      autoApproved: canWaive.canWaive,
      appliedImmediately: canWaive.canWaive,
    };
  }

  /**
   * Apply an approved waiver to loan/installments
   */
  private async applyWaiver(waiver: any, tenantId: number) {
    const knex = this.knexService.instance;

    if (waiver.installment_id) {
      // Apply to specific installment
      const installment = await knex('money_loan_repayment_schedules')
        .where({ id: waiver.installment_id })
        .first();

      const newPenaltyAmount = Math.max(0, installment.penalty_amount - waiver.approved_waiver_amount);

      await knex('money_loan_repayment_schedules')
        .where({ id: waiver.installment_id })
        .update({
          penalty_amount: newPenaltyAmount,
          penalty_waived_amount: (installment.penalty_waived_amount || 0) + waiver.approved_waiver_amount,
          updated_at: knex.fn.now(),
        });
    } else {
      // Apply proportionally to all unpaid installments with penalties
      const installments = await knex('money_loan_repayment_schedules')
        .where({ loan_id: waiver.loan_id })
        .where('penalty_amount', '>', 0)
        .whereIn('status', ['pending', 'overdue']);

      let remainingWaiver = waiver.approved_waiver_amount;

      for (const installment of installments) {
        if (remainingWaiver <= 0) break;

        const waiverForInstallment = Math.min(installment.penalty_amount, remainingWaiver);
        const newPenaltyAmount = installment.penalty_amount - waiverForInstallment;

        await knex('money_loan_repayment_schedules')
          .where({ id: installment.id })
          .update({
            penalty_amount: newPenaltyAmount,
            penalty_waived_amount: (installment.penalty_waived_amount || 0) + waiverForInstallment,
            updated_at: knex.fn.now(),
          });

        remainingWaiver -= waiverForInstallment;
      }

      // Update loan total waived amount
      const loan = await knex('money_loan_loans')
        .where({ id: waiver.loan_id })
        .first();

      await knex('money_loan_loans')
        .where({ id: waiver.loan_id })
        .update({
          penalty_waived_amount: (loan.penalty_waived_amount || 0) + waiver.approved_waiver_amount,
          updated_at: knex.fn.now(),
        });
    }
  }

  /**
   * Get pending waiver requests for a collector
   */
  async getPendingWaivers(collectorId: number, tenantId: number) {
    const knex = this.knexService.instance;

    // Get customers assigned to this collector
    const assignments = await knex('money_loan_collector_assignments')
      .where({ collector_id: collectorId, tenant_id: tenantId, is_active: true })
      .pluck('customer_id');

    // Get pending waivers for these customers
    const waivers = await knex('money_loan_penalty_waivers as w')
      .select(
        'w.*',
        'l.loan_number',
        'c.first_name',
        'c.last_name',
        'c.id_number',
        'i.installment_number',
      )
      .leftJoin('money_loan_loans as l', 'w.loan_id', 'l.id')
      .leftJoin('customers as c', 'l.customer_id', 'c.id')
      .leftJoin('money_loan_repayment_schedules as i', 'w.installment_id', 'i.id')
      .where({ 'w.tenant_id': tenantId, 'w.status': 'pending' })
      .whereIn('l.customer_id', assignments)
      .orderBy('w.created_at', 'desc');

    return waivers;
  }

  /**
   * Get waiver request details
   */
  async getWaiverDetails(waiverId: number, collectorId: number, tenantId: number) {
    const knex = this.knexService.instance;

    const waiver = await knex('money_loan_penalty_waivers as w')
      .select(
        'w.*',
        'l.loan_number',
        'l.customer_id',
        'c.first_name',
        'c.last_name',
        'c.phone_number',
        'i.installment_number',
        'i.due_date',
        'i.penalty_amount as current_penalty',
        'req.username as requested_by_name',
        'app.username as approved_by_name',
      )
      .leftJoin('money_loan_loans as l', 'w.loan_id', 'l.id')
      .leftJoin('customers as c', 'l.customer_id', 'c.id')
      .leftJoin('money_loan_repayment_schedules as i', 'w.installment_id', 'i.id')
      .leftJoin('users as req', 'w.requested_by', 'req.id')
      .leftJoin('users as app', 'w.approved_by', 'app.id')
      .where({ 'w.id': waiverId, 'w.tenant_id': tenantId })
      .first();

    if (!waiver) {
      throw new BadRequestException('Waiver request not found');
    }

    // Verify customer is assigned to this collector
    await this.collectorAssignmentService.verifyCustomerAccess(
      waiver.customer_id,
      collectorId,
      tenantId,
    );

    return waiver;
  }
}
