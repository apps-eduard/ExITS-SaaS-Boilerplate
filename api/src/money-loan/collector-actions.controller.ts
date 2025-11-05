import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MoneyLoanService } from './money-loan.service';
import { CollectorAssignmentService } from './services/collector-assignment.service';
import { ApproveLoanDto, DisburseLoanDto, CreatePaymentDto } from './dto/money-loan.dto';

@Controller('money-loan/collectors/:collectorId')
@UseGuards(JwtAuthGuard)
export class CollectorActionsController {
  constructor(
    private moneyLoanService: MoneyLoanService,
    private collectorAssignmentService: CollectorAssignmentService,
  ) {}

  /**
   * Verify collector can only access their own routes or admin/manager can access any
   */
  private verifyCollectorAccess(req: any, collectorId: number) {
    const userId = req.user.id;
    const permissions = req.user.permissions || [];
    
    const isOwnRoute = userId === collectorId;
    const isAdmin = permissions.includes('money-loan:manage') || permissions.includes('users:read');
    
    if (!isOwnRoute && !isAdmin) {
      throw new ForbiddenException('You can only access your own collector routes');
    }
  }

  /**
   * Get collector's daily summary for dashboard
   */
  @Get('daily-summary')
  async getDailySummary(
    @Param('collectorId') collectorIdParam: string,
    @Req() req: any,
  ) {
    const collectorId = parseInt(collectorIdParam);
    this.verifyCollectorAccess(req, collectorId);

    const tenantId = req.user.tenantId;
    const knex = this.moneyLoanService['knexService'].instance;
    const today = new Date().toISOString().split('T')[0];

    // Get assigned customers count
    const customersResult = await knex('customers')
      .where({ assigned_employee_id: collectorId, tenant_id: tenantId })
      .count('* as total');

    // Get active and overdue loans
    const loansResult = await knex('money_loan_loans as mll')
      .join('customers as c', 'mll.customer_id', 'c.id')
      .where('c.assigned_employee_id', collectorId)
      .where('mll.tenant_id', tenantId)
      .whereIn('mll.status', ['active', 'overdue', 'partially_paid'])
      .select(
        knex.raw('COUNT(*) as active_loans'),
        knex.raw('SUM(CASE WHEN mll.status = ? THEN 1 ELSE 0 END) as overdue_loans', ['overdue']),
        knex.raw('SUM(mll.outstanding_balance) as total_outstanding')
      )
      .first();

    // Get today's collections
    const collectionsResult = await knex('money_loan_payments as mlp')
      .join('money_loan_loans as mll', 'mlp.loan_id', 'mll.id')
      .join('customers as c', 'mll.customer_id', 'c.id')
      .where('c.assigned_employee_id', collectorId)
      .where('mlp.tenant_id', tenantId)
      .whereRaw('DATE(mlp.payment_date) = ?', [today])
      .sum('mlp.amount as collected_today')
      .first();

    // Get collector's daily target
    const targetResult = await knex('money_loan_collector_targets')
      .where({ collector_id: collectorId, tenant_id: tenantId })
      .orderBy('id', 'desc')
      .first();

    // Get today's visits
    const visitsResult = await knex('money_loan_customer_visits')
      .where({ collector_id: collectorId, tenant_id: tenantId })
      .whereRaw('DATE(check_in_time) = ?', [today])
      .where('status', 'completed')
      .count('* as visits_completed')
      .first();

    const totalCustomers = Number(customersResult[0]?.total || 0);
    const visitsPlanned = totalCustomers;

    // Get pending actions counts
    const pendingApplications = await knex('money_loan_applications as mla')
      .join('customers as c', 'mla.customer_id', 'c.id')
      .where('c.assigned_employee_id', collectorId)
      .where('mla.tenant_id', tenantId)
      .whereIn('mla.status', ['submitted', 'under_review'])
      .count('* as count')
      .first();

    const pendingDisbursements = await knex('money_loan_loans as mll')
      .join('customers as c', 'mll.customer_id', 'c.id')
      .where('c.assigned_employee_id', collectorId)
      .where('mll.tenant_id', tenantId)
      .whereIn('mll.status', ['pending', 'approved'])
      .count('* as count')
      .first();

    const pendingWaivers = await knex('money_loan_penalty_waivers')
      .where({ requested_by_collector_id: collectorId, tenant_id: tenantId, status: 'pending' })
      .count('* as count')
      .first();

    return {
      success: true,
      data: {
        date: today,
        totalCustomers,
        activeLoans: Number(loansResult?.['active_loans'] || 0),
        overdueLoans: Number(loansResult?.['overdue_loans'] || 0),
        totalOutstanding: Number(loansResult?.['total_outstanding'] || 0),
        collectedToday: Number(collectionsResult?.['collected_today'] || 0),
        collectionTarget: Number(targetResult?.['daily_collection_target'] || 0),
        visitsCompleted: Number(visitsResult?.['visits_completed'] || 0),
        visitsPlanned,
        pendingApplications: Number(pendingApplications?.['count'] || 0),
        pendingDisbursements: Number(pendingDisbursements?.['count'] || 0),
        pendingWaivers: Number(pendingWaivers?.['count'] || 0),
      },
    };
  }

