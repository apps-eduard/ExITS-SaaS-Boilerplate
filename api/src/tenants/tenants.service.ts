import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { KnexService } from '../database/knex.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';

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
}
