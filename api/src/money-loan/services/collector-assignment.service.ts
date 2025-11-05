import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { KnexService } from '../../database/knex.service';

@Injectable()
export class CollectorAssignmentService {
  constructor(private knexService: KnexService) {}

  /**
   * Check if a customer is assigned to a specific collector
   */
  async isCustomerAssignedTo(customerId: number, collectorId: number, tenantId: number): Promise<boolean> {
    const knex = this.knexService.instance;
    const customer = await knex('customers')
      .where({ 
        id: customerId, 
        assigned_employee_id: collectorId,
        tenant_id: tenantId 
      })
      .first();
    return !!customer;
  }

  /**
   * Verify collector has access to customer, throw if not
   */
  async verifyCustomerAccess(customerId: number, collectorId: number, tenantId: number): Promise<void> {
    const hasAccess = await this.isCustomerAssignedTo(customerId, collectorId, tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this customer');
    }
  }

  /**
   * Get collector's limits
   */
  async getCollectorLimits(collectorId: number, tenantId: number) {
    const knex = this.knexService.instance;
    const limits = await knex('money_loan_collector_limits')
      .where({ user_id: collectorId, tenant_id: tenantId, is_active: true })
      .first();

    if (!limits) {
      // Return default limits if none set
      return {
        maxApprovalAmount: 50000,
        maxApprovalPerDay: 10,
        maxDisbursementAmount: 100000,
        dailyDisbursementLimit: 500000,
        monthlyDisbursementLimit: 5000000,
        maxPenaltyWaiverAmount: 5000,
        maxPenaltyWaiverPercent: 50,
        requiresManagerApprovalAbove: 2000,
        maxCashCollectionPerTransaction: 50000,
      };
    }

    return limits;
  }

  /**
   * Check if collector can approve an application
   */
  async canApprove(collectorId: number, tenantId: number, amount: number): Promise<{ canApprove: boolean; reason?: string }> {
    const limits = await this.getCollectorLimits(collectorId, tenantId);
    
    if (amount > limits.maxApprovalAmount) {
      return { 
        canApprove: false, 
        reason: `Amount exceeds your approval limit of ₱${limits.maxApprovalAmount.toLocaleString()}` 
      };
    }

    // Check daily approval count
    const knex = this.knexService.instance;
    const today = new Date().toISOString().split('T')[0];
    const todayCount = await knex('money_loan_collector_action_logs')
      .where({ 
        collector_id: collectorId, 
        action_type: 'approve_application',
        status: 'success'
      })
      .whereRaw(`DATE(created_at) = ?`, [today])
      .count('* as count')
      .first();

    const count = parseInt(todayCount?.count as string || '0');
    if (count >= limits.maxApprovalPerDay) {
      return { 
        canApprove: false, 
        reason: `You have reached your daily approval limit of ${limits.maxApprovalPerDay} applications` 
      };
    }

    return { canApprove: true };
  }

  /**
   * Check if collector can disburse a loan
   */
  async canDisburse(collectorId: number, tenantId: number, amount: number): Promise<{ canDisburse: boolean; reason?: string }> {
    const limits = await this.getCollectorLimits(collectorId, tenantId);
    
    if (amount > limits.maxDisbursementAmount) {
      return { 
        canDisburse: false, 
        reason: `Amount exceeds your disbursement limit of ₱${limits.maxDisbursementAmount.toLocaleString()}` 
      };
    }

    const knex = this.knexService.instance;
    const today = new Date().toISOString().split('T')[0];
    
    // Check daily disbursement total
    const todayTotal = await knex('money_loan_loans')
      .where({ disbursed_by: collectorId, tenant_id: tenantId })
      .whereRaw(`DATE(disbursement_date) = ?`, [today])
      .sum('principal_amount as total')
      .first();

    const dailyTotal = parseFloat(todayTotal?.total as string || '0');
    if (dailyTotal + amount > limits.dailyDisbursementLimit) {
      return { 
        canDisburse: false, 
        reason: `This would exceed your daily disbursement limit of ₱${limits.dailyDisbursementLimit.toLocaleString()}` 
      };
    }

    // Check monthly disbursement total
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthTotal = await knex('money_loan_loans')
      .where({ disbursed_by: collectorId, tenant_id: tenantId })
      .where('disbursement_date', '>=', startOfMonth)
      .sum('principal_amount as total')
      .first();

    const monthlyTotal = parseFloat(monthTotal?.total as string || '0');
    if (monthlyTotal + amount > limits.monthlyDisbursementLimit) {
      return { 
        canDisburse: false, 
        reason: `This would exceed your monthly disbursement limit of ₱${limits.monthlyDisbursementLimit.toLocaleString()}` 
      };
    }

    return { canDisburse: true };
  }

