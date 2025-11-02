import { Module } from '@nestjs/common';
import { KnexModule } from '../database/knex.module';
import { RbacModule } from '../rbac/rbac.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

@Module({
  imports: [KnexModule, RbacModule],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
