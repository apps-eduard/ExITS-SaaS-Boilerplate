import { Injectable, BadRequestException } from '@nestjs/common';
import { KnexService } from '../../database/knex.service';
import { CollectorAssignmentService } from './collector-assignment.service';

@Injectable()
export class CollectorPenaltyWaiversService {
  constructor(
    private knexService: KnexService,
    private collectorAssignmentService: CollectorAssignmentService,
  ) {}

  private waiverColumnCache: Record<string, boolean> = {};

  private async waiverHasColumn(column: string): Promise<boolean> {
    if (this.waiverColumnCache[column] !== undefined) {
      return this.waiverColumnCache[column];
    }

    const knex = this.knexService.instance;
    try {
      const exists = await knex.schema.hasColumn('money_loan_penalty_waivers', column);
      this.waiverColumnCache[column] = exists;
      return exists;
    } catch (error) {
      console.error('❌ [CollectorPenaltyWaiversService] Failed to inspect waiver column', {
        column,
        error,
      });
      this.waiverColumnCache[column] = false;
      return false;
    }
  }

  private toNumber(value: any, fallback: number | null = 0): number | null {
    if (value === null || value === undefined) {
      return fallback;
    }

    try {
      const normalized = typeof value === 'bigint' ? Number(value) : Number(value);
      return Number.isFinite(normalized) ? normalized : fallback;
    } catch (error) {
      console.error('❌ [CollectorPenaltyWaiversService] Failed to coerce number', {
        value,
        fallback,
        error,
      });
      return fallback;
    }
  }

  private toString(value: any, fallback: string | null = ''): string | null {
    if (value === null || value === undefined) {
      return fallback;
    }

    try {
      return String(value);
    } catch (error) {
      console.error('❌ [CollectorPenaltyWaiversService] Failed to coerce string', {
        value,
        fallback,
        error,
      });
      return fallback;
    }
  }

  private toIsoString(value: any): string | null {
    if (!value) {
      return null;
    }

    try {
      if (value instanceof Date) {
        return value.toISOString();
      }

      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? this.toString(value, null) : date.toISOString();
    } catch (error) {
      console.error('❌ [CollectorPenaltyWaiversService] Failed to coerce ISO string', {
        value,
        error,
      });
      return this.toString(value, null);
    }
  }

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

    const [
      hasInstallmentIdColumn,
      hasWaiveTypeColumn,
      hasRequestedAmountColumn,
      hasApprovedAmountColumn,
      hasNotesColumn,
      hasWaivedAmountColumn,
      hasRemainingPenaltyColumn,
      hasWaiverPercentageColumn,
      hasDetailedJustificationColumn,
      hasSupportingDocumentsColumn,
      hasRequestedAtColumn,
      hasCreatedAtColumn,
      hasUpdatedAtColumn,
    ] = await Promise.all([
      this.waiverHasColumn('installment_id'),
      this.waiverHasColumn('waive_type'),
      this.waiverHasColumn('requested_waiver_amount'),
      this.waiverHasColumn('approved_waiver_amount'),
      this.waiverHasColumn('notes'),
      this.waiverHasColumn('waived_amount'),
      this.waiverHasColumn('remaining_penalty'),
      this.waiverHasColumn('waiver_percentage'),
      this.waiverHasColumn('detailed_justification'),
      this.waiverHasColumn('supporting_documents'),
      this.waiverHasColumn('requested_at'),
      this.waiverHasColumn('created_at'),
      this.waiverHasColumn('updated_at'),
    ]);

  const waiverAmount = requestDto.requestedWaiverAmount;
  const approvedAmount = canWaive.canWaive ? waiverAmount : null;

    const insertPayload: Record<string, any> = {
      tenant_id: tenantId,
      loan_id: requestDto.loanId,
      customer_id: loan.customer_id,
      original_penalty_amount: totalPenalties,
      requested_by: collectorId,
      reason: requestDto.reason,
      status,
      approved_by: approvedBy,
      approved_at: approvedAt,
    };

    if (hasInstallmentIdColumn) {
      insertPayload.installment_id = requestDto.installmentId ?? null;
    }

    if (hasWaiveTypeColumn) {
      insertPayload.waive_type = requestDto.waiveType;
    }

    if (hasRequestedAmountColumn) {
      insertPayload.requested_waiver_amount = waiverAmount;
    }

    if (hasApprovedAmountColumn) {
      insertPayload.approved_waiver_amount = approvedAmount;
    }

    if (hasNotesColumn) {
      insertPayload.notes = requestDto.notes ?? null;
    }

