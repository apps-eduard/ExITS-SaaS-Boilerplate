import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { MoneyLoanService } from './money-loan.service';
import { DisburseLoanDto, CreateLoanProductDto, UpdateLoanProductDto, CreateLoanApplicationDto } from './dto/money-loan.dto';

const productBodyValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: false,
  transform: true,
});

@Controller('tenants/:tenantId/platforms/moneyloan')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MoneyLoanTenantController {
  constructor(private readonly moneyLoanService: MoneyLoanService) {}

  private parseTenantId(rawTenantId: string): number {
    const tenantId = parseInt(rawTenantId, 10);
    if (Number.isNaN(tenantId) || tenantId <= 0) {
      throw new ForbiddenException('Invalid tenant identifier');
    }
    return tenantId;
  }

  private ensureTenantAccess(request: any, tenantId: number): number {
    const userTenantId = request?.user?.tenantId;
    if (userTenantId && userTenantId !== tenantId) {
      throw new ForbiddenException('Access to tenant resources denied');
    }
    return tenantId;
  }

  private parseProductId(rawProductId: string): number {
    const productId = parseInt(rawProductId, 10);
    if (Number.isNaN(productId) || productId <= 0) {
      throw new BadRequestException('Invalid product identifier');
    }
    return productId;
  }

  @Get('loans/products')
  @Permissions('money-loan:read')
  async getLoanProducts(@Param('tenantId') tenantIdParam: string, @Req() req: any) {
    const tenantId = this.ensureTenantAccess(req, this.parseTenantId(tenantIdParam));
    const onlyActive = req.user?.type === 'customer';
    const products = await this.moneyLoanService.getProducts(tenantId, { onlyActive });
    return {
      success: true,
      data: products,
    };
  }

  @Post('loans/products')
  @Permissions('money-loan:create', 'loans:create', 'products:create')
  @UsePipes(productBodyValidationPipe)
  async createLoanProduct(
    @Param('tenantId') tenantIdParam: string,
    @Body() createDto: CreateLoanProductDto,
    @Req() req: any,
  ) {
    const tenantId = this.ensureTenantAccess(req, this.parseTenantId(tenantIdParam));
    const product = await this.moneyLoanService.createProduct(tenantId, createDto);
    return {
      success: true,
      message: 'Loan product created successfully',
      data: product,
    };
  }

  @Put('loans/products/:productId')
  @Permissions('money-loan:update', 'loans:update', 'products:update')
  @UsePipes(productBodyValidationPipe)
  async updateLoanProduct(
    @Param('tenantId') tenantIdParam: string,
    @Param('productId') productIdParam: string,
    @Body() updateDto: UpdateLoanProductDto,
    @Req() req: any,
  ) {
    const tenantId = this.ensureTenantAccess(req, this.parseTenantId(tenantIdParam));
    const productId = this.parseProductId(productIdParam);
    const product = await this.moneyLoanService.updateProduct(tenantId, productId, updateDto);
    return {
      success: true,
      message: 'Loan product updated successfully',
      data: product,
    };
  }

  @Delete('loans/products/:productId')
  @Permissions('money-loan:update', 'loans:delete', 'products:delete')
  async deleteLoanProduct(
    @Param('tenantId') tenantIdParam: string,
    @Param('productId') productIdParam: string,
    @Req() req: any,
  ) {
    const tenantId = this.ensureTenantAccess(req, this.parseTenantId(tenantIdParam));
    const productId = this.parseProductId(productIdParam);
    await this.moneyLoanService.deleteProduct(tenantId, productId);
    return {
      success: true,
      message: 'Loan product deleted successfully',
    };
  }

  @Get('loans')
  @Permissions('money-loan:read')
  async listLoans(
    @Param('tenantId') tenantIdParam: string,
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
    const tenantId = this.ensureTenantAccess(req, this.parseTenantId(tenantIdParam));
    
    console.log('🔍 [LIST LOANS] Request received:', {
      tenantId,
      userType: req.user?.type,
      customerId,
      status,
      search,
      page,
      limit,
      loanProductId,
      productId
    });
    
    if (req.user?.type === 'customer') {
      const filters = {
        customerId: req.user.customerId,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        status,
        loanProductId: loanProductId ? parseInt(loanProductId, 10) : undefined,
        productId: productId
          ? parseInt(productId, 10)
          : legacyProductId
          ? parseInt(legacyProductId, 10)
          : undefined,
        search,
      };
      console.log('👤 [CUSTOMER REQUEST] Filters:', filters);
      const result = await this.moneyLoanService.getLoans(tenantId, filters);
      console.log('✅ [CUSTOMER RESPONSE] Found:', result.data.length, 'loans');
      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };
    }
    
    const filters = {
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
    };
    console.log('👔 [ADMIN REQUEST] Filters:', filters);
    const result = await this.moneyLoanService.getLoans(tenantId, filters);
    console.log('✅ [ADMIN RESPONSE] Found:', result.data.length, 'loans');
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Get('loans/overview')
  @Permissions('money-loan:read')
  async getLoansOverview(@Param('tenantId') tenantIdParam: string, @Req() req: any) {
    const tenantId = this.ensureTenantAccess(req, this.parseTenantId(tenantIdParam));
    const stats = await this.moneyLoanService.getOverview(tenantId);
    return {
      success: true,
      data: stats,
    };
  }

  @Post('loans/:loanId/disburse')
  @Permissions('money-loan:disburse', 'loans:disburse', 'money-loan:loans:disburse')
  async disburseLoan(
    @Param('tenantId') tenantIdParam: string,
    @Param('loanId') loanIdParam: string,
    @Body() disburseDto: DisburseLoanDto,
    @Req() req: any,
  ) {
    const tenantId = this.ensureTenantAccess(req, this.parseTenantId(tenantIdParam));
    const loanId = parseInt(loanIdParam, 10);
    const loan = await this.moneyLoanService.disburseLoan(tenantId, loanId, disburseDto, req.user.id);
    return {
      success: true,
      message: 'Loan disbursed successfully',
      data: loan,
    };
  }

  @Get('loans/customers/:customerId/loans')
  @Permissions('money-loan:read')
  async listCustomerLoans(
    @Param('tenantId') tenantIdParam: string,
    @Param('customerId') customerIdParam: string,
    @Req() req: any,
  ) {
    const tenantId = this.ensureTenantAccess(req, this.parseTenantId(tenantIdParam));
    const customerId = parseInt(customerIdParam, 10);
    if (req.user?.type === 'customer' && req.user.customerId !== customerId) {
      throw new ForbiddenException('Access to another customer loans is not allowed');
    }
    const result = await this.moneyLoanService.getLoans(tenantId, {
      customerId,
      limit: 100,
    });
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Get('loans/applications')
  @Permissions('money-loan:read')
  async listApplications(
    @Param('tenantId') tenantIdParam: string,
    @Req() req: any,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('productId') productId?: string,
    @Query('product_id') legacyProductId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const tenantId = this.ensureTenantAccess(req, this.parseTenantId(tenantIdParam));
    const result = await this.moneyLoanService.getApplications(tenantId, {
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

  @Post('loans/applications')
  async createLoanApplication(
    @Param('tenantId') tenantIdParam: string,
    @Body() createDto: CreateLoanApplicationDto,
    @Req() req: any,
  ) {
    const tenantId = this.ensureTenantAccess(req, this.parseTenantId(tenantIdParam));
    
    // Check if customer already has a pending application for THIS SPECIFIC product
    // Products remain disabled through submitted AND approved states, only re-enable after disbursed/rejected
    const pendingApplications = await this.moneyLoanService.getApplications(tenantId, {
      customerId: createDto.customerId,
      productId: createDto.loanProductId,
      status: 'submitted,approved',
      limit: 1,
    });

    if (pendingApplications.data && pendingApplications.data.length > 0) {
      const app = pendingApplications.data[0];
      const statusMessage = app.status === 'approved' 
        ? 'Your application for this loan product has been approved and is awaiting disbursement.'
        : 'You already have a pending application for this loan product. Please wait for it to be processed.';
      throw new BadRequestException(statusMessage);
    }

    const application = await this.moneyLoanService.createApplication(tenantId, createDto);
    return {
      success: true,
      message: 'Loan application submitted successfully',
      data: application,
    };
  }
}
