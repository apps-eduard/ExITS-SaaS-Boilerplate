import { Module } from '@nestjs/common';
import { MoneyLoanController } from './money-loan.controller';
import { MoneyLoanTenantController } from './money-loan-tenant.controller';
import { MoneyLoanService } from './money-loan.service';
import { CollectorsController } from './collectors.controller';
import { CollectorActionsController } from './collector-actions.controller';
import { CollectorAssignmentService } from './services/collector-assignment.service';
import { KnexModule } from '../database/knex.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [KnexModule, RbacModule],
  controllers: [
    MoneyLoanController,
    MoneyLoanTenantController,
    CollectorsController,
    CollectorActionsController,
  ],
  providers: [MoneyLoanService, CollectorAssignmentService],
  exports: [MoneyLoanService],
})
export class MoneyLoanModule {}
