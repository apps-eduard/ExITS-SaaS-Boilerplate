const knex = require('./src/config/knex');

async function checkEmployeeTables() {
  try {
    console.log('🔍 Checking employee_profiles table...\n');
    
    // Check if table exists
    const hasEmployeeProfiles = await knex.schema.hasTable('employee_profiles');
    const hasEmployeeProductAccess = await knex.schema.hasTable('employee_product_access');
    
    console.log('✓ employee_profiles table exists:', hasEmployeeProfiles);
    console.log('✓ employee_product_access table exists:', hasEmployeeProductAccess);
    
    if (hasEmployeeProfiles) {
      // Get column info
      const columns = await knex('employee_profiles').columnInfo();
      console.log('\n📋 employee_profiles columns:');
      Object.keys(columns).forEach(col => {
        console.log(`  - ${col}: ${columns[col].type}`);
      });
      
      // Check constraints
      const indexes = await knex.raw(`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'employee_profiles'
      `);
      console.log('\n🔑 employee_profiles indexes:');
      indexes.rows.forEach(idx => {
        console.log(`  - ${idx.indexname}`);
      });
    }
    
    if (hasEmployeeProductAccess) {
      // Get column info
      const columns = await knex('employee_product_access').columnInfo();
      console.log('\n📋 employee_product_access columns:');
      Object.keys(columns).forEach(col => {
        console.log(`  - ${col}: ${columns[col].type}`);
      });
      
      // Check enums
      const enums = await knex.raw(`
        SELECT t.typname, e.enumlabel
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname IN ('product_type', 'access_level', 'product_access_status', 'employment_type', 'employment_status')
        ORDER BY t.typname, e.enumsortorder
      `);
      
      console.log('\n🎯 Enum types:');
      const grouped = {};
      enums.rows.forEach(row => {
        if (!grouped[row.typname]) grouped[row.typname] = [];
        grouped[row.typname].push(row.enumlabel);
      });
      Object.keys(grouped).forEach(typname => {
        console.log(`  ${typname}: ${grouped[typname].join(', ')}`);
      });
    }
    
    console.log('\n✅ Employee tables verification complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await knex.destroy();
  }
}

checkEmployeeTables();
