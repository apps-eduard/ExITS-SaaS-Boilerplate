import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CustomerController } from './customer.controller';
import { LoansController, LoanProductsController } from './loans.controller';
import { CustomerService } from './customer.service';
import { KnexModule } from '../database/knex.module';
import { RbacModule } from '../rbac/rbac.module';
import { MoneyLoanModule } from '../money-loan/money-loan.module';

@Module({
  imports: [
    KnexModule,
    RbacModule,
    MoneyLoanModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [CustomerController, LoansController, LoanProductsController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
