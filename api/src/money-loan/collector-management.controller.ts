import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { KnexService } from '../database/knex.service';
import { CollectorAssignmentService } from './services/collector-assignment.service';

@Controller('money-loan')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CollectorManagementController {
  constructor(
    private readonly knexService: KnexService,
    private readonly collectorAssignmentService: CollectorAssignmentService,
  ) {}

  // ==================== COLLECTOR LIMITS ====================

  @Get('collector-limits')
  @Permissions('money-loan:collector-management:read')
  async getCollectorLimits(@Req() req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    const knex = this.knexService.instance;
    
    // Get all collectors with their limits
    const collectors = await knex('users as u')
      .select(
        'u.id',
        'u.email',
        'u.first_name as firstName',
        'u.last_name as lastName',
        'ep.employee_code as employeeCode',
        'ep.position',
        'cl.max_approval_amount as maxApprovalAmount',
        'cl.max_approval_per_day as maxApprovalPerDay',
        'cl.max_disbursement_amount as maxDisbursementAmount',
        'cl.daily_disbursement_limit as dailyDisbursementLimit',
        'cl.monthly_disbursement_limit as monthlyDisbursementLimit',
        'cl.max_penalty_waiver_amount as maxPenaltyWaiverAmount',
        'cl.max_penalty_waiver_percent as maxPenaltyWaiverPercent',
        'cl.requires_manager_approval_above as requiresManagerApprovalAbove',
        'cl.max_cash_collection_per_transaction as maxCashCollectionPerTransaction',
        'cl.is_active as isActive'
      )
      .leftJoin('employee_profiles as ep', 'ep.user_id', 'u.id')
      .leftJoin('employee_product_access as epa', function() {
        this.on('epa.user_id', '=', 'u.id')
          .andOn('epa.platform_type', '=', knex.raw('?', ['money_loan']))
          .andOn('epa.status', '=', knex.raw('?', ['active']));
      })
      .leftJoin('money_loan_collector_limits as cl', function() {
        this.on('cl.user_id', '=', 'u.id')
          .andOn('cl.tenant_id', '=', knex.raw('?', [tenantId]));
      })
      .where('u.tenant_id', tenantId)
      .where('u.status', 'active')
      .whereNotNull('ep.id')
      .whereNotNull('epa.id')
      .groupBy('u.id', 'u.email', 'u.first_name', 'u.last_name', 
               'ep.employee_code', 'ep.position', 'cl.max_approval_amount', 
               'cl.max_approval_per_day', 'cl.max_disbursement_amount',
               'cl.daily_disbursement_limit', 'cl.monthly_disbursement_limit',
               'cl.max_penalty_waiver_amount', 'cl.max_penalty_waiver_percent',
               'cl.requires_manager_approval_above', 'cl.max_cash_collection_per_transaction',
               'cl.is_active');

    // Add assignment counts
    const assignmentCounts = await knex('customers')
      .select('assigned_employee_id as collectorId')
      .count('* as customerCount')
      .where('tenant_id', tenantId)
      .whereNotNull('assigned_employee_id')
      .groupBy('assigned_employee_id');

    const countMap = assignmentCounts.reduce((acc, item) => {
      acc[item.collectorId] = parseInt(item.customerCount as string);
      return acc;
    }, {});

    // Get today's usage
    const today = new Date().toISOString().split('T')[0];
    const usageData = await knex('money_loan_collector_action_logs')
      .select('collector_id')
      .count('* as actionCount')
      .sum('amount as totalAmount')
      .where('tenant_id', tenantId)
      .whereRaw(`DATE(created_at) = ?`, [today])
      .groupBy('collector_id');

    const usageMap = usageData.reduce((acc, item) => {
      acc[item.collector_id] = {
        actionCount: parseInt(item.actionCount as string),
        totalAmount: parseFloat(item.totalAmount as string || '0'),
      };
      return acc;
    }, {});

    const result = collectors.map(collector => ({
      ...collector,
      currentCustomers: countMap[collector.id] || 0,
      todayActions: usageMap[collector.id]?.actionCount || 0,
      todayAmount: usageMap[collector.id]?.totalAmount || 0,
      // Set defaults if no limits configured
      maxApprovalAmount: collector.maxApprovalAmount || 50000,
      maxApprovalPerDay: collector.maxApprovalPerDay || 10,
      maxDisbursementAmount: collector.maxDisbursementAmount || 100000,
      dailyDisbursementLimit: collector.dailyDisbursementLimit || 500000,
      monthlyDisbursementLimit: collector.monthlyDisbursementLimit || 5000000,
      maxPenaltyWaiverAmount: collector.maxPenaltyWaiverAmount || 5000,
      maxPenaltyWaiverPercent: collector.maxPenaltyWaiverPercent || 50,
      requiresManagerApprovalAbove: collector.requiresManagerApprovalAbove || 2000,
      maxCashCollectionPerTransaction: collector.maxCashCollectionPerTransaction || 50000,
      isActive: collector.isActive !== false,
    }));

    return {
      success: true,
      data: result,
    };
  }

  @Put('collector-limits/:id')
  @Permissions('money-loan:collector-management:update')
  async updateCollectorLimits(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const collectorId = parseInt(id, 10);
    if (Number.isNaN(collectorId)) {
      throw new BadRequestException('Invalid collector id');
    }

    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    const knex = this.knexService.instance;

    // Check if limits exist
    const existing = await knex('money_loan_collector_limits')
      .where({ user_id: collectorId, tenant_id: tenantId })
      .first();

    const limitsData = {
      user_id: collectorId,
      tenant_id: tenantId,
      max_approval_amount: body.maxApprovalAmount,
      max_approval_per_day: body.maxApprovalPerDay,
      max_disbursement_amount: body.maxDisbursementAmount,
      daily_disbursement_limit: body.dailyDisbursementLimit,
      monthly_disbursement_limit: body.monthlyDisbursementLimit,
      max_penalty_waiver_amount: body.maxPenaltyWaiverAmount,
      max_penalty_waiver_percent: body.maxPenaltyWaiverPercent,
      requires_manager_approval_above: body.requiresManagerApprovalAbove,
      max_cash_collection_per_transaction: body.maxCashCollectionPerTransaction,
      is_active: body.isActive !== false,
      updated_at: knex.fn.now(),
    };

    if (existing) {
      await knex('money_loan_collector_limits')
        .where({ user_id: collectorId, tenant_id: tenantId })
        .update(limitsData);
    } else {
      await knex('money_loan_collector_limits').insert({
        ...limitsData,
        created_at: knex.fn.now(),
      });
    }

    return {
      success: true,
      message: 'Collector limits updated successfully',
    };
  }

  // ==================== COLLECTOR PERFORMANCE ====================

  @Get('collector-performance')
  @Permissions('money-loan:collector-management:read')
  async getCollectorPerformance(@Req() req: any, @Query('period') period: string = 'today') {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    const knex = this.knexService.instance;
    
    // Calculate date range based on period
    let startDate: Date;
    const endDate = new Date();
    
    switch (period) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
    }

    // Get all collectors with their performance metrics
    const collectors = await knex('users as u')
      .select(
        'u.id',
        'u.email',
        'u.first_name as firstName',
        'u.last_name as lastName',
        'ep.employee_code as employeeCode',
        'ep.position'
      )
      .leftJoin('employee_profiles as ep', 'ep.user_id', 'u.id')
      .leftJoin('employee_product_access as epa', function() {
        this.on('epa.user_id', '=', 'u.id')
          .andOn('epa.platform_type', '=', knex.raw('?', ['money_loan']))
          .andOn('epa.status', '=', knex.raw('?', ['active']));
      })
      .where('u.tenant_id', tenantId)
      .where('u.status', 'active')
      .whereNotNull('ep.id')
      .whereNotNull('epa.id')
      .groupBy('u.id', 'u.email', 'u.first_name', 'u.last_name', 'ep.employee_code', 'ep.position');

    // Get performance data for each collector
    const performanceData = await Promise.all(collectors.map(async (collector) => {
      // Applications approved
      const approvals = await knex('money_loan_collector_action_logs')
        .where({ 
          collector_id: collector.id,
          tenant_id: tenantId,
          action_type: 'approve_application',
          status: 'success'
        })
        .whereBetween('created_at', [startDate, endDate])
        .select(knex.raw('COUNT(*) as count, COALESCE(SUM(amount), 0) as total'))
        .first();

      // Disbursements
      const disbursements = await knex('money_loan_loans')
        .where({ 
          disbursed_by: collector.id,
          tenant_id: tenantId
        })
        .whereBetween('disbursement_date', [startDate, endDate])
        .select(knex.raw('COUNT(*) as count, COALESCE(SUM(principal_amount), 0) as total'))
        .first();

      // Collections
      const collections = await knex('money_loan_payments')
        .where({ 
          received_by: collector.id,
          tenant_id: tenantId
        })
        .whereBetween('payment_date', [startDate, endDate])
        .select(knex.raw('COUNT(*) as count, COALESCE(SUM(amount), 0) as total'))
        .first();

      // Customer visits
      const visitsRaw = await knex('money_loan_collector_action_logs')
        .where({ 
          collector_id: collector.id,
          tenant_id: tenantId,
          action_type: 'customer_visit'
        })
        .whereBetween('created_at', [startDate, endDate])
        .count('* as count')
        .first();

      // Active assignments
      const assignmentsRaw = await knex('customers')
        .where({ 
          assigned_employee_id: collector.id,
          tenant_id: tenantId
        })
        .count('* as count')
        .first();

      const visits: any = visitsRaw || {};
      const assignments: any = assignmentsRaw || {};

      return {
        ...collector,
        employeeName: `${collector.firstName} ${collector.lastName}`,
        approvalsCount: parseInt((approvals as any)?.count || '0'),
        approvalsAmount: parseFloat((approvals as any)?.total || '0'),
        disbursementsCount: parseInt((disbursements as any)?.count || '0'),
        disbursementsAmount: parseFloat((disbursements as any)?.total || '0'),
        collectionsCount: parseInt((collections as any)?.count || '0'),
        collectionsAmount: parseFloat((collections as any)?.total || '0'),
        visitsCount: parseInt(visits.count || '0'),
        activeAssignments: parseInt(assignments.count || '0'),
      };
    }));

    return {
      success: true,
      data: performanceData,
    };
  }

  // ==================== ACTION LOGS ====================

  @Get('collector-action-logs')
  @Permissions('money-loan:collector-management:read')
  async getCollectorActionLogs(
    @Req() req: any,
    @Query('collectorId') collectorId?: string,
    @Query('actionType') actionType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit: string = '100'
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    const knex = this.knexService.instance;
    
    let query = knex('money_loan_collector_action_logs as cal')
      .select(
        'cal.id',
        'cal.collector_id as collectorId',
        'cal.customer_id as customerId',
        'cal.action_type as actionType',
        'cal.application_id as applicationId',
        'cal.loan_id as loanId',
        'cal.payment_id as paymentId',
        'cal.amount',
        'cal.previous_value as previousValue',
        'cal.new_value as newValue',
        'cal.status',
        'cal.notes',
        'cal.location_lat as locationLat',
        'cal.location_lng as locationLng',
        'cal.created_at as createdAt',
        knex.raw(`CONCAT(u.first_name, ' ', u.last_name) as collectorName`),
        knex.raw(`CONCAT(c.first_name, ' ', c.last_name) as customerName`)
      )
      .leftJoin('users as u', 'u.id', 'cal.collector_id')
      .leftJoin('customers as c', 'c.id', 'cal.customer_id')
      .where('cal.tenant_id', tenantId)
      .orderBy('cal.created_at', 'desc')
      .limit(parseInt(limit, 10) || 100);

    if (collectorId) {
      query = query.where('cal.collector_id', parseInt(collectorId, 10));
    }

    if (actionType) {
      query = query.where('cal.action_type', actionType);
    }

    if (startDate) {
      query = query.where('cal.created_at', '>=', new Date(startDate));
    }

    if (endDate) {
      query = query.where('cal.created_at', '<=', new Date(endDate));
    }

    const logs = await query;

    return {
      success: true,
      data: logs,
    };
  }

  // ==================== COLLECTOR ROUTES ====================

  @Get('collector-routes/:id')
  @Permissions('money-loan:customers:read')
  async getCollectorRoute(@Param('id') id: string, @Req() req: any) {
    const collectorId = parseInt(id, 10);
    if (Number.isNaN(collectorId)) {
      throw new BadRequestException('Invalid collector id');
    }

    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    const knex = this.knexService.instance;

    // Get assigned customers with loan info
    const customers = await knex('customers as c')
      .select(
        'c.id',
        'c.first_name as firstName',
        'c.last_name as lastName',
        'c.phone',
        'c.email',
        'a.street_address as address',
        'a.city',
        'a.province',
        'a.latitude',
        'a.longitude',
        knex.raw('COUNT(DISTINCT l.id) as totalLoans'),
        knex.raw('SUM(CASE WHEN l.status = ? THEN 1 ELSE 0 END) as activeLoans', ['active']),
        knex.raw('COALESCE(SUM(l.outstanding_balance), 0) as totalOutstanding')
      )
      .leftJoin('addresses as a', 'a.customer_id', 'c.id')
      .leftJoin('money_loan_loans as l', 'l.customer_id', 'c.id')
      .where('c.assigned_employee_id', collectorId)
      .where('c.tenant_id', tenantId)
      .groupBy('c.id', 'c.first_name', 'c.last_name', 'c.phone', 'c.email',
               'a.street_address', 'a.city', 'a.province', 'a.latitude', 'a.longitude');

    return {
      success: true,
      data: customers,
    };
  }

  // ==================== PENALTY WAIVERS ====================

  @Get('penalty-waivers')
  @Permissions('money-loan:collector-management:read')
  async getPenaltyWaivers(
    @Req() req: any,
    @Query('status') status?: string
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    const knex = this.knexService.instance;

    let query = knex('money_loan_penalty_waivers as pw')
      .select(
        'pw.id',
        'pw.loan_id as loanId',
        'pw.customer_id as customerId',
        'pw.requested_by as requestedBy',
        'pw.original_penalty_amount as penaltyAmount',
        'pw.waived_amount as waiverAmount',
        'pw.waiver_percentage as waiverPercentage',
        'pw.reason',
        'pw.detailed_justification as detailedJustification',
        'pw.status',
        'pw.approved_by as approvedBy',
        'pw.rejection_reason as approvalNotes',
        'pw.requested_at as createdAt',
        'pw.approved_at as updatedAt',
        knex.raw(`CONCAT(c.first_name, ' ', c.last_name) as customerName`),
        knex.raw(`CONCAT(u1.first_name, ' ', u1.last_name) as requestedByName`),
        knex.raw(`CONCAT(u2.first_name, ' ', u2.last_name) as approvedByName`),
        'l.loan_number as loanNumber'
      )
      .leftJoin('customers as c', 'c.id', 'pw.customer_id')
      .leftJoin('users as u1', 'u1.id', 'pw.requested_by')
      .leftJoin('users as u2', 'u2.id', 'pw.approved_by')
      .leftJoin('money_loan_loans as l', 'l.id', 'pw.loan_id')
      .where('pw.tenant_id', tenantId)
      .orderBy('pw.requested_at', 'desc');

    if (status) {
      query = query.where('pw.status', status);
    }

    const waivers = await query;

    return {
      success: true,
      data: waivers,
    };
  }

  @Post('penalty-waivers')
  @Permissions('money-loan:penalty-waivers:create')
  async createPenaltyWaiver(@Body() body: any, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    const knex = this.knexService.instance;

    const [waiver] = await knex('money_loan_penalty_waivers')
      .insert({
        tenant_id: tenantId,
        loan_id: body.loanId,
        customer_id: body.customerId,
        requested_by: userId,
        original_penalty_amount: body.penaltyAmount,
        waived_amount: body.waiverAmount,
        waiver_percentage: (body.waiverAmount / body.penaltyAmount) * 100,
        remaining_penalty: body.penaltyAmount - body.waiverAmount,
        reason: body.reason,
        detailed_justification: body.detailedJustification || body.reason,
        status: 'pending',
        requested_at: knex.fn.now(),
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      })
      .returning('*');

    return {
      success: true,
      data: waiver,
    };
  }

  @Put('penalty-waivers/:id/approve')
  @Permissions('money-loan:penalty-waivers:approve')
  async approvePenaltyWaiver(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const waiverId = parseInt(id, 10);
    if (Number.isNaN(waiverId)) {
      throw new BadRequestException('Invalid waiver id');
    }

    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    const knex = this.knexService.instance;

    await knex('money_loan_penalty_waivers')
      .where({ id: waiverId, tenant_id: tenantId })
      .update({
        status: 'approved',
        approved_by: userId,
        approved_at: knex.fn.now(),
        rejection_reason: body.notes,
        updated_at: knex.fn.now(),
      });

    return {
      success: true,
      message: 'Penalty waiver approved successfully',
    };
  }

  @Put('penalty-waivers/:id/reject')
  @Permissions('money-loan:penalty-waivers:reject')
  async rejectPenaltyWaiver(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const waiverId = parseInt(id, 10);
    if (Number.isNaN(waiverId)) {
      throw new BadRequestException('Invalid waiver id');
    }

    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    const knex = this.knexService.instance;

    await knex('money_loan_penalty_waivers')
      .where({ id: waiverId, tenant_id: tenantId })
      .update({
        status: 'rejected',
        approved_by: userId,
        approved_at: knex.fn.now(),
        rejection_reason: body.notes,
        updated_at: knex.fn.now(),
      });

    return {
      success: true,
      message: 'Penalty waiver rejected successfully',
    };
  }

  // ==================== COLLECTOR TARGETS ====================

  @Get('collector-targets')
  @Permissions('money-loan:collector-management:read')
  async getCollectorTargets(
    @Req() req: any,
    @Query('period') period?: string
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    const knex = this.knexService.instance;

    let query = knex('money_loan_collector_targets as ct')
      .select(
        'ct.id',
        'ct.collector_id as collectorId',
        'ct.target_type as targetType',
        'ct.period',
        'ct.period_start as periodStart',
        'ct.period_end as periodEnd',
        'ct.target_amount as targetAmount',
        'ct.target_count as targetCount',
        'ct.actual_amount as actualAmount',
        'ct.actual_count as actualCount',
        'ct.achievement_percentage as achievementPercentage',
        'ct.status',
        knex.raw(`CONCAT(u.first_name, ' ', u.last_name) as employeeName`),
        'ep.employee_code as employeeCode',
        'ep.position'
      )
      .leftJoin('users as u', 'u.id', 'ct.collector_id')
      .leftJoin('employee_profiles as ep', 'ep.user_id', 'u.id')
      .where('ct.tenant_id', tenantId)
      .orderBy('ct.period_start', 'desc');

    if (period) {
      query = query.where('ct.period', period);
    }

    const targets = await query;

    return {
      success: true,
      data: targets,
    };
  }

  @Post('collector-targets')
  @Permissions('money-loan:collector-management:create')
  async createCollectorTarget(@Body() body: any, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    const knex = this.knexService.instance;

    const [target] = await knex('money_loan_collector_targets')
      .insert({
        tenant_id: tenantId,
        collector_id: body.collectorId,
        target_type: body.targetType,
        period: body.period,
        period_start: body.periodStart,
        period_end: body.periodEnd,
        target_amount: body.targetAmount,
        target_count: body.targetCount,
        actual_amount: 0,
        actual_count: 0,
        achievement_percentage: 0,
        status: 'active',
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      })
      .returning('*');

    return {
      success: true,
      data: target,
    };
  }

  @Put('collector-targets/:id')
  @Permissions('money-loan:collector-management:update')
  async updateCollectorTarget(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const targetId = parseInt(id, 10);
    if (Number.isNaN(targetId)) {
      throw new BadRequestException('Invalid target id');
    }

    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    const knex = this.knexService.instance;

    await knex('money_loan_collector_targets')
      .where({ id: targetId, tenant_id: tenantId })
      .update({
        target_amount: body.targetAmount,
        target_count: body.targetCount,
        status: body.status,
        updated_at: knex.fn.now(),
      });

    return {
      success: true,
      message: 'Target updated successfully',
    };
  }
}
