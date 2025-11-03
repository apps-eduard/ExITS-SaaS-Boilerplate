import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { KnexService } from '../database/knex.service';
import { SubscribePlatformDto } from './dto/subscribe-platform.dto';
import { UpdatePlatformSubscriptionDto } from './dto/update-platform-subscription.dto';

@Injectable()
export class PlatformSubscriptionsService {
  constructor(private readonly knexService: KnexService) {}

  async listTenantSubscriptions(tenantId: number) {
    const knex = this.knexService.instance;

    const rows = await knex('platform_subscriptions as ps')
      .leftJoin('subscription_plans as sp', 'sp.id', 'ps.subscription_plan_id')
      .select(
        'ps.id',
        'ps.tenant_id',
        'ps.platform_type',
        'ps.subscription_plan_id',
        'ps.status',
        'ps.started_at',
        'ps.expires_at',
        'ps.price',
        'ps.billing_cycle',
        'ps.metadata',
        'ps.created_at',
        'ps.updated_at',
        'sp.name as plan_name',
        'sp.description as plan_description',
        'sp.price as plan_price',
        'sp.billing_cycle as plan_billing_cycle',
        'sp.features as plan_features',
        'sp.platform_type as plan_platform_type',
        'sp.status as plan_status',
      )
      .where('ps.tenant_id', tenantId)
      .orderBy('ps.platform_type', 'asc');

    return rows.map((row) => this.mapSubscription(row));
  }

  async getTenantSubscription(tenantId: number, platformType: string) {
    const knex = this.knexService.instance;

    const row = await knex('platform_subscriptions as ps')
      .leftJoin('subscription_plans as sp', 'sp.id', 'ps.subscription_plan_id')
      .select(
        'ps.id',
        'ps.tenant_id',
        'ps.platform_type',
        'ps.subscription_plan_id',
        'ps.status',
        'ps.started_at',
        'ps.expires_at',
        'ps.price',
        'ps.billing_cycle',
        'ps.metadata',
        'ps.created_at',
        'ps.updated_at',
        'sp.name as plan_name',
        'sp.description as plan_description',
        'sp.price as plan_price',
        'sp.billing_cycle as plan_billing_cycle',
        'sp.features as plan_features',
        'sp.platform_type as plan_platform_type',
        'sp.status as plan_status',
      )
      .where({ 'ps.tenant_id': tenantId, 'ps.platform_type': platformType })
      .first();

    if (!row) {
      throw new NotFoundException('Platform subscription not found');
    }

    return this.mapSubscription(row);
  }

  async subscribeTenant(
    tenantId: number,
    dto: SubscribePlatformDto,
    userId?: number | null,
  ) {
    const knex = this.knexService.instance;

    const platformType = (dto.platformType || '').trim().toLowerCase();

    if (!platformType) {
      throw new BadRequestException('platformType is required');
    }

    return await knex.transaction(async (trx) => {
      const plan = await this.ensurePlanMatchesPlatform(trx, dto.subscriptionPlanId, platformType);
      const cycle = dto.billingCycle ?? plan.billing_cycle ?? 'monthly';
      const now = new Date();
      const startsAt = dto.startsAt ? new Date(dto.startsAt) : now;
      const price = this.toNumber(plan.price, 0);

      const payload: Record<string, any> = {
        subscription_plan_id: plan.id,
        status: 'active',
        started_at: startsAt,
        expires_at: null,
        price,
        billing_cycle: cycle,
        metadata: {},
        updated_at: now,
      };

      const existing = await trx('platform_subscriptions')
        .where({ tenant_id: tenantId, platform_type: platformType })
        .first();

      if (existing) {
        await trx('platform_subscriptions')
          .where({ id: existing.id })
          .update(payload);
      } else {
        await trx('platform_subscriptions').insert({
          tenant_id: tenantId,
          platform_type: platformType,
          ...payload,
        });
      }

      await trx('payment_history').insert({
        tenant_id: tenantId,
        transaction_id: this.generateTransactionId(),
        amount: price,
        currency: 'PHP',
        status: 'completed',
        provider: 'manual',
        processed_at: now,
        user_id: userId ?? null,
        subscription_plan_id: plan.id,
        transaction_type: existing ? 'upgrade' : 'subscription',
        plan_name: plan.name,
        platform_type: platformType,
        description: `${existing ? 'Updated' : 'Subscribed to'} ${plan.name} (${cycle})`,
      });

      const latest = await trx('platform_subscriptions as ps')
        .leftJoin('subscription_plans as sp', 'sp.id', 'ps.subscription_plan_id')
        .select(
          'ps.id',
          'ps.tenant_id',
          'ps.platform_type',
          'ps.subscription_plan_id',
          'ps.status',
          'ps.started_at',
          'ps.expires_at',
          'ps.price',
          'ps.billing_cycle',
          'ps.metadata',
          'ps.created_at',
          'ps.updated_at',
          'sp.name as plan_name',
          'sp.description as plan_description',
          'sp.price as plan_price',
          'sp.billing_cycle as plan_billing_cycle',
          'sp.features as plan_features',
          'sp.platform_type as plan_platform_type',
          'sp.status as plan_status',
        )
        .where({ 'ps.tenant_id': tenantId, 'ps.platform_type': platformType })
        .first();

      return this.mapSubscription(latest);
    });
  }

