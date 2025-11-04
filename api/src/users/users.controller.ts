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
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UpdateUserProductsDto } from './dto/user-products.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @Permissions('users:create', 'tenant-users:create', 'tenant-users:invite')
  async create(@Req() req: any, @Body() createUserDto: CreateUserDto) {
    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('users:create');

    let tenantScope: number | undefined = undefined;
    if (hasSystemAccess) {
      tenantScope = createUserDto.tenantId ?? requester?.tenantId ?? undefined;
    } else {
      if (!requester?.tenantId) {
        throw new ForbiddenException('Tenant context is required to create users');
      }
      tenantScope = requester.tenantId;
    }

    const user = await this.usersService.create(createUserDto, tenantScope);
    return {
      success: true,
      message: 'User created successfully',
      data: user,
    };
  }

  @Get()
  @Permissions('users:read', 'tenant-users:read')
  async findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('users:read');
    const hasTenantAccess = permissions.includes('tenant-users:read');

    if (!hasSystemAccess && !hasTenantAccess) {
      throw new ForbiddenException('Access to users is not allowed');
    }

    let resolvedTenantId: number | string | undefined = undefined;
    if (hasSystemAccess) {
      resolvedTenantId = tenantId ?? requester?.tenantId ?? undefined;
    } else {
      if (!requester?.tenantId) {
        throw new ForbiddenException('Tenant context is required to view users');
      }
      resolvedTenantId = requester.tenantId;
    }

    let parsedTenantId: number | undefined;
    if (resolvedTenantId !== undefined && resolvedTenantId !== null && `${resolvedTenantId}`.trim().length > 0) {
      const candidate =
        typeof resolvedTenantId === 'number' ? resolvedTenantId : Number(resolvedTenantId);
      if (!Number.isNaN(candidate)) {
        parsedTenantId = candidate;
      }
    }

    const pageCandidate = Number(page);
    const limitCandidate = Number(limit);
    const pageNumber = Number.isFinite(pageCandidate) && pageCandidate > 0 ? Math.floor(pageCandidate) : 1;
    const limitNumber = Number.isFinite(limitCandidate) && limitCandidate > 0 ? Math.floor(limitCandidate) : 20;

    const result = await this.usersService.findAll(parsedTenantId, pageNumber, limitNumber);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @Permissions('users:read', 'tenant-users:read')
  async findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('users:read');

    const user = await this.usersService.findOne(id);

    if (!hasSystemAccess) {
      if (!requester?.tenantId || requester.tenantId !== user.tenantId) {
        throw new ForbiddenException('Access to this user is not allowed');
      }
    }

    return {
      success: true,
      data: user,
    };
  }

  @Get(':id/products')
  @Permissions('users:read', 'tenant-users:read')
  async getProducts(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('users:read');

    const existing = await this.usersService.findOne(id);

    if (!hasSystemAccess) {
      if (!requester?.tenantId || requester.tenantId !== existing.tenantId) {
        throw new ForbiddenException('Access to this user is not allowed');
      }
    }

    const products = await this.usersService.getUserProducts(id);
    return {
      success: true,
      data: products,
    };
  }

  @Post(':id/products')
  @Permissions('users:update', 'tenant-users:update')
  async setProducts(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateUserProductsDto,
  ) {
    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('users:update');

    const existing = await this.usersService.findOne(id);

    if (!hasSystemAccess) {
      if (!requester?.tenantId || requester.tenantId !== existing.tenantId) {
        throw new ForbiddenException('Access to this user is not allowed');
      }
    }

    const assignments = payload?.products ?? [];
    const result = await this.usersService.setUserProducts(id, assignments);

    return {
      success: true,
      message: 'Platform access updated successfully',
      data: result,
    };
  }

  @Put(':id')
  @Permissions('users:update', 'tenant-users:update')
  async update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('users:update');

    const existing = await this.usersService.findOne(id);

    if (!hasSystemAccess) {
      if (!requester?.tenantId || requester.tenantId !== existing.tenantId) {
        throw new ForbiddenException('Access to this user is not allowed');
      }
    }

    const user = await this.usersService.update(id, updateUserDto);
    return {
      success: true,
      message: 'User updated successfully',
      data: user,
    };
  }

  @Put(':id/reset-password')
  @Permissions('users:update', 'tenant-users:update')
  async resetPassword(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { newPassword: string },
  ) {
    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('users:update');

    const existing = await this.usersService.findOne(id);

    if (!hasSystemAccess) {
      if (!requester?.tenantId || requester.tenantId !== existing.tenantId) {
        throw new ForbiddenException('Access to this user is not allowed');
      }
    }

    await this.usersService.resetPassword(id, body.newPassword);
    return {
      success: true,
      message: 'Password reset successfully',
    };
  }

  @Delete(':id')
  @Permissions('users:delete', 'tenant-users:delete')
  async remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('users:delete');

    const existing = await this.usersService.findOne(id);

    if (!hasSystemAccess) {
      if (!requester?.tenantId || requester.tenantId !== existing.tenantId) {
        throw new ForbiddenException('Access to this user is not allowed');
      }
    }

    const result = await this.usersService.remove(id);
    return {
      success: true,
      message: result.message,
    };
  }
}
