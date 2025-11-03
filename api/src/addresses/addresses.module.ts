import { Module } from '@nestjs/common';
import { KnexModule } from '../database/knex.module';
import { RbacModule } from '../rbac/rbac.module';
import { AddressesService } from './addresses.service';
import { AddressesController } from './addresses.controller';
import { UserAddressesController } from './user-addresses.controller';

@Module({
  imports: [KnexModule, RbacModule],
  controllers: [AddressesController, UserAddressesController],
  providers: [AddressesService],
  exports: [AddressesService],
})
export class AddressesModule {}