  async updateTenantSubscription(
    tenantId: number,
    platformType: string,
    dto: UpdatePlatformSubscriptionDto,
  ) {
    const knex = this.knexService.instance;

    const normalizedPlatformType = (platformType || '').trim().toLowerCase();

    return await knex.transaction(async (trx) => {
      const existing = await trx('platform_subscriptions')
        .where({ tenant_id: tenantId, platform_type: normalizedPlatformType })
        .first();

      if (!existing) {
        throw new NotFoundException('Platform subscription not found');
      }

      const updatePayload: Record<string, any> = {
        updated_at: new Date(),
      };

      if (dto.subscriptionPlanId) {
  const plan = await this.ensurePlanMatchesPlatform(trx, dto.subscriptionPlanId, normalizedPlatformType);
        updatePayload.subscription_plan_id = plan.id;
        updatePayload.price = this.toNumber(plan.price, 0);
        updatePayload.billing_cycle = dto.billingCycle ?? plan.billing_cycle ?? existing.billing_cycle ?? 'monthly';
      }

      if (dto.billingCycle) {
        updatePayload.billing_cycle = dto.billingCycle;
      }

      if (dto.price !== undefined) {
        updatePayload.price = this.toNumber(dto.price, 0);
      }

      if (dto.expiresAt !== undefined) {
        updatePayload.expires_at = dto.expiresAt ? new Date(dto.expiresAt) : null;
      }

      if (dto.status) {
        updatePayload.status = dto.status;
      }

      await trx('platform_subscriptions')
        .where({ id: existing.id })
        .update(updatePayload);

      const latest = await trx('platform_subscriptions as ps')
        .leftJoin('subscription_plans as sp', 'sp.id', 'ps.subscription_plan_id')
        .select(
          'ps.id',
          'ps.tenant_id',
          'ps.platform_type',
          'ps.subscription_plan_id',
          'ps.status',
          'ps.started_at',
          'ps.expires_at',
          'ps.price',
          'ps.billing_cycle',
          'ps.metadata',
          'ps.created_at',
          'ps.updated_at',
          'sp.name as plan_name',
          'sp.description as plan_description',
          'sp.price as plan_price',
          'sp.billing_cycle as plan_billing_cycle',
          'sp.features as plan_features',
          'sp.platform_type as plan_platform_type',
          'sp.status as plan_status',
        )
  .where({ 'ps.id': existing.id })
        .first();

      return this.mapSubscription(latest);
    });
  }

  async unsubscribeTenant(tenantId: number, platformType: string) {
    const knex = this.knexService.instance;

    const normalizedPlatformType = (platformType || '').trim().toLowerCase();

    const existing = await knex('platform_subscriptions')
      .where({ tenant_id: tenantId, platform_type: normalizedPlatformType })
      .first();

    if (!existing) {
      throw new NotFoundException('Platform subscription not found');
    }

    const now = new Date();

    await knex('platform_subscriptions')
      .where({ id: existing.id })
      .update({
        status: 'cancelled',
        expires_at: now,
        updated_at: now,
      });

    return {
      success: true,
      message: 'Platform subscription cancelled successfully',
    };
  }

  private async ensurePlanMatchesPlatform(knex: Knex, planId: number, platformType: string) {
    const plan = await knex('subscription_plans')
      .where({ id: planId, status: 'active' })
      .first();

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const normalizedPlanType = (plan.platform_type || '').trim().toLowerCase();
    const normalizedRequestedType = (platformType || '').trim().toLowerCase();

    if (!normalizedPlanType || normalizedPlanType !== normalizedRequestedType) {
      throw new BadRequestException('Selected plan does not match platform type');
    }

    return plan;
  }

  private mapSubscription(row: any) {
    if (!row) {
      return null;
    }

    const features = this.normalizeFeatures(row.plan_features);

    const subscriptionPlan = row.subscription_plan_id
      ? {
          id: row.subscription_plan_id,
          name: row.plan_name,
          description: row.plan_description ?? '',
          price: this.toNumber(row.plan_price, 0),
          billingCycle: row.plan_billing_cycle ?? 'monthly',
          features,
          platformType: row.plan_platform_type ?? null,
          status: row.plan_status ?? 'active',
        }
      : null;

    return {
      id: row.id,
      tenantId: row.tenant_id,
      platformType: row.platform_type,
      subscriptionPlanId: row.subscription_plan_id,
      subscriptionPlan,
      status: row.status,
      startsAt: row.started_at,
      expiresAt: row.expires_at,
      price: this.toNumber(row.price ?? row.plan_price, 0),
      billingCycle: row.billing_cycle ?? row.plan_billing_cycle ?? 'monthly',
  metadata: this.normalizeMetadata(row.metadata),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private normalizeFeatures(value: any) {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }

    return [];
  }

  private normalizeMetadata(value: any) {
    if (!value) {
      return {};
    }

    if (typeof value === 'object') {
      return value;
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return typeof parsed === 'object' && parsed !== null ? parsed : {};
      } catch (error) {
        return {};
      }
    }

    return {};
  }

  private toNumber(value: any, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private generateTransactionId(): string {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `PS-${datePart}-${randomPart}`;
  }
}
