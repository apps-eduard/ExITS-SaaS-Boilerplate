import { Controller, Post, Get, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { MoneyLoanService } from './money-loan.service';
import { CreateLoanApplicationDto, ApproveLoanDto, DisburseLoanDto, CreatePaymentDto } from './dto/money-loan.dto';

@Controller('money-loan')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MoneyLoanController {
  constructor(private moneyLoanService: MoneyLoanService) {}

  @Post('applications')
  @Permissions('money-loan:create')
  async createApplication(@Body() createDto: CreateLoanApplicationDto, @Req() req: any) {
    const application = await this.moneyLoanService.createApplication(req.user.tenantId, createDto);
    return {
      success: true,
      message: 'Loan application created successfully',
      data: application,
    };
  }

  @Get('applications')
  @Permissions('money-loan:read')
  async getApplications(
    @Req() req: any,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('productId') productId?: string,
    @Query('product_id') legacyProductId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.moneyLoanService.getApplications(req.user.tenantId, {
      customerId: customerId ? parseInt(customerId, 10) : undefined,
      status,
      productId: productId ? parseInt(productId, 10) : legacyProductId ? parseInt(legacyProductId, 10) : undefined,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Put('applications/:id/approve')
  @Permissions('money-loan:approve')
  async approveApplication(
    @Param('id') id: string,
    @Body() approveDto: ApproveLoanDto,
    @Req() req: any
  ) {
    const loan = await this.moneyLoanService.approveApplication(
      req.user.tenantId,
      parseInt(id),
      approveDto,
      req.user.id
    );
    return {
      success: true,
      message: 'Application approved successfully',
      data: loan,
    };
  }

  @Get('loans')
  @Permissions('money-loan:read')
  async getLoans(
    @Req() req: any,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('loanProductId') loanProductId?: string,
    @Query('productId') productId?: string,
    @Query('product_id') legacyProductId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.moneyLoanService.getLoans(req.user.tenantId, {
      customerId: customerId ? parseInt(customerId, 10) : undefined,
      status,
      loanProductId: loanProductId ? parseInt(loanProductId, 10) : undefined,
      productId: productId
        ? parseInt(productId, 10)
        : legacyProductId
        ? parseInt(legacyProductId, 10)
        : undefined,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Post('loans/:id/disburse')
  @Permissions('money-loan:disburse', 'money-loan:loans:disburse')
  async disburseLoan(
    @Param('id') id: string,
    @Body() disburseDto: DisburseLoanDto,
    @Req() req: any
  ) {
    const loan = await this.moneyLoanService.disburseLoan(
      req.user.tenantId,
      parseInt(id),
      disburseDto,
      req.user.id
    );
    return {
      success: true,
      message: 'Loan disbursed successfully',
      data: loan,
    };
  }

  @Post('loans/:id/payments')
  @Permissions('money-loan:payment')
  async createPayment(
    @Param('id') id: string,
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req: any
  ) {
    const payment = await this.moneyLoanService.createPayment(
      req.user.tenantId,
      { ...createPaymentDto, loanId: parseInt(id) },
      req.user.id
    );
    return {
      success: true,
      message: 'Payment recorded successfully',
      data: payment,
    };
  }

  @Get('loans/:id/payments')
  @Permissions('money-loan:read')
  async getPayments(@Param('id') id: string, @Req() req: any) {
    const payments = await this.moneyLoanService.getPayments(req.user.tenantId, parseInt(id));
    return {
      success: true,
      data: payments,
    };
  }

  @Get('products')
  @Permissions('money-loan:read')
  async getProducts(@Req() req: any) {
    const onlyActive = req.user?.type === 'customer';
    const products = await this.moneyLoanService.getProducts(req.user.tenantId, { onlyActive });
    return {
      success: true,
      data: products,
    };
  }

  @Get('overview')
  @Permissions('money-loan:read')
  async getOverview(@Req() req: any) {
    const stats = await this.moneyLoanService.getOverview(req.user.tenantId);
    return {
      success: true,
      data: stats,
    };
  }

  @Get('loans/overview')
  @Permissions('money-loan:read')
  async getLoansOverview(@Req() req: any) {
    const stats = await this.moneyLoanService.getOverview(req.user.tenantId);
    return {
      success: true,
      data: stats,
    };
  }

  @Get('customers')
  @Permissions('money-loan:read')
  async getCustomers(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('kycStatus') kycStatus?: string,
  ) {
    const customers = await this.moneyLoanService.getCustomers(req.user.tenantId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      search,
      status,
      kycStatus,
    });
    return {
      success: true,
      data: customers.data,
      pagination: customers.pagination,
    };
  }

  @Get('customers/:id')
  @Permissions('money-loan:read')
  async getCustomerById(@Param('id') id: string, @Req() req: any) {
    const customer = await this.moneyLoanService.getCustomerById(req.user.tenantId, parseInt(id));
    return {
      success: true,
      data: customer,
    };
  }

  @Post('customers')
  @Permissions('money-loan:create')
  async createCustomer(@Body() customerData: any, @Req() req: any) {
    const customer = await this.moneyLoanService.createCustomer(req.user.tenantId, customerData, req.user.id);
    return {
      success: true,
      message: 'Customer created successfully',
      data: customer,
    };
  }

  @Put('customers/:id')
  @Permissions('money-loan:update')
  async updateCustomer(@Param('id') id: string, @Body() updateData: any, @Req() req: any) {
    const customer = await this.moneyLoanService.updateCustomer(req.user.tenantId, parseInt(id), updateData);
    return {
      success: true,
      message: 'Customer updated successfully',
      data: customer,
    };
  }

  @Get('customers/:id/stats')
  @Permissions('money-loan:read')
  async getCustomerStats(@Param('id') id: string, @Req() req: any) {
    const stats = await this.moneyLoanService.getCustomerStats(req.user.tenantId, parseInt(id));
    return {
      success: true,
      data: stats,
    };
  }
}
