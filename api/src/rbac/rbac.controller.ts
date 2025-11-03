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
  NotFoundException,
  BadRequestException,
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

  @Post('roles')
  @Permissions('roles:create', 'tenant-roles:create')
  async createRole(@Body() body: any, @Req() req: any) {
    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('roles:create');
    const hasTenantAccess = permissions.includes('tenant-roles:create');

    if (!hasSystemAccess && !hasTenantAccess) {
      throw new ForbiddenException('Access to create roles is not allowed');
    }

    const { name, description, space, tenant_id } = body;

    if (!name || !space) {
      throw new BadRequestException('Role name and space are required');
    }

    // Validate space
    if (!['system', 'tenant'].includes(space)) {
      throw new BadRequestException('Invalid role space. Must be "system" or "tenant"');
    }

    // For tenant roles, ensure tenant_id is provided
    if (space === 'tenant') {
      if (!tenant_id) {
        throw new BadRequestException('Tenant ID is required for tenant roles');
      }

      // If user doesn't have system access, they can only create roles for their own tenant
      if (!hasSystemAccess) {
        const requesterTenantId = Number(requester?.tenantId);
        const targetTenantId = Number(tenant_id);

        if (!requesterTenantId || requesterTenantId !== targetTenantId) {
          throw new ForbiddenException('You can only create roles for your own tenant');
        }
      }
    } else if (space === 'system') {
      // Only system admins can create system roles
      if (!hasSystemAccess) {
        throw new ForbiddenException('Only system administrators can create system roles');
      }
    }

    const role = await this.permissionsService.createRole({
      name,
      description: description || null,
      space,
      tenantId: space === 'tenant' ? Number(tenant_id) : null,
    });

    return {
      success: true,
      data: role,
    };
  }

  @Put('roles/:roleId')
  @Permissions('roles:update', 'tenant-roles:update')
  async updateRole(
    @Param('roleId') roleIdParam: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('roles:update');
    const hasTenantAccess = permissions.includes('tenant-roles:update');

    if (!hasSystemAccess && !hasTenantAccess) {
      throw new ForbiddenException('Access to update roles is not allowed');
    }

    const roleId = Number(roleIdParam);
    if (!Number.isFinite(roleId) || roleId <= 0) {
      throw new NotFoundException('Role not found');
    }

    // Get existing role
    const existingRole = await this.permissionsService.getRoleWithPermissions(roleId);
    if (!existingRole) {
      throw new NotFoundException('Role not found');
    }

    // Check permissions based on role space
    if (!hasSystemAccess) {
      const requesterTenantId = Number(requester?.tenantId);
      const roleTenantId = existingRole.tenantId ? Number(existingRole.tenantId) : null;

      if (!requesterTenantId || requesterTenantId <= 0) {
        throw new ForbiddenException('Tenant context is required to update this role');
      }

      if (!roleTenantId || roleTenantId !== requesterTenantId) {
        throw new ForbiddenException('You can only update roles in your own tenant');
      }
    }

    const { name, description } = body;
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const updatedRole = await this.permissionsService.updateRole(roleId, updateData);

    return {
      success: true,
      data: updatedRole,
    };
  }

  @Delete('roles/:roleId')
  @Permissions('roles:delete', 'tenant-roles:delete')
  async deleteRole(@Param('roleId') roleIdParam: string, @Req() req: any) {
    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('roles:delete');
    const hasTenantAccess = permissions.includes('tenant-roles:delete');

    if (!hasSystemAccess && !hasTenantAccess) {
      throw new ForbiddenException('Access to delete roles is not allowed');
    }

    const roleId = Number(roleIdParam);
    if (!Number.isFinite(roleId) || roleId <= 0) {
      throw new NotFoundException('Role not found');
    }

    // Get existing role
    const existingRole = await this.permissionsService.getRoleWithPermissions(roleId);
    if (!existingRole) {
      throw new NotFoundException('Role not found');
    }

    // Check permissions based on role space
    if (!hasSystemAccess) {
      const requesterTenantId = Number(requester?.tenantId);
      const roleTenantId = existingRole.tenantId ? Number(existingRole.tenantId) : null;

      if (!requesterTenantId || requesterTenantId <= 0) {
        throw new ForbiddenException('Tenant context is required to delete this role');
      }

      if (!roleTenantId || roleTenantId !== requesterTenantId) {
        throw new ForbiddenException('You can only delete roles in your own tenant');
      }
    }

    await this.permissionsService.deleteRole(roleId);

    return {
      success: true,
      message: 'Role deleted successfully',
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
  @Permissions('roles:update', 'permissions:update', 'tenant-roles:update')
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

  @Post('roles/:roleId/permissions/bulk')
  @Permissions('roles:update', 'permissions:update', 'tenant-roles:update')
  async bulkAssignPermissions(
    @Param('roleId') roleIdParam: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('roles:update');
    const hasTenantAccess = permissions.includes('tenant-roles:update');

    if (!hasSystemAccess && !hasTenantAccess) {
      throw new ForbiddenException('Access to update role permissions is not allowed');
    }

    const roleId = Number(roleIdParam);
    if (!Number.isFinite(roleId) || roleId <= 0) {
      throw new NotFoundException('Role not found');
    }

    // Get existing role
    const existingRole = await this.permissionsService.getRoleWithPermissions(roleId);
    if (!existingRole) {
      throw new NotFoundException('Role not found');
    }

    // Check permissions based on role space
    if (!hasSystemAccess) {
      const requesterTenantId = Number(requester?.tenantId);
      const roleTenantId = existingRole.tenantId ? Number(existingRole.tenantId) : null;

      if (!requesterTenantId || requesterTenantId <= 0) {
        throw new ForbiddenException('Tenant context is required to update this role');
      }

      if (!roleTenantId || roleTenantId !== requesterTenantId) {
        throw new ForbiddenException('You can only update roles in your own tenant');
      }
    }

    const { permissions: permissionsList } = body;

    if (!Array.isArray(permissionsList)) {
      throw new BadRequestException('Permissions must be an array');
    }

    const result = await this.permissionsService.bulkAssignPermissions(
      roleId,
      permissionsList,
    );

    return {
      success: true,
      count: result.count,
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
