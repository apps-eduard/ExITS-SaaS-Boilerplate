import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { RbacController } from './rbac.controller';
import { KnexModule } from '../database/knex.module';

@Module({
  imports: [KnexModule],
  controllers: [RbacController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class RbacModule {}
