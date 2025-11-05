import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { KnexService } from '../database/knex.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { CreateTenantSubscriptionDto } from './dto/create-tenant-subscription.dto';

@Injectable()
export class TenantsService {
  constructor(private knexService: KnexService) {}

  async create(createTenantDto: CreateTenantDto) {
    const knex = this.knexService.instance;

    return await knex.transaction(async (trx) => {
      const existing = await trx('tenants')
        .where({ subdomain: createTenantDto.subdomain })
        .first();

      if (existing) {
        throw new ConflictException('Subdomain already taken');
      }

      if (createTenantDto.adminEmail) {
        const existingUser = await trx('users')
          .whereRaw('LOWER(email) = LOWER(?)', [createTenantDto.adminEmail])
          .first();

        if (existingUser) {
          throw new ConflictException('Admin email already registered');
        }
      }

      const plan = createTenantDto.plan || 'starter';

      const [tenant] = await trx('tenants')
        .insert({
          name: createTenantDto.name,
          subdomain: createTenantDto.subdomain,
          plan,
          status: 'active',
          max_users: createTenantDto.maxUsers || 10,
          logo_url: createTenantDto.logoUrl,
          primary_color: createTenantDto.primaryColor,
          secondary_color: createTenantDto.secondaryColor,
          money_loan_enabled: createTenantDto.moneyLoanEnabled || false,
          bnpl_enabled: createTenantDto.bnplEnabled || false,
          pawnshop_enabled: createTenantDto.pawnshopEnabled || false,
        })
        .returning('*');

      if (createTenantDto.adminEmail && createTenantDto.adminPassword) {
        const passwordHash = await bcrypt.hash(createTenantDto.adminPassword, 10);

        const [adminUser] = await trx('users')
          .insert({
            tenant_id: tenant.id,
            email: createTenantDto.adminEmail,
            password_hash: passwordHash,
            first_name: 'Admin',
            last_name: 'User',
            status: 'active',
            email_verified: true,
          })
          .returning('*');

        const [adminRole] = await trx('roles')
          .where({ name: 'Admin', tenant_id: tenant.id })
          .orWhere({ name: 'Admin', tenant_id: null })
          .first();

        if (adminRole) {
          await trx('user_roles').insert({
            user_id: adminUser.id,
            role_id: adminRole.id,
          });
        }
      }

      return tenant;
    });
  }

  async findAll(page = 1, limit = 20) {
    const knex = this.knexService.instance;
    const offset = (page - 1) * limit;

    const tenants = await knex('tenants')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const [{ count }] = await knex('tenants').count('* as count');

    return {
      data: tenants,
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    };
  }

  async getActiveTenants() {
    const knex = this.knexService.instance;
    
    const tenants = await knex('tenants')
      .select('id', 'name', 'subdomain', 'plan', 'status', 'logo_url', 'created_at')
      .where({ status: 'active' })
      .orderBy('name', 'asc');

    return tenants;
  }

  async findOne(id: number) {
    const knex = this.knexService.instance;

    const tenantRecord = await knex('tenants')
      .select(
        'tenants.id',
        'tenants.name',
        'tenants.subdomain',
        'tenants.plan',
        'tenants.status',
        'tenants.logo_url',
        'tenants.primary_color',
        'tenants.secondary_color',
        'tenants.max_users',
        'tenants.money_loan_enabled',
        'tenants.bnpl_enabled',
        'tenants.pawnshop_enabled',
        'tenants.created_at',
        'tenants.updated_at',
      )
      .where({ 'tenants.id': id })
      .first();

    if (!tenantRecord) {
      throw new NotFoundException('Tenant not found');
    }

    return {
      id: tenantRecord.id,
      name: tenantRecord.name,
      subdomain: tenantRecord.subdomain,
      plan: tenantRecord.plan,
      status: tenantRecord.status,
      logoUrl: tenantRecord.logoUrl ?? undefined,
      primaryColor: tenantRecord.primaryColor ?? undefined,
      secondaryColor: tenantRecord.secondaryColor ?? undefined,
      maxUsers: tenantRecord.maxUsers ?? undefined,
      moneyLoanEnabled: Boolean(tenantRecord.moneyLoanEnabled),
      bnplEnabled: Boolean(tenantRecord.bnplEnabled),
      pawnshopEnabled: Boolean(tenantRecord.pawnshopEnabled),
      createdAt: tenantRecord.createdAt,
      updatedAt: tenantRecord.updatedAt,
    };
  }

