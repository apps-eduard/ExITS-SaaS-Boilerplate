import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Controller('users/:userId/addresses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UserAddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @Permissions('users:read', 'tenant-users:read')
  async list(@Req() req: any, @Param('userId', ParseIntPipe) userId: number) {
    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('users:read');

    const userContext = await this.addressesService.getUserContext(userId);

    if (!hasSystemAccess) {
      if (!requester?.tenantId || requester.tenantId !== userContext.tenantId) {
        throw new ForbiddenException('Access to this user is not allowed');
      }
    }

    const addresses = await this.addressesService.findByUser(userId);
    return {
      success: true,
      data: addresses,
    };
  }

  @Get(':addressId')
  @Permissions('users:read', 'tenant-users:read')
  async getOne(
    @Req() req: any,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('addressId', ParseIntPipe) addressId: number,
  ) {
    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('users:read');

    const address = await this.addressesService.findOne(addressId);
    const tenantId = address.tenantId ? Number(address.tenantId) : null;
    const ownerUserId = address.userId ? Number(address.userId) : null;

    if (ownerUserId !== null && ownerUserId !== userId) {
      throw new BadRequestException('Address does not belong to the specified user');
    }

    if (!hasSystemAccess) {
      if (!requester?.tenantId || (tenantId !== null && requester.tenantId !== tenantId)) {
        throw new ForbiddenException('Access to this address is not allowed');
      }
    }

    return {
      success: true,
      data: address,
    };
  }

  @Post()
  @Permissions('users:update', 'tenant-users:update')
  async create(
    @Req() req: any,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateAddressDto,
  ) {
    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('users:update');

    const userContext = await this.addressesService.getUserContext(userId);

    if (!hasSystemAccess) {
      if (!requester?.tenantId || requester.tenantId !== userContext.tenantId) {
        throw new ForbiddenException('Access to this user is not allowed');
      }
    }

    dto.userId = userId;

    const address = await this.addressesService.create(dto, requester?.id);
    return {
      success: true,
      message: 'Address created successfully',
      data: address,
    };
  }

  @Put(':addressId')
  @Permissions('users:update', 'tenant-users:update')
  async update(
    @Req() req: any,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('addressId', ParseIntPipe) addressId: number,
    @Body() dto: UpdateAddressDto,
  ) {
    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('users:update');

    const existing = await this.addressesService.findOne(addressId);
    const tenantId = existing.tenantId ? Number(existing.tenantId) : null;
    const ownerUserId = existing.userId ? Number(existing.userId) : null;

    if (ownerUserId !== null && ownerUserId !== userId) {
      throw new BadRequestException('Address does not belong to the specified user');
    }

    if (!hasSystemAccess) {
      if (!requester?.tenantId || (tenantId !== null && requester.tenantId !== tenantId)) {
        throw new ForbiddenException('Access to this address is not allowed');
      }
    }

    dto.userId = userId;
    const updated = await this.addressesService.update(addressId, dto, requester?.id);
    return {
      success: true,
      message: 'Address updated successfully',
      data: updated,
    };
  }

  @Delete(':addressId')
  @Permissions('users:update', 'tenant-users:update')
  async remove(
    @Req() req: any,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('addressId', ParseIntPipe) addressId: number,
  ) {
    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('users:update');

    const existing = await this.addressesService.findOne(addressId);
    const tenantId = existing.tenantId ? Number(existing.tenantId) : null;
    const ownerUserId = existing.userId ? Number(existing.userId) : null;

    if (ownerUserId !== null && ownerUserId !== userId) {
      throw new BadRequestException('Address does not belong to the specified user');
    }

    if (!hasSystemAccess) {
      if (!requester?.tenantId || (tenantId !== null && requester.tenantId !== tenantId)) {
        throw new ForbiddenException('Access to this address is not allowed');
      }
    }

    await this.addressesService.remove(addressId, requester?.id);
    return {
      success: true,
      message: 'Address deleted successfully',
    };
  }

  @Patch(':addressId/set-primary')
  @Permissions('users:update', 'tenant-users:update')
  async setPrimary(
    @Req() req: any,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('addressId', ParseIntPipe) addressId: number,
  ) {
    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('users:update');

    const existing = await this.addressesService.findOne(addressId);
    const tenantId = existing.tenantId ? Number(existing.tenantId) : null;
    const ownerUserId = existing.userId ? Number(existing.userId) : null;

    if (ownerUserId !== null && ownerUserId !== userId) {
      throw new BadRequestException('Address does not belong to the specified user');
    }

    if (!hasSystemAccess) {
      if (!requester?.tenantId || (tenantId !== null && requester.tenantId !== tenantId)) {
        throw new ForbiddenException('Access to this address is not allowed');
      }
    }

    const updated = await this.addressesService.setPrimary(addressId, requester?.id);
    return {
      success: true,
      message: 'Primary address updated successfully',
      data: updated,
    };
  }

  @Patch(':addressId/verify')
  @Permissions('users:update', 'tenant-users:update')
  async verify(
    @Req() req: any,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('addressId', ParseIntPipe) addressId: number,
  ) {
    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('users:update');

    const existing = await this.addressesService.findOne(addressId);
    const tenantId = existing.tenantId ? Number(existing.tenantId) : null;
    const ownerUserId = existing.userId ? Number(existing.userId) : null;

    if (ownerUserId !== null && ownerUserId !== userId) {
      throw new BadRequestException('Address does not belong to the specified user');
    }

    if (!hasSystemAccess) {
      if (!requester?.tenantId || (tenantId !== null && requester.tenantId !== tenantId)) {
        throw new ForbiddenException('Access to this address is not allowed');
      }
    }

    const updated = await this.addressesService.verify(addressId, requester?.id);
    return {
      success: true,
      message: 'Address verified successfully',
      data: updated,
    };
  }
}