    if (hasDetailedJustificationColumn) {
      insertPayload.detailed_justification = requestDto.notes ?? requestDto.reason;
    }

    if (hasSupportingDocumentsColumn) {
      insertPayload.supporting_documents = null;
    }

    if (hasWaivedAmountColumn) {
      insertPayload.waived_amount = approvedAmount ?? waiverAmount;
    }

    if (hasRemainingPenaltyColumn) {
      const remaining = totalPenalties - (approvedAmount ?? waiverAmount);
      insertPayload.remaining_penalty = remaining < 0 ? 0 : remaining;
    }

    if (hasWaiverPercentageColumn) {
      insertPayload.waiver_percentage = totalPenalties > 0 ? ((approvedAmount ?? waiverAmount) / totalPenalties) * 100 : 0;
    }

    if (hasRequestedAtColumn) {
      insertPayload.requested_at = knex.fn.now();
    }

    if (hasCreatedAtColumn) {
      insertPayload.created_at = knex.fn.now();
    }

    if (hasUpdatedAtColumn) {
      insertPayload.updated_at = knex.fn.now();
    }

    const [waiver] = await knex('money_loan_penalty_waivers')
      .insert(insertPayload)
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

    const approvedAmount = Number(
      waiver?.approved_waiver_amount ??
      waiver?.waived_amount ??
      waiver?.requested_waiver_amount ??
      0,
    );

    if (!approvedAmount || Number.isNaN(approvedAmount) || approvedAmount <= 0) {
      return;
    }

