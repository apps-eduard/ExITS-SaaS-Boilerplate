import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { KnexService } from '../database/knex.service';
import { CustomerLoginDto } from './dto/customer-auth.dto';
import bcrypt from 'bcrypt';
import { Knex } from 'knex';

@Injectable()
export class CustomerService {
  constructor(
    private knexService: KnexService,
    private jwtService: JwtService,
  ) {}

  async listCustomers(
    tenantId: number,
    filters: {
      page?: number;
      limit?: number;
      status?: string;
      kycStatus?: string;
      search?: string;
    },
  ): Promise<{ data: any[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
    const knex = this.knexService.instance;
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 25;
    const offset = (page - 1) * limit;

    const baseQuery = knex('customers as c')
      .leftJoin('money_loan_customer_profiles as mlcp', function join() {
        this.on('c.id', '=', 'mlcp.customer_id').andOn('c.tenant_id', '=', 'mlcp.tenant_id');
      })
      .where('c.tenant_id', tenantId);

    if (filters.status) {
      baseQuery.andWhere('c.status', filters.status);
    }

    if (filters.kycStatus) {
      baseQuery.andWhere('mlcp.kyc_status', filters.kycStatus);
    }

    if (filters.search && filters.search.trim().length > 0) {
      const term = `%${filters.search.trim().toLowerCase()}%`;
      baseQuery.andWhere((qb) => {
        qb.whereRaw('LOWER(c.first_name) LIKE ?', [term])
          .orWhereRaw('LOWER(c.last_name) LIKE ?', [term])
          .orWhereRaw('LOWER(c.email) LIKE ?', [term])
          .orWhereRaw('LOWER(c.phone) LIKE ?', [term])
          .orWhereRaw('LOWER(c.customer_code) LIKE ?', [term]);
      });
    }

    const countRow = await baseQuery
      .clone()
      .clearSelect()
      .clearOrder()
      .countDistinct<{ total: string }>('c.id as total')
      .first();

    const total = countRow?.total ? Number(countRow.total) : 0;

    const rows = await baseQuery
      .clone()
      .select(
        'c.id',
        'c.tenant_id as tenantId',
        'c.customer_code as customerCode',
        'c.first_name as firstName',
        'c.last_name as lastName',
        'c.email',
        'c.phone',
        'c.date_of_birth as dateOfBirth',
        'c.status',
        'mlcp.kyc_status as kycStatus',
        'mlcp.credit_score as creditScore',
        'c.created_at as createdAt',
        'c.updated_at as updatedAt',
      )
      .orderBy('c.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      data: rows.map((row) => this.mapCustomerListRow(row)),
      pagination: {
        page,
        limit,
        total,
        pages: total > 0 ? Math.max(1, Math.ceil(total / limit)) : 1,
      },
    };
  }

  async getCustomerDetails(
    tenantId: number,
    customerId: number,
    connection?: Knex | Knex.Transaction,
  ): Promise<any | null> {
    const db = connection ?? this.knexService.instance;

    const customer = await db('customers as c')
      .leftJoin('tenants as t', 'c.tenant_id', 't.id')
      .leftJoin('money_loan_customer_profiles as mlcp', function join() {
        this.on('c.id', '=', 'mlcp.customer_id').andOn('c.tenant_id', '=', 'mlcp.tenant_id');
      })
      .select(
        'c.id',
        'c.tenant_id as tenantId',
        'c.customer_code as customerCode',
        'c.customer_type as customerType',
        'c.first_name as firstName',
        'c.middle_name as middleName',
        'c.last_name as lastName',
        'c.suffix',
        'c.date_of_birth as dateOfBirth',
        'c.gender',
        'c.nationality as nationality',
        'c.civil_status as civilStatus',
        'c.email',
        'c.phone',
        'c.alternate_phone as alternatePhone',
        'c.employment_status as employmentStatus',
        'c.employer_name as employerName',
        'c.monthly_income as monthlyIncome',
        'c.source_of_income as sourceOfIncome',
        'c.id_type as idType',
        'c.id_number as idNumber',
        'c.status',
        'c.notes',
        'c.created_at as createdAt',
        'c.updated_at as updatedAt',
  'mlcp.kyc_status as kycStatus',
  'mlcp.credit_score as creditScore',
  'mlcp.risk_level as riskLevel',
        't.name as tenantName',
      )
      .where({ 'c.id': customerId, 'c.tenant_id': tenantId })
      .first();

    if (!customer) {
      return null;
    }

    const addressRow = await db('addresses')
      .where({
        tenant_id: tenantId,
        addressable_type: 'customer',
        addressable_id: customerId,
      })
      .whereNot('status', 'deleted')
      .orderBy([{ column: 'is_primary', order: 'desc' }, { column: 'created_at', order: 'desc' }])
      .first();

    const address = addressRow ? this.mapAddressRow(addressRow, customerId) : null;

    return this.composeCustomerDetail(customer, address);
  }

  async createTenantCustomer(tenantId: number, payload: any, actorId?: number) {
    if (!payload?.firstName || !payload?.lastName) {
      throw new BadRequestException('First name and last name are required');
    }

    if (!payload?.phone) {
      throw new BadRequestException('Phone number is required');
    }

    return this.knexService.transaction(async (trx) => {
      const customerCode = this.generateCustomerCode(tenantId, payload.customerCode);
      const monthlyIncomeValue = this.toNullableNumber(payload.monthlyIncome);
      const creditScoreValue = this.toNullableNumber(payload.creditScore);

      const [customer] = await trx('customers')
        .insert({
          tenant_id: tenantId,
          user_id: payload.userId ?? null,
          customer_code: customerCode,
          customer_type: payload.customerType ?? 'individual',
          first_name: payload.firstName,
          middle_name: payload.middleName ?? null,
          last_name: payload.lastName,
          suffix: payload.suffix ?? null,
          date_of_birth: payload.dateOfBirth ?? null,
          gender: payload.gender ?? null,
          nationality: payload.nationality ?? null,
          civil_status: payload.civilStatus ?? null,
          email: payload.email ?? null,
          phone: payload.phone,
          alternate_phone: payload.alternatePhone ?? null,
          id_type: payload.idType ?? null,
          id_number: payload.idNumber ?? null,
          employment_status: payload.employmentStatus ?? null,
          employer_name: payload.employerName ?? null,
          monthly_income: monthlyIncomeValue,
          source_of_income: payload.sourceOfIncome ?? null,
          status: payload.status ?? 'active',
          notes: payload.notes ?? null,
          created_by: actorId ?? null,
          updated_by: actorId ?? null,
        })
        .returning('*');

      await this.upsertMoneyLoanProfile(trx, tenantId, customer.id, {
        kycStatus: payload.kycStatus ?? 'pending',
        creditScore: creditScoreValue,
        riskLevel: payload.riskLevel ?? null,
      });

      await this.upsertCustomerAddress(trx, {
        tenantId,
        customerId: customer.id,
        addressType: payload.addressType,
        streetAddress: payload.streetAddress,
        houseNumber: payload.houseNumber,
        streetName: payload.streetName,
        subdivision: payload.subdivision,
        barangay: payload.barangay,
        cityMunicipality: payload.cityMunicipality,
        province: payload.province,
        region: payload.region,
        zipCode: payload.zipCode,
        country: payload.country,
        isPrimary: payload.isPrimary,
        actorId,
      });

      const detailed = await this.getCustomerDetails(tenantId, customer.id, trx);
      if (!detailed) {
        throw new NotFoundException('Customer not found after creation');
      }

      return detailed;
    });
  }

  async updateTenantCustomer(tenantId: number, customerId: number, payload: any, actorId?: number) {
    return this.knexService.transaction(async (trx) => {
      const existing = await trx('customers')
        .where({ id: customerId, tenant_id: tenantId })
        .first();

      if (!existing) {
        throw new NotFoundException('Customer not found');
      }

      const monthlyIncomeValue =
        payload.monthlyIncome !== undefined
          ? this.toNullableNumber(payload.monthlyIncome)
          : undefined;
      const creditScoreValue =
        payload.creditScore !== undefined
          ? this.toNullableNumber(payload.creditScore)
          : undefined;

      await trx('customers')
        .where({ id: customerId })
        .update({
          first_name: payload.firstName ?? existing.first_name,
          middle_name: payload.middleName ?? existing.middle_name,
          last_name: payload.lastName ?? existing.last_name,
          suffix: payload.suffix ?? existing.suffix,
          date_of_birth: payload.dateOfBirth ?? existing.date_of_birth,
          gender: payload.gender ?? existing.gender,
          nationality: payload.nationality ?? existing.nationality,
          civil_status: payload.civilStatus ?? existing.civil_status,
          email: payload.email ?? existing.email,
          phone: payload.phone ?? existing.phone,
          alternate_phone: payload.alternatePhone ?? existing.alternate_phone,
          id_type: payload.idType ?? existing.id_type,
          id_number: payload.idNumber ?? existing.id_number,
          employment_status: payload.employmentStatus ?? existing.employment_status,
          employer_name: payload.employerName ?? existing.employer_name,
          monthly_income:
            monthlyIncomeValue !== undefined
              ? monthlyIncomeValue
              : existing.monthly_income,
          source_of_income: payload.sourceOfIncome ?? existing.source_of_income,
          status: payload.status ?? existing.status,
          notes: payload.notes ?? existing.notes,
          updated_by: actorId ?? null,
          updated_at: trx.fn.now(),
        });

      await this.upsertMoneyLoanProfile(trx, tenantId, customerId, {
        kycStatus: payload.kycStatus,
        creditScore: creditScoreValue,
        riskLevel: payload.riskLevel,
      });

      await this.upsertCustomerAddress(trx, {
        tenantId,
        customerId,
        addressType: payload.addressType,
        streetAddress: payload.streetAddress,
        houseNumber: payload.houseNumber,
        streetName: payload.streetName,
        subdivision: payload.subdivision,
        barangay: payload.barangay,
        cityMunicipality: payload.cityMunicipality,
        province: payload.province,
        region: payload.region,
        zipCode: payload.zipCode,
        country: payload.country,
        isPrimary: payload.isPrimary,
        actorId,
      });

      const detailed = await this.getCustomerDetails(tenantId, customerId, trx);
      if (!detailed) {
        throw new NotFoundException('Customer not found after update');
      }

      return detailed;
    });
  }

  private mapCustomerListRow(row: any) {
    const firstName = row.firstName ?? '';
    const lastName = row.lastName ?? '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Unknown Customer';
    
    return {
      id: row.id,
      tenantId: row.tenantId,
      customerCode: row.customerCode,
      firstName: firstName,
      lastName: lastName,
      fullName: fullName,
      email: row.email ?? null,
      phone: row.phone ?? null,
      dateOfBirth: this.formatDateString(row.dateOfBirth) ?? '',
      status: row.status ?? 'active',
      kycStatus: row.kycStatus ?? 'pending',
      creditScore: row.creditScore !== undefined && row.creditScore !== null ? Number(row.creditScore) : 650,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private composeCustomerDetail(customer: any, address: any | null) {
    const creditScore = customer.creditScore !== undefined && customer.creditScore !== null
      ? Number(customer.creditScore)
      : 650;

  const monthlyIncomeSource = customer.monthlyIncome ?? null;
    const monthlyIncome = monthlyIncomeSource !== undefined && monthlyIncomeSource !== null
      ? Number(monthlyIncomeSource)
      : null;

    const streetFromAddress = address?.street ?? this.buildStreetFromParts(address?.houseNumber, address?.streetName, address?.streetAddress);

    return {
      id: customer.id,
      tenantId: customer.tenantId,
      tenantName: customer.tenantName ?? undefined,
      customerCode: customer.customerCode,
      customerType: customer.customerType ?? 'individual',
      firstName: customer.firstName ?? '',
      middleName: customer.middleName ?? '',
      lastName: customer.lastName ?? '',
      suffix: customer.suffix ?? '',
      dateOfBirth: this.formatDateString(customer.dateOfBirth),
      gender: customer.gender ?? '',
      nationality: customer.nationality ?? '',
      civilStatus: customer.civilStatus ?? '',
      email: customer.email ?? '',
      phone: customer.phone ?? '',
      alternatePhone: customer.alternatePhone ?? '',
  employmentStatus: customer.employmentStatus ?? '',
      employerName: customer.employerName ?? '',
      monthlyIncome,
      sourceOfIncome: customer.sourceOfIncome ?? '',
      idType: customer.idType ?? '',
      idNumber: customer.idNumber ?? '',
      kycStatus: customer.kycStatus ?? 'pending',
      creditScore,
      riskLevel: customer.riskLevel ?? 'medium',
      status: customer.status ?? 'active',
      streetAddress: streetFromAddress ?? '',
      houseNumber: address?.houseNumber ?? '',
      streetName: address?.streetName ?? '',
      subdivision: address?.subdivision ?? '',
      barangay: address?.barangay ?? '',
      cityMunicipality: address?.cityMunicipality ?? '',
      province: address?.province ?? '',
      region: address?.region ?? '',
      zipCode: address?.zipCode ?? '',
      country: address?.country ?? 'Philippines',
      addressType: address?.addressType ?? 'home',
      isPrimary: address?.isPrimary ?? true,
      addressId: address?.id ?? undefined,
      notes: customer.notes ?? undefined,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  private formatDateString(value: any): string | null {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString();
  }

  private buildStreetFromParts(houseNumber?: string, streetName?: string, streetAddress?: string): string {
    if (streetAddress && streetAddress.trim().length > 0) {
      return streetAddress.trim();
    }

    const parts = [houseNumber, streetName]
      .map((value) => (value ? `${value}`.trim() : ''))
      .filter((value) => value.length > 0);

    return parts.join(' ').trim();
  }

  private mapAddressRow(row: any, fallbackCustomerId: number) {
    if (!row) {
      return null;
    }

    const streetParts = [row.houseNumber, row.streetName]
      .map((value) => (value ? `${value}`.trim() : ''))
      .filter((value) => value.length > 0);

  const fallbackStreet = streetParts.join(' ').trim();
  const street = row.street ?? (fallbackStreet || row.streetName || '');

    return {
      id: row.id !== undefined && row.id !== null ? String(row.id) : undefined,
      customerId: String(fallbackCustomerId),
      tenantId: row.tenantId !== undefined && row.tenantId !== null ? String(row.tenantId) : undefined,
      addressType: row.addressType ?? 'home',
      label: row.label ?? undefined,
      street,
      streetAddress: street,
      houseNumber: row.houseNumber ?? undefined,
      streetName: row.streetName ?? undefined,
      subdivision: row.subdivision ?? undefined,
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
    };
  }

  private hasAddressPayload(payload: any): boolean {
    if (!payload) {
      return false;
    }

    const fields = [
      payload.streetAddress,
      payload.streetName,
      payload.houseNumber,
      payload.subdivision,
      payload.barangay,
      payload.cityMunicipality,
      payload.province,
      payload.region,
      payload.zipCode,
    ];

    return fields.some((value) => value !== undefined && value !== null && `${value}`.trim().length > 0);
  }

  private async upsertMoneyLoanProfile(
    trx: Knex.Transaction,
    tenantId: number,
    customerId: number,
    payload: {
      kycStatus?: string;
      creditScore?: number | null;
      riskLevel?: string | null;
    },
  ): Promise<void> {
    const existing = await trx('money_loan_customer_profiles')
      .where({ customer_id: customerId, tenant_id: tenantId })
      .first();

    const updatePayload: Record<string, any> = {
      updated_at: trx.fn.now(),
    };

    if (payload.kycStatus !== undefined) updatePayload.kyc_status = payload.kycStatus;
    if (payload.creditScore !== undefined) {
      updatePayload.credit_score = payload.creditScore === null ? null : Number(payload.creditScore);
    }
    if (payload.riskLevel !== undefined) updatePayload.risk_level = payload.riskLevel;

    if (existing) {
      if (Object.keys(updatePayload).length > 1) {
        await trx('money_loan_customer_profiles')
          .where({ customer_id: customerId, tenant_id: tenantId })
          .update(updatePayload);
      }
      return;
    }

    await trx('money_loan_customer_profiles').insert({
      customer_id: customerId,
      tenant_id: tenantId,
      credit_score: payload.creditScore === null || payload.creditScore === undefined ? 650 : Number(payload.creditScore),
      risk_level: payload.riskLevel ?? 'medium',
      kyc_status: payload.kycStatus ?? 'pending',
      created_at: trx.fn.now(),
      updated_at: trx.fn.now(),
    });
  }

  private async upsertCustomerAddress(
    trx: Knex.Transaction,
    input: {
      tenantId: number;
      customerId: number;
      addressType?: string;
      streetAddress?: string;
      houseNumber?: string;
      streetName?: string;
      subdivision?: string;
      barangay?: string;
      cityMunicipality?: string;
      province?: string;
      region?: string;
      zipCode?: string;
      country?: string;
      isPrimary?: boolean;
      actorId?: number | null;
    },
  ): Promise<void> {
    if (!this.hasAddressPayload(input)) {
      return;
    }

    const existing = await trx('addresses')
      .where({
        tenant_id: input.tenantId,
        addressable_type: 'customer',
        addressable_id: input.customerId,
      })
      .whereNot('status', 'deleted')
      .orderBy([{ column: 'is_primary', order: 'desc' }, { column: 'created_at', order: 'desc' }])
      .first();

    const streetName = input.streetName || input.streetAddress || null;
    const payload: Record<string, any> = {
      address_type: input.addressType ?? 'home',
      label: this.defaultAddressLabel(input.addressType),
      house_number: input.houseNumber ?? null,
      street_name: streetName ?? null,
      subdivision: input.subdivision ?? null,
      barangay: input.barangay ?? null,
      city_municipality: input.cityMunicipality ?? null,
      province: input.province ?? null,
      region: input.region ?? null,
      zip_code: input.zipCode ?? null,
      country: input.country ?? 'Philippines',
      is_primary: input.isPrimary ?? true,
      updated_by: input.actorId ?? null,
      updated_at: trx.fn.now(),
      status: 'active',
    };

    if (existing) {
      await trx('addresses').where({ id: existing.id }).update(payload);
      return;
    }

    await trx('addresses').insert({
      tenant_id: input.tenantId,
      addressable_type: 'customer',
      addressable_id: input.customerId,
      ...payload,
      created_by: input.actorId ?? null,
      created_at: trx.fn.now(),
    });
  }

  private defaultAddressLabel(addressType?: string) {
    switch (addressType) {
      case 'work':
        return 'Work Address';
      case 'billing':
        return 'Billing Address';
      case 'shipping':
        return 'Shipping Address';
      case 'business':
        return 'Business Address';
      case 'home':
        return 'Home Address';
      default:
        return 'Primary Address';
    }
  }

  private toNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  private generateCustomerCode(tenantId: number, provided?: string): string {
    if (provided && provided.trim().length > 0) {
      return provided.trim();
    }

    return `CUST-${tenantId}-${Date.now()}`;
  }

  async checkEmailExists(tenantName: string, email: string): Promise<boolean> {
    const knex = this.knexService.instance;

    // Find tenant by name
    const tenant = await knex('tenants')
      .where({ name: tenantName, status: 'active' })
      .first();

    if (!tenant) {
      return false;
    }

    // Check if email exists in customers table
    const customer = await knex('customers')
      .where({ email: email.toLowerCase(), tenant_id: tenant.id })
      .first();

    if (customer) {
      return true;
    }

    // Also check users table
    const user = await knex('users')
      .whereRaw('LOWER(email) = LOWER(?)', [email])
      .where({ tenant_id: tenant.id })
      .first();

    return !!user;
  }

  async register(payload: {
    tenant: string;
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
    address?: string;
  }) {
    const knex = this.knexService.instance;

    return await knex.transaction(async (trx) => {
      // Find tenant by name
      const tenant = await trx('tenants')
        .where({ name: payload.tenant, status: 'active' })
        .first();

      if (!tenant) {
        throw new BadRequestException('Invalid tenant');
      }

      // Check if email already exists
      const existingCustomer = await trx('customers')
        .where({ email: payload.email, tenant_id: tenant.id })
        .first();

      if (existingCustomer) {
        throw new BadRequestException('Email already registered');
      }

      // Check if user exists
      const existingUser = await trx('users')
        .whereRaw('LOWER(email) = LOWER(?)', [payload.email])
        .where({ tenant_id: tenant.id })
        .first();

      if (existingUser) {
        throw new BadRequestException('Email already registered');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(payload.password, 10);

      // Split full name if provided, otherwise leave empty for profile completion
      let firstName = '';
      let lastName = '';
      if (payload.fullName && payload.fullName.trim()) {
        const nameParts = payload.fullName.trim().split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      // Create user record
      const [user] = await trx('users')
        .insert({
          tenant_id: tenant.id,
          email: payload.email,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          status: 'active',
          email_verified: false,
        })
        .returning('*');

      // Find customer role
      const customerRole = await trx('roles')
        .where(function() {
          this.where({ name: 'Customer', tenant_id: tenant.id })
            .orWhere({ name: 'Customer', tenant_id: null });
        })
        .first();

      if (customerRole) {
        await trx('user_roles').insert({
          user_id: user.id,
          role_id: customerRole.id,
        });
      }

      // Generate customer code
      const customerCode = `CUST-${tenant.id}-${Date.now()}`;

      // Create customer record
      const [customer] = await trx('customers')
        .insert({
          tenant_id: tenant.id,
          user_id: user.id,
          customer_code: customerCode,
          email: payload.email,
          phone: payload.phone || '', // Use empty string if phone not provided
          first_name: firstName,
          last_name: lastName,
          status: 'active',
        })
        .returning('*');

      // Create address if provided
      if (payload.address) {
        await trx('addresses').insert({
          customer_id: customer.id,
          tenant_id: tenant.id,
          address_type: 'primary',
          street_address: payload.address,
          is_primary: true,
        });
      }

      return {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.phone,
        customerCode: customer.customer_code,
        tenantId: customer.tenant_id,
        tenantName: tenant.name,
      };
    });
  }

  async login(loginDto: CustomerLoginDto) {
    const knex = this.knexService.instance;

    // Query customer record (main SaaS customer table)
    // and join with money_loan_customer_profiles (loan-specific KYC/credit data)
    const customerRecord = await knex('customers')
      .select(
        'customers.*',
        'users.email as userEmail',
        'users.password_hash as passwordHash',
        'users.id as userId',
        // Loan profile fields from money_loan_customer_profiles
        'money_loan_customer_profiles.kyc_status as loanProfileKycStatus',
        'money_loan_customer_profiles.credit_score as loanProfileCreditScore',
        'money_loan_customer_profiles.risk_level as loanProfileRiskLevel',
        'tenants.name as tenantName',
        'tenants.subdomain as tenantSubdomain'
      )
      .leftJoin('users', 'customers.user_id', 'users.id')
      .leftJoin('money_loan_customer_profiles', 'customers.id', 'money_loan_customer_profiles.customer_id')
      .leftJoin('tenants', 'customers.tenant_id', 'tenants.id')
      .where(function() {
        this.where('customers.email', loginDto.identifier)
          .orWhere('customers.phone', loginDto.identifier);
      })
      .whereNotNull('customers.user_id')
      .where('customers.status', 'active')
      .first();

    if (!customerRecord || !customerRecord.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(loginDto.password, customerRecord.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokenExpiry = loginDto.rememberMe ? '30d' : '1d';
    const customerPermissions = [
      'money-loan:read',
      'money-loan:payments',
      'money-loan:create',
    ];
    const payload = {
      userId: customerRecord.userId,
      customerId: customerRecord.id, // customers.id (main SaaS customer ID)
      tenantId: customerRecord.tenantId,
      type: 'customer',
      permissions: customerPermissions,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: tokenExpiry });

    // Hash the token for storage
    const tokenHash = await bcrypt.hash(accessToken, 10);

    await knex('user_sessions').insert({
      user_id: customerRecord.userId,
      token_hash: tokenHash,
      status: 'active',
      expires_at: new Date(Date.now() + (loginDto.rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000),
      user_agent: 'Customer Portal',
    });

    const customerData = { ...customerRecord };
    delete customerData.passwordHash;

    // Check if profile is complete (handle both camelCase and snake_case due to Knex transformation)
    const firstName = customerRecord.firstName || customerRecord.first_name;
    const phone = customerRecord.phone;
    const profileComplete = !!(
      firstName && 
      firstName.trim() !== '' &&
      phone && 
      phone.trim() !== ''
    );

    console.log('🔍 Profile completeness check:', {
      firstName,
      phone,
      profileComplete,
      rawCustomerRecord: customerRecord
    });

    return {
      success: true,
      message: 'Login successful',
      data: {
        tokens: {
          accessToken,
          refreshToken: accessToken, // TODO: Implement proper refresh token
        },
        customer: {
          ...customerData,
          permissions: customerPermissions,
          profileComplete,
        },
        user: {
          id: customerRecord.id.toString(),
          email: customerRecord.email || customerRecord.userEmail,
          firstName: customerRecord.firstName || customerRecord.first_name,
          lastName: customerRecord.lastName || customerRecord.last_name,
          role: 'customer',
          tenant: {
            id: customerRecord.tenantId?.toString(),
            name: customerRecord.tenantName,
          },
          permissions: customerPermissions,
          profileComplete,
        },
      },
    };
  }

  async getProfile(customerId: number, tenantId: number) {
    const knex = this.knexService.instance;

    // Get customer record (main SaaS customer table)
    // with loan profile data (money_loan_customer_profiles)
    const customerProfile = await knex('customers')
      .select(
        'customers.*',
        // Loan-specific profile fields
        'money_loan_customer_profiles.kyc_status as loanProfileKycStatus',
        'money_loan_customer_profiles.credit_score as loanProfileCreditScore',
        'money_loan_customer_profiles.risk_level as loanProfileRiskLevel'
      )
      .leftJoin('money_loan_customer_profiles', 'customers.id', 'money_loan_customer_profiles.customer_id')
      .where({ 'customers.id': customerId, 'customers.tenant_id': tenantId })
      .first();

    if (!customerProfile) {
      throw new NotFoundException('Customer not found');
    }

    return customerProfile;
  }

  async updateProfile(customerId: number, tenantId: number, payload: any) {
    const knex = this.knexService.instance;

    return await knex.transaction(async (trx) => {
      // Prepare update data
      const updateData: any = {};

      // Handle personal info updates
      if (payload.firstName !== undefined) {
        updateData.first_name = payload.firstName.trim();
      }
      if (payload.lastName !== undefined) {
        updateData.last_name = payload.lastName.trim();
      }
      if (payload.phone !== undefined) {
        updateData.phone = payload.phone.trim();
      }

      // Update customer record
      if (Object.keys(updateData).length > 0) {
        updateData.updated_at = trx.fn.now();
        
        await trx('customers')
          .where({ id: customerId, tenant_id: tenantId })
          .update(updateData);

        // Also update the user record to keep first_name and last_name in sync
        const userUpdateData: any = {};
        if (updateData.first_name !== undefined) {
          userUpdateData.first_name = updateData.first_name;
        }
        if (updateData.last_name !== undefined) {
          userUpdateData.last_name = updateData.last_name;
        }

        if (Object.keys(userUpdateData).length > 0) {
          userUpdateData.updated_at = trx.fn.now();
          
          // Find user_id from customer
          const customer = await trx('customers')
            .select('user_id')
            .where({ id: customerId })
            .first();

          if (customer?.user_id) {
            await trx('users')
              .where({ id: customer.user_id })
              .update(userUpdateData);
          }
        }
      }

      // Handle address updates
      if (payload.address) {
        const addressData = {
          street_name: payload.address.streetAddress || '',
          city_municipality: payload.address.city || '',
          province: payload.address.state || '',
          zip_code: payload.address.postalCode || '',
          country: payload.address.country || 'Philippines',
          // Set default required fields for PH addresses
          barangay: payload.address.barangay || 'N/A',
          region: payload.address.region || 'NCR',
          updated_at: trx.fn.now(),
        };

        // Check if customer already has an address
        const existingAddress = await trx('addresses')
          .where({ 
            addressable_type: 'customer',
            addressable_id: customerId,
            tenant_id: tenantId 
          })
          .first();

        if (existingAddress) {
          // Update existing address
          await trx('addresses')
            .where({ 
              addressable_type: 'customer',
              addressable_id: customerId,
              tenant_id: tenantId 
            })
            .update(addressData);
        } else {
          // Create new address
          await trx('addresses').insert({
            addressable_type: 'customer',
            addressable_id: customerId,
            tenant_id: tenantId,
            address_type: 'home',
            is_primary: true,
            ...addressData,
            created_at: trx.fn.now(),
          });
        }
      }

      // Fetch and return updated profile
      const updatedCustomer = await trx('customers')
        .select('customers.*')
        .where({ 'customers.id': customerId, 'customers.tenant_id': tenantId })
        .first();

      // Fetch addresses using polymorphic relation
      const addresses = await trx('addresses')
        .where({ 
          addressable_type: 'customer',
          addressable_id: customerId,
          tenant_id: tenantId 
        })
        .orderBy('is_primary', 'desc');

      return {
        ...updatedCustomer,
        addresses,
      };
    });
  }

  async getLoans(customerId: number, tenantId: number) {
    const knex = this.knexService.instance;

    return await knex('money_loan_loans')
      .select(
        'money_loan_loans.*',
        'money_loan_products.name as productName',
        'money_loan_products.interest_rate as productInterestRate'
      )
      .leftJoin('money_loan_products', 'money_loan_loans.loan_product_id', 'money_loan_products.id')
      .where({
        'money_loan_loans.customer_id': customerId,
        'money_loan_loans.tenant_id': tenantId,
      })
      .orderBy('money_loan_loans.created_at', 'desc');
  }

  async getLoansById(userId: number) {
    const knex = this.knexService.instance;

    // Resolve user → customer relationship
    // Note: userId from mobile app → users.id → customers.user_id → customers.id
    const userWithCustomer = await knex('users')
      .select('users.tenant_id', 'customers.id as customer_id')
      .leftJoin('customers', 'users.id', 'customers.user_id')
      .where({ 'users.id': userId })
      .first();

    if (!userWithCustomer) {
      throw new NotFoundException('User not found');
    }

    // Knex converts snake_case to camelCase
    // customers.id is the main SaaS customer ID
    const mainCustomerId = userWithCustomer.customerId;
    
    if (!mainCustomerId) {
      throw new NotFoundException('Customer record not found for this user');
    }

    console.log(`🔍 getLoansById - User ID: ${userId}, Main Customer ID: ${mainCustomerId}, Tenant ID: ${userWithCustomer.tenantId}`);

    // Query loans using customers.id (money_loan_loans.customer_id references customers.id)
    const loans = await knex('money_loan_loans')
      .select(
        'money_loan_loans.*',
        'money_loan_products.name as productName',
        'money_loan_products.interest_rate as productInterestRate'
      )
      .leftJoin('money_loan_products', 'money_loan_loans.loan_product_id', 'money_loan_products.id')
      .where({
        'money_loan_loans.customer_id': mainCustomerId, // References customers.id
        'money_loan_loans.tenant_id': userWithCustomer.tenantId,
      })
      .orderBy('money_loan_loans.created_at', 'desc');

    console.log(`📊 getLoansById - Found ${loans.length} loans for customer ${mainCustomerId}`);
    
    return loans;
  }

  async getApplications(customerId: number, tenantId: number) {
    const knex = this.knexService.instance;

    return await knex('money_loan_applications')
      .select(
        'money_loan_applications.*',
        'money_loan_products.name as productName'
      )
      .leftJoin('money_loan_products', 'money_loan_applications.loan_product_id', 'money_loan_products.id')
      .where({
        'money_loan_applications.customer_id': customerId,
        'money_loan_applications.tenant_id': tenantId,
      })
      .whereIn('money_loan_applications.status', ['submitted', 'under_review'])
      .orderBy('money_loan_applications.created_at', 'desc');
  }

  async getPayments(customerId: number, tenantId: number, loanId?: number) {
    const knex = this.knexService.instance;

    console.log(`📋 getPayments - Customer ID: ${customerId}, Tenant ID: ${tenantId}, Loan ID: ${loanId}`);

    // Validate customerId
    if (!customerId) {
      throw new NotFoundException('Customer ID is required');
    }

    let query = knex('money_loan_payments')
      .select('money_loan_payments.*', 'money_loan_loans.loan_number as loanNumber')
      .join('money_loan_loans', 'money_loan_payments.loan_id', 'money_loan_loans.id')
      .where('money_loan_loans.customer_id', customerId)
      .where('money_loan_loans.tenant_id', tenantId)
      .orderBy('money_loan_payments.created_at', 'desc');

    if (loanId) {
      query = query.where('money_loan_payments.loan_id', loanId);
    }

    const payments = await query;
    console.log(`💳 Found ${payments.length} payments for customer ${customerId}`);
    
    return payments;
  }

  async getDashboard(userId: number) {
    const knex = this.knexService.instance;

    // Resolve user → customer relationship
    // Note: userId from mobile app → users.id → customers.user_id → customers.id
    const userWithCustomer = await knex('users')
      .select(
        'users.*',
        'users.tenant_id',
        'customers.id as customer_id',
        'customers.assigned_employee_id as assignedEmployeeId',
        'customers.assigned_at as assignedAt'
      )
      .leftJoin('customers', 'users.id', 'customers.user_id')
      .where({ 'users.id': userId })
      .first();

    if (!userWithCustomer) {
      throw new NotFoundException('User not found');
    }

    // Knex converts snake_case to camelCase
    // customers.id is the main SaaS customer ID
  const mainCustomerId = userWithCustomer.customerId;
  const assignedEmployeeId = userWithCustomer.assignedEmployeeId;
  const assignedAt = userWithCustomer.assignedAt;
    
    if (!mainCustomerId) {
      throw new NotFoundException('Customer record not found for this user');
    }

    const tenantId = userWithCustomer.tenantId;

    console.log(`🔍 getDashboard - User ID: ${userId}, Main Customer ID: ${mainCustomerId}, Tenant ID: ${tenantId}`);

    // Resolve assigned collector (if any)
    let assignedCollector: any = null;
    if (assignedEmployeeId) {
      const collector = await knex('users')
        .select('id', 'first_name', 'last_name', 'email', 'phone')
        .where({ id: assignedEmployeeId })
        .first();

      if (collector) {
        const firstName = collector.firstName ?? collector.first_name ?? '';
        const lastName = collector.lastName ?? collector.last_name ?? '';
        const fullName = `${firstName} ${lastName}`.trim() || collector.email;

        assignedCollector = {
          id: collector.id,
          firstName,
          lastName,
          fullName,
          email: collector.email,
          phone: collector.phone ?? null,
          assignedAt: assignedAt ?? null,
        };
      }
    }

    // Get all loans for this customer (money_loan_loans.customer_id references customers.id)
    const loans = await knex('money_loan_loans')
      .where({
        'customer_id': mainCustomerId, // References customers.id
        'tenant_id': tenantId,
      });

    console.log(`📊 getDashboard - Found ${loans.length} loans for customer ${mainCustomerId}`);

    // Calculate dashboard stats
    const totalLoans = loans.length;
    const activeLoans = loans.filter(loan => 
      ['active', 'approved', 'disbursed'].includes(loan.status)
    ).length;
    
    const totalBorrowed = loans.reduce((sum, loan) => {
      const principal = loan.principal_amount ?? loan.principalAmount ?? 0;
      return sum + parseFloat(principal);
    }, 0);
    const totalPaid = loans.reduce((sum, loan) => {
      const paid = loan.total_paid ?? loan.totalPaid ?? loan.amount_paid ?? loan.amountPaid ?? 0;
      return sum + parseFloat(paid);
    }, 0);
    const remainingBalance = loans.reduce((sum, loan) => {
      const balance = loan.outstanding_balance ?? loan.outstandingBalance ?? 0;
      return sum + parseFloat(balance);
    }, 0);

    // Get next payment info for this customer
    const nextPayment = await knex('money_loan_repayment_schedules as schedule')
      .join('money_loan_loans as loans', 'schedule.loan_id', 'loans.id')
      .select(
        'schedule.due_date',
        'schedule.total_amount',
        'schedule.outstanding_amount'
      )
      .where('loans.customer_id', mainCustomerId) // References customers.id
      .andWhere('loans.tenant_id', tenantId)
      .andWhere(builder =>
        builder.whereIn('schedule.status', ['pending', 'partially_paid'])
      )
      .orderBy('schedule.due_date', 'asc')
      .first();

    // Get recent applications (submitted, approved) for this customer
    // Note: Only fetch applications that haven't been disbursed yet
    const recentApplications = await knex('money_loan_applications')
      .select(
        'money_loan_applications.*',
        'money_loan_products.name as productName'
      )
      .leftJoin('money_loan_products', 'money_loan_applications.loan_product_id', 'money_loan_products.id')
      .where({
        'money_loan_applications.customer_id': mainCustomerId,
        'money_loan_applications.tenant_id': tenantId,
      })
      .whereIn('money_loan_applications.status', ['submitted', 'approved', 'pending'])
      .orderBy('money_loan_applications.created_at', 'desc')
      .limit(5);

    // Get recent loans (disbursed) for this customer
    const recentLoans = await knex('money_loan_loans')
      .select(
        'money_loan_loans.*',
        'money_loan_products.name as productName'
      )
      .leftJoin('money_loan_products', 'money_loan_loans.loan_product_id', 'money_loan_products.id')
      .where({
        'money_loan_loans.customer_id': mainCustomerId, // References customers.id
        'money_loan_loans.tenant_id': tenantId,
      })
      .orderBy('money_loan_loans.created_at', 'desc')
      .limit(5);

    // Combine applications and loans, sorted by created date
    const combinedRecent = [
      ...recentApplications.map(app => ({
        id: app.id,
        applicationNumber: app.application_number ?? app.applicationNumber,
        loanNumber: null,
        amount: app.requested_amount ?? app.requestedAmount,
        balance: 0,
        status: app.status,
        productName: app.productName,
        createdAt: app.created_at ?? app.createdAt,
        type: 'application'
      })),
      ...recentLoans.map(loan => ({
        id: loan.id,
        applicationNumber: null,
        loanNumber: loan.loan_number ?? loan.loanNumber,
        amount: loan.principal_amount ?? loan.principalAmount,
        balance: loan.outstanding_balance ?? loan.outstandingBalance,
        status: loan.status,
        productName: loan.productName,
        createdAt: loan.created_at ?? loan.createdAt,
        type: 'loan'
      }))
    ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

    return {
      totalLoans,
      activeLoans,
      totalBorrowed,
      totalPaid,
      remainingBalance,
      nextPaymentAmount: nextPayment
        ? parseFloat(
            (nextPayment.outstanding_amount ??
              nextPayment.outstandingAmount ??
              nextPayment.total_amount ??
              nextPayment.totalAmount ??
              0) as any,
          )
        : 0,
      nextPaymentDate:
        nextPayment?.due_date ?? nextPayment?.dueDate ?? null,
      recentLoans: combinedRecent.map(item => ({
        id: item.id,
        loanNumber: item.loanNumber,
        applicationNumber: item.applicationNumber,
        amount: item.amount,
        balance: item.balance,
        status: item.status,
        productName: item.productName,
        type: item.type,
        dueDate: null, // Will be populated when loan is disbursed
      })),
      assignedCollector,
    };
  }

  async getDashboardByCustomerId(customerId: number, tenantId: number) {
    const knex = this.knexService.instance;

    console.log(`🔍 getDashboardByCustomerId - Customer ID: ${customerId}, Tenant ID: ${tenantId}`);

    const customerRecord = await knex('customers')
      .select(
        'assigned_employee_id as assignedEmployeeId',
        'assigned_at as assignedAt'
      )
      .where({ id: customerId, tenant_id: tenantId })
      .first();

    let assignedCollector: any = null;
    if (customerRecord?.assignedEmployeeId) {
      const collector = await knex('users')
        .select('id', 'first_name', 'last_name', 'email', 'phone')
        .where({ id: customerRecord.assignedEmployeeId })
        .first();

      if (collector) {
        const firstName = collector.firstName ?? collector.first_name ?? '';
        const lastName = collector.lastName ?? collector.last_name ?? '';
        const fullName = `${firstName} ${lastName}`.trim() || collector.email;

        assignedCollector = {
          id: collector.id,
          firstName,
          lastName,
          fullName,
          email: collector.email,
          phone: collector.phone ?? null,
          assignedAt: customerRecord.assignedAt ?? null,
        };
      }
    }

    // Get all loans for this customer (money_loan_loans.customer_id references customers.id)
    const loans = await knex('money_loan_loans')
      .where({
        'customer_id': customerId, // References customers.id
        'tenant_id': tenantId,
      });

    console.log(`📊 getDashboardByCustomerId - Found ${loans.length} loans for customer ${customerId}`);

    // Calculate dashboard stats
    const totalLoans = loans.length;
    const activeLoans = loans.filter(loan => 
      ['active', 'approved', 'disbursed'].includes(loan.status)
    ).length;
    
    const totalBorrowed = loans.reduce((sum, loan) => {
      const principal = loan.principal_amount ?? loan.principalAmount ?? 0;
      return sum + parseFloat(principal);
    }, 0);
    const totalPaid = loans.reduce((sum, loan) => {
      const paid = loan.total_paid ?? loan.totalPaid ?? loan.amount_paid ?? loan.amountPaid ?? 0;
      return sum + parseFloat(paid);
    }, 0);
    const remainingBalance = loans.reduce((sum, loan) => {
      const balance = loan.outstanding_balance ?? loan.outstandingBalance ?? 0;
      return sum + parseFloat(balance);
    }, 0);

    // Get next payment info for this customer
    const nextPayment = await knex('money_loan_repayment_schedules as schedule')
      .join('money_loan_loans as loans', 'schedule.loan_id', 'loans.id')
      .select(
        'schedule.due_date',
        'schedule.total_amount',
        'schedule.outstanding_amount'
      )
      .where('loans.customer_id', customerId) // References customers.id
      .andWhere('loans.tenant_id', tenantId)
      .andWhere(builder =>
        builder.whereIn('schedule.status', ['pending', 'partially_paid'])
      )
      .orderBy('schedule.due_date', 'asc')
      .first();

    // Get recent loans for this customer
    const recentLoans = await knex('money_loan_loans')
      .select(
        'money_loan_loans.*',
        'money_loan_products.name as productName'
      )
      .leftJoin('money_loan_products', 'money_loan_loans.loan_product_id', 'money_loan_products.id')
      .where({
        'money_loan_loans.customer_id': customerId, // References customers.id
        'money_loan_loans.tenant_id': tenantId,
      })
      .orderBy('money_loan_loans.created_at', 'desc')
      .limit(5);

    // Get recent applications (pending/submitted) for this customer
    const recentApplications = await knex('money_loan_applications')
      .select(
        'money_loan_applications.*',
        'money_loan_products.name as productName'
      )
      .leftJoin('money_loan_products', 'money_loan_applications.loan_product_id', 'money_loan_products.id')
      .where({
        'money_loan_applications.customer_id': customerId,
        'money_loan_applications.tenant_id': tenantId,
      })
      .whereIn('money_loan_applications.status', ['submitted', 'approved', 'pending'])
      .orderBy('money_loan_applications.created_at', 'desc')
      .limit(5);

    // Combine loans and applications, sort by created_at
    const combinedRecent = [
      ...recentLoans.map(loan => ({
        id: loan.id,
        loanNumber: loan.loan_number ?? loan.loanNumber,
        applicationNumber: null,
        amount: loan.principal_amount ?? loan.principalAmount,
        balance: loan.outstanding_balance ?? loan.outstandingBalance,
        status: loan.status,
        productName: loan.productName,
        dueDate: loan.next_payment_date ?? loan.nextPaymentDate ?? loan.maturity_date ?? loan.maturityDate,
        createdAt: loan.created_at ?? loan.createdAt,
        type: 'loan',
      })),
      ...recentApplications.map(app => ({
        id: app.id,
        loanNumber: null,
        applicationNumber: app.application_number ?? app.applicationNumber,
        amount: app.requested_amount ?? app.requestedAmount,
        balance: null,
        status: app.status,
        productName: app.productName,
        dueDate: null,
        createdAt: app.created_at ?? app.createdAt,
        type: 'application',
      }))
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalLoans,
      activeLoans,
      totalBorrowed,
      totalPaid,
      remainingBalance,
      nextPaymentAmount: nextPayment
        ? parseFloat(
            (nextPayment.outstanding_amount ??
              nextPayment.outstandingAmount ??
              nextPayment.total_amount ??
              nextPayment.totalAmount ??
              0) as any,
          )
        : 0,
      nextPaymentDate:
        nextPayment?.due_date ?? nextPayment?.dueDate ?? null,
      recentLoans: combinedRecent,
      assignedCollector,
    };
  }

  async getLoanDetailsByCustomerId(customerId: number, tenantId: number, loanId: number) {
    const knex = this.knexService.instance;

    console.log(`🔍 getLoanDetailsByCustomerId - Customer ID: ${customerId}, Tenant ID: ${tenantId}, Loan ID: ${loanId}`);

    // Get loan details with product information
    const loan = await knex('money_loan_loans')
      .select(
        'money_loan_loans.*',
        'money_loan_products.name as productName',
        'money_loan_products.interest_rate as productInterestRate',
        'money_loan_products.interest_type as productInterestType',
        'money_loan_products.description as productDescription',
        'money_loan_products.min_amount as productMinAmount',
        'money_loan_products.max_amount as productMaxAmount',
        'money_loan_products.payment_frequency as productPaymentFrequency'
      )
      .leftJoin('money_loan_products', 'money_loan_loans.loan_product_id', 'money_loan_products.id')
      .where({
        'money_loan_loans.id': loanId,
        'money_loan_loans.customer_id': customerId,
        'money_loan_loans.tenant_id': tenantId,
      })
      .first();

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    console.log(`🔍 Found loan ${loanId} for customer ${customerId}`);

    // Get payment history
    const payments = await knex('money_loan_payments')
      .where({
        'loan_id': loanId,
        'tenant_id': tenantId,
      })
      .orderBy('payment_date', 'desc');

    console.log(`💳 Payment history query result: ${payments.length} records`);

    // Get payment frequency from loan or product
    const paymentFrequency = (loan.payment_frequency || loan.paymentFrequency || 
                            loan.productPaymentFrequency || 'weekly') as 'daily' | 'weekly' | 'biweekly' | 'monthly';
    const termDays = loan.term_days || loan.termDays || 30;
    const termMonths = termDays / 30;
    const disbursementDateValue = loan.disbursement_date || loan.disbursementDate;
    const disbursementDate = disbursementDateValue ? new Date(disbursementDateValue) : new Date();
    
    console.log(`📋 Using payment frequency: ${paymentFrequency} (term: ${termMonths} months)`);
    
    // Use the centralized loan calculator service for schedule generation
    const principalAmount = parseFloat(loan.principal_amount || loan.principalAmount || '0');
    const interestRate = parseFloat(loan.interest_rate || loan.interestRate || '0');
    const interestType = (loan.interest_type || loan.interestType || 'flat') as 'flat' | 'reducing' | 'compound';
    const processingFeePercent = parseFloat(loan.processing_fee || loan.processingFee || '0');
    const platformFee = parseFloat(loan.platform_fee || loan.platformFee || '50');

    // Import and use the loan calculator
    const { LoanCalculatorService } = require('../money-loan/loan-calculator.service');
    const calculator = new LoanCalculatorService();
    
    const calculation = calculator.calculate({
      loanAmount: principalAmount,
      termMonths,
      paymentFrequency,
      interestRate,
      interestType,
      processingFeePercentage: processingFeePercent,
      platformFee,
    });

    const schedule = calculator.generateSchedule(calculation, disbursementDate);

    // Calculate total paid from payments
    let totalPaid = 0;
    for (const payment of payments) {
      const amount = parseFloat(payment.amount || '0');
      console.log(`💰 Payment ${payment.id}: amount = ${amount}, status = ${payment.status}`);
      totalPaid += amount;
    }
    console.log(`📊 TOTAL PAID calculated from ${payments.length} payments: ${totalPaid}`);

    // Instead of using stored schedules, use the MoneyLoanService to generate dynamic schedule
    // This ensures customer view matches collector view calculations
    const { MoneyLoanService } = require('../money-loan/money-loan.service');
    const moneyLoanService = new MoneyLoanService(this.knexService);
    
    console.log('🔄 Using dynamic schedule generation (same as collector view)');
    const scheduleData = await moneyLoanService.generateRepaymentSchedule(tenantId, loanId);
    
    console.log(`📅 Generated ${scheduleData.length} schedule items dynamically`);

    const scheduleTotalAmount = scheduleData.reduce((sum: number, installment: any) => sum + (installment.totalAmount || 0), 0);

    const outstandingBalance = parseFloat(loan.outstanding_balance ?? loan.outstandingBalance ?? 0);
    const totalRepayableForProgress = scheduleTotalAmount > 0 ? scheduleTotalAmount : calculation.totalRepayable;
    const paymentProgress = totalRepayableForProgress > 0
      ? Math.min(100, Math.round((totalPaid / totalRepayableForProgress) * 100))
      : 0;

    return {
      loan: {
        id: loan.id,
        loanNumber: loan.loan_number ?? loan.loanNumber,
        principalAmount: principalAmount,
        interestRate,
        interestType,
        totalInterest: parseFloat(loan.total_interest ?? loan.totalInterest ?? calculation.interestAmount ?? 0),
        totalAmount: totalRepayableForProgress,
        outstandingBalance: outstandingBalance,
        status: loan.status,
        disbursementDate: loan.disbursement_date ?? loan.disbursementDate,
        maturityDate: loan.maturity_date ?? loan.maturityDate,
        paymentFrequency: paymentFrequency,
        termDays: termDays,
        term: termMonths,
        processingFee: calculation.processingFeeAmount,
        productName: loan.productName,
        productDescription: loan.productDescription,
        nextPaymentDate: scheduleData.find(s => s.status !== 'paid')?.due_date || null,
        nextPaymentAmount: scheduleData.find(s => s.status !== 'paid')?.total_amount || 0,
      },
      paymentProgress: paymentProgress,
      schedule: scheduleData,
      payments: payments.map(payment => ({
        id: payment.id,
        amount: parseFloat(payment.amount || '0'),
        paymentDate: payment.payment_date ?? payment.paymentDate,
        paymentMethod: payment.payment_method ?? payment.paymentMethod,
        referenceNumber: payment.reference_number ?? payment.referenceNumber,
        status: payment.status,
        notes: payment.notes,
        principalPaid: parseFloat(payment.principal_paid ?? payment.principalPaid ?? '0'),
        interestPaid: parseFloat(payment.interest_paid ?? payment.interestPaid ?? '0'),
      })),
    };
  }

  async getApplicationDetailsByCustomerId(customerId: number, tenantId: number, applicationId: number) {
    const knex = this.knexService.instance;

    console.log(`🔍 getApplicationDetailsByCustomerId - Customer ID: ${customerId}, Tenant ID: ${tenantId}, Application ID: ${applicationId}`);

    // Get application details with product information
    const application = await knex('money_loan_applications')
      .select(
        'money_loan_applications.*',
        'money_loan_products.name as productName',
        'money_loan_products.description as productDescription',
        'money_loan_products.interest_rate as productInterestRate',
        'money_loan_products.min_amount as productMinAmount',
        'money_loan_products.max_amount as productMaxAmount'
      )
      .leftJoin('money_loan_products', 'money_loan_applications.loan_product_id', 'money_loan_products.id')
      .where({
        'money_loan_applications.id': applicationId,
        'money_loan_applications.customer_id': customerId,
        'money_loan_applications.tenant_id': tenantId,
      })
      .first();

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    console.log(`🔍 Found application ${applicationId} for customer ${customerId}`);

    return {
      id: application.id,
      applicationNumber: application.application_number ?? application.applicationNumber,
      status: application.status,
      requestedAmount: parseFloat(application.requested_amount ?? application.requestedAmount ?? '0'),
      requestedTermDays: application.requested_term_days ?? application.requestedTermDays,
      purpose: application.purpose,
      productName: application.productName,
      productDescription: application.productDescription,
      createdAt: application.created_at ?? application.createdAt,
      reviewedAt: application.reviewed_at ?? application.reviewedAt,
      approvedAt: application.approved_at ?? application.approvedAt,
      rejectedAt: application.rejected_at ?? application.rejectedAt,
      disbursedAt: application.disbursed_at ?? application.disbursedAt,
      reviewedBy: application.reviewed_by ?? application.reviewedBy,
      rejectionReason: application.rejection_reason ?? application.rejectionReason,
    };
  }

  async getLoanDetails(userId: number, loanId: number) {
    const knex = this.knexService.instance;

    // Resolve user → customer relationship
    const userWithCustomer = await knex('users')
      .select('users.tenant_id', 'customers.id as customer_id')
      .leftJoin('customers', 'users.id', 'customers.user_id')
      .where({ 'users.id': userId })
      .first();

    if (!userWithCustomer) {
      throw new NotFoundException('User not found');
    }

    const mainCustomerId = userWithCustomer.customerId;
    
    if (!mainCustomerId) {
      throw new NotFoundException('Customer record not found for this user');
    }

    const tenantId = userWithCustomer.tenantId;

    // Get loan details with product information
    const loan = await knex('money_loan_loans')
      .select(
        'money_loan_loans.*',
        'money_loan_products.name as productName',
        'money_loan_products.interest_rate as productInterestRate',
        'money_loan_products.interest_type as productInterestType',
        'money_loan_products.description as productDescription',
        'money_loan_products.min_amount as productMinAmount',
        'money_loan_products.max_amount as productMaxAmount'
      )
      .leftJoin('money_loan_products', 'money_loan_loans.loan_product_id', 'money_loan_products.id')
      .where({
        'money_loan_loans.id': loanId,
        'money_loan_loans.customer_id': mainCustomerId,
        'money_loan_loans.tenant_id': tenantId,
      })
      .first();

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    console.log(`🔍 Found loan ${loanId} for customer ${mainCustomerId}`);

    // Get payment history
    const payments = await knex('money_loan_payments')
      .where({
        'loan_id': loanId,
        'tenant_id': tenantId,
      })
      .orderBy('payment_date', 'desc');

    console.log(`� Payment history query result: ${payments.length} records`);

    // Generate repayment schedule dynamically (same logic as MoneyLoanService)
    const paymentFrequency = loan.payment_frequency || loan.paymentFrequency || 'weekly';
    const termDays = loan.term_days || loan.termDays || 30;
    const disbursementDateValue = loan.disbursement_date || loan.disbursementDate;
    const disbursementDate = disbursementDateValue ? new Date(disbursementDateValue) : new Date();
    
    // Calculate number of installments based on frequency
    let numberOfInstallments = 1;
    let daysBetweenPayments = termDays;
    
    if (paymentFrequency === 'daily') {
      numberOfInstallments = termDays;
      daysBetweenPayments = 1;
    } else if (paymentFrequency === 'weekly') {
      numberOfInstallments = Math.ceil(termDays / 7);
      daysBetweenPayments = 7;
    } else if (paymentFrequency === 'monthly') {
      numberOfInstallments = Math.ceil(termDays / 30);
      daysBetweenPayments = 30;
    }

    // Calculate total amount to be repaid (principal + interest)
    const principalAmount = parseFloat(loan.principal_amount || loan.principalAmount || '0');
    const totalInterest = parseFloat(loan.total_interest || loan.totalInterest || '0');
    const totalAmount = parseFloat(loan.total_amount || loan.totalAmount || '0') || (principalAmount + totalInterest);
    const amountPerInstallment = totalAmount / numberOfInstallments;

    console.log(`📅 Schedule calculation: ${numberOfInstallments} ${paymentFrequency} installments, ${amountPerInstallment} each`);

    // Calculate total paid from payments
    let totalPaid = 0;
    for (const payment of payments) {
      totalPaid += parseFloat(payment.amount || '0');
    }

    console.log(`💰 Total paid from ${payments.length} payments: ${totalPaid}`);

    // Generate installment schedule
    const scheduleData = [];
    for (let i = 1; i <= numberOfInstallments; i++) {
      const dueDate = new Date(disbursementDate);
      dueDate.setDate(dueDate.getDate() + (i * daysBetweenPayments));

      // Calculate how much of this installment has been paid
      const previousInstallmentsTotal = (i - 1) * amountPerInstallment;
      const thisInstallmentEnd = i * amountPerInstallment;
      
      let amountPaidForThisInstallment = 0;
      let status = 'pending';
      
      if (totalPaid >= thisInstallmentEnd) {
        amountPaidForThisInstallment = amountPerInstallment;
        status = 'paid';
      } else if (totalPaid > previousInstallmentsTotal) {
        amountPaidForThisInstallment = totalPaid - previousInstallmentsTotal;
        status = 'partial';
      }

      // Check if overdue
      const today = new Date();
      if (status !== 'paid' && dueDate < today) {
        status = 'overdue';
      }

      const principalForInstallment = principalAmount / numberOfInstallments;
      const interestForInstallment = totalInterest / numberOfInstallments;
      const outstandingForInstallment = amountPerInstallment - amountPaidForThisInstallment;

      scheduleData.push({
        id: i,
        installment_number: i,
        due_date: dueDate,
        principal_amount: Math.round(principalForInstallment * 100) / 100,
        interest_amount: Math.round(interestForInstallment * 100) / 100,
        total_amount: Math.round(amountPerInstallment * 100) / 100,
        outstanding_amount: Math.round(outstandingForInstallment * 100) / 100,
        status: status,
      });
    }

    const outstandingBalance = parseFloat(loan.outstanding_balance ?? loan.outstandingBalance ?? 0);
    const paymentProgress = principalAmount > 0 ? Math.round((totalPaid / principalAmount) * 100) : 0;

    console.log(`💰 Loan ${loanId} - Principal: ${principalAmount}, Total Paid: ${totalPaid}, Outstanding: ${outstandingBalance}, Progress: ${paymentProgress}%`);
    console.log(`📊 Schedule count: ${scheduleData.length}, Payments count: ${payments.length}`);

    return {
      id: loan.id,
      loanNumber: loan.loan_number ?? loan.loanNumber,
      status: loan.status,
      principalAmount,
      outstandingBalance,
      totalPaid,
      paymentProgress,
      interestRate: parseFloat(loan.interest_rate ?? loan.interestRate ?? 0),
      term: loan.term_months ?? loan.termMonths ?? 12,
      disbursementDate: loan.disbursement_date ?? loan.disbursementDate,
      maturityDate: loan.maturity_date ?? loan.maturityDate,
      nextPaymentDate: loan.next_payment_date ?? loan.nextPaymentDate,
      nextPaymentAmount: parseFloat(loan.next_payment_amount ?? loan.nextPaymentAmount ?? 0),
      productName: loan.productName,
      productInterestRate: parseFloat(loan.productInterestRate ?? 0),
      productInterestType: loan.productInterestType,
      productDescription: loan.productDescription,
      productMinAmount: parseFloat(loan.productMinAmount ?? 0),
      productMaxAmount: parseFloat(loan.productMaxAmount ?? 0),
      schedule: scheduleData.map(s => ({
        id: s.id,
        installmentNumber: s.installment_number ?? s.installmentNumber,
        dueDate: s.due_date ?? s.dueDate,
        principalAmount: parseFloat(s.principal_amount ?? s.principalAmount ?? 0),
        interestAmount: parseFloat(s.interest_amount ?? s.interestAmount ?? 0),
        totalAmount: parseFloat(s.total_amount ?? s.totalAmount ?? 0),
        outstandingAmount: parseFloat(s.outstanding_amount ?? s.outstandingAmount ?? 0),
        status: s.status,
      })),
      payments: payments.map(p => ({
        id: p.id,
        paymentDate: p.payment_date ?? p.paymentDate,
        amount: parseFloat(p.amount ?? 0),
        principalPaid: parseFloat(p.principal_paid ?? p.principalPaid ?? 0),
        interestPaid: parseFloat(p.interest_paid ?? p.interestPaid ?? 0),
        paymentMethod: p.payment_method ?? p.paymentMethod,
        referenceNumber: p.reference_number ?? p.referenceNumber,
        status: p.status,
      })),
    };
  }
}