  /**
   * Get assigned customers
   */
  @Get('customers')
  async getAssignedCustomers(
    @Param('collectorId') collectorIdParam: string,
    @Req() req: any,
  ) {
    const collectorId = parseInt(collectorIdParam);
    this.verifyCollectorAccess(req, collectorId);

    const tenantId = req.user.tenantId;
    const knex = this.moneyLoanService['knexService'].instance;

    const customers = await knex('customers')
      .where({ assigned_employee_id: collectorId, tenant_id: tenantId })
      .select('*');

    return {
      success: true,
      data: customers,
    };
  }

  /**
   * Get pending applications from assigned customers
   */
  @Get('applications')
  async getAssignedApplications(
    @Param('collectorId') collectorIdParam: string,
    @Query('status') status: string,
    @Req() req: any,
  ) {
    const collectorId = parseInt(collectorIdParam);
    this.verifyCollectorAccess(req, collectorId);

    const tenantId = req.user.tenantId;
    const knex = this.moneyLoanService['knexService'].instance;

    const query = knex('money_loan_applications as mla')
      .join('customers as c', 'mla.customer_id', 'c.id')
      .join('money_loan_products as mlp', 'mla.loan_product_id', 'mlp.id')
      .where('c.assigned_employee_id', collectorId)
      .where('mla.tenant_id', tenantId)
      .select(
        'mla.*',
        'c.first_name as customerFirstName',
        'c.last_name as customerLastName',
        'c.phone as customerPhone',
        'mlp.name as productName',
      );

    if (status) {
      query.where('mla.status', status);
    } else {
      query.whereIn('mla.status', ['submitted', 'under_review']);
    }

    const applications = await query.orderBy('mla.created_at', 'desc');

    return {
      success: true,
      data: applications,
    };
  }

  /**
   * Approve application (with limit check)
   */
  @Post('applications/:appId/approve')
  async approveApplication(
    @Param('collectorId') collectorIdParam: string,
    @Param('appId') appId: string,
    @Body() approveDto: ApproveLoanDto,
    @Req() req: any,
  ) {
    const collectorId = parseInt(collectorIdParam);
    this.verifyCollectorAccess(req, collectorId);

    const tenantId = req.user.tenantId;
    const applicationId = parseInt(appId);

    // Get application
    const knex = this.moneyLoanService['knexService'].instance;
    const application = await knex('money_loan_applications')
      .join('customers', 'money_loan_applications.customer_id', 'customers.id')
      .where({ 'money_loan_applications.id': applicationId, 'money_loan_applications.tenant_id': tenantId })
      .select('money_loan_applications.*', 'customers.assigned_employee_id')
      .first();

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Verify customer is assigned to this collector
    await this.collectorAssignmentService.verifyCustomerAccess(
      application.customerId,
      collectorId,
      tenantId,
    );

    // Check approval limits
    const limitCheck = await this.collectorAssignmentService.canApprove(
      collectorId,
      tenantId,
      approveDto.approvedAmount,
    );

    if (!limitCheck.canApprove) {
      throw new BadRequestException(limitCheck.reason);
    }

    // Approve the application
    const loan = await this.moneyLoanService.approveApplication(
      tenantId,
      applicationId,
      approveDto,
      collectorId,
    );

    // Log the action
    await this.collectorAssignmentService.logAction({
      tenantId,
      collectorId,
      customerId: application.customerId,
      actionType: 'approve_application',
      applicationId,
      amount: approveDto.approvedAmount,
      status: 'success',
    });

    return {
      success: true,
      message: 'Application approved successfully',
      data: loan,
    };
  }

  /**
   * Get pending disbursements for assigned customers
   */
  @Get('disbursements/pending')
  async getPendingDisbursements(
    @Param('collectorId') collectorIdParam: string,
    @Req() req: any,
  ) {
    const collectorId = parseInt(collectorIdParam);
    this.verifyCollectorAccess(req, collectorId);

    const tenantId = req.user.tenantId;
    const knex = this.moneyLoanService['knexService'].instance;

    const loans = await knex('money_loan_loans as mll')
      .join('customers as c', 'mll.customer_id', 'c.id')
      .join('money_loan_products as mlp', 'mll.loan_product_id', 'mlp.id')
      .where('c.assigned_employee_id', collectorId)
      .where('mll.tenant_id', tenantId)
      .whereIn('mll.status', ['pending', 'approved'])
      .select(
        'mll.*',
        'c.first_name as customerFirstName',
        'c.last_name as customerLastName',
        'c.phone as customerPhone',
        'mlp.name as productName',
      )
      .orderBy('mll.created_at', 'desc');

    return {
      success: true,
      data: loans,
    };
  }

