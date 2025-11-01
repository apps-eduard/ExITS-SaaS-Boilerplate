import { Controller, Post, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomerService } from './customer.service';
import { CustomerLoginDto } from './dto/customer-auth.dto';

@Controller('customer/auth')
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @Post('login')
  async login(@Body() loginDto: CustomerLoginDto) {
    return await this.customerService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    const customer = await this.customerService.getProfile(req.user.customerId, req.user.tenantId);
    return {
      success: true,
      data: customer,
    };
  }

  @Get('loans')
  @UseGuards(JwtAuthGuard)
  async getLoans(@Req() req: any) {
    const loans = await this.customerService.getLoans(req.user.customerId, req.user.tenantId);
    return {
      success: true,
      data: loans,
    };
  }

  @Get('applications')
  @UseGuards(JwtAuthGuard)
  async getApplications(@Req() req: any) {
    const applications = await this.customerService.getApplications(req.user.customerId, req.user.tenantId);
    return {
      success: true,
      data: applications,
    };
  }

  @Get('payments')
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