  /**
   * Check if collector can waive a penalty
   */
  async canWaivePenalty(
    collectorId: number, 
    tenantId: number, 
    penaltyAmount: number, 
    waiverAmount: number
  ): Promise<{ canWaive: boolean; requiresApproval: boolean; reason?: string }> {
    const limits = await this.getCollectorLimits(collectorId, tenantId);
    const waiverPercent = (waiverAmount / penaltyAmount) * 100;

    if (waiverAmount > limits.maxPenaltyWaiverAmount) {
      return { 
        canWaive: false, 
        requiresApproval: false,
        reason: `Waiver amount exceeds your limit of ₱${limits.maxPenaltyWaiverAmount.toLocaleString()}` 
      };
    }

    if (waiverPercent > limits.maxPenaltyWaiverPercent) {
      return { 
        canWaive: false, 
        requiresApproval: false,
        reason: `Waiver percentage (${waiverPercent.toFixed(2)}%) exceeds your limit of ${limits.maxPenaltyWaiverPercent}%` 
      };
    }

    // If above threshold, requires manager approval
    if (waiverAmount > limits.requiresManagerApprovalAbove) {
      return { 
        canWaive: true, 
        requiresApproval: true,
        reason: 'Waiver requires manager approval'
      };
    }

    return { canWaive: true, requiresApproval: false };
  }

  /**
   * Log collector action
   */
  async logAction(actionData: {
    tenantId: number;
    collectorId: number;
    customerId: number;
    actionType: string;
    applicationId?: number;
    loanId?: number;
    paymentId?: number;
    amount?: number;
    previousValue?: any;
    newValue?: any;
    status?: string;
    notes?: string;
    locationLat?: number;
    locationLng?: number;
    deviceInfo?: any;
  }) {
    const knex = this.knexService.instance;
    
    await knex('money_loan_collector_action_logs').insert({
      tenant_id: actionData.tenantId,
      collector_id: actionData.collectorId,
      customer_id: actionData.customerId,
      action_type: actionData.actionType,
      application_id: actionData.applicationId,
      loan_id: actionData.loanId,
      payment_id: actionData.paymentId,
      amount: actionData.amount,
      previous_value: actionData.previousValue ? JSON.stringify(actionData.previousValue) : null,
      new_value: actionData.newValue ? JSON.stringify(actionData.newValue) : null,
      status: actionData.status || 'success',
      notes: actionData.notes,
      location_lat: actionData.locationLat,
      location_lng: actionData.locationLng,
      device_info: actionData.deviceInfo ? JSON.stringify(actionData.deviceInfo) : null,
    });
  }

  /**
   * Get today's usage for a collector
   */
  async getTodayUsage(collectorId: number, tenantId: number) {
    const knex = this.knexService.instance;
    const today = new Date().toISOString().split('T')[0];

    const [approvalsRaw, disbursementsRaw, paymentsRaw] = await Promise.all([
      // Approvals today
      knex('money_loan_collector_action_logs')
        .where({ 
          collector_id: collectorId, 
          tenant_id: tenantId,
          action_type: 'approve_application',
          status: 'success'
        })
        .whereRaw(`DATE(created_at) = ?`, [today])
        .select(knex.raw('COUNT(*) as count, COALESCE(SUM(amount), 0) as total')),
      
      // Disbursements today
      knex('money_loan_loans')
        .where({ disbursed_by: collectorId, tenant_id: tenantId })
        .whereRaw(`DATE(disbursement_date) = ?`, [today])
        .select(knex.raw('COUNT(*) as count, COALESCE(SUM(principal_amount), 0) as total')),
      
      // Collections today
      knex('money_loan_payments')
        .where({ received_by: collectorId, tenant_id: tenantId })
        .whereRaw(`DATE(payment_date) = ?`, [today])
        .select(knex.raw('COUNT(*) as count, COALESCE(SUM(amount), 0) as total')),
    ]);

    const approvals: any = approvalsRaw[0] || {};
    const disbursements: any = disbursementsRaw[0] || {};
    const payments: any = paymentsRaw[0] || {};

    return {
      approvals: {
        count: parseInt(approvals.count || '0'),
        total: parseFloat(approvals.total || '0'),
      },
      disbursements: {
        count: parseInt(disbursements.count || '0'),
        total: parseFloat(disbursements.total || '0'),
      },
      collections: {
        count: parseInt(payments.count || '0'),
        total: parseFloat(payments.total || '0'),
      },
    };
  }
}