  /**
   * Disburse loan (with limit check)
   */
  @Post('loans/:loanId/disburse')
  async disburseLoan(
    @Param('collectorId') collectorIdParam: string,
    @Param('loanId') loanId: string,
    @Body() disburseDto: DisburseLoanDto,
    @Req() req: any,
  ) {
    const collectorId = parseInt(collectorIdParam);
    this.verifyCollectorAccess(req, collectorId);

    const tenantId = req.user.tenantId;
    const loanIdNum = parseInt(loanId);

    // Get loan
    const knex = this.moneyLoanService['knexService'].instance;
    const loan = await knex('money_loan_loans')
      .join('customers', 'money_loan_loans.customer_id', 'customers.id')
      .where({ 'money_loan_loans.id': loanIdNum, 'money_loan_loans.tenant_id': tenantId })
      .select('money_loan_loans.*', 'customers.assigned_employee_id')
      .first();

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    // Verify customer is assigned to this collector
    await this.collectorAssignmentService.verifyCustomerAccess(
      loan.customerId,
      collectorId,
      tenantId,
    );

    // Check disbursement limits
    const limitCheck = await this.collectorAssignmentService.canDisburse(
      collectorId,
      tenantId,
      loan.principalAmount,
    );

    if (!limitCheck.canDisburse) {
      throw new BadRequestException(limitCheck.reason);
    }

    // Disburse the loan
    const disbursedLoan = await this.moneyLoanService.disburseLoan(
      tenantId,
      loanIdNum,
      disburseDto,
      collectorId,
    );

    // Log the action
    await this.collectorAssignmentService.logAction({
      tenantId,
      collectorId,
      customerId: loan.customerId,
      actionType: 'disburse_loan',
      loanId: loanIdNum,
      amount: loan.principalAmount,
      status: 'success',
    });

    return {
      success: true,
      message: 'Loan disbursed successfully',
      data: disbursedLoan,
    };
  }

  /**
   * Get collector's limits
   */
  @Get('limits')
  async getLimits(
    @Param('collectorId') collectorIdParam: string,
    @Req() req: any,
  ) {
    const collectorId = parseInt(collectorIdParam);
    this.verifyCollectorAccess(req, collectorId);

    const tenantId = req.user.tenantId;
    const limits = await this.collectorAssignmentService.getCollectorLimits(collectorId, tenantId);

    return {
      success: true,
      data: limits,
    };
  }

  /**
   * Get today's usage
   */
  @Get('limits/usage')
  async getLimitsUsage(
    @Param('collectorId') collectorIdParam: string,
    @Req() req: any,
  ) {
    const collectorId = parseInt(collectorIdParam);
    this.verifyCollectorAccess(req, collectorId);

    const tenantId = req.user.tenantId;
    const [limits, usage] = await Promise.all([
      this.collectorAssignmentService.getCollectorLimits(collectorId, tenantId),
      this.collectorAssignmentService.getTodayUsage(collectorId, tenantId),
    ]);

    return {
      success: true,
      data: {
        limits,
        usage,
        remaining: {
          approvals: limits.maxApprovalPerDay - usage.approvals.count,
          disbursements: limits.dailyDisbursementLimit - usage.disbursements.total,
        },
      },
    };
  }

  /**
   * Collect payment
   */
  @Post('payments')
  async collectPayment(
    @Param('collectorId') collectorIdParam: string,
    @Body() paymentDto: CreatePaymentDto,
    @Req() req: any,
  ) {
    const collectorId = parseInt(collectorIdParam);
    this.verifyCollectorAccess(req, collectorId);

    const tenantId = req.user.tenantId;

    // Get loan to verify customer assignment
    const knex = this.moneyLoanService['knexService'].instance;
    const loan = await knex('money_loan_loans')
      .where({ id: paymentDto.loanId, tenant_id: tenantId })
      .first();

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    // Verify customer is assigned to this collector
    await this.collectorAssignmentService.verifyCustomerAccess(
      loan.customerId,
      collectorId,
      tenantId,
    );

    // Process payment
    const payment = await this.moneyLoanService.createPayment(
      tenantId,
      paymentDto,
      collectorId,
    );

    // Log the action
    await this.collectorAssignmentService.logAction({
      tenantId,
      collectorId,
      customerId: loan.customerId,
      actionType: 'collect_payment',
      loanId: paymentDto.loanId,
      paymentId: payment.id,
      amount: paymentDto.amount,
      status: 'success',
    });

    return {
      success: true,
      message: 'Payment collected successfully',
      data: payment,
    };
  }
}
