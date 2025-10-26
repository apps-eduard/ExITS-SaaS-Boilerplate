const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  console.log('🌱 Starting comprehensive seed...\n');

  // Clean up existing data (but preserve permissions from migrations)
  await knex('role_permissions').del();
  await knex('user_roles').del();
  // Note: NOT deleting permissions - they come from migrations
  await knex('users').del();
  await knex('roles').del();
  await knex('modules').del();
  await knex('tenants').del();

  // 1. Create tenants
  console.log('1. Creating tenants...');
  const tenants = await knex('tenants').insert([
    {
      name: 'ExITS Platform',
      subdomain: 'exits-platform',
      plan: 'enterprise',
      status: 'active',
      max_users: 1000,
      contact_person: 'System Admin',
      contact_email: 'admin@exits-platform.com',
      contact_phone: '+63-917-123-4567',
      money_loan_enabled: false,
      bnpl_enabled: false,
      pawnshop_enabled: false
    },
    {
      name: 'ACME Corporation',
      subdomain: 'acme',
      plan: 'pro',
      status: 'active',
      max_users: 100,
      contact_person: 'John Doe',
      contact_email: 'john.doe@acme.com',
      contact_phone: '+63-917-123-4567',
      money_loan_enabled: false,
      bnpl_enabled: false,
      pawnshop_enabled: false
    }
  ]).returning(['id', 'name']);
  console.log(`✅ ${tenants.length} tenants created`);

  // 2. Create modules
  console.log('2. Creating modules...');
  const modules = await knex('modules').insert([
    { menu_key: 'dashboard', display_name: 'Dashboard', icon: 'dashboard', space: 'tenant', menu_order: 1, status: 'active' },
    { menu_key: 'users', display_name: 'User Management', icon: 'people', space: 'tenant', menu_order: 2, status: 'active' },
    { menu_key: 'roles', display_name: 'Roles & Permissions', icon: 'shield-check', space: 'tenant', menu_order: 3, status: 'active' },
    { menu_key: 'tenant-products', display_name: 'Products', icon: 'cube', space: 'tenant', menu_order: 4, status: 'active' },
    { menu_key: 'tenants', display_name: 'Tenants', icon: 'office-building', space: 'system', menu_order: 5, status: 'active' },
    { menu_key: 'permissions', display_name: 'Permissions', icon: 'key', space: 'system', menu_order: 6, status: 'active' },
    { menu_key: 'audit', display_name: 'Audit Logs', icon: 'document-text', space: 'tenant', menu_order: 7, status: 'active' },
    { menu_key: 'settings', display_name: 'Settings', icon: 'cog', space: 'tenant', menu_order: 8, status: 'active' }
  ]).returning(['id', 'menu_key']);
  console.log(`✅ ${modules.length} modules created`);

  // 3. Create comprehensive permissions (only if they don't exist from migrations)
  console.log('3. Creating comprehensive permissions...');
  
  // First check if permissions already exist from migrations
  const existingPermissions = await knex('permissions').select('permission_key');
  const existingKeys = existingPermissions.map(p => p.permission_key);
  
  const permissionsToAdd = [
    // System permissions
    { permission_key: 'dashboard:view', resource: 'dashboard', action: 'view', description: 'System dashboard access', space: 'system' },
    
    { permission_key: 'tenants:create', resource: 'tenants', action: 'create', description: 'Create tenants', space: 'system' },
    { permission_key: 'tenants:read', resource: 'tenants', action: 'read', description: 'View tenants', space: 'system' },
    { permission_key: 'tenants:update', resource: 'tenants', action: 'update', description: 'Edit tenants', space: 'system' },
    { permission_key: 'tenants:delete', resource: 'tenants', action: 'delete', description: 'Delete tenants', space: 'system' },
    { permission_key: 'tenants:manage-subscriptions', resource: 'tenants', action: 'manage-subscriptions', description: 'Manage tenant subscriptions', space: 'system' },
    
    // System modules permissions
    { permission_key: 'modules:create', resource: 'modules', action: 'create', description: 'Create modules', space: 'system' },
    { permission_key: 'modules:read', resource: 'modules', action: 'read', description: 'View modules', space: 'system' },
    { permission_key: 'modules:update', resource: 'modules', action: 'update', description: 'Edit modules', space: 'system' },
    { permission_key: 'modules:delete', resource: 'modules', action: 'delete', description: 'Delete modules', space: 'system' },
    
    // System permissions management
    { permission_key: 'permissions:create', resource: 'permissions', action: 'create', description: 'Create permissions', space: 'system' },
    { permission_key: 'permissions:read', resource: 'permissions', action: 'read', description: 'View permissions', space: 'system' },
    { permission_key: 'permissions:update', resource: 'permissions', action: 'update', description: 'Edit permissions', space: 'system' },
    { permission_key: 'permissions:delete', resource: 'permissions', action: 'delete', description: 'Delete permissions', space: 'system' },
    
    // Platform management (System Level)
    { permission_key: 'platforms:create', resource: 'platforms', action: 'create', description: 'Create new platforms', space: 'system' },
    { permission_key: 'platforms:read', resource: 'platforms', action: 'read', description: 'View platforms', space: 'system' },
    { permission_key: 'platforms:update', resource: 'platforms', action: 'update', description: 'Edit platform details', space: 'system' },
    { permission_key: 'platforms:delete', resource: 'platforms', action: 'delete', description: 'Delete platforms', space: 'system' },
    { permission_key: 'platforms:manage-catalog', resource: 'platforms', action: 'manage-catalog', description: 'Manage platform catalog', space: 'system' },
    
    // Subscriptions Management (System Level)
    { permission_key: 'subscriptions:create', resource: 'subscriptions', action: 'create', description: 'Create new subscriptions', space: 'system' },
    { permission_key: 'subscriptions:read', resource: 'subscriptions', action: 'read', description: 'View subscriptions', space: 'system' },
    { permission_key: 'subscriptions:update', resource: 'subscriptions', action: 'update', description: 'Edit subscription details', space: 'system' },
    { permission_key: 'subscriptions:delete', resource: 'subscriptions', action: 'delete', description: 'Delete subscriptions', space: 'system' },
    { permission_key: 'subscriptions:manage-plans', resource: 'subscriptions', action: 'manage-plans', description: 'Manage subscription plans', space: 'system' },
    
    // System Reports & Analytics
    { permission_key: 'reports:view', resource: 'reports', action: 'view', description: 'View system reports', space: 'system' },
    { permission_key: 'reports:export', resource: 'reports', action: 'export', description: 'Export reports', space: 'system' },
    { permission_key: 'reports:tenant-usage', resource: 'reports', action: 'tenant-usage', description: 'View tenant usage reports', space: 'system' },
    { permission_key: 'reports:revenue', resource: 'reports', action: 'revenue', description: 'View revenue reports', space: 'system' },
    { permission_key: 'analytics:view', resource: 'analytics', action: 'view', description: 'View analytics dashboard', space: 'system' },
    
    // System Recycle Bin
    { permission_key: 'recycle-bin:view', resource: 'recycle-bin', action: 'view', description: 'View recycle bin', space: 'system' },
    { permission_key: 'recycle-bin:restore', resource: 'recycle-bin', action: 'restore', description: 'Restore deleted items', space: 'system' },
    { permission_key: 'recycle-bin:permanent-delete', resource: 'recycle-bin', action: 'permanent-delete', description: 'Permanently delete items', space: 'system' },
    
    // System Settings & Configuration
    { permission_key: 'settings:read', resource: 'settings', action: 'read', description: 'View system settings', space: 'system' },
    { permission_key: 'settings:update', resource: 'settings', action: 'update', description: 'Edit system settings', space: 'system' },
    
    // System Audit Logs
    { permission_key: 'audit:read', resource: 'audit', action: 'read', description: 'View system audit logs', space: 'system' },
    { permission_key: 'audit:export', resource: 'audit', action: 'export', description: 'Export system audit logs', space: 'system' },
    
    // System-level User Management (for Super Admin to manage all users)
    { permission_key: 'users:create', resource: 'users', action: 'create', description: 'Create users (system-wide)', space: 'system' },
    { permission_key: 'users:read', resource: 'users', action: 'read', description: 'View users (system-wide)', space: 'system' },
    { permission_key: 'users:update', resource: 'users', action: 'update', description: 'Edit users (system-wide)', space: 'system' },
    { permission_key: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users (system-wide)', space: 'system' },
    { permission_key: 'users:export', resource: 'users', action: 'export', description: 'Export user data (system-wide)', space: 'system' },
    
    // Tenant-scoped permissions (kept with tenant prefix to avoid conflicts)
    { permission_key: 'tenant-users:create', resource: 'tenant-users', action: 'create', description: 'Create users within tenant', space: 'tenant' },
    { permission_key: 'tenant-users:read', resource: 'tenant-users', action: 'read', description: 'View users within tenant', space: 'tenant' },
    { permission_key: 'tenant-users:update', resource: 'tenant-users', action: 'update', description: 'Edit users within tenant', space: 'tenant' },
    { permission_key: 'tenant-users:delete', resource: 'tenant-users', action: 'delete', description: 'Delete users within tenant', space: 'tenant' },
    { permission_key: 'tenant-users:export', resource: 'tenant-users', action: 'export', description: 'Export tenant user data', space: 'tenant' },
    
    // System-level Role Management  
    { permission_key: 'roles:create', resource: 'roles', action: 'create', description: 'Create roles (system-wide)', space: 'system' },
    { permission_key: 'roles:read', resource: 'roles', action: 'read', description: 'View roles (system-wide)', space: 'system' },
    { permission_key: 'roles:update', resource: 'roles', action: 'update', description: 'Edit roles (system-wide)', space: 'system' },
    { permission_key: 'roles:delete', resource: 'roles', action: 'delete', description: 'Delete roles (system-wide)', space: 'system' },
    
    // Tenant-scoped role permissions
    { permission_key: 'tenant-roles:create', resource: 'tenant-roles', action: 'create', description: 'Create roles within tenant', space: 'tenant' },
    { permission_key: 'tenant-roles:read', resource: 'tenant-roles', action: 'read', description: 'View roles within tenant', space: 'tenant' },
    { permission_key: 'tenant-roles:update', resource: 'tenant-roles', action: 'update', description: 'Edit roles within tenant', space: 'tenant' },
    { permission_key: 'tenant-roles:delete', resource: 'tenant-roles', action: 'delete', description: 'Delete roles within tenant', space: 'tenant' },
    
    { permission_key: 'tenant-audit:read', resource: 'tenant-audit', action: 'read', description: 'View tenant audit logs', space: 'tenant' },
    { permission_key: 'tenant-audit:export', resource: 'tenant-audit', action: 'export', description: 'Export tenant audit logs', space: 'tenant' },
    
    { permission_key: 'tenant-settings:read', resource: 'tenant-settings', action: 'read', description: 'View tenant settings', space: 'tenant' },
    { permission_key: 'tenant-settings:update', resource: 'tenant-settings', action: 'update', description: 'Edit tenant settings', space: 'tenant' },
    
    // Tenant Platforms (Tenant Level)
    { permission_key: 'tenant-platforms:read', resource: 'tenant-platforms', action: 'read', description: 'View tenant platform catalog', space: 'tenant' },
    { permission_key: 'tenant-platforms:configure', resource: 'tenant-platforms', action: 'configure', description: 'Configure tenant platforms', space: 'tenant' },
    { permission_key: 'tenant-platforms:manage-settings', resource: 'tenant-platforms', action: 'manage-settings', description: 'Manage platform settings/features', space: 'tenant' },
    
    // Tenant Billing
    { permission_key: 'tenant-billing:read', resource: 'tenant-billing', action: 'read', description: 'View tenant billing information', space: 'tenant' },
    { permission_key: 'tenant-billing:view-subscriptions', resource: 'tenant-billing', action: 'view-subscriptions', description: 'View tenant subscriptions', space: 'tenant' },
    { permission_key: 'tenant-billing:view-invoices', resource: 'tenant-billing', action: 'view-invoices', description: 'View tenant invoices', space: 'tenant' },
    { permission_key: 'tenant-billing:manage-renewals', resource: 'tenant-billing', action: 'manage-renewals', description: 'Manage subscription renewals', space: 'tenant' },
    { permission_key: 'tenant-billing:view-overview', resource: 'tenant-billing', action: 'view-overview', description: 'View billing overview', space: 'tenant' },
    
    // Tenant Reports
    { permission_key: 'tenant-reports:view', resource: 'tenant-reports', action: 'view', description: 'View tenant reports', space: 'tenant' },
    { permission_key: 'tenant-reports:product-usage', resource: 'tenant-reports', action: 'product-usage', description: 'View product usage reports', space: 'tenant' },
    { permission_key: 'tenant-reports:user-activity', resource: 'tenant-reports', action: 'user-activity', description: 'View user activity reports', space: 'tenant' },
    { permission_key: 'tenant-reports:billing-summary', resource: 'tenant-reports', action: 'billing-summary', description: 'View billing/payment summary', space: 'tenant' },
    { permission_key: 'tenant-reports:transactions', resource: 'tenant-reports', action: 'transactions', description: 'View transaction history', space: 'tenant' },
    { permission_key: 'tenant-reports:export', resource: 'tenant-reports', action: 'export', description: 'Export tenant reports', space: 'tenant' },
    
    // Tenant Recycle Bin
    { permission_key: 'tenant-recycle-bin:view', resource: 'tenant-recycle-bin', action: 'view', description: 'View tenant recycle bin', space: 'tenant' },
    { permission_key: 'tenant-recycle-bin:restore', resource: 'tenant-recycle-bin', action: 'restore', description: 'Restore deleted tenant items', space: 'tenant' },
    { permission_key: 'tenant-recycle-bin:view-history', resource: 'tenant-recycle-bin', action: 'view-history', description: 'View recovery history', space: 'tenant' },
    
    // Money Loan permissions (Tenant Level)
    { permission_key: 'money-loan:read', resource: 'money-loan', action: 'read', description: 'View loan information', space: 'tenant' },
    { permission_key: 'money-loan:create', resource: 'money-loan', action: 'create', description: 'Create new loans', space: 'tenant' },
    { permission_key: 'money-loan:update', resource: 'money-loan', action: 'update', description: 'Update loan details', space: 'tenant' },
    { permission_key: 'money-loan:approve', resource: 'money-loan', action: 'approve', description: 'Approve/reject loans', space: 'tenant' },
    { permission_key: 'money-loan:payments', resource: 'money-loan', action: 'payments', description: 'Manage loan payments', space: 'tenant' },
    
    // BNPL permissions (Tenant Level)
    { permission_key: 'bnpl:read', resource: 'bnpl', action: 'read', description: 'View BNPL information', space: 'tenant' },
    { permission_key: 'bnpl:create', resource: 'bnpl', action: 'create', description: 'Create BNPL plans', space: 'tenant' },
    { permission_key: 'bnpl:update', resource: 'bnpl', action: 'update', description: 'Update BNPL plans', space: 'tenant' },
    { permission_key: 'bnpl:manage', resource: 'bnpl', action: 'manage', description: 'Manage BNPL transactions', space: 'tenant' },
    
    // Pawnshop permissions (Tenant Level)
    { permission_key: 'pawnshop:read', resource: 'pawnshop', action: 'read', description: 'View pawnshop information', space: 'tenant' },
    { permission_key: 'pawnshop:create', resource: 'pawnshop', action: 'create', description: 'Create pawn tickets', space: 'tenant' },
    { permission_key: 'pawnshop:update', resource: 'pawnshop', action: 'update', description: 'Update pawn details', space: 'tenant' },
    { permission_key: 'pawnshop:manage', resource: 'pawnshop', action: 'manage', description: 'Manage pawnshop operations', space: 'tenant' },
    
    // Additional missing permissions that were added via migrations/fixes
    { permission_key: 'loans:read', resource: 'loans', action: 'read', description: 'View loan information', space: 'system' },
    { permission_key: 'loans:create', resource: 'loans', action: 'create', description: 'Create new loans', space: 'system' },
    { permission_key: 'loans:update', resource: 'loans', action: 'update', description: 'Update loan details', space: 'system' },
    { permission_key: 'loans:delete', resource: 'loans', action: 'delete', description: 'Delete loans', space: 'system' },
    { permission_key: 'loans:approve', resource: 'loans', action: 'approve', description: 'Approve/reject loans', space: 'system' },
    { permission_key: 'loans:disburse', resource: 'loans', action: 'disburse', description: 'Disburse loan amounts', space: 'system' },
    
    { permission_key: 'payments:create', resource: 'payments', action: 'create', description: 'Create payments', space: 'system' },
    { permission_key: 'payments:read', resource: 'payments', action: 'read', description: 'View payments', space: 'system' },
    { permission_key: 'payments:update', resource: 'payments', action: 'update', description: 'Update payments', space: 'system' },
    { permission_key: 'payments:delete', resource: 'payments', action: 'delete', description: 'Delete payments', space: 'system' },
    
    // Tenant-level user management (additional permissions) - kept for backward compatibility
    { permission_key: 'tenant-users:invite', resource: 'tenant-users', action: 'invite', description: 'Invite new users', space: 'tenant' },
    { permission_key: 'tenant-users:assign-roles', resource: 'tenant-users', action: 'assign-roles', description: 'Assign roles to users', space: 'tenant' },
    
    // Tenant-level settings (additional permissions) - duplicate removed above
    
    // Tenant dashboard (additional permission)
    { permission_key: 'tenant-dashboard:view', resource: 'tenant-dashboard', action: 'view', description: 'View tenant dashboard', space: 'tenant' }
  ];
  
  // Filter out permissions that already exist from migrations
  const newPermissions = permissionsToAdd.filter(p => !existingKeys.includes(p.permission_key));
  
  let permissions = [];
  if (newPermissions.length > 0) {
    permissions = await knex('permissions').insert(newPermissions).returning(['id', 'permission_key']);
    console.log(`✅ ${newPermissions.length} new permissions created (${existingKeys.length} already existed from migrations)`);
  } else {
    // Get all existing permissions for role assignment
    permissions = await knex('permissions').select(['id', 'permission_key']);
    console.log(`✅ Using ${permissions.length} existing permissions from migrations`);
  }

  // 4. Create roles
  console.log('4. Creating roles...');
  
  // System Administrator role
  const [systemAdminRole] = await knex('roles').insert({
    tenant_id: null,
    name: 'Super Admin',
    description: 'Full system access',
    space: 'system',
    status: 'active'
  }).returning(['id', 'name']);
  
  // Tenant Administrator role for each tenant
  const tenantAdminRoles = [];
  for (const tenant of tenants) {
    const [tenantAdminRole] = await knex('roles').insert({
      tenant_id: tenant.id,
      name: 'Tenant Admin',
      description: 'Full access within tenant scope',
      space: 'tenant',
      status: 'active'
    }).returning(['id', 'name', 'tenant_id']);
    tenantAdminRoles.push(tenantAdminRole);
  }
  console.log(`✅ 1 system role + ${tenantAdminRoles.length} tenant roles created`);

  // 5. Create users
  console.log('5. Creating users...');
  const passwordHash = await bcrypt.hash('Admin@123', 10);
  
  // System admin
  const [systemAdmin] = await knex('users').insert({
    tenant_id: null,
    email: 'admin@exitsaas.com',
    password_hash: passwordHash,
    first_name: 'System',
    last_name: 'Administrator',
    status: 'active',
    email_verified: true
  }).returning(['id', 'email']);
  
  // Tenant admins
  const tenantAdmins = [];
  for (let i = 0; i < tenants.length; i++) {
    const [tenantAdmin] = await knex('users').insert({
      tenant_id: tenants[i].id,
      email: `admin-${i+1}@example.com`,
      password_hash: passwordHash,
      first_name: 'Tenant',
      last_name: 'Admin',
      status: 'active',
      email_verified: true
    }).returning(['id', 'email', 'tenant_id']);
    tenantAdmins.push(tenantAdmin);
  }
  console.log(`✅ 1 system user + ${tenantAdmins.length} tenant users created`);

  // 6. Assign roles to users
  console.log('6. Assigning roles to users...');
  
  // Assign Super Admin role to system admin
  await knex('user_roles').insert({
    user_id: systemAdmin.id,
    role_id: systemAdminRole.id
  });
  
  // Assign Tenant Admin roles to tenant admins
  for (let i = 0; i < tenantAdmins.length; i++) {
    await knex('user_roles').insert({
      user_id: tenantAdmins[i].id,
      role_id: tenantAdminRoles[i].id
    });
  }
  console.log(`✅ All users assigned appropriate roles`);

  // 7. Grant permissions to roles (CRITICAL: Must be after all permissions are created)
  console.log('7. Granting permissions to roles...');
  
  // IMPORTANT: Re-fetch ALL permissions to ensure we have the complete data
  const allPermissions = await knex('permissions').select('*');
  console.log(`   • Found ${allPermissions.length} total permissions`);
  
  // CRITICAL: Separate permissions by space
  const systemPermissions = allPermissions.filter(p => p.space === 'system');
  const tenantPermissions = allPermissions.filter(p => p.space === 'tenant');
  console.log(`   • System permissions: ${systemPermissions.length}`);
  console.log(`   • Tenant permissions: ${tenantPermissions.length}`);
  
  // Grant ONLY system permissions to Super Admin
  if (systemPermissions.length > 0) {
    // First clear any existing permissions for Super Admin to avoid duplicates
    await knex('role_permissions').where('role_id', systemAdminRole.id).del();
    
    const systemRolePermissions = systemPermissions.map(perm => ({
      role_id: systemAdminRole.id,
      permission_id: perm.id
    }));
    await knex('role_permissions').insert(systemRolePermissions);
    console.log(`   ✅ Granted ${systemRolePermissions.length} SYSTEM permissions to Super Admin`);
  }
  
  // Grant ONLY tenant permissions to Tenant Admins
  for (const tenantAdminRole of tenantAdminRoles) {
    if (tenantPermissions.length > 0) {
      // Clear existing permissions for this role to avoid duplicates
      await knex('role_permissions').where('role_id', tenantAdminRole.id).del();
      
      const tenantRolePermissions = tenantPermissions.map(perm => ({
        role_id: tenantAdminRole.id,
        permission_id: perm.id
      }));
      await knex('role_permissions').insert(tenantRolePermissions);
      console.log(`   ✅ Granted ${tenantRolePermissions.length} TENANT permissions to Tenant Admin (tenant_id: ${tenantAdminRole.tenant_id})`);
    }
  }
  console.log(`✅ All roles granted appropriate permissions (space-separated)`);

  console.log('\n✨ Seed completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`   • ${tenants.length} tenants`);
  console.log(`   • ${modules.length} modules`);
  console.log(`   • ${allPermissions.length} comprehensive permissions`);
  console.log(`   • ${1 + tenantAdminRoles.length} roles (1 system + ${tenantAdminRoles.length} tenant)`);
  console.log(`   • ${1 + tenantAdmins.length} users (1 system + ${tenantAdmins.length} tenant)`);
  
  console.log('\n🔐 Permission Assignments:');
  console.log(`   • Super Admin: ${systemPermissions.length} system permissions (100%)`);
  console.log(`   • Tenant Admin(s): ${tenantPermissions.length} tenant permissions each (100%)`);
  console.log(`   • Total System Permissions: ${systemPermissions.length}`);
  console.log(`   • Total Tenant Permissions: ${tenantPermissions.length}`);
  
  console.log('\n📦 Permission Breakdown:');
  console.log('   • User Management, Roles & Permissions');
  console.log('   • Product Management (Money Loan, BNPL, Pawnshop)');
  console.log('   • Subscription & Billing Management');
  console.log('   • Reports & Analytics (System & Tenant)');
  console.log('   • Tenant Billing, Reports, Recycle Bin');
  console.log('   • System Administration & Monitoring');
  
  console.log('\n🔑 Login credentials:');
  console.log('   System Admin: admin@exitsaas.com / Admin@123');
  console.log('   Tenant Admin 1: admin-1@example.com / Admin@123');
  console.log('   Tenant Admin 2: admin-2@example.com / Admin@123');
};
