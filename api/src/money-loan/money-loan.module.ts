import { Module } from '@nestjs/common';
import { MoneyLoanController } from './money-loan.controller';
import { MoneyLoanTenantController } from './money-loan-tenant.controller';
import { MoneyLoanService } from './money-loan.service';
import { KnexModule } from '../database/knex.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [KnexModule, RbacModule],
  controllers: [MoneyLoanController, MoneyLoanTenantController],
  providers: [MoneyLoanService],
  exports: [MoneyLoanService],
})
export class MoneyLoanModule {}
