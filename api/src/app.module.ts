import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KnexModule } from './database/knex.module';
import { AuthModule } from './auth/auth.module';
import { RbacModule } from './rbac/rbac.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { MoneyLoanModule } from './money-loan/money-loan.module';
import { CustomerModule } from './customer/customer.module';
import { BillingModule } from './billing/billing.module';
import { AddressesModule } from './addresses/addresses.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    KnexModule,
    AuthModule,
    RbacModule,
    UsersModule,
    TenantsModule,
    MoneyLoanModule,
    CustomerModule,
    BillingModule,
    AddressesModule,
    SubscriptionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
