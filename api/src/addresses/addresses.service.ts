import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { KnexService } from '../database/knex.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

const PH_REGIONS = [
  { code: 'NCR', name: 'National Capital Region (NCR)' },
  { code: 'CAR', name: 'Cordillera Administrative Region (CAR)' },
  { code: 'Region_I', name: 'Ilocos Region (Region I)' },
  { code: 'Region_II', name: 'Cagayan Valley (Region II)' },
  { code: 'Region_III', name: 'Central Luzon (Region III)' },
  { code: 'Region_IV_A', name: 'CALABARZON (Region IV-A)' },
  { code: 'Region_IV_B', name: 'MIMAROPA (Region IV-B)' },
  { code: 'Region_V', name: 'Bicol Region (Region V)' },
  { code: 'Region_VI', name: 'Western Visayas (Region VI)' },
  { code: 'Region_VII', name: 'Central Visayas (Region VII)' },
  { code: 'Region_VIII', name: 'Eastern Visayas (Region VIII)' },
  { code: 'Region_IX', name: 'Zamboanga Peninsula (Region IX)' },
  { code: 'Region_X', name: 'Northern Mindanao (Region X)' },
  { code: 'Region_XI', name: 'Davao Region (Region XI)' },
  { code: 'Region_XII', name: 'SOCCSKSARGEN (Region XII)' },
  { code: 'Region_XIII', name: 'Caraga Region (Region XIII)' },
  { code: 'BARMM', name: 'Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)' },
];

@Injectable()
export class AddressesService {
  constructor(private readonly knexService: KnexService) {}

  getRegions() {
    return PH_REGIONS;
  }

  async findByUser(userId: number) {
    const connection = this.knexService.instance;

    let employeeProfileId: number | null = null;
    try {
      const profile = await connection('employee_profiles')
        .select('id')
        .where({ user_id: userId })
        .whereNull('deleted_at')
        .first();

      if (profile?.id !== undefined && profile?.id !== null) {
        employeeProfileId = Number(profile.id);
      }
    } catch (error: any) {
      if (error?.code !== '42P01') {
        throw error;
      }
    }

    const rows = await this.baseQuery(connection)
      .whereNot('status', 'deleted')
      .modify((qb) => {
        qb.where((nested) => {
          nested.where({ addressable_type: 'user', addressable_id: userId });
          if (employeeProfileId) {
            nested.orWhere({ addressable_type: 'employee_profile', addressable_id: employeeProfileId });
          }
        });
      })
      .orderBy([{ column: 'is_primary', order: 'desc' }, { column: 'created_at', order: 'desc' }]);

    return rows.map((row) => this.mapAddress(row, userId)).filter((row) => !!row);
  }

  async findOne(id: number) {
    const connection = this.knexService.instance;
    const address = await this.baseQuery(connection)
      .where({ id })
      .whereNot('status', 'deleted')
      .first();

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return this.mapAddress(address, address.addressableId);
  }

  async create(dto: CreateAddressDto, actorId?: number) {
    if (!dto.userId) {
      throw new BadRequestException('userId is required to create an address');
    }

    return this.knexService.transaction(async (trx) => {
      const userContext = await this.getUserContext(dto.userId as number, trx);

      const payload: Record<string, any> = {
        tenant_id: userContext.tenantId,
        addressable_type: 'user',
        addressable_id: dto.userId,
        address_type: dto.addressType ?? 'home',
        label: dto.label ?? this.defaultLabel(dto.addressType),
        house_number: dto.houseNumber ?? null,
        unit_number: dto.unitNumber ?? null,
        subdivision: dto.subdivision ?? null,
        street_name: dto.street,
        barangay: dto.barangay,
        city_municipality: dto.cityMunicipality,
        province: dto.province,
        region: dto.region,
        zip_code: dto.zipCode ?? null,
        country: dto.country ?? 'Philippines',
        landmark: dto.landmark ?? null,
        delivery_instructions: dto.notes ?? null,
        contact_person: dto.contactName ?? null,
        contact_phone: dto.contactPhone ?? null,
        is_primary: !!dto.isPrimary,
        is_verified: !!dto.isVerified,
        status: 'active',
        created_by: actorId ?? null,
        updated_by: actorId ?? null,
      };

      if (payload.is_primary) {
        await trx('addresses')
          .where({ addressable_type: 'user', addressable_id: dto.userId })
          .update({ is_primary: false, updated_at: trx.fn.now(), updated_by: actorId ?? null });
      }

      const [inserted] = await trx('addresses').insert(payload).returning('*');

      return this.mapAddress(inserted, dto.userId);
    });
  }

