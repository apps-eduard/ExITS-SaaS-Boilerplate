import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { KnexService } from '../database/knex.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private knexService: KnexService) {}

  async create(createUserDto: CreateUserDto, tenantId?: number) {
    const knex = this.knexService.instance;

    const existing = await knex('users')
      .where({ email: createUserDto.email })
      .first();

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const [user] = await knex('users')
      .insert({
        tenant_id: tenantId !== undefined ? tenantId : createUserDto.tenantId,
        email: createUserDto.email,
        password_hash: passwordHash,
        first_name: createUserDto.firstName,
        last_name: createUserDto.lastName,
        status: createUserDto.status || 'active',
        email_verified: false,
      })
      .returning(['id', 'email', 'first_name', 'last_name', 'tenant_id', 'status', 'created_at']);

    if (createUserDto.roleId) {
      await knex('user_roles').insert({
        user_id: user.id,
        role_id: createUserDto.roleId,
      });
    }

    return user;
  }

  async findAll(tenantId?: number, page = 1, limit = 20) {
    const knex = this.knexService.instance;
    const offset = (page - 1) * limit;

    let query = knex('users')
      .leftJoin('tenants', 'users.tenant_id', 'tenants.id')
      .select(
        'users.id',
        'users.email',
        'users.first_name',
        'users.last_name',
        'users.tenant_id',
        'users.status',
        'users.email_verified',
        'users.last_login',
        'users.created_at',
        'tenants.name as tenant_name',
      )
      .orderBy('users.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (tenantId) {
      query = query.where('users.tenant_id', tenantId);
    }

    const rawUsers = await query;

    const userIds = rawUsers.map((user) => user.id);

    let rolesByUser: Record<number, Array<{ id: number; name: string; space: string }>> = {};
    if (userIds.length > 0) {
      const roleRows = await knex('user_roles as ur')
        .leftJoin('roles as r', 'ur.role_id', 'r.id')
        .select('ur.user_id', 'r.id as role_id', 'r.name', 'r.space')
        .whereIn('ur.user_id', userIds)
        .andWhere('r.status', 'active');

      rolesByUser = roleRows.reduce((acc, row) => {
        // postProcessResponse converts to camelCase, so row.roleId & row.userId exist
        const roleId = row.roleId;
        const userId = row.userId;

        if (!roleId || !userId) {
          return acc;
        }
        if (!acc[userId]) {
          acc[userId] = [];
        }
        acc[userId].push({
          id: roleId,
          name: row.name,
          space: row.space,
        });
        return acc;
      }, {} as Record<number, Array<{ id: number; name: string; space: string }>>);
    }

    let profilesByUser: Record<number, any> = {};
    let platformsByUser: Record<number, string[]> = {};

    if (userIds.length > 0) {
      try {
        const profileRows = await knex('employee_profiles')
          .select(
            'id',
            'user_id',
            'tenant_id',
            'employee_code',
            'department',
            'position',
            'employment_type',
            'employment_status',
            'hire_date',
            'status',
            'created_at',
            'updated_at',
          )
          .whereIn('user_id', userIds)
          .whereNull('deleted_at');

        profilesByUser = profileRows.reduce((acc, row) => {
          const userId = row.userId;
          if (!userId) {
            return acc;
          }
          acc[userId] = row;
          return acc;
        }, {} as Record<number, any>);
      } catch (error: any) {
        if (error?.code !== '42P01') {
          throw error;
        }
      }

      try {
        const platformRows = await knex('employee_product_access')
          .select('user_id', 'product_type', 'status')
          .whereIn('user_id', userIds)
          .andWhere('status', 'active');

        platformsByUser = platformRows.reduce((acc, row) => {
          const userId = row.userId;
          if (!userId) {
            return acc;
          }
          if (!acc[userId]) {
            acc[userId] = [];
          }
          if (row.productType && !acc[userId].includes(row.productType)) {
            acc[userId].push(row.productType);
          }
          return acc;
        }, {} as Record<number, string[]>);
      } catch (error: any) {
        if (error?.code !== '42P01') {
          throw error;
        }
      }
    }

    const users = rawUsers.map((user) => {
      const tenantIdValue = user.tenantId ?? null;
      const firstName = user.firstName ?? null;
      const lastName = user.lastName ?? null;
      const fullNameParts = [firstName, lastName].filter((part) => !!part);

      const profile = profilesByUser[user.id];
      const platforms = platformsByUser[user.id] ?? [];

      return {
        id: user.id,
        email: user.email,
        firstName: firstName ?? undefined,
        lastName: lastName ?? undefined,
        fullName: fullNameParts.length > 0 ? fullNameParts.join(' ') : undefined,
        status: user.status,
        tenantId: tenantIdValue,
        tenant: tenantIdValue
          ? {
              id: tenantIdValue,
              name: user.tenantName ?? undefined,
            }
          : undefined,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLogin ?? undefined,
        createdAt: user.createdAt,
        roles: rolesByUser[user.id] ?? [],
        employeeProfileId: profile?.id,
        employeeCode: profile?.employeeCode,
        department: profile?.department,
        position: profile?.position,
        employmentType: profile?.employmentType,
        employmentStatus: profile?.employmentStatus,
        hireDate: profile?.hireDate,
        employeeStatus: profile?.status,
        platforms,
      };
    });

    const countQuery = knex('users').count('* as count');
    if (tenantId) {
      countQuery.where('tenant_id', tenantId);
    }
    const [{ count }] = await countQuery;

    return {
      data: users,
      pagination: {
        page,
        limit,
        total: Number(count),
        pages: Math.ceil(Number(count) / limit),
        totalPages: Math.ceil(Number(count) / limit),
      },
    };
  }

  async findOne(id: number) {
    const knex = this.knexService.instance;

    const user = await knex('users')
      .select(
        'users.id',
        'users.email',
        'users.first_name',
        'users.last_name',
        'users.tenant_id',
        'users.status',
        'users.email_verified',
        'users.mfa_enabled',
        'users.last_login',
        'users.created_at',
      )
      .where({ 'users.id': id })
      .first();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const knex = this.knexService.instance;

    const user = await this.findOne(id);

    const updateData: any = {};
    if (updateUserDto.firstName) updateData.first_name = updateUserDto.firstName;
    if (updateUserDto.lastName) updateData.last_name = updateUserDto.lastName;
    if (updateUserDto.status) updateData.status = updateUserDto.status;

    await knex('users').where({ id }).update(updateData);

    if (updateUserDto.roleId) {
      await knex('user_roles').where({ user_id: id }).delete();
      await knex('user_roles').insert({
        user_id: id,
        role_id: updateUserDto.roleId,
      });
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    const knex = this.knexService.instance;
    await this.findOne(id);

    await knex('users').where({ id }).update({ status: 'deleted' });

    return { message: 'User deleted successfully' };
  }
}
