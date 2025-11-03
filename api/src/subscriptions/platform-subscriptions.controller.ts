import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PlatformSubscriptionsService } from './platform-subscriptions.service';
import { SubscribePlatformDto } from './dto/subscribe-platform.dto';
import { UpdatePlatformSubscriptionDto } from './dto/update-platform-subscription.dto';

@Controller('platform-subscriptions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PlatformSubscriptionsController {
  constructor(private readonly platformSubscriptionsService: PlatformSubscriptionsService) {}

  @Get('tenant/:tenantId')
  @Permissions('subscriptions:manage-plans', 'tenants:read', 'tenant-users:read', 'tenant-billing:read')
  async listTenantSubscriptions(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Req() req: any,
  ) {
    this.ensureTenantAccess(req, tenantId);

    const data = await this.platformSubscriptionsService.listTenantSubscriptions(tenantId);
    return {
      success: true,
      data,
    };
  }

  @Get('tenant/:tenantId/product/:platformType')
  @Permissions('subscriptions:manage-plans', 'tenants:read', 'tenant-users:read', 'tenant-billing:read')
  async getTenantSubscription(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('platformType') platformType: string,
    @Req() req: any,
  ) {
    this.ensureTenantAccess(req, tenantId);

    const data = await this.platformSubscriptionsService.getTenantSubscription(tenantId, platformType.toLowerCase());
    return {
      success: true,
      data,
    };
  }

  @Post('tenant/:tenantId/subscribe')
  @Permissions('subscriptions:manage-plans')
  async subscribeTenant(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Req() req: any,
    @Body() dto: SubscribePlatformDto,
  ) {
    const userId = req.user?.id ? Number(req.user.id) : null;
    const data = await this.platformSubscriptionsService.subscribeTenant(tenantId, dto, userId);
    return {
      success: true,
      message: 'Platform subscription created successfully',
      data,
    };
  }

  @Put('tenant/:tenantId/product/:platformType')
  @Permissions('subscriptions:manage-plans')
  async updateTenantSubscription(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('platformType') platformType: string,
    @Body() dto: UpdatePlatformSubscriptionDto,
  ) {
    const data = await this.platformSubscriptionsService.updateTenantSubscription(tenantId, platformType.toLowerCase(), dto);
    return {
      success: true,
      message: 'Platform subscription updated successfully',
      data,
    };
  }

  @Delete('tenant/:tenantId/unsubscribe/:platformType')
  @Permissions('subscriptions:manage-plans')
  async unsubscribeTenant(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('platformType') platformType: string,
  ) {
    return this.platformSubscriptionsService.unsubscribeTenant(tenantId, platformType.toLowerCase());
  }

    private ensureTenantAccess(req: any, targetTenantId: number) {
      const requester = req.user;
      const permissions: string[] = requester?.permissions || [];
      const hasSystemScope = permissions.includes('subscriptions:manage-plans') || permissions.includes('tenants:read');

      if (hasSystemScope) {
        return;
      }

      const hasTenantScope = permissions.includes('tenant-users:read') || permissions.includes('tenant-billing:read');
      if (!hasTenantScope) {
        throw new ForbiddenException('Access to platform subscriptions is not allowed');
      }

      const requesterTenantId = requester?.tenantId ? Number(requester.tenantId) : null;
      if (!Number.isFinite(requesterTenantId) || requesterTenantId !== targetTenantId) {
        throw new ForbiddenException('Access to this tenant is not allowed');
      }
    }
}
