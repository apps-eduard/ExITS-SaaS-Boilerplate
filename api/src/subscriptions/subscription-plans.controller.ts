import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';

const PRODUCT_PLAN_TYPES = new Set(['money_loan', 'bnpl', 'pawnshop']);

@Controller('subscription-plans')
export class SubscriptionPlansController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  async listPlatformPlans() {
    const plans = await this.subscriptionsService.listPlans();
    const data = plans
      .filter((plan) => !plan.product_type || !PRODUCT_PLAN_TYPES.has(plan.product_type))
      .map((plan) => this.transformPlan(plan));

    return {
      success: true,
      data,
      count: data.length,
    };
  }

  @Get('all/including-products')
  async listAllPlansIncludingProducts() {
    const plans = await this.subscriptionsService.listPlans();
    const data = plans.map((plan) => this.transformPlan(plan));

    return {
      success: true,
      data,
      count: data.length,
    };
  }

  @Get(':id')
  async getPlan(@Param('id') id: string) {
    let plan = null;
    const numericId = Number(id);

    if (Number.isFinite(numericId)) {
      plan = await this.subscriptionsService.findPlanById(numericId);
    }

    if (!plan) {
      const plans = await this.subscriptionsService.listPlans();
      plan = plans.find((candidate) => String(candidate.id) === id || candidate.name === id);
    }

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    return {
      success: true,
      data: this.transformPlan(plan),
    };
  }

  private transformPlan(plan: any) {
    const features = Array.isArray(plan.features) ? plan.features : [];
    const maxUsers = plan.max_users !== null && plan.max_users !== undefined ? Number(plan.max_users) : null;
    const maxStorageGb = plan.max_storage_gb !== null && plan.max_storage_gb !== undefined ? Number(plan.max_storage_gb) : null;
    const trialDays = plan.trial_days !== null && plan.trial_days !== undefined ? Number(plan.trial_days) : 0;
    const subscriberCount = Number(plan.subscriber_count ?? 0);

    return {
      id: plan.id,
      name: plan.name,
      displayName: plan.name,
      description: plan.description ?? '',
      icon: plan.is_featured ? '🌟' : '📦',
      price: Number(plan.price ?? 0),
      billingCycle: plan.billing_cycle ?? 'monthly',
      productType: plan.product_type ?? null,
      maxUsers,
      maxStorageGb,
      features,
      isActive: plan.status === 'active',
      isRecommended: Boolean(plan.is_featured),
      customPricing: Boolean(plan.custom_pricing),
      subscriberCount,
      trialDays,
      createdAt: plan.created_at ?? null,
      updatedAt: plan.updated_at ?? null,
      sortOrder: plan.sort_order ?? 0,
    };
  }
}
