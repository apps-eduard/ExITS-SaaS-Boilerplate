import { BadRequestException, Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { MoneyLoanService } from './money-loan.service';
import { KnexService } from '../database/knex.service';

@Controller('collectors')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CollectorsController {
  constructor(
    private readonly moneyLoanService: MoneyLoanService,
    private readonly knexService: KnexService
  ) {}

  @Get()
  @Permissions('money-loan:collector-management:read', 'tenant-users:read')
  async getAllCollectors(@Req() req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    const knex = this.knexService.instance;
    
    // Get all users with employee profiles and money-loan access
    const collectors = await knex('users as u')
      .select(
        'u.id',
        'u.email',
        'u.first_name as firstName',
        'u.last_name as lastName',
        'u.phone',
        'u.status',
        'ep.employee_code as employeeCode',
        'ep.position',
        'ep.department',
        'r.id as roleId',
        'r.name as roleName'
      )
      .leftJoin('employee_profiles as ep', 'ep.user_id', 'u.id')
      .leftJoin('employee_product_access as epa', function() {
        this.on('epa.user_id', '=', 'u.id')
          .andOn('epa.platform_type', '=', knex.raw('?', ['money_loan']))
          .andOn('epa.status', '=', knex.raw('?', ['active']));
      })
      .leftJoin('user_roles as ur', 'ur.user_id', 'u.id')
      .leftJoin('roles as r', 'r.id', 'ur.role_id')
      .where('u.tenant_id', tenantId)
      .where('u.status', 'active')
      .whereNotNull('ep.id') // Must have employee profile
      .whereNotNull('epa.id') // Must have money-loan access
      .groupBy('u.id', 'u.email', 'u.first_name', 'u.last_name', 'u.phone', 'u.status', 
               'ep.employee_code', 'ep.position', 'ep.department', 'r.id', 'r.name');

    // Get assignment counts for each collector
    const assignmentCounts = await knex('customers')
      .select('assigned_employee_id as collectorId')
      .count('* as count')
      .where('tenant_id', tenantId)
      .whereNotNull('assigned_employee_id')
      .groupBy('assigned_employee_id');

    const countMap = assignmentCounts.reduce((acc, item) => {
      acc[item.collectorId] = parseInt(item.count as string);
      return acc;
    }, {});

    // Add assignment count to each collector
    const collectorsWithCounts = collectors.map(collector => ({
      ...collector,
      activeAssignments: countMap[collector.id] || 0
    }));

    return {
      success: true,
      data: collectorsWithCounts
    };
  }

  @Get(':id/route')
  @Permissions('money-loan:customers:read', 'tenant-users:read')
  async getCollectorRoute(@Param('id') id: string, @Req() req: any) {
    const collectorId = parseInt(id, 10);
    if (Number.isNaN(collectorId)) {
      throw new BadRequestException('Invalid collector id');
    }

    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    const data = await this.moneyLoanService.getCollectorRoute(tenantId, collectorId);

    return {
      success: true,
      data,
    };
  }
}
