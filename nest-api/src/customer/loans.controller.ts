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

  @Get()
  async getLoanProducts() {
    const knex = this.knexService.instance;
    
    // Get all active loan products - Public endpoint for customer browsing
    const products = await knex('money_loan_products')
      .select('*')
      .where({ is_active: true })
      .orderBy('created_at', 'desc');

    console.log(`📦 Fetched ${products.length} loan products`);
    return products;
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
    return products;
  }
}
