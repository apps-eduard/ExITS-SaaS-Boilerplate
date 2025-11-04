import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Knex } from 'knex';
import * as bcrypt from 'bcrypt';
import { KnexService } from '../database/knex.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UserProductAssignmentDto } from './dto/user-products.dto';

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

    const finalTenantId = tenantId !== undefined ? tenantId : createUserDto.tenantId;

    const [user] = await knex('users')
      .insert({
        tenant_id: finalTenantId,
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

    // Handle employee profile creation if data is provided
    const hasEmployeeProfileData = 
      createUserDto.position !== undefined ||
      createUserDto.department !== undefined ||
      createUserDto.employmentType !== undefined ||
      createUserDto.employmentStatus !== undefined ||
      createUserDto.hireDate !== undefined ||
      createUserDto.workPhone !== undefined ||
      createUserDto.workEmail !== undefined ||
      createUserDto.phoneExtension !== undefined ||
      createUserDto.emergencyContactName !== undefined ||
      createUserDto.emergencyContactPhone !== undefined ||
      createUserDto.notes !== undefined;

    if (hasEmployeeProfileData && finalTenantId) {
      await this.createEmployeeProfile(user.id, finalTenantId, createUserDto, knex);
    }

    return user;
  }

  private async createEmployeeProfile(
    userId: number,
    tenantId: number,
    createUserDto: CreateUserDto,
    connection: Knex | Knex.Transaction,
  ) {
    try {
      const employeeCode = this.buildEmployeeCode(tenantId, userId);

      const profileData: Record<string, any> = {
        tenant_id: tenantId,
        user_id: userId,
        employee_code: employeeCode,
        position: createUserDto.position?.trim() || 'Employee',
        hire_date: createUserDto.hireDate || new Date().toISOString().split('T')[0],
        employment_status: createUserDto.employmentStatus?.trim() || 'active',
        status: 'active',
        created_at: connection.fn.now(),
        updated_at: connection.fn.now(),
      };

      if (createUserDto.department !== undefined) {
        profileData.department = createUserDto.department?.trim() || null;
      }

      if (createUserDto.employmentType !== undefined) {
        profileData.employment_type = createUserDto.employmentType?.trim() || null;
      }

      if (createUserDto.workPhone !== undefined) {
        profileData.work_phone = createUserDto.workPhone?.trim() || null;
      }

      if (createUserDto.workEmail !== undefined) {
        profileData.work_email = createUserDto.workEmail?.trim() || null;
      }

      if (createUserDto.phoneExtension !== undefined) {
        profileData.phone_extension = createUserDto.phoneExtension?.trim() || null;
      }

      if (createUserDto.emergencyContactName !== undefined) {
        profileData.emergency_contact_name = createUserDto.emergencyContactName?.trim() || null;
      }

      if (createUserDto.emergencyContactPhone !== undefined) {
        profileData.emergency_contact_phone = createUserDto.emergencyContactPhone?.trim() || null;
      }

      if (createUserDto.notes !== undefined) {
        profileData.notes = createUserDto.notes || null;
      }

      await connection('employee_profiles').insert(profileData);
    } catch (error: any) {
      if (error?.code === '42P01') {
        // Table doesn't exist, silently skip
        return;
      }
      throw error;
    }
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
          .select('user_id', 'platform_type as platformType', 'status')
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
          if (row.platformType && !acc[userId].includes(row.platformType)) {
            acc[userId].push(row.platformType);
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

    const userRecord = await knex('users as u')
      .leftJoin('tenants as t', 'u.tenant_id', 't.id')
      .select(
        'u.id',
        'u.email',
        'u.first_name',
        'u.last_name',
        'u.tenant_id',
        'u.status',
        'u.email_verified',
        'u.mfa_enabled',
        'u.last_login',
        'u.created_at',
        'u.updated_at',
        't.name as tenant_name',
      )
      .where('u.id', id)
      .first();

    if (!userRecord) {
      throw new NotFoundException('User not found');
    }

    const [roles, employeeProfile, productAssignments] = await Promise.all([
      this.getUserRoles(id, knex),
      this.getEmployeeProfile(id, knex),
      this.getUserProducts(id, knex),
    ]);

    const addresses = await this.getAddressesForUser(
      id,
      userRecord.tenantId ?? null,
      employeeProfile?.id ?? null,
      knex,
    );

    const fullNameParts = [userRecord.firstName, userRecord.lastName].filter(
      (part) => !!part && `${part}`.trim().length > 0,
    );

    const activePlatforms = productAssignments
      .filter((assignment) => (assignment.status ?? 'active') === 'active' && assignment.productType)
      .map((assignment) => assignment.productType as string);

    const platforms = Array.from(new Set(activePlatforms));

    return {
      id: userRecord.id,
      email: userRecord.email,
      firstName: userRecord.firstName ?? undefined,
      lastName: userRecord.lastName ?? undefined,
      fullName: fullNameParts.length > 0 ? fullNameParts.join(' ') : undefined,
      status: userRecord.status,
      tenantId: userRecord.tenantId ?? null,
      tenant: userRecord.tenantId
        ? {
            id: userRecord.tenantId,
            name: userRecord.tenantName ?? undefined,
          }
        : undefined,
      emailVerified: userRecord.emailVerified,
      mfaEnabled: userRecord.mfaEnabled ?? false,
      lastLoginAt: userRecord.lastLogin ?? undefined,
      createdAt: userRecord.createdAt,
      updatedAt: userRecord.updatedAt ?? undefined,
      roles,
      employeeProfile: employeeProfile ?? undefined,
      productAccess: productAssignments,
      platforms,
      addresses,
    };
  }

  async getUserProducts(userId: number, connection?: Knex | Knex.Transaction) {
    const db = connection ?? this.knexService.instance;

    try {
      const rows = await db('employee_product_access as epa')
        .select(
          'epa.id',
          'epa.tenant_id',
          'epa.user_id',
          'epa.employee_id',
          'epa.platform_type',
          'epa.access_level',
          'epa.is_primary',
          'epa.can_approve_loans',
          'epa.can_disburse_funds',
          'epa.can_view_reports',
          'epa.can_modify_interest',
          'epa.can_waive_penalties',
          'epa.max_approval_amount',
          'epa.daily_transaction_limit',
          'epa.monthly_transaction_limit',
          'epa.max_daily_transactions',
          'epa.assignment_notes',
          'epa.assigned_date',
          'epa.status',
        )
        .where('epa.user_id', userId)
        .whereNull('epa.deleted_at');

      return rows.map((row) => this.mapProductRow(row));
    } catch (error: any) {
      if (error?.code === '42P01') {
        return [];
      }
      throw error;
    }
  }

  async setUserProducts(userId: number, assignments: UserProductAssignmentDto[]) {
    const products = Array.isArray(assignments) ? assignments : [];

    return this.knexService.transaction(async (trx) => {
      const user = await trx('users')
        .select('id', 'tenant_id')
        .where({ id: userId })
        .first();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Note: Knex postProcessResponse converts tenant_id to tenantId
      console.log('🔍 setUserProducts - User loaded:', { 
        userId, 
        tenantId: user.tenantId,
        fullUser: user 
      });

      if (!user.tenantId) {
        console.error('❌ setUserProducts - Missing tenantId:', { user });
        throw new BadRequestException('Tenant context is required to assign platform access');
      }

      console.log('🔄 setUserProducts - Ensuring employee profile...');
      const employeeProfile = await this.ensureEmployeeProfile(
        { id: userId, tenantId: user.tenantId },
        trx,
      );

      console.log('✅ setUserProducts - Employee profile:', employeeProfile);

      if (!employeeProfile) {
        throw new BadRequestException('Unable to create employee profile for platform assignment');
      }

      await trx('employee_product_access')
        .where({ user_id: userId })
        .del();

      for (const assignment of products) {
        const normalizedType = this.normalizePlatformType(assignment.productType);
        if (!normalizedType) {
          continue;
        }

        const payload: Record<string, any> = {
          tenant_id: user.tenantId, // Use camelCase version from Knex conversion
          employee_id: employeeProfile.id,
          user_id: userId,
          platform_type: normalizedType,
          access_level: assignment.accessLevel ?? 'view',
          is_primary: !!assignment.isPrimary,
          can_approve_loans: !!assignment.canApproveLoans,
          can_disburse_funds: !!assignment.canDisburseFunds,
          can_view_reports: !!assignment.canViewReports,
          can_modify_interest: !!assignment.canModifyInterest,
          can_waive_penalties: !!assignment.canWaivePenalties,
          max_approval_amount: this.toNullableNumber(assignment.maxApprovalAmount),
          daily_transaction_limit: this.toNullableNumber(assignment.dailyTransactionLimit),
          monthly_transaction_limit: this.toNullableNumber(assignment.monthlyTransactionLimit),
          max_daily_transactions: this.toNullableNumber(assignment.maxDailyTransactions),
          assignment_notes: assignment.notes ?? null,
          status: 'active',
          assigned_date: trx.fn.now(),
        };

        await trx('employee_product_access').insert(payload);
      }

      return this.getUserProducts(userId, trx);
    });
  }

  private async getUserRoles(userId: number, connection: Knex | Knex.Transaction) {
    try {
      const rows = await connection('user_roles as ur')
        .leftJoin('roles as r', 'ur.role_id', 'r.id')
        .select('r.id as role_id', 'r.name', 'r.space', 'r.status')
        .where('ur.user_id', userId)
        .andWhere('r.status', 'active');

      return rows
        .filter((row) => !!row.roleId)
        .map((row) => ({
          id: row.roleId,
          name: row.name,
          space: row.space,
        }));
    } catch (error: any) {
      if (error?.code === '42P01') {
        return [];
      }
      throw error;
    }
  }

  private async getEmployeeProfile(userId: number, connection: Knex | Knex.Transaction) {
    try {
      const profile = await connection('employee_profiles')
        .select(
          'id',
          'tenant_id',
          'user_id',
          'employee_code',
          'department',
          'position',
          'employment_type',
          'employment_status',
          'hire_date',
          'work_phone',
          'work_email',
          'phone_extension',
          'emergency_contact_name',
          'emergency_contact_phone',
          'notes',
          'status',
          'created_at',
          'updated_at',
        )
        .where({ user_id: userId })
        .whereNull('deleted_at')
        .first();

      return profile ?? null;
    } catch (error: any) {
      if (error?.code === '42P01') {
        return null;
      }
      throw error;
    }
  }

  private async ensureEmployeeProfile(
    context: { id: number; tenantId: number | null },
    connection: Knex | Knex.Transaction,
  ) {
    const existingProfile = await this.getEmployeeProfile(context.id, connection);
    if (existingProfile) {
      return existingProfile;
    }

    if (!context.tenantId) {
      throw new BadRequestException('Tenant context is required to create employee profile');
    }

    try {
      await connection('employee_profiles')
        .insert({
          tenant_id: context.tenantId,
          user_id: context.id,
          employee_code: this.buildEmployeeCode(context.tenantId, context.id),
          position: 'Employee', // Default position for auto-created profiles
          hire_date: connection.fn.now(), // Default to current date
          employment_status: 'active',
          status: 'active',
          created_at: connection.fn.now(),
          updated_at: connection.fn.now(),
        });
    } catch (error: any) {
      if (error?.code !== '42P01') {
        throw error;
      }
      // If the table doesn't exist in the current schema, bubble up the original error path
      throw new BadRequestException('Employee profiles feature is not available in this environment');
    }

    return this.getEmployeeProfile(context.id, connection);
  }

  private buildEmployeeCode(tenantId: number, userId: number): string {
    return `EMP-${tenantId}-${userId}`;
  }

  private async getAddressesForUser(
    userId: number,
    tenantId: number | null,
    employeeProfileId: number | null,
    connection: Knex | Knex.Transaction,
  ) {
    try {
      const rows = await connection('addresses')
        .select(
          'id',
          'tenant_id',
          'addressable_type',
          'addressable_id',
          'address_type',
          'label',
          'is_primary',
          'unit_number',
          'house_number',
          'street_name',
          'subdivision',
          'barangay',
          'city_municipality',
          'province',
          'region',
          'zip_code',
          'country',
          'landmark',
          'delivery_instructions',
          'contact_person',
          'contact_phone',
          'is_verified',
          'verified_at',
          'status',
          'created_at',
          'updated_at',
        )
        .whereNull('deleted_at')
        .modify((qb) => {
          qb.where((nested) => {
            nested.where({ addressable_type: 'user', addressable_id: userId });
            if (employeeProfileId) {
              nested.orWhere({ addressable_type: 'employee_profile', addressable_id: employeeProfileId });
            }
          });
          if (tenantId) {
            qb.andWhere('tenant_id', tenantId);
          }
        })
        .orderBy([{ column: 'is_primary', order: 'desc' }, { column: 'created_at', order: 'desc' }]);

      return rows.map((row) => this.mapAddressRow(row, userId));
    } catch (error: any) {
      if (error?.code === '42P01') {
        return [];
      }
      throw error;
    }
  }

  private mapProductRow(row: any) {
    return {
      id: row.id,
      tenantId: row.tenantId ?? undefined,
      userId: row.userId ?? undefined,
      employeeId: row.employeeId ?? undefined,
      productType: row.platformType,
      accessLevel: row.accessLevel ?? 'view',
      isPrimary: !!row.isPrimary,
      canApproveLoans: !!row.canApproveLoans,
      canDisburseFunds: !!row.canDisburseFunds,
      canViewReports: !!row.canViewReports,
      canModifyInterest: !!row.canModifyInterest,
      canWaivePenalties: !!row.canWaivePenalties,
      maxApprovalAmount: this.toNullableNumber(row.maxApprovalAmount),
      dailyTransactionLimit: this.toNullableNumber(row.dailyTransactionLimit),
      monthlyTransactionLimit: this.toNullableNumber(row.monthlyTransactionLimit),
      maxDailyTransactions: this.toNullableNumber(row.maxDailyTransactions),
      notes: row.assignmentNotes ?? undefined,
      assignedDate: row.assignedDate ?? undefined,
      status: row.status ?? undefined,
    };
  }

  private mapAddressRow(row: any, fallbackUserId: number) {
    if (!row) {
      return null;
    }

    const streetParts = [row.houseNumber, row.streetName]
      .map((value) => (value ? `${value}`.trim() : ''))
      .filter((value) => value.length > 0);

    const street = streetParts.join(' ').trim() || row.streetName || '';

    return {
      id: row.id !== undefined && row.id !== null ? String(row.id) : undefined,
      userId: row.addressableType === 'user'
        ? String(row.addressableId)
        : String(fallbackUserId),
      tenantId:
        row.tenantId !== undefined && row.tenantId !== null ? String(row.tenantId) : undefined,
      addressType: row.addressType,
      label: row.label ?? undefined,
      street,
      houseNumber: row.houseNumber ?? undefined,
      streetName: row.streetName ?? undefined,
      barangay: row.barangay ?? '',
      cityMunicipality: row.cityMunicipality ?? '',
      province: row.province ?? '',
      region: row.region ?? '',
      zipCode: row.zipCode ?? undefined,
      country: row.country ?? 'Philippines',
      landmark: row.landmark ?? undefined,
      isPrimary: !!row.isPrimary,
      isVerified: !!row.isVerified,
      contactPhone: row.contactPhone ?? undefined,
      contactName: row.contactPerson ?? undefined,
      notes: row.deliveryInstructions ?? undefined,
      addressableType: row.addressableType,
      addressableId: row.addressableId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      verifiedAt: row.verifiedAt ?? undefined,
      status: row.status ?? undefined,
    };
  }

  private normalizePlatformType(value: string | undefined | null) {
    if (!value) {
      return null;
    }

    const normalized = value.toString().trim();
    if (!normalized) {
      return null;
    }

    const collapsed = normalized.replace(/\s+/g, '_').replace(/-+/g, '_');
    const lower = collapsed.toLowerCase();

    switch (lower) {
      case 'money_loan':
      case 'moneyloan':
        return 'money_loan';
      case 'bnpl':
        return 'bnpl';
      case 'pawnshop':
        return 'pawnshop';
      case 'platform':
        return 'platform';
      default:
        return normalized
          .replace(/([a-z])([A-Z])/g, '$1_$2')
          .replace(/\s+/g, '_')
          .replace(/-+/g, '_')
          .toLowerCase();
    }
  }

  private toNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return null;
    }

    return numeric;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const knex = this.knexService.instance;

    const user = await this.findOne(id);

    const updateData: Record<string, any> = {};

    if (updateUserDto.email !== undefined) {
      const candidateEmail = updateUserDto.email ? updateUserDto.email.trim() : '';
      if (!candidateEmail) {
        throw new BadRequestException('Email cannot be empty');
      }

      const currentEmailNormalized = (user.email ?? '').trim().toLowerCase();
      const candidateEmailNormalized = candidateEmail.toLowerCase();

      if (candidateEmailNormalized !== currentEmailNormalized) {
        const existing = await knex('users')
          .whereRaw('LOWER(email) = ?', [candidateEmailNormalized])
          .andWhereNot({ id })
          .first();

        if (existing) {
          throw new ConflictException('User with this email already exists');
        }
      }

      updateData.email = candidateEmail;
    }

    if (updateUserDto.firstName !== undefined) {
      const firstName = updateUserDto.firstName?.trim();
      updateData.first_name = firstName && firstName.length > 0 ? firstName : null;
    }

    if (updateUserDto.lastName !== undefined) {
      const lastName = updateUserDto.lastName?.trim();
      updateData.last_name = lastName && lastName.length > 0 ? lastName : null;
    }

    if (updateUserDto.status !== undefined) {
      const status = updateUserDto.status?.trim();
      if (status) {
        updateData.status = status;
      }
    }

    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = knex.fn.now();
      await knex('users').where({ id }).update(updateData);
    }

    if (updateUserDto.roleId !== undefined) {
      await knex('user_roles').where({ user_id: id }).delete();
      if (updateUserDto.roleId !== null) {
        await knex('user_roles').insert({
          user_id: id,
          role_id: updateUserDto.roleId,
        });
      }
    }

    // Handle employee profile updates
    const hasEmployeeProfileData = 
      updateUserDto.position !== undefined ||
      updateUserDto.department !== undefined ||
      updateUserDto.employmentType !== undefined ||
      updateUserDto.employmentStatus !== undefined ||
      updateUserDto.hireDate !== undefined ||
      updateUserDto.workPhone !== undefined ||
      updateUserDto.workEmail !== undefined ||
      updateUserDto.phoneExtension !== undefined ||
      updateUserDto.emergencyContactName !== undefined ||
      updateUserDto.emergencyContactPhone !== undefined ||
      updateUserDto.notes !== undefined;

    if (hasEmployeeProfileData) {
      await this.updateEmployeeProfile(id, user.tenantId, updateUserDto, knex);
    }

    return this.findOne(id);
  }

  private async updateEmployeeProfile(
    userId: number,
    tenantId: number | null,
    updateUserDto: UpdateUserDto,
    connection: Knex | Knex.Transaction,
  ) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required to update employee profile');
    }

    try {
      // Check if employee profile exists
      const existingProfile = await this.getEmployeeProfile(userId, connection);

      const profileData: Record<string, any> = {};

      if (updateUserDto.position !== undefined) {
        profileData.position = updateUserDto.position?.trim() || null;
      }

      if (updateUserDto.department !== undefined) {
        profileData.department = updateUserDto.department?.trim() || null;
      }

      if (updateUserDto.employmentType !== undefined) {
        profileData.employment_type = updateUserDto.employmentType?.trim() || null;
      }

      if (updateUserDto.employmentStatus !== undefined) {
        profileData.employment_status = updateUserDto.employmentStatus?.trim() || 'active';
      }

      if (updateUserDto.hireDate !== undefined) {
        profileData.hire_date = updateUserDto.hireDate || null;
      }

      if (updateUserDto.workPhone !== undefined) {
        profileData.work_phone = updateUserDto.workPhone?.trim() || null;
      }

      if (updateUserDto.workEmail !== undefined) {
        profileData.work_email = updateUserDto.workEmail?.trim() || null;
      }

      if (updateUserDto.phoneExtension !== undefined) {
        profileData.phone_extension = updateUserDto.phoneExtension?.trim() || null;
      }

      if (updateUserDto.emergencyContactName !== undefined) {
        profileData.emergency_contact_name = updateUserDto.emergencyContactName?.trim() || null;
      }

      if (updateUserDto.emergencyContactPhone !== undefined) {
        profileData.emergency_contact_phone = updateUserDto.emergencyContactPhone?.trim() || null;
      }

      if (updateUserDto.notes !== undefined) {
        profileData.notes = updateUserDto.notes || null;
      }

      if (Object.keys(profileData).length === 0) {
        return;
      }

      if (existingProfile) {
        // Update existing profile
        profileData.updated_at = connection.fn.now();
        await connection('employee_profiles')
          .where({ user_id: userId, tenant_id: tenantId })
          .update(profileData);
      } else {
        // Create new profile
        const employeeCode = this.buildEmployeeCode(tenantId, userId);
        
        // Position and hire_date are required fields
        if (!profileData.position) {
          profileData.position = 'Employee'; // Default position
        }
        if (!profileData.hire_date) {
          profileData.hire_date = new Date().toISOString().split('T')[0]; // Today
        }

        await connection('employee_profiles').insert({
          tenant_id: tenantId,
          user_id: userId,
          employee_code: employeeCode,
          ...profileData,
          employment_status: profileData.employment_status || 'active',
          status: 'active',
          created_at: connection.fn.now(),
          updated_at: connection.fn.now(),
        });
      }
    } catch (error: any) {
      if (error?.code === '42P01') {
        throw new BadRequestException('Employee profiles feature is not available in this environment');
      }
      throw error;
    }
  }

  async remove(id: number) {
    const knex = this.knexService.instance;
    await this.findOne(id);

    await knex('users').where({ id }).update({ status: 'deleted' });

    return { message: 'User deleted successfully' };
  }

  async resetPassword(id: number, newPassword: string) {
    const knex = this.knexService.instance;
    
    // Verify user exists
    await this.findOne(id);

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update the password
    await knex('users')
      .where({ id })
      .update({
        password_hash: passwordHash,
        updated_at: knex.fn.now(),
      });

    return { message: 'Password reset successfully' };
  }
}
