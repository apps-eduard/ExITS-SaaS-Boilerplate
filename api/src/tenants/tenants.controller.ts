import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { CreateTenantSubscriptionDto } from './dto/create-tenant-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';

@Controller('tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Post()
  async create(@Body() createTenantDto: CreateTenantDto) {
    const tenant = await this.tenantsService.create(createTenantDto);
    return {
      success: true,
      message: 'Tenant created successfully',
      data: tenant,
    };
  }

  @Get('public/active')
  async getActiveTenants() {
    const tenants = await this.tenantsService.getActiveTenants();
    return {
      success: true,
      data: tenants,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('tenants:read')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const result = await this.tenantsService.findAll(page, limit);
    return {
      success: true,
      ...result,
    };
  }

  @Get('current')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('tenants:read', 'tenant-dashboard:view')
  async getCurrentTenant(@Req() req: any) {
    const rawTenantId = req.user?.tenantId;
    const tenantId = Number(rawTenantId);

    if (!Number.isFinite(tenantId)) {
      throw new ForbiddenException('Tenant context not available');
    }

    const tenant = await this.tenantsService.findOne(tenantId);
    return {
      success: true,
      data: tenant,
    };
  }

  @Get('current/subscriptions')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('tenant-billing:read', 'tenant-dashboard:view')
  async getCurrentTenantSubscriptions(@Req() req: any) {
    const rawTenantId = req.user?.tenantId;
    const tenantId = Number(rawTenantId);

    if (!Number.isFinite(tenantId)) {
      throw new ForbiddenException('Tenant context not available');
    }

    const data = await this.tenantsService.getCurrentTenantSubscriptions(tenantId);

    return {
      success: true,
      data,
    };
  }

  @Post('current/subscribe')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('tenant-billing:update', 'tenant-billing:read')
  async subscribeCurrentTenant(
    @Req() req: any,
    @Body() dto: CreateTenantSubscriptionDto,
  ) {
    const rawTenantId = req.user?.tenantId;
    const tenantId = Number(rawTenantId);

    if (!Number.isFinite(tenantId)) {
      throw new ForbiddenException('Tenant context not available');
    }

    const userId = req.user?.id ? Number(req.user.id) : null;

    const result = await this.tenantsService.createOrUpdateSubscription(
      tenantId,
      userId,
      dto,
    );

    return {
      success: true,
      message: 'Subscription created successfully',
      data: result,
    };
  }

  @Get('by-subdomain/:subdomain')
  async findBySubdomain(@Param('subdomain') subdomain: string) {
    const tenant = await this.tenantsService.findBySubdomain(subdomain);
    return {
      success: true,
      data: tenant,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('tenants:read', 'tenant-dashboard:view')
  async findOne(@Param('id') id: number) {
    const tenant = await this.tenantsService.findOne(id);
    return {
      success: true,
      data: tenant,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('tenants:update')
  async update(@Param('id') id: number, @Body() updateTenantDto: UpdateTenantDto) {
    const tenant = await this.tenantsService.update(id, updateTenantDto);
    return {
      success: true,
      message: 'Tenant updated successfully',
      data: tenant,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('tenants:delete')
  async remove(@Param('id') id: number) {
    const result = await this.tenantsService.remove(id);
    return {
      success: true,
      message: result.message,
    };
  }
}
