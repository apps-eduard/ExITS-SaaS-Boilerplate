import { BadRequestException, Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { MoneyLoanService } from './money-loan.service';

@Controller('money-loan/customers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CustomersController {
  constructor(private readonly moneyLoanService: MoneyLoanService) {}

  @Get()
  @Permissions('tenant-customers:read', 'money-loan:customers:read')
  async listCustomers(
    @Req() req: any,
    @Query('tenantId') tenantIdQuery?: string,
    @Query('page') pageQuery?: string,
    @Query('limit') limitQuery?: string,
    @Query('status') status?: string,
    @Query('kycStatus') kycStatus?: string,
    @Query('search') search?: string,
  ) {
    const tokenTenantId = req?.user?.tenantId;
    const parsedTokenTenantId = tokenTenantId !== undefined && tokenTenantId !== null ? Number(tokenTenantId) : undefined;
    const parsedQueryTenantId = tenantIdQuery !== undefined ? Number(tenantIdQuery) : undefined;

    const tenantId = parsedTokenTenantId ?? parsedQueryTenantId;

    if (!tenantId || Number.isNaN(tenantId)) {
      throw new BadRequestException('Tenant context is required to load customers');
    }

    const page = pageQuery ? Number(pageQuery) : 1;
    const limit = limitQuery ? Number(limitQuery) : 25;

    const result = await this.moneyLoanService.getCustomers(tenantId, {
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 25,
      status,
      kycStatus,
      search,
    });

    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }
}