    if (waiver.installment_id) {
      const installment = await knex('money_loan_repayment_schedules')
        .where({ id: waiver.installment_id })
        .first();

      if (installment) {
        const newPenaltyAmount = Math.max(0, (installment.penalty_amount || 0) - approvedAmount);

        await knex('money_loan_repayment_schedules')
          .where({ id: waiver.installment_id })
          .update({
            penalty_amount: newPenaltyAmount,
            penalty_waived_amount: (installment.penalty_waived_amount || 0) + approvedAmount,
            updated_at: knex.fn.now(),
          });
      }
    } else {
      const installments = await knex('money_loan_repayment_schedules')
        .where({ loan_id: waiver.loan_id })
        .where('penalty_amount', '>', 0)
        .whereIn('status', ['pending', 'overdue']);

      let remainingWaiver = approvedAmount;

      for (const installment of installments) {
        if (remainingWaiver <= 0) {
          break;
        }

        const penaltyAmount = Number(installment.penalty_amount ?? 0);
        const waiverForInstallment = Math.min(penaltyAmount, remainingWaiver);
        const newPenaltyAmount = penaltyAmount - waiverForInstallment;

        await knex('money_loan_repayment_schedules')
          .where({ id: installment.id })
          .update({
            penalty_amount: newPenaltyAmount,
            penalty_waived_amount: (installment.penalty_waived_amount || 0) + waiverForInstallment,
            updated_at: knex.fn.now(),
          });

        remainingWaiver -= waiverForInstallment;
      }

      const loanRow = await knex('money_loan_loans')
        .where({ id: waiver.loan_id })
        .first();

      if (loanRow) {
        await knex('money_loan_loans')
          .where({ id: waiver.loan_id })
          .update({
            penalty_waived_amount: (loanRow.penalty_waived_amount || 0) + approvedAmount,
            updated_at: knex.fn.now(),
          });
      }
    }
  }

  /**
   * Get pending waiver requests for a collector
   */
  async getPendingWaivers(collectorId: number, tenantId: number) {
    const knex = this.knexService.instance;

    const normalizeIds = (items: unknown[]): number[] =>
      (items || [])
        .map((value) => {
          try {
            const coerced = Number(value);
            return Number.isFinite(coerced) ? coerced : null;
          } catch (error) {
            console.error('❌ [CollectorPenaltyWaiversService] Failed to normalize ID', {
              value,
              error,
            });
            return null;
          }
        })
        .filter((value): value is number => value !== null);

    let explicitAssignmentsRaw: unknown[] = [];
    try {
      explicitAssignmentsRaw = await knex('money_loan_collector_assignments')
        .where({ collector_id: collectorId, tenant_id: tenantId, is_active: true })
        .pluck('customer_id');
    } catch (error: any) {
      if (error?.code === '42P01') {
        console.warn('⚠️ [CollectorPenaltyWaiversService] Collector assignment table missing, using direct assignments only');
        explicitAssignmentsRaw = [];
      } else {
        throw error;
      }
    }

    const directAssignmentsRaw = await knex('customers')
      .where({ assigned_employee_id: collectorId, tenant_id: tenantId })
      .pluck('id');

    const assignmentIds = normalizeIds([
      ...(explicitAssignmentsRaw as unknown[]),
      ...(directAssignmentsRaw as unknown[]),
    ]);

    if (!assignmentIds.length) {
      console.log('ℹ️ [CollectorPenaltyWaiversService] No assigned customers for collector', collectorId);
      return [];
    }

    // Get pending waivers for these customers
    let waiversRaw: any[];
    try {
      waiversRaw = await knex('money_loan_penalty_waivers as w')
        .select(
          'w.*',
          'l.loan_number',
          'l.customer_id',
          'c.first_name',
          'c.last_name',
          'c.id_number',
          'i.installment_number',
        )
        .leftJoin('money_loan_loans as l', 'w.loan_id', 'l.id')
        .leftJoin('customers as c', 'l.customer_id', 'c.id')
        .leftJoin('money_loan_repayment_schedules as i', 'w.installment_id', 'i.id')
        .where({ 'w.tenant_id': tenantId, 'w.status': 'pending' })
        .whereIn('l.customer_id', assignmentIds)
        .orderBy('w.created_at', 'desc');
    } catch (error: any) {
      if (error?.code !== '42703') {
        throw error;
      }

      console.warn('⚠️ [CollectorPenaltyWaiversService] Falling back to legacy waiver schema (missing column)', {
        code: error.code,
        message: error.message,
      });

      waiversRaw = await knex('money_loan_penalty_waivers as w')
        .select(
          'w.*',
          'l.loan_number',
          'l.customer_id',
          'c.first_name',
          'c.last_name',
          'c.id_number'
        )
        .leftJoin('money_loan_loans as l', 'w.loan_id', 'l.id')
        .leftJoin('customers as c', 'l.customer_id', 'c.id')
        .where({ 'w.tenant_id': tenantId, 'w.status': 'pending' })
        .whereIn('l.customer_id', assignmentIds)
        .orderBy('w.created_at', 'desc');
    }

    const waivers = (waiversRaw || []).map((row: any) => {
      const id = this.toNumber(row.id, null);
      const loanId = this.toNumber(row.loan_id, null);
      const installmentId = this.toNumber(row.installment_id, null);
      const installmentNumber = this.toNumber(row.installment_number, null);
      const originalPenaltyAmount = this.toNumber(row.original_penalty_amount, 0) ?? 0;
      const requestedWaiverAmountRaw =
        row.requested_waiver_amount ?? row.waived_amount ?? row.waiverAmount ?? null;
      const requestedWaiverAmount = this.toNumber(requestedWaiverAmountRaw, 0) ?? 0;

      const approvedWaiverAmountRaw =
        row.approved_waiver_amount ?? (row.status === 'approved' || row.status === 'auto_approved'
          ? (row.waived_amount ?? row.waiverAmount)
          : null);
      const approvedWaiverAmount = approvedWaiverAmountRaw !== null && approvedWaiverAmountRaw !== undefined
        ? this.toNumber(approvedWaiverAmountRaw, 0)
        : null;

      const requestedBy = this.toNumber(row.requested_by, null);
      const approvedBy = row.approved_by !== null && row.approved_by !== undefined
        ? this.toNumber(row.approved_by, null)
        : null;
      const waiverPercentage = this.toNumber(row.waiver_percentage, null);
      const waiveTypeValue = row.waive_type
        ? this.toString(row.waive_type, 'partial')
        : waiverPercentage !== null && waiverPercentage >= 99.99
          ? 'full'
          : 'partial';

      return {
        id,
        loanId,
        loanNumber: this.toString(row.loan_number, null),
        customerId: this.toNumber(row.customer_id, null),
        customerName: [row.first_name, row.last_name].filter((part) => !!part).join(' ').trim() || this.toString(row.id_number, null) || null,
        customerIdNumber: this.toString(row.id_number, null),
        installmentId,
        installmentNumber,
        waiveType: waiveTypeValue,
        originalPenaltyAmount,
        requestedWaiverAmount,
        approvedWaiverAmount,
        status: this.toString(row.status, 'pending'),
        reason: this.toString(row.reason, null),
        notes: this.toString(row.notes ?? row.detailed_justification, null),
        requestedBy,
        requestedByName: this.toString(row.requested_by_name, null),
        approvedBy,
        approvedByName: this.toString(row.approved_by_name, null),
        requestedAt: this.toIsoString(row.requested_at ?? row.created_at),
        approvedAt: this.toIsoString(row.approved_at),
        updatedAt: this.toIsoString(row.updated_at ?? row.approved_at ?? row.created_at),
        createdAt: this.toIsoString(row.created_at),
      };
    });

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
