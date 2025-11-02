import { BadRequestException, Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';

@Controller('billing')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscriptions')
  @Permissions('subscriptions:read', 'tenant-billing:read')
  async listSubscriptions(@Req() req: any) {
    const rawTenantId = req?.user?.tenantId;
    const numericTenantId = Number(rawTenantId);
    const hasTenantContext = rawTenantId !== null && rawTenantId !== undefined;
    const tenantId = hasTenantContext && Number.isFinite(numericTenantId) ? numericTenantId : undefined;

    const data = await this.billingService.getSubscriptions({ tenantId });

    return {
      success: true,
      data,
    };
  }

  @Post('subscriptions/:id/cancel')
  @Permissions('subscriptions:update', 'tenant-billing:manage-renewals')
  async cancelSubscription(
    @Param('id') id: string,
    @Body() body: CancelSubscriptionDto,
  ) {
    const subscriptionId = Number(id);

    if (!Number.isFinite(subscriptionId)) {
      throw new BadRequestException('Invalid subscription ID');
    }

    const data = await this.billingService.cancelSubscription(subscriptionId, body?.reason);

    return {
      success: true,
      message: 'Subscription cancelled successfully',
      data,
    };
  }
}
