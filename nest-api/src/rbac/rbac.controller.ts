import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PermissionsService } from './permissions.service';

@Controller('rbac')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RbacController {
  constructor(private permissionsService: PermissionsService) {}

  @Get('roles')
  @Permissions('roles:read', 'tenant-roles:read')
  async getRoles(@Req() req: any, @Query('tenantId') tenantId?: string) {
    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('roles:read');
    const hasTenantAccess = permissions.includes('tenant-roles:read');

    if (!hasSystemAccess && !hasTenantAccess) {
      throw new ForbiddenException('Access to roles is not allowed');
    }

    let resolvedTenantId: number | undefined;
    if (hasSystemAccess) {
      if (tenantId !== undefined && tenantId !== null && tenantId.trim().length > 0) {
        const candidate = Number(tenantId);
        if (!Number.isNaN(candidate)) {
          resolvedTenantId = candidate;
        }
      }
    } else {
      if (!requester?.tenantId) {
        throw new ForbiddenException('Tenant context is required to view roles');
      }
      const candidate = Number(requester.tenantId);
      if (!Number.isNaN(candidate)) {
        resolvedTenantId = candidate;
      }
    }

    const roles = await this.permissionsService.getRoles(resolvedTenantId);
    return {
      success: true,
      data: roles,
    };
  }

  @Get('roles/:roleId')
  @Permissions('roles:read', 'tenant-roles:read')
  async getRoleById(@Param('roleId') roleIdParam: string, @Req() req: any) {
    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('roles:read');
    const hasTenantAccess = permissions.includes('tenant-roles:read');

    if (!hasSystemAccess && !hasTenantAccess) {
      throw new ForbiddenException('Access to roles is not allowed');
    }

    const roleId = Number(roleIdParam);
    if (!Number.isFinite(roleId) || roleId <= 0) {
      throw new NotFoundException('Role not found');
    }

    const role = await this.permissionsService.getRoleWithPermissions(roleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (!hasSystemAccess) {
      const requesterTenantId = Number(requester?.tenantId);
      const roleTenantId = role.tenantId ? Number(role.tenantId) : null;

      if (!requesterTenantId || requesterTenantId <= 0) {
        throw new ForbiddenException('Tenant context is required to view this role');
      }

      if (!roleTenantId || roleTenantId !== requesterTenantId) {
        throw new ForbiddenException('Access to this role is not allowed');
      }
    }

    return {
      success: true,
      data: role,
    };
  }

  @Get('permissions')
  @Permissions('permissions:read')
  async getPermissions() {
    const permissions = await this.permissionsService.getPermissions();
    return {
      success: true,
      data: permissions,
    };
  }

  @Get('roles/:roleId/permissions')
  @Permissions('roles:read', 'permissions:read')
  async getRolePermissions(@Param('roleId') roleId: number) {
    const permissions = await this.permissionsService.getRolePermissions(roleId);
    return {
      success: true,
      data: permissions,
    };
  }

  @Post('roles/:roleId/permissions/:permissionId')
  @Permissions('roles:update', 'permissions:update')
  async assignPermission(
    @Param('roleId') roleId: number,
    @Param('permissionId') permissionId: number,
  ) {
    const result = await this.permissionsService.assignPermissionToRole(
      roleId,
      permissionId,
    );
    return {
      success: true,
      message: result.message,
    };
  }

  @Delete('roles/:roleId/permissions/:permissionId')
  @Permissions('roles:update', 'permissions:update')
  async removePermission(
    @Param('roleId') roleId: number,
    @Param('permissionId') permissionId: number,
  ) {
    const result = await this.permissionsService.removePermissionFromRole(
      roleId,
      permissionId,
    );
    return {
      success: true,
      message: result.message,
    };
  }

  @Get('modules')
  @Permissions('modules:read', 'tenant-dashboard:view')
  async getModules(@Query('space') space?: string) {
    const modules = await this.permissionsService.getModules(space);
    return {
      success: true,
      data: modules,
    };
  }
}
