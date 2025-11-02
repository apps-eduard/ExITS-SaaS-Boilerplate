import { Controller, Post, Get, Body, Param, Query, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomerService } from './customer.service';
import { CustomerLoginDto } from './dto/customer-auth.dto';

@Controller('customers')
export class CustomerController {
  constructor(private customerService: CustomerService) {}

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
}
