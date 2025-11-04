import { BadRequestException, Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { MoneyLoanService } from './money-loan.service';

@Controller('collectors')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CollectorsController {
  constructor(private readonly moneyLoanService: MoneyLoanService) {}

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