  async update(id: number, dto: UpdateAddressDto, actorId?: number) {
    return this.knexService.transaction(async (trx) => {
      const existing = await this.getAddressRecord(id, trx);

      if (!existing || existing.status === 'deleted') {
        throw new NotFoundException('Address not found');
      }

      const addressableType = existing.addressableType ?? existing.addressable_type;
      const addressableId = existing.addressableId ?? existing.addressable_id;

      const updates: Record<string, any> = {};

      if (dto.addressType !== undefined) updates.address_type = dto.addressType;
      if (dto.label !== undefined) updates.label = dto.label;
      if (dto.houseNumber !== undefined) updates.house_number = dto.houseNumber;
      if (dto.unitNumber !== undefined) updates.unit_number = dto.unitNumber;
      if (dto.subdivision !== undefined) updates.subdivision = dto.subdivision;
      if (dto.street !== undefined) updates.street_name = dto.street;
      if (dto.barangay !== undefined) updates.barangay = dto.barangay;
      if (dto.cityMunicipality !== undefined) updates.city_municipality = dto.cityMunicipality;
      if (dto.province !== undefined) updates.province = dto.province;
      if (dto.region !== undefined) updates.region = dto.region;
      if (dto.zipCode !== undefined) updates.zip_code = dto.zipCode;
      if (dto.country !== undefined) updates.country = dto.country;
      if (dto.landmark !== undefined) updates.landmark = dto.landmark;
      if (dto.notes !== undefined) updates.delivery_instructions = dto.notes;
      if (dto.contactName !== undefined) updates.contact_person = dto.contactName;
      if (dto.contactPhone !== undefined) updates.contact_phone = dto.contactPhone;
      if (dto.isVerified !== undefined) {
        updates.is_verified = !!dto.isVerified;
        updates.verified_at = dto.isVerified ? trx.fn.now() : null;
        updates.verified_by = dto.isVerified ? actorId ?? null : null;
      }

      if (dto.isPrimary !== undefined) {
        await trx('addresses')
          .where({ addressable_type: addressableType, addressable_id: addressableId })
          .andWhereNot({ id })
          .update({ is_primary: false, updated_at: trx.fn.now(), updated_by: actorId ?? null });
        updates.is_primary = !!dto.isPrimary;
      }

      if (Object.keys(updates).length === 0) {
        return this.mapAddress(existing, addressableId);
      }

      updates.updated_at = trx.fn.now();
      updates.updated_by = actorId ?? null;

      await trx('addresses').where({ id }).update(updates);

      const refreshed = await this.getAddressRecord(id, trx);
      return this.mapAddress(refreshed, addressableId);
    });
  }

  async remove(id: number, actorId?: number) {
    return this.knexService.transaction(async (trx) => {
      const existing = await this.getAddressRecord(id, trx);

      if (!existing || existing.status === 'deleted') {
        throw new NotFoundException('Address not found');
      }

      await trx('addresses')
        .where({ id })
        .update({
          status: 'deleted',
          deleted_at: trx.fn.now(),
          updated_at: trx.fn.now(),
          updated_by: actorId ?? null,
        });

      return { message: 'Address deleted successfully' };
    });
  }

  async setPrimary(id: number, actorId?: number) {
    return this.knexService.transaction(async (trx) => {
      const existing = await this.getAddressRecord(id, trx);

      if (!existing || existing.status === 'deleted') {
        throw new NotFoundException('Address not found');
      }

      const addressableType = existing.addressableType ?? existing.addressable_type;
      const addressableId = existing.addressableId ?? existing.addressable_id;

      await trx('addresses')
        .where({ addressable_type: addressableType, addressable_id: addressableId })
        .update({ is_primary: false, updated_at: trx.fn.now(), updated_by: actorId ?? null });

      await trx('addresses')
        .where({ id })
        .update({
          is_primary: true,
          updated_at: trx.fn.now(),
          updated_by: actorId ?? null,
        });

      const refreshed = await this.getAddressRecord(id, trx);
      return this.mapAddress(refreshed, addressableId);
    });
  }

  async verify(id: number, actorId?: number) {
    return this.knexService.transaction(async (trx) => {
      const existing = await this.getAddressRecord(id, trx);

      if (!existing || existing.status === 'deleted') {
        throw new NotFoundException('Address not found');
      }

      await trx('addresses')
        .where({ id })
        .update({
          is_verified: true,
          verified_at: trx.fn.now(),
          verified_by: actorId ?? null,
          updated_at: trx.fn.now(),
          updated_by: actorId ?? null,
        });

      const refreshed = await this.getAddressRecord(id, trx);
      return this.mapAddress(refreshed, existing.addressable_id);
    });
  }

  async getUserContext(userId: number, connection?: Knex | Knex.Transaction) {
    const db = connection ?? this.knexService.instance;

    const user = await db('users')
      .select('id', 'tenant_id')
      .where({ id: userId })
      .first();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.tenantId) {
      throw new BadRequestException('Tenant context is required for addresses');
    }

    return user;
  }

  async getAddressRecord(id: number, connection?: Knex | Knex.Transaction) {
    const db = connection ?? this.knexService.instance;

    return this.baseQuery(db)
      .where({ id })
      .first();
  }

  private baseQuery(connection: Knex | Knex.Transaction) {
    return connection('addresses').select(
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
      'verified_by',
      'status',
      'created_by',
      'updated_by',
      'created_at',
      'updated_at',
      'deleted_at',
    ).whereNull('deleted_at');
  }

  private mapAddress(row: any, fallbackUserId?: number) {
    if (!row) {
      return null;
    }

    const streetParts = [row.houseNumber, row.streetName]
      .map((value) => (value ? `${value}`.trim() : ''))
      .filter((value) => value.length > 0);

    const street = streetParts.join(' ').trim() || row.streetName || '';

    const userId = row.addressableType === 'user'
      ? row.addressableId
      : fallbackUserId ?? row.addressableId;

    return {
      id: row.id !== undefined && row.id !== null ? String(row.id) : undefined,
      userId: userId !== undefined && userId !== null ? String(userId) : undefined,
      tenantId: row.tenantId !== undefined && row.tenantId !== null ? String(row.tenantId) : undefined,
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

  private defaultLabel(addressType?: string) {
    if (!addressType) {
      return 'Primary Address';
    }

    switch (addressType) {
      case 'home':
        return 'Home Address';
      case 'work':
        return 'Work Address';
      case 'billing':
        return 'Billing Address';
      case 'shipping':
        return 'Shipping Address';
      default:
        return 'Additional Address';
    }
  }
}
