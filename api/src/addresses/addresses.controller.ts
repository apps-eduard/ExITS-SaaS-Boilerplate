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
  Query,
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

@Controller('addresses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get('regions')
  getRegions() {
    return {
      success: true,
      data: this.addressesService.getRegions(),
    };
  }

  @Get()
  @Permissions('users:read', 'tenant-users:read')
  async list(@Req() req: any, @Query('userId') userId?: string) {
    if (!userId) {
      return {
        success: true,
        data: [],
      };
    }

    const parsedUserId = Number(userId);
    if (!Number.isFinite(parsedUserId)) {
      throw new BadRequestException('userId must be a valid number');
    }

    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('users:read');

    const userContext = await this.addressesService.getUserContext(parsedUserId);

    if (!hasSystemAccess) {
      if (!requester?.tenantId || requester.tenantId !== userContext.tenantId) {
        throw new ForbiddenException('Access to this user is not allowed');
      }
    }

    const addresses = await this.addressesService.findByUser(parsedUserId);
    return {
      success: true,
      data: addresses,
    };
  }

  @Get(':id')
  @Permissions('users:read', 'tenant-users:read')
  async getOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('users:read');

    const address = await this.addressesService.findOne(id);
    const tenantId = address.tenantId ? Number(address.tenantId) : null;

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
  async create(@Req() req: any, @Body() dto: CreateAddressDto) {
    if (!dto.userId) {
      throw new BadRequestException('userId is required');
    }

    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('users:update');

    const userContext = await this.addressesService.getUserContext(dto.userId);

    if (!hasSystemAccess) {
      if (!requester?.tenantId || requester.tenantId !== userContext.tenantId) {
        throw new ForbiddenException('Access to this user is not allowed');
      }
    }

    const address = await this.addressesService.create(dto, requester?.id);
    return {
      success: true,
      message: 'Address created successfully',
      data: address,
    };
  }

  @Put(':id')
  @Permissions('users:update', 'tenant-users:update')
  async update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAddressDto,
  ) {
    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('users:update');

    const address = await this.addressesService.findOne(id);
    const tenantId = address.tenantId ? Number(address.tenantId) : null;

    if (!hasSystemAccess) {
      if (!requester?.tenantId || (tenantId !== null && requester.tenantId !== tenantId)) {
        throw new ForbiddenException('Access to this address is not allowed');
      }
    }

    const updated = await this.addressesService.update(id, dto, requester?.id);
    return {
      success: true,
      message: 'Address updated successfully',
      data: updated,
    };
  }

  @Delete(':id')
  @Permissions('users:update', 'tenant-users:update')
  async remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('users:update');

    const address = await this.addressesService.findOne(id);
    const tenantId = address.tenantId ? Number(address.tenantId) : null;

    if (!hasSystemAccess) {
      if (!requester?.tenantId || (tenantId !== null && requester.tenantId !== tenantId)) {
        throw new ForbiddenException('Access to this address is not allowed');
      }
    }

    await this.addressesService.remove(id, requester?.id);
    return {
      success: true,
      message: 'Address deleted successfully',
    };
  }

  @Patch(':id/set-primary')
  @Permissions('users:update', 'tenant-users:update')
  async setPrimary(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('users:update');

    const address = await this.addressesService.findOne(id);
    const tenantId = address.tenantId ? Number(address.tenantId) : null;

    if (!hasSystemAccess) {
      if (!requester?.tenantId || (tenantId !== null && requester.tenantId !== tenantId)) {
        throw new ForbiddenException('Access to this address is not allowed');
      }
    }

    const updated = await this.addressesService.setPrimary(id, requester?.id);
    return {
      success: true,
      message: 'Primary address updated successfully',
      data: updated,
    };
  }

  @Patch(':id/verify')
  @Permissions('users:update', 'tenant-users:update')
  async verify(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const requester = req.user;
    const permissions: string[] = requester?.permissions || [];
    const hasSystemAccess = permissions.includes('users:update');

    const address = await this.addressesService.findOne(id);
    const tenantId = address.tenantId ? Number(address.tenantId) : null;

    if (!hasSystemAccess) {
      if (!requester?.tenantId || (tenantId !== null && requester.tenantId !== tenantId)) {
        throw new ForbiddenException('Access to this address is not allowed');
      }
    }

    const updated = await this.addressesService.verify(id, requester?.id);
    return {
      success: true,
      message: 'Address verified successfully',
      data: updated,
    };
  }
}
