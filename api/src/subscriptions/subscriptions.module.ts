import { Module } from '@nestjs/common';
import { KnexModule } from '../database/knex.module';
import { RbacModule } from '../rbac/rbac.module';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionPlansController } from './subscription-plans.controller';
import { PlatformSubscriptionsService } from './platform-subscriptions.service';
import { PlatformSubscriptionsController } from './platform-subscriptions.controller';

@Module({
  imports: [KnexModule, RbacModule],
  controllers: [SubscriptionsController, SubscriptionPlansController, PlatformSubscriptionsController],
  providers: [SubscriptionsService, PlatformSubscriptionsService],
  exports: [SubscriptionsService, PlatformSubscriptionsService],
})
export class SubscriptionsModule {}
