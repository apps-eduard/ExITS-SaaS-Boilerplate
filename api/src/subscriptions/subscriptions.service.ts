import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { KnexService } from '../database/knex.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly knexService: KnexService) {}

  async listPlans(): Promise<any[]> {
    const knex = this.knexService.instance;

    try {
      const rows = await this.buildPlansQuery(knex)
        .orderBy([{ column: 'sp.sort_order', order: 'asc' }, { column: 'sp.created_at', order: 'desc' }]);

      return rows.map((row) => this.mapPlan(row));
    } catch (error: any) {
      if (error?.code === '42P01') {
        return [];
      }
      throw error;
    }
  }

  async findPlanById(id: number): Promise<any | null> {
    const knex = this.knexService.instance;

    try {
      const row = await this.buildPlansQuery(knex)
        .where('sp.id', id)
        .first();

      return row ? this.mapPlan(row) : null;
    } catch (error: any) {
      if (error?.code === '42P01') {
        return null;
      }
      throw error;
    }
  }

  async createPlan(dto: CreatePlanDto) {
    const knex = this.knexService.instance;

    const payload = this.preparePlanPayload(dto);

    const [created] = await knex('subscription_plans').insert(payload).returning('*');
    return this.mapPlan(created);
  }

  async updatePlan(id: number, dto: UpdatePlanDto) {
    const knex = this.knexService.instance;

    const existing = await knex('subscription_plans').where({ id }).first();
    if (!existing) {
      throw new NotFoundException('Plan template not found');
    }

    const payload = this.preparePlanPayload(dto, existing);
    payload.updated_at = knex.fn.now();

    const [updated] = await knex('subscription_plans').where({ id }).update(payload).returning('*');
    return this.mapPlan(updated);
  }

  async deletePlan(id: number) {
    const knex = this.knexService.instance;

    const existing = await knex('subscription_plans').where({ id }).first();
    if (!existing) {
      throw new NotFoundException('Plan template not found');
    }

    const countResult = await knex('tenant_subscriptions').where({ plan_id: id }).count<{ count: string }>('id as count');
    const subscriptionCount = countResult?.[0]?.count ? Number(countResult[0].count) : 0;
    if (subscriptionCount > 0) {
      throw new BadRequestException('Plan cannot be deleted while tenants are subscribed');
    }

    await knex('subscription_plans').where({ id }).del();

    return {
      success: true,
    };
  }

  private buildPlansQuery(knex: Knex) {
    return knex('subscription_plans as sp')
      .select(
        'sp.id',
        'sp.name',
        'sp.description',
        'sp.price',
        'sp.billing_cycle',
        'sp.features',
        'sp.max_users',
        'sp.max_storage_gb',
        'sp.status',
        'sp.trial_days',
        'sp.is_featured',
        'sp.custom_pricing',
        'sp.platform_type as product_type',
        'sp.sort_order',
        'sp.created_at',
        'sp.updated_at',
        knex.raw(`COALESCE((SELECT COUNT(*) FROM tenant_subscriptions ts WHERE ts.plan_id = sp.id), 0) as subscriber_count`),
      );
  }

  private preparePlanPayload(dto: CreatePlanDto | UpdatePlanDto, existing?: any) {
    const result: Record<string, any> = {};

    if (dto.name !== undefined) result.name = dto.name;
    if (dto.description !== undefined) result.description = dto.description ?? null;
    if (dto.price !== undefined) result.price = Number(dto.price);
    if (dto.billingCycle !== undefined) result.billing_cycle = dto.billingCycle;
    if (dto.trialDays !== undefined) result.trial_days = dto.trialDays ?? 0;
    if (dto.maxUsers !== undefined) result.max_users = dto.maxUsers ?? null;
    if (dto.maxStorageGb !== undefined) result.max_storage_gb = dto.maxStorageGb ?? null;
    if (dto.isFeatured !== undefined) result.is_featured = !!dto.isFeatured;
    if (dto.customPricing !== undefined) result.custom_pricing = !!dto.customPricing;
    if (dto.status !== undefined) result.status = dto.status;
    if (dto.productType !== undefined) result.platform_type = dto.productType ?? null;

    if (dto.features !== undefined) {
      result.features = Array.isArray(dto.features) ? dto.features : [];
    } else if (!existing && result.features === undefined) {
      result.features = [];
    }

    if (!existing) {
      result.sort_order = dto instanceof Object && 'sortOrder' in dto ? (dto as any).sortOrder ?? 0 : 0;
    }

    return result;
  }

  private mapPlan(row: any) {
    if (!row) {
      return null;
    }

    const features = Array.isArray(row.features)
      ? row.features
      : typeof row.features === 'string'
        ? this.safeParseJson(row.features)
        : [];

    return {
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      price: Number(row.price ?? 0),
      billing_cycle: row.billing_cycle,
      features,
      max_users: row.max_users !== null && row.max_users !== undefined ? Number(row.max_users) : null,
      max_storage_gb: row.max_storage_gb !== null && row.max_storage_gb !== undefined ? Number(row.max_storage_gb) : null,
      status: row.status ?? 'active',
      trial_days: row.trial_days !== undefined && row.trial_days !== null ? Number(row.trial_days) : 0,
      is_featured: !!row.is_featured,
      custom_pricing: !!row.custom_pricing,
      product_type: row.product_type ?? null,
      sort_order: row.sort_order ?? 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
      subscriber_count: Number(row.subscriber_count ?? 0),
    };
  }

  private safeParseJson(value: string): any[] {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }
}
