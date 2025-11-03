import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { KnexService } from '../database/knex.service';

@Controller('loans')
export class LoansController {
  constructor(
    private customerService: CustomerService,
    private knexService: KnexService,
  ) {}

  @Get('customer/:id')
  async getCustomerLoans(@Param('id') id: string) {
    // Get customer's tenant_id first
    const loans = await this.customerService.getLoansById(parseInt(id));
    return loans;
  }
}

@Controller('loan-products')
export class LoanProductsController {
  constructor(private knexService: KnexService) {}

  private transformProductFields(product: any) {
    // Knex already converts snake_case to camelCase via postProcessResponse
    // So we just return the product with proper field selection
    return {
      id: product.id,
      tenantId: product.tenantId,
      productCode: product.productCode,
      name: product.name,
      description: product.description,
      minAmount: product.minAmount,
      maxAmount: product.maxAmount,
      interestRate: product.interestRate,
      interestType: product.interestType,
      loanTermType: product.loanTermType,
      fixedTermDays: product.fixedTermDays,
      minTermDays: product.minTermDays,
      maxTermDays: product.maxTermDays,
      processingFeePercent: product.processingFeePercent,
      platformFee: product.platformFee,
      latePaymentPenaltyPercent: product.latePaymentPenaltyPercent,
      gracePeriodDays: product.gracePeriodDays,
      paymentFrequency: product.paymentFrequency,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  @Get()
  async getLoanProducts() {
    const knex = this.knexService.instance;
    
    // Get all active loan products - Public endpoint for customer browsing
    const products = await knex('money_loan_products')
      .select('*')
      .where({ is_active: true })
      .orderBy('created_at', 'desc');

    console.log(`📦 Fetched ${products.length} loan products (all tenants)`);
    
    // Transform database fields to camelCase
    const transformed = products.map(product => this.transformProductFields(product));
    
    return transformed;
  }

  @Get('tenant/:tenantId')
  async getLoanProductsByTenant(@Param('tenantId') tenantId: string) {
    const knex = this.knexService.instance;
    
    const products = await knex('money_loan_products')
      .select('*')
      .where({ 
        tenant_id: parseInt(tenantId),
        is_active: true 
      })
      .orderBy('created_at', 'desc');

    console.log(`📦 Fetched ${products.length} loan products for tenant ${tenantId}`);
    
    // Transform database fields to camelCase with proper formatting
    const transformed = products.map(product => this.transformProductFields(product));
    
    console.log('✅ Transformed products:', transformed);
    
    return transformed;
  }
}
