/**
 * Shared Customers Table Migration
 * Creates a unified customers table that can be used across all products
 * (Money Loan, BNPL, Pawnshop)
 */

exports.up = function(knex) {
  return knex.schema
    // Drop the product-specific loan_customers table if it exists
    .dropTableIfExists('loan_customers')
    
    // Create shared customers table
    .createTable('customers', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').unsigned().notNullable()
        .references('id').inTable('tenants').onDelete('CASCADE');
      table.integer('user_id').unsigned()
        .references('id').inTable('users').onDelete('SET NULL')
        .comment('Optional link to user account for customer portal access');
      
      // Customer Identification
      table.string('customer_code', 50).notNullable()
        .comment('Unique customer identifier per tenant');
      table.string('customer_type', 20).defaultTo('individual')
        .comment('individual or business');
      
      // Personal Information
      table.string('first_name', 100).notNullable();
      table.string('middle_name', 100);
      table.string('last_name', 100).notNullable();
      table.string('suffix', 20);
      table.date('date_of_birth');
      table.enum('gender', ['male', 'female', 'other']);
      table.string('nationality', 100);
      table.enum('civil_status', ['single', 'married', 'widowed', 'separated', 'divorced']);
      
      // Contact Information
      table.string('email', 255);
      table.string('phone', 50).notNullable();
      table.string('alternate_phone', 50);
      
      // NOTE: Address information moved to unified 'addresses' table
      // Use polymorphic relationship: addressable_type='customer', addressable_id=customer.id
      
      // Identification Documents
      table.string('id_type', 50)
        .comment('e.g., passport, drivers_license, national_id, sss, umid');
      table.string('id_number', 100);
      table.date('id_expiry_date');
      table.string('tin_number', 50)
        .comment('Tax Identification Number');
      table.string('sss_number', 50)
        .comment('Social Security System Number');
      
      // Employment Information
      table.string('employment_status', 50)
        .comment('employed, self-employed, unemployed, retired, student');
      table.string('employer_name', 200);
      table.string('employer_address', 500);
      table.string('employer_phone', 50);
      table.string('occupation', 100);
      table.decimal('monthly_income', 15, 2);
      table.string('source_of_income', 100);
      table.integer('years_employed');
      
      // Business Information (for business customers)
      table.string('business_name', 200);
      table.string('business_type', 100);
      table.string('business_registration_number', 100);
      table.decimal('annual_revenue', 15, 2);
      
      // Financial Information
      table.integer('credit_score').defaultTo(650)
        .comment('Credit score from 300-850');
      table.enum('risk_level', ['low', 'medium', 'high']).defaultTo('medium');
      table.decimal('total_debt', 15, 2).defaultTo(0);
      table.boolean('has_existing_loans').defaultTo(false);
      
      // KYC (Know Your Customer) Status
      table.enum('kyc_status', ['pending', 'verified', 'rejected', 'expired']).defaultTo('pending');
      table.timestamp('kyc_verified_at');
      table.integer('kyc_verified_by').unsigned()
        .references('id').inTable('users').onDelete('SET NULL');
      table.text('kyc_notes');
      table.date('kyc_expiry_date');
      
      // Customer Status
      table.enum('status', ['active', 'inactive', 'suspended', 'blacklisted', 'deceased']).defaultTo('active');
      table.text('status_reason');
      
      // Product Access Flags
      table.boolean('money_loan_approved').defaultTo(false)
        .comment('Approved to use Money Loan product');
      table.boolean('bnpl_approved').defaultTo(false)
        .comment('Approved to use BNPL product');
      table.boolean('pawnshop_approved').defaultTo(false)
        .comment('Approved to use Pawnshop product');
      
      // Emergency Contact
      table.string('emergency_contact_name', 200);
      table.string('emergency_contact_relationship', 50);
      table.string('emergency_contact_phone', 50);
      
      // Reference Information
      table.string('reference_name', 200);
      table.string('reference_phone', 50);
      table.string('reference_relationship', 50);
      
      // Customer Preferences
      table.string('preferred_language', 10).defaultTo('en');
      table.string('preferred_contact_method', 20).defaultTo('sms')
        .comment('sms, email, call, whatsapp');
      
      // Metadata
      table.jsonb('metadata').defaultTo('{}')
        .comment('Additional flexible data storage');
      table.text('notes')
        .comment('Internal notes about the customer');
      
      // Audit Fields
      table.integer('created_by').unsigned()
        .references('id').inTable('users').onDelete('SET NULL');
      table.integer('updated_by').unsigned()
        .references('id').inTable('users').onDelete('SET NULL');
      table.timestamps(true, true);
      
      // Indexes
      table.unique(['tenant_id', 'customer_code']);
      table.unique(['tenant_id', 'email']);
      table.index(['tenant_id', 'status']);
      table.index(['tenant_id', 'kyc_status']);
      table.index(['tenant_id', 'phone']);
      table.index('credit_score');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('customers')
    // Recreate loan_customers if needed for rollback
    .createTable('loan_customers', (table) => {
      table.increments('id').primary();
      table.integer('tenant_id').unsigned().notNullable()
        .references('id').inTable('tenants').onDelete('CASCADE');
      table.string('customer_code', 50).notNullable();
      table.string('first_name', 100).notNullable();
      table.string('middle_name', 100);
      table.string('last_name', 100).notNullable();
      table.date('date_of_birth');
      table.enum('gender', ['male', 'female', 'other']);
      table.string('email', 255);
      table.string('phone', 50).notNullable();
      table.text('address');
      table.string('city', 100);
      table.string('state', 100);
      table.string('zip_code', 20);
      table.string('country', 100).defaultTo('Philippines');
      table.string('id_type', 50);
      table.string('id_number', 100);
      table.string('employment_status', 50);
      table.string('employer_name', 200);
      table.decimal('monthly_income', 15, 2);
      table.integer('credit_score').defaultTo(0);
      table.enum('risk_level', ['low', 'medium', 'high']).defaultTo('medium');
      table.enum('status', ['active', 'suspended', 'blacklisted']).defaultTo('active');
      table.enum('kyc_status', ['pending', 'verified', 'rejected']).defaultTo('pending');
      table.timestamp('kyc_verified_at');
      table.text('kyc_notes');
      table.jsonb('metadata');
      table.timestamps(true, true);
      table.unique(['tenant_id', 'customer_code']);
    });
};
