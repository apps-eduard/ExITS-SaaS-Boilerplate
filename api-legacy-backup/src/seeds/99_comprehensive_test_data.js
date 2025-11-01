/**
 * Comprehensive Test Data Seed
 * Adds Money Loan modules and updates role permissions
 * NOTE: User creation (employees, customers) is now handled in 01_initial_data.js
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  console.log('\n🌱 Starting comprehensive test data seed...\n');

  try {
    // ==================== STEP 1: ADD MONEY LOAN MODULES ====================
    console.log('1️⃣  Adding Money Loan modules...');
    
    const moneyLoanModules = [
      { menu_key: 'moneyloan-dashboard', display_name: 'Money Loan Dashboard', space: 'tenant', icon: 'chart-bar', menu_order: 1, status: 'active' },
      { menu_key: 'moneyloan-customers', display_name: 'Customers', space: 'tenant', icon: 'users', menu_order: 2, status: 'active' },
      { menu_key: 'moneyloan-loans', display_name: 'Loans', space: 'tenant', icon: 'cash', menu_order: 3, status: 'active' },
      { menu_key: 'moneyloan-payments', display_name: 'Payments', space: 'tenant', icon: 'credit-card', menu_order: 4, status: 'active' },
      { menu_key: 'moneyloan-reports', display_name: 'Reports', space: 'tenant', icon: 'document-report', menu_order: 5, status: 'active' },
      { menu_key: 'moneyloan-settings', display_name: 'Money Loan Settings', space: 'tenant', icon: 'cog', menu_order: 6, status: 'active' },
    ];

    const insertedModules = [];
    for (const module of moneyLoanModules) {
      const existing = await knex('modules').where('menu_key', module.menu_key).first();
      if (!existing) {
        const [inserted] = await knex('modules').insert(module).returning('*');
        insertedModules.push(inserted);
        console.log(`   ✅ ${module.display_name}`);
      } else {
        insertedModules.push(existing);
        console.log(`   ℹ️  ${module.display_name} (already exists)`);
      }
    }

    // ==================== STEP 2: UPDATE ROLE PERMISSIONS ====================
    console.log('\n2️⃣  Updating role permissions...');
    
    // Get all permissions including Money Loan
    const allPermissions = await knex('permissions').select('*');
    const dashboardPerm = allPermissions.find(p => p.permissionKey === 'tenant-dashboard:view');
    const customerPerms = allPermissions.filter(p => p.resource === 'tenant-customers');
    const moneyLoanPerms = allPermissions.filter(p => p.resource === 'money-loan' || p.permissionKey.startsWith('money-loan:'));
    
    // Update Employee roles with Money Loan permissions
    const employeeRoles = await knex('roles').where({ name: 'Employee', space: 'tenant' });
    
    for (const employeeRole of employeeRoles) {
      const employeePermissions = [];
      if (dashboardPerm) employeePermissions.push(dashboardPerm);
      employeePermissions.push(...customerPerms);
      employeePermissions.push(...moneyLoanPerms);
      
      if (employeePermissions.length > 0) {
        // Clear existing and re-assign
        await knex('role_permissions').where('role_id', employeeRole.id).del();
        
        const employeeRolePermissions = employeePermissions.map(perm => ({
          role_id: employeeRole.id,
          permission_id: perm.id
        }));
        await knex('role_permissions').insert(employeeRolePermissions);
        console.log(`   ✅ Employee role (tenant_id: ${employeeRole.tenant_id}): ${employeePermissions.length} permissions`);
        console.log(`      • Dashboard: ${dashboardPerm ? 1 : 0}, Customers: ${customerPerms.length}, Money Loan: ${moneyLoanPerms.length}`);
      }
    }

    // ==================== SUMMARY ====================
    console.log('\n✅ Comprehensive test data seed completed!\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📝 SEED SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`   • Money Loan Modules: ${insertedModules.length}`);
    console.log(`   • Employee Roles Updated: ${employeeRoles.length}`);
    console.log('   • Users: Created in 01_initial_data.js');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    throw error;
  }
};
