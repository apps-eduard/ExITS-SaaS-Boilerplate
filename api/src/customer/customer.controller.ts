import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CustomerService } from './customer.service';
import { CustomerLoginDto } from './dto/customer-auth.dto';
import { MoneyLoanService } from '../money-loan/money-loan.service';
import { LoanCalculationRequestDto } from '../money-loan/dto/money-loan.dto';

@Controller('customers')
export class CustomerController {
  constructor(
    private customerService: CustomerService,
    private moneyLoanService: MoneyLoanService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('tenant-customers:read', 'money-loan:customers:read')
  async listCustomers(
    @Req() req: any,
    @Query('tenantId') tenantIdParam?: string,
    @Query('page') pageParam?: string,
    @Query('limit') limitParam?: string,
    @Query('status') status?: string,
    @Query('kycStatus') kycStatus?: string,
    @Query('search') search?: string,
  ) {
    const tenantId = this.resolveTenantContext(req.user, tenantIdParam, true);
    const page = pageParam ? parseInt(pageParam, 10) : undefined;
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const result = await this.customerService.listCustomers(tenantId, {
      page,
      limit,
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

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('tenant-customers:create', 'money-loan:customers:create')
  async createCustomer(
    @Req() req: any,
    @Body() payload: any,
    @Query('tenantId') tenantIdParam?: string,
  ) {
    const tenantId = this.resolveTenantContext(req.user, tenantIdParam, true);
    const customer = await this.customerService.createTenantCustomer(tenantId, payload, req.user?.id);
    return {
      success: true,
      message: 'Customer created successfully',
      data: customer,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('tenant-customers:read', 'money-loan:customers:read')
  async getCustomer(
    @Req() req: any,
    @Param('id') id: string,
    @Query('tenantId') tenantIdParam?: string,
  ) {
    const tenantId = this.resolveTenantContext(req.user, tenantIdParam, true);
    const customerId = parseInt(id, 10);
    if (!Number.isFinite(customerId)) {
      throw new BadRequestException('Customer ID must be a valid number');
    }

    const customer = await this.customerService.getCustomerDetails(tenantId, customerId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return {
      success: true,
      data: customer,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('tenant-customers:update', 'money-loan:customers:update')
  async updateCustomer(
    @Req() req: any,
    @Param('id') id: string,
    @Body() payload: any,
    @Query('tenantId') tenantIdParam?: string,
  ) {
    const tenantId = this.resolveTenantContext(req.user, tenantIdParam, true);
    const customerId = parseInt(id, 10);
    if (!Number.isFinite(customerId)) {
      throw new BadRequestException('Customer ID must be a valid number');
    }

    const updated = await this.customerService.updateTenantCustomer(tenantId, customerId, payload, req.user?.id);
    return {
      success: true,
      message: 'Customer updated successfully',
      data: updated,
    };
  }

  // Dashboard endpoint for mobile app
  @Get(':id/dashboard')
  async getDashboard(@Param('id') id: string) {
    return await this.customerService.getDashboard(parseInt(id));
  }

  // Loan details endpoint for mobile app
  @Get(':userId/loans/:loanId')
  async getLoanDetails(
    @Param('userId') userId: string,
    @Param('loanId') loanId: string
  ) {
    return await this.customerService.getLoanDetails(parseInt(userId), parseInt(loanId));
  }

  // Legacy customer/auth routes
  @Get('auth/check-email')
  async checkEmail(
    @Query('tenant') tenant: string,
    @Query('email') email: string
  ) {
    if (!tenant || !email) {
      throw new BadRequestException('Tenant and email are required');
    }
    
    const exists = await this.customerService.checkEmailExists(tenant, email);
    return {
      exists,
    };
  }

  @Post('auth/register')
  async register(@Body() payload: any) {
    const customer = await this.customerService.register(payload);
    return {
      success: true,
      message: 'Customer registered successfully',
      data: customer,
    };
  }

  @Post('auth/login')
  async login(@Body() loginDto: CustomerLoginDto) {
    return await this.customerService.login(loginDto);
  }

  @Get('auth/profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    const customer = await this.customerService.getProfile(req.user.customerId, req.user.tenantId);
    return {
      success: true,
      data: customer,
    };
  }

  @Put('auth/profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req: any, @Body() payload: any) {
    const updatedCustomer = await this.customerService.updateProfile(
      req.user.customerId,
      req.user.tenantId,
      payload
    );
    return {
      success: true,
      message: 'Profile updated successfully',
      data: updatedCustomer,
    };
  }

  @Post('auth/loan-preview')
  @UseGuards(JwtAuthGuard)
  async calculateLoanPreview(@Req() req: any, @Body() payload: LoanCalculationRequestDto) {
    const tenantId = req.user.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required for loan preview');
    }

    const preview = await this.moneyLoanService.calculateLoanPreview(Number(tenantId), payload);
    return {
      success: true,
      data: preview,
    };
  }

  @Get('auth/loans')
  @UseGuards(JwtAuthGuard)
  async getAuthLoans(@Req() req: any) {
    const loans = await this.customerService.getLoans(req.user.customerId, req.user.tenantId);
    return {
      success: true,
      data: loans,
    };
  }

  @Get('auth/applications')
  @UseGuards(JwtAuthGuard)
  async getApplications(@Req() req: any) {
    const applications = await this.customerService.getApplications(req.user.customerId, req.user.tenantId);
    return {
      success: true,
      data: applications,
    };
  }

  @Get('auth/payments')
  @UseGuards(JwtAuthGuard)
  async getPayments(@Req() req: any, @Query('loanId') loanId?: string) {
    console.log('🔐 getPayments - req.user:', req.user);
    
    const customerId = req.user.customerId;
    const tenantId = req.user.tenantId;
    
    if (!customerId) {
      throw new NotFoundException('Customer ID not found in token');
    }
    
    console.log(`📋 getPayments - Customer ID: ${customerId}, Tenant ID: ${tenantId}, Loan ID: ${loanId || 'all'}`);
    
    const payments = await this.customerService.getPayments(
      customerId,
      tenantId,
      loanId ? parseInt(loanId) : undefined
    );
    return {
      success: true,
      data: payments,
    };
  }

  @Get('auth/dashboard')
  @UseGuards(JwtAuthGuard)
  async getAuthDashboard(@Req() req: any) {
    const customerId = req.user.customerId;
    const tenantId = req.user.tenantId;
    
    if (!customerId) {
      throw new NotFoundException('Customer ID not found in token');
    }
    
    const dashboard = await this.customerService.getDashboardByCustomerId(customerId, tenantId);
    return {
      success: true,
      data: dashboard,
    };
  }

  @Get('auth/loans/:loanId')
  @UseGuards(JwtAuthGuard)
  async getAuthLoanDetails(@Req() req: any, @Param('loanId') loanId: string) {
    const customerId = req.user.customerId;
    const tenantId = req.user.tenantId;
    
    if (!customerId) {
      throw new NotFoundException('Customer ID not found in token');
    }
    
    const loanDetails = await this.customerService.getLoanDetailsByCustomerId(
      customerId, 
      tenantId, 
      parseInt(loanId)
    );
    return {
      success: true,
      data: loanDetails,
    };
  }

  @Get('auth/applications/:applicationId')
  @UseGuards(JwtAuthGuard)
  async getAuthApplicationDetails(@Req() req: any, @Param('applicationId') applicationId: string) {
    const customerId = req.user.customerId;
    const tenantId = req.user.tenantId;
    
    if (!customerId) {
      throw new NotFoundException('Customer ID not found in token');
    }
    
    const applicationDetails = await this.customerService.getApplicationDetailsByCustomerId(
      customerId, 
      tenantId, 
      parseInt(applicationId)
    );
    return {
      success: true,
      data: applicationDetails,
    };
  }

  private resolveTenantContext(user: any, tenantIdParam?: string, allowOverride = false): number {
    const permissions: string[] = user?.permissions || [];
    const hasSystemAccess = permissions.includes('money-loan:customers:read') || permissions.includes('users:read');

    let tenantId: number | undefined = user?.tenantId !== undefined && user?.tenantId !== null
      ? Number(user.tenantId)
      : undefined;

    if (tenantIdParam !== undefined) {
      const parsed = Number(tenantIdParam);
      if (!Number.isFinite(parsed)) {
        throw new BadRequestException('tenantId must be a valid number');
      }

      if (allowOverride || hasSystemAccess || tenantId === undefined) {
        tenantId = parsed;
      }
    }

    if (tenantId === undefined || Number.isNaN(tenantId)) {
      throw new BadRequestException('Tenant context is required');
    }

    if (!hasSystemAccess && user?.tenantId !== undefined && Number(user.tenantId) !== tenantId) {
      throw new ForbiddenException('Access to this tenant is not allowed');
    }

    return tenantId;
  }
}