  async findBySubdomain(subdomain: string) {
    const knex = this.knexService.instance;

    const tenant = await knex('tenants').where({ subdomain }).first();

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async getCurrentTenantSubscriptions(tenantId: number) {
    const knex = this.knexService.instance;

    const tenant = await knex('tenants')
      .select(
        'money_loan_enabled',
        'bnpl_enabled',
        'pawnshop_enabled',
      )
      .where({ id: tenantId })
      .first();

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const enabledProducts: string[] = [];
    if (tenant.money_loan_enabled) {
      enabledProducts.push('money_loan');
    }
    if (tenant.bnpl_enabled) {
      enabledProducts.push('bnpl');
    }
    if (tenant.pawnshop_enabled) {
      enabledProducts.push('pawnshop');
    }

    let subscriptions: any[] = [];

    try {
      const rows = await knex('tenant_subscriptions as ts')
        .leftJoin('subscription_plans as sp', 'sp.id', 'ts.plan_id')
        .select(
          'ts.id as subscription_id',
          'ts.plan_id',
          'ts.status as subscription_status',
          'ts.started_at as subscription_started_at',
          'ts.expires_at as subscription_expires_at',
          'ts.billing_cycle as subscription_billing_cycle',
          'ts.created_at as subscription_created_at',
          'ts.updated_at as subscription_updated_at',
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
          'sp.platform_type',
          'sp.sort_order',
          'sp.created_at as plan_created_at',
          'sp.updated_at as plan_updated_at',
        )
        .where('ts.tenant_id', tenantId)
        .orderBy('ts.created_at', 'desc');

      subscriptions = rows
        .map((row) => this.mapSubscriptionRow(row))
        .filter((row) => Boolean(row));
    } catch (error: any) {
      if (error?.code === '42P01' || error?.code === '42703') {
        subscriptions = [];
      } else {
        throw error;
      }
    }

    return {
      subscriptions,
      enabledProducts,
    };
  }

  async createOrUpdateSubscription(
    tenantId: number,
    userId: number | null,
    dto: CreateTenantSubscriptionDto,
  ) {
    const knex = this.knexService.instance;

    const result = await knex.transaction(async (trx) => {
      const plan = await trx('subscription_plans')
        .where({ id: dto.planId, status: 'active' })
        .first();

      if (!plan) {
        throw new NotFoundException('Subscription plan not found');
      }

  const planPriceRaw = this.toNumber(plan.price, 0);
  const planPrice = Math.round(planPriceRaw * 100) / 100;
      const cycle = dto.billingCycle ?? (plan.billing_cycle ?? 'monthly');
      const monthlyPrice = this.calculateMonthlyPrice(planPrice, cycle);
      const now = new Date();
      const nextBillingDate = this.calculateNextBillingDate(now, cycle);
      const productType: string | null = plan.platform_type ?? null;

      let transactionType: 'subscription' | 'upgrade' = 'subscription';

      if (productType && productType !== 'platform') {
        const existingProductSubscription = await trx('platform_subscriptions')
          .where({ tenant_id: tenantId, platform_type: productType })
          .first();

        const updatePayload = {
          subscription_plan_id: plan.id,
          price: planPrice,
          billing_cycle: cycle,
          status: 'active',
          started_at: now,
          expires_at: null,
          updated_at: now,
        };

        if (existingProductSubscription) {
          const existingStatus = String(existingProductSubscription.status || '').toLowerCase();
          transactionType = existingStatus === 'active' ? 'upgrade' : 'subscription';
          await trx('platform_subscriptions')
            .where({ id: existingProductSubscription.id })
            .update(updatePayload);
        } else {
          await trx('platform_subscriptions').insert({
            tenant_id: tenantId,
            platform_type: productType,
            subscription_plan_id: plan.id,
            status: 'active',
            started_at: now,
            expires_at: null,
            price: planPrice,
            billing_cycle: cycle,
            metadata: {},
          });
        }
      } else {
        const existingSubscription = await trx('tenant_subscriptions')
          .where({ tenant_id: tenantId })
          .first();

        const subscriptionPayload: Record<string, any> = {
          plan_id: plan.id,
          status: 'active',
          price: planPrice,
          monthly_price: monthlyPrice,
          billing_cycle: cycle,
          started_at: now,
          updated_at: now,
          expires_at: null,
          cancelled_at: null,
          cancellation_reason: null,
        };

        subscriptionPayload.next_billing_date = nextBillingDate ?? null;

        if (existingSubscription) {
          const existingStatus = String(existingSubscription.status || '').toLowerCase();
          transactionType = existingStatus === 'active' ? 'upgrade' : 'subscription';
          await trx('tenant_subscriptions')
            .where({ id: existingSubscription.id })
            .update(subscriptionPayload);
        } else {
          await trx('tenant_subscriptions').insert({
            tenant_id: tenantId,
            ...subscriptionPayload,
            metadata: {},
          });
        }

        await trx('tenants')
          .where({ id: tenantId })
          .update({
            plan: this.resolveTenantPlanValue(plan.platform_type, plan.name),
            updated_at: now,
          });

        const tenantProducts = await trx('tenants')
          .select('money_loan_enabled', 'bnpl_enabled', 'pawnshop_enabled')
          .where({ id: tenantId })
          .first();

        if (tenantProducts) {
          const productFlags: Array<[string, boolean]> = [
            ['money_loan', Boolean(tenantProducts.money_loan_enabled)],
            ['bnpl', Boolean(tenantProducts.bnpl_enabled)],
            ['pawnshop', Boolean(tenantProducts.pawnshop_enabled)],
          ];

          for (const [productKey, enabled] of productFlags) {
            if (!enabled) {
              continue;
            }

            await trx('platform_subscriptions')
              .where({ tenant_id: tenantId, platform_type: productKey })
              .update({ status: 'active', updated_at: now, expires_at: null });
          }
        }
      }

      const transactionId = this.generateTransactionId();

      await trx('payment_history').insert({
        tenant_id: tenantId,
        transaction_id: transactionId,
        amount: planPrice,
        currency: 'PHP',
        status: 'completed',
        provider: dto.paymentMethod ?? 'manual',
        processed_at: now,
        user_id: userId ?? null,
        subscription_plan_id: plan.id,
        transaction_type: transactionType,
        plan_name: plan.name,
        platform_type: productType ?? 'platform',
        description: `${transactionType === 'upgrade' ? 'Upgraded to' : 'Subscribed to'} ${plan.name} (${cycle})`,
      });

      return {
        planId: plan.id,
        planName: plan.name,
        productType,
        billingCycle: cycle,
        amount: planPrice,
        transactionId,
        nextBillingDate,
      };
    });

    return result;
  }

  async update(id: number, updateTenantDto: UpdateTenantDto) {
    const knex = this.knexService.instance;

    await this.findOne(id);

    const updateData: any = {};
    if (updateTenantDto.name) updateData.name = updateTenantDto.name;
    if (updateTenantDto.status) updateData.status = updateTenantDto.status;
    if (updateTenantDto.maxUsers) updateData.max_users = updateTenantDto.maxUsers;
    if (updateTenantDto.logoUrl !== undefined) updateData.logo_url = updateTenantDto.logoUrl;
    if (updateTenantDto.primaryColor !== undefined) updateData.primary_color = updateTenantDto.primaryColor;
    if (updateTenantDto.secondaryColor !== undefined) updateData.secondary_color = updateTenantDto.secondaryColor;
    if (updateTenantDto.moneyLoanEnabled !== undefined) updateData.money_loan_enabled = updateTenantDto.moneyLoanEnabled;
    if (updateTenantDto.bnplEnabled !== undefined) updateData.bnpl_enabled = updateTenantDto.bnplEnabled;
    if (updateTenantDto.pawnshopEnabled !== undefined) updateData.pawnshop_enabled = updateTenantDto.pawnshopEnabled;

    await knex('tenants').where({ id }).update(updateData);

    return this.findOne(id);
  }

  async remove(id: number) {
    const knex = this.knexService.instance;
    await this.findOne(id);

    await knex('tenants').where({ id }).update({ status: 'suspended' });

    return { message: 'Tenant suspended successfully' };
  }

  private mapSubscriptionRow(row: any) {
    if (!row) {
      return null;
    }

    const features = this.normalizeFeatures(row.features);

    return {
      id: row.plan_id ?? row.subscription_id,
      subscriptionId: row.subscription_id,
      name: row.name,
      displayName: row.name,
      description: row.description ?? '',
      icon: '📦',
      price: this.toNumber(row.price),
      billingCycle: row.subscription_billing_cycle ?? row.billing_cycle ?? 'monthly',
      productType: row.platform_type ?? null,
      maxUsers: this.toNullableNumber(row.max_users),
      maxStorageGb: this.toNullableNumber(row.max_storage_gb),
      features,
      isActive: (row.subscription_status ?? row.status) === 'active',
      isRecommended: Boolean(row.is_featured),
      createdAt: row.plan_created_at ?? row.subscription_created_at ?? null,
      updatedAt: row.plan_updated_at ?? row.subscription_updated_at ?? null,
      startedAt: row.subscription_started_at ?? null,
      expiresAt: row.subscription_expires_at ?? null,
      subscriptionStatus: row.subscription_status ?? row.status ?? 'inactive',
    };
  }

  private normalizeFeatures(value: any): string[] {
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

  private toNumber(value: any, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private toNullableNumber(value: any): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private resolveTenantPlanValue(platformType: string | null, planName: string): string {
    if (platformType && platformType !== 'platform') {
      return 'custom';
    }

    const normalized = (planName || '').toLowerCase();

    if (normalized.includes('enterprise')) {
      return 'enterprise';
    }

    if (normalized.includes('pro')) {
      return 'professional';
    }

    if (normalized.includes('starter') || normalized.includes('basic')) {
      return 'starter';
    }

    return 'custom';
  }

  private calculateMonthlyPrice(amount: number, billingCycle: string): number {
    if (!Number.isFinite(amount)) {
      return 0;
    }

    switch (billingCycle) {
      case 'yearly':
        return Number((amount / 12).toFixed(2));
      case 'quarterly':
        return Number((amount / 3).toFixed(2));
      default:
        return Number(amount.toFixed(2));
    }
  }

  private calculateNextBillingDate(baseDate: Date, billingCycle: string): Date | null {
    const nextDate = new Date(baseDate.getTime());

    switch (billingCycle) {
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        return nextDate;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        return nextDate;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        return nextDate;
      default:
        return null;
    }
  }

  private generateTransactionId(): string {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `INV-${datePart}-${randomPart}`;
  }
}
