import { Injectable, NotFoundException } from '@nestjs/common';
import { KnexService } from '../database/knex.service';

export interface SubscriptionFilter {
  tenantId?: number;
}

@Injectable()
export class BillingService {
  constructor(private readonly knexService: KnexService) {}

  async getSubscriptions(filter: SubscriptionFilter = {}) {
    const knex = this.knexService.instance;

    try {
      let query = knex('tenant_subscriptions as ts')
        .leftJoin('tenants as t', 'ts.tenant_id', 't.id')
        .leftJoin('subscription_plans as sp', 'ts.plan_id', 'sp.id')
        .select(
          'ts.id',
          'ts.tenant_id',
          'ts.plan_id',
          'ts.status',
          'ts.started_at',
          'ts.expires_at',
          'ts.next_billing_date',
          'ts.cancelled_at',
          'ts.cancellation_reason',
          'ts.billing_cycle',
          'ts.price',
          'ts.monthly_price',
          't.name as tenant_name',
          'sp.name as plan_name',
          'sp.price as plan_price',
        )
        .orderBy('ts.started_at', 'desc');

      if (filter.tenantId !== undefined) {
        query = query.where('ts.tenant_id', filter.tenantId);
      }

      const rows = await query;

      return rows.map((row: any) => {
        const rawPrice = row.price ?? row.monthlyPrice ?? null;
        const parsedPrice = rawPrice !== null ? Number(rawPrice) : null;
        const parsedPlanPrice = row.planPrice !== undefined && row.planPrice !== null ? Number(row.planPrice) : null;

        return {
          id: row.id,
          tenant_id: row.tenantId ?? null,
          tenant_name: row.tenantName ?? null,
          plan_id: row.planId ?? null,
          plan_name: row.planName ?? null,
          plan_price: parsedPlanPrice,
          status: row.status,
          started_at: row.startedAt,
          expires_at: row.expiresAt,
          next_billing_date: row.nextBillingDate,
          cancelled_at: row.cancelledAt,
          cancellation_reason: row.cancellationReason,
          billing_cycle: row.billingCycle,
          price: parsedPrice,
        };
      });
    } catch (error: any) {
      if (error?.code === '42P01') {
        // tenant_subscriptions table not present yet – return empty list for graceful UX
        return [];
      }
      throw error;
    }
  }

  async cancelSubscription(id: number, reason?: string) {
    const knex = this.knexService.instance;

    const existing = await knex('tenant_subscriptions')
      .select('id', 'status')
      .where({ id })
      .first();

    if (!existing) {
      throw new NotFoundException('Subscription not found');
    }

    if (existing.status === 'cancelled') {
      return { id, status: existing.status };
    }

    await knex('tenant_subscriptions')
      .where({ id })
      .update({
        status: 'cancelled',
        cancelled_at: knex.fn.now(),
        cancellation_reason: reason ?? null,
        updated_at: knex.fn.now(),
      });

    const updated = await knex('tenant_subscriptions')
      .leftJoin('tenants as t', 'tenant_subscriptions.tenant_id', 't.id')
      .leftJoin('subscription_plans as sp', 'tenant_subscriptions.plan_id', 'sp.id')
      .select(
        'tenant_subscriptions.id',
        'tenant_subscriptions.tenant_id',
        'tenant_subscriptions.plan_id',
        'tenant_subscriptions.status',
        'tenant_subscriptions.started_at',
        'tenant_subscriptions.expires_at',
        'tenant_subscriptions.next_billing_date',
        'tenant_subscriptions.cancelled_at',
        'tenant_subscriptions.cancellation_reason',
        'tenant_subscriptions.billing_cycle',
        'tenant_subscriptions.price',
        'tenant_subscriptions.monthly_price',
        't.name as tenant_name',
        'sp.name as plan_name',
        'sp.price as plan_price',
      )
      .where('tenant_subscriptions.id', id)
      .first();

    if (!updated) {
      throw new NotFoundException('Subscription not found after update');
    }

    const rawPrice = updated.price ?? updated.monthlyPrice ?? null;
    const parsedPrice = rawPrice !== null ? Number(rawPrice) : null;
    const parsedPlanPrice = updated.planPrice !== undefined && updated.planPrice !== null ? Number(updated.planPrice) : null;

    return {
      id: updated.id,
      tenant_id: updated.tenantId ?? null,
      tenant_name: updated.tenantName ?? null,
      plan_id: updated.planId ?? null,
      plan_name: updated.planName ?? null,
      plan_price: parsedPlanPrice,
      status: updated.status,
      started_at: updated.startedAt,
      expires_at: updated.expiresAt,
      next_billing_date: updated.nextBillingDate,
      cancelled_at: updated.cancelledAt,
      cancellation_reason: updated.cancellationReason,
      billing_cycle: updated.billingCycle,
      price: parsedPrice,
    };
  }
}
