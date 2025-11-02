/**
 * Create Unified Addresses Table Migration
 * Polymorphic address table for users, customers, businesses, etc.
 */

exports.up = function(knex) {
  return knex.schema
    .createTable('addresses', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').unsigned().notNullable()
        .references('id').inTable('tenants').onDelete('CASCADE')
        .comment('Tenant isolation');
      
      // Polymorphic relationship
      table.string('addressable_type', 50).notNullable()
        .comment('Type: user, customer, business, etc.');
      table.integer('addressable_id').unsigned().notNullable()
        .comment('ID of the related entity');
      
      // Address classification
      table.enum('address_type', ['home', 'work', 'billing', 'shipping', 'business', 'other'])
        .defaultTo('home')
        .comment('Type of address');
      table.string('label', 100)
        .comment('Custom label like "Main Office", "Home Address"');
      table.boolean('is_primary').defaultTo(false)
        .comment('Primary address for this type');
      
      // Philippine Address Structure
      table.string('unit_number', 50)
        .comment('Unit/Floor number');
      table.string('house_number', 50)
        .comment('House/Building number');
      table.string('street_name', 200)
        .comment('Street name');
      table.string('subdivision', 200)
        .comment('Subdivision/Village name');
      table.string('barangay', 200).notNullable()
        .comment('Barangay');
      table.string('city_municipality', 200).notNullable()
        .comment('City or Municipality');
      table.string('province', 200).notNullable()
        .comment('Province');
      table.enum('region', [
        'NCR', 'CAR', 'Region_I', 'Region_II', 'Region_III',
        'Region_IV_A', 'Region_IV_B', 'Region_V', 'Region_VI',
        'Region_VII', 'Region_VIII', 'Region_IX', 'Region_X',
        'Region_XI', 'Region_XII', 'Region_XIII', 'BARMM'
      ]).notNullable()
        .comment('Philippine region');
      table.string('zip_code', 10)
        .comment('Postal/ZIP code');
      table.string('country', 100).defaultTo('Philippines')
        .comment('Country');
      
      // Geolocation (optional)
      table.decimal('latitude', 10, 8)
        .comment('GPS latitude');
      table.decimal('longitude', 11, 8)
        .comment('GPS longitude');
      
      // Additional info
      table.string('landmark', 255)
        .comment('Nearby landmark for directions');
      table.text('delivery_instructions')
        .comment('Special delivery or location instructions');
      table.string('contact_person', 200)
        .comment('Contact person at this address');
      table.string('contact_phone', 50)
        .comment('Contact phone at this address');
      
      // Verification
      table.boolean('is_verified').defaultTo(false)
        .comment('Address has been verified');
      table.timestamp('verified_at')
        .comment('When address was verified');
      table.integer('verified_by').unsigned()
        .references('id').inTable('users').onDelete('SET NULL')
        .comment('User who verified the address');
      
      // Status
      table.enum('status', ['active', 'inactive', 'deleted']).defaultTo('active');
      
      // Audit fields
      table.integer('created_by').unsigned()
        .references('id').inTable('users').onDelete('SET NULL');
      table.integer('updated_by').unsigned()
        .references('id').inTable('users').onDelete('SET NULL');
      table.timestamps(true, true);
      table.timestamp('deleted_at');
      
      // Indexes for performance
      table.index(['tenant_id', 'addressable_type', 'addressable_id'], 'idx_addresses_polymorphic');
      table.index(['tenant_id', 'is_primary'], 'idx_addresses_primary');
      table.index(['tenant_id', 'address_type'], 'idx_addresses_type');
      table.index(['barangay'], 'idx_addresses_barangay');
      table.index(['city_municipality'], 'idx_addresses_city');
      table.index(['province'], 'idx_addresses_province');
      table.index(['region'], 'idx_addresses_region');
      table.index(['status'], 'idx_addresses_status');
    });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('addresses');
};
