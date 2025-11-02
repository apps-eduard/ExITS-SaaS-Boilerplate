import { Controller, Post, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
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
    const payments = await this.customerService.getPayments(
      req.user.customerId,
      req.user.tenantId,
      loanId ? parseInt(loanId) : undefined
    );
    return {
      success: true,
      data: payments,
    };
  }
}
