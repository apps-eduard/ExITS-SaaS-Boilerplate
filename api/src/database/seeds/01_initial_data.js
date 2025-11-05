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
      name: 'ACME Corporation',
      subdomain: 'acme',
      plan: 'enterprise',
      status: 'active',
      max_users: 1000,
      contact_person: 'John Doe',
      contact_email: 'admin@acme.com',
      contact_phone: '+63-917-123-4567',
      money_loan_enabled: true,
      bnpl_enabled: true,
      pawnshop_enabled: false
    },
    {
      name: 'TechStart Solutions',
      subdomain: 'techstart',
      plan: 'pro',
      status: 'active',
      max_users: 100,
      contact_person: 'Jane Smith',
      contact_email: 'admin@techstart.com',
      contact_phone: '+63-917-987-6543',
      money_loan_enabled: true,
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
  const existingKeys = existingPermissions.map(p => p.permissionKey); // Knex returns camelCase
  console.log(`Found ${existingKeys.length} existing permissions in database`);
  
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
    
    // Tenant Customers Management
    { permission_key: 'tenant-customers:create', resource: 'tenant-customers', action: 'create', description: 'Create customers within tenant', space: 'tenant' },
    { permission_key: 'tenant-customers:read', resource: 'tenant-customers', action: 'read', description: 'View customers within tenant', space: 'tenant' },
    { permission_key: 'tenant-customers:update', resource: 'tenant-customers', action: 'update', description: 'Edit customers within tenant', space: 'tenant' },
    { permission_key: 'tenant-customers:delete', resource: 'tenant-customers', action: 'delete', description: 'Delete customers within tenant', space: 'tenant' },
    { permission_key: 'tenant-customers:export', resource: 'tenant-customers', action: 'export', description: 'Export tenant customer data', space: 'tenant' },
    
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
    
    // Tenant dashboard (additional permission)
    { permission_key: 'tenant-dashboard:view', resource: 'tenant-dashboard', action: 'view', description: 'View tenant dashboard', space: 'tenant' },
    
    // Customer-specific permissions (Customer Portal)
    { permission_key: 'customer-profile:read', resource: 'customer-profile', action: 'read', description: 'View own customer profile', space: 'customer' },
    { permission_key: 'customer-profile:update', resource: 'customer-profile', action: 'update', description: 'Update own customer profile', space: 'customer' },
    { permission_key: 'customer-loans:read', resource: 'customer-loans', action: 'read', description: 'View own loans', space: 'customer' },
    { permission_key: 'customer-loans:apply', resource: 'customer-loans', action: 'apply', description: 'Apply for new loan', space: 'customer' },
    { permission_key: 'customer-payments:read', resource: 'customer-payments', action: 'read', description: 'View own payment history', space: 'customer' },
    { permission_key: 'customer-payments:create', resource: 'customer-payments', action: 'create', description: 'Make loan payments', space: 'customer' },
    { permission_key: 'customer-dashboard:view', resource: 'customer-dashboard', action: 'view', description: 'View customer dashboard', space: 'customer' }
  ];
  
  // Filter out permissions that already exist from migrations
  const newPermissions = permissionsToAdd.filter(p => !existingKeys.includes(p.permission_key));  // permission_key is correct here (it's from permissionsToAdd, not from DB)
  
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
  const customerRoles = [];
  const employeeRoles = [];
  for (const tenant of tenants) {
    const [tenantAdminRole] = await knex('roles').insert({
      tenant_id: tenant.id,
      name: 'Tenant Admin',
      description: 'Full access within tenant scope',
      space: 'tenant',
      status: 'active'
    }).returning(['id', 'name', 'tenant_id']);
    tenantAdminRoles.push(tenantAdminRole);
    
    // Create Employee role for each tenant
    const [employeeRole] = await knex('roles').insert({
      tenant_id: tenant.id,
      name: 'Employee',
      description: 'Platform access for employees',
      space: 'tenant',
      status: 'active'
    }).returning(['id', 'name', 'tenant_id']);
    employeeRoles.push(employeeRole);
    
    // Create Customer role for each tenant
    const [customerRole] = await knex('roles').insert({
      tenant_id: tenant.id,
      name: 'Customer',
      description: 'Customer portal access only',
      space: 'customer',
      status: 'active'
    }).returning(['id', 'name', 'tenant_id']);
    customerRoles.push(customerRole);
  }
  console.log(`✅ 1 system role + ${tenantAdminRoles.length} tenant roles + ${employeeRoles.length} employee roles + ${customerRoles.length} customer roles created`);

  // 5. Create users
  console.log('5. Creating users...');
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  const locationPresets = {
    acme: [
      {
        houseNumber: '128',
        streetName: 'Ayala Avenue',
        barangay: 'San Lorenzo',
        city: 'Makati City',
        province: 'Metro Manila',
        region: 'NCR',
        zipCode: '1223',
        landmark: 'Near Greenbelt'
      },
      {
        houseNumber: '77',
        streetName: 'Legazpi Street',
        barangay: 'Legazpi Village',
        city: 'Makati City',
        province: 'Metro Manila',
        region: 'NCR',
        zipCode: '1229',
        landmark: 'Washington SyCip Park'
      }
    ],
    techstart: [
      {
        houseNumber: '18',
        streetName: 'Bonifacio High Street',
        barangay: 'Fort Bonifacio',
        city: 'Taguig City',
        province: 'Metro Manila',
        region: 'NCR',
        zipCode: '1630',
        landmark: 'Bonifacio High Street Central'
      },
      {
        houseNumber: '35',
        streetName: 'McKinley Parkway',
        barangay: 'Fort Bonifacio',
        city: 'Taguig City',
        province: 'Metro Manila',
        region: 'NCR',
        zipCode: '1634',
        landmark: 'SM Aura Premier'
      }
    ]
  };

  const pickLocation = (subdomain = 'acme', sequence = 0) => {
    const presets = locationPresets[subdomain] || locationPresets.acme;
    return presets[sequence % presets.length];
  };

  const createAddressPayload = (
    tenantId,
    addressableType,
    addressableId,
    {
      subdomain = 'acme',
      sequence = 0,
      addressType = 'home',
      label = 'Primary Residence',
      isPrimary = true,
      houseNumber,
      streetName,
      barangay,
      city,
      province,
      region,
      zipCode,
      country = 'Philippines',
      contactPerson,
      contactPhone,
      landmark,
    } = {}
  ) => {
    const preset = pickLocation(subdomain, sequence);
    return {
      tenant_id: tenantId,
      addressable_type: addressableType,
      addressable_id: addressableId,
      address_type: addressType,
      label,
      is_primary: isPrimary,
      house_number: houseNumber || preset.houseNumber,
      street_name: streetName || preset.streetName,
      barangay: barangay || preset.barangay,
      city_municipality: city || preset.city,
      province: province || preset.province,
      region: region || preset.region,
      zip_code: zipCode || preset.zipCode,
      country,
      contact_person: contactPerson || null,
      contact_phone: contactPhone || null,
      landmark: landmark || preset.landmark,
    };
  };
  
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
  
  // Create test customers (only for ACME Corporation - tenant 2)
  const acmeTenant = tenants.find(t => t.name === 'ACME Corporation');
  if (acmeTenant) {
    console.log('5a. Creating test customers for ACME Corporation...');
    const customerPasswordHash = await bcrypt.hash('Admin@123', 10);
    
    const testCustomersData = [
      {
        email: 'juan.delacruz@test.com',
        firstName: 'Juan',
        middleName: 'Santos',
        lastName: 'Dela Cruz',
        customerCode: 'CUST-2025-001',
        phone: '+639171234567',
        dateOfBirth: '1990-05-15',
        gender: 'male',
        civilStatus: 'married',
        idType: 'national_id',
        idNumber: 'NID-TEST-001',
        employer: 'ABC Corporation',
        occupation: 'Software Engineer',
        monthlyIncome: 45000,
        yearsEmployed: 3,
        creditScore: 720,
        riskLevel: 'low'
      },
      {
        email: 'maria.santos@test.com',
        firstName: 'Maria',
        middleName: 'Garcia',
        lastName: 'Santos',
        customerCode: 'CUST-2025-002',
        phone: '+639181234567',
        dateOfBirth: '1985-08-22',
        gender: 'female',
        civilStatus: 'single',
        idType: 'drivers_license',
        idNumber: 'DL-TEST-002',
        employer: 'Maria\'s Catering Services',
        occupation: 'Business Owner',
        monthlyIncome: 35000,
        yearsEmployed: 2,
        creditScore: 680,
        riskLevel: 'medium'
      },
      {
        email: 'pedro.gonzales@test.com',
        firstName: 'Pedro',
        middleName: 'Reyes',
        lastName: 'Gonzales',
        customerCode: 'CUST-2025-003',
        phone: '+639191234567',
        dateOfBirth: '1995-03-10',
        gender: 'male',
        civilStatus: 'single',
        idType: 'umid',
        idNumber: 'UMID-TEST-003',
        employer: 'XYZ Manufacturing Inc.',
        occupation: 'Factory Supervisor',
        monthlyIncome: 28000,
        yearsEmployed: 1,
        creditScore: 620,
        riskLevel: 'medium'
      }
    ];
    
    for (const [index, testCustomer] of testCustomersData.entries()) {
      // Create user account for customer
      const [customerUser] = await knex('users').insert({
        tenant_id: acmeTenant.id,
        email: testCustomer.email,
        password_hash: customerPasswordHash,
        first_name: testCustomer.firstName,
        last_name: testCustomer.lastName,
        status: 'active',
        email_verified: true
      }).returning('*');
      
      // Create customer record (only shared personal info)
      const [customer] = await knex('customers').insert({
        tenant_id: acmeTenant.id,
        user_id: customerUser.id,
        customer_code: testCustomer.customerCode,
        customer_type: 'individual',
        first_name: testCustomer.firstName,
        middle_name: testCustomer.middleName,
        last_name: testCustomer.lastName,
        date_of_birth: testCustomer.dateOfBirth,
        gender: testCustomer.gender,
        civil_status: testCustomer.civilStatus,
        email: testCustomer.email,
        phone: testCustomer.phone,
        id_type: testCustomer.idType,
        id_number: testCustomer.idNumber,
        employment_status: 'employed',
        employer_name: testCustomer.employer,
        occupation: testCustomer.occupation,
        monthly_income: testCustomer.monthlyIncome,
        source_of_income: 'Salary',
        years_employed: testCustomer.yearsEmployed,
        status: 'active',
        emergency_contact_name: 'Emergency Contact',
        emergency_contact_relationship: 'Family',
        emergency_contact_phone: testCustomer.phone.replace('9', '8')
      }).returning('*');

      // Create Money Loan profile with business-specific data
      await knex('money_loan_customer_profiles').insert({
        customer_id: customer.id,
        tenant_id: acmeTenant.id,
        credit_score: testCustomer.creditScore,
        risk_level: testCustomer.riskLevel,
        kyc_status: 'verified',
        kyc_verified_at: new Date(),
        status: 'active'
      });

      const customerFullName = `${testCustomer.firstName} ${testCustomer.lastName}`.trim();
      const primaryAddress = createAddressPayload(acmeTenant.id, 'customer', customer.id, {
        subdomain: 'acme',
        sequence: index,
        addressType: 'home',
        label: 'Home Address',
        isPrimary: true,
        contactPerson: customerFullName,
        contactPhone: testCustomer.phone,
      });

      const billingAddress = createAddressPayload(acmeTenant.id, 'customer', customer.id, {
        subdomain: 'acme',
        sequence: index + 1,
        addressType: 'billing',
        label: 'Billing Address',
        isPrimary: false,
        contactPerson: customerFullName,
        contactPhone: testCustomer.phone,
        landmark: 'ACME Finance Center',
      });

      await knex('addresses').insert([primaryAddress, billingAddress]);
    }
    console.log(`✅ Created ${testCustomersData.length} test customers with Money Loan profiles`);
  }
  
  // Create employees and additional customers for both tenants
  console.log('5b. Creating employees and customers for all tenants...');
  const employeePasswordHash = await bcrypt.hash('Admin@123', 10);
  const additionalCustomerPasswordHash = await bcrypt.hash('Admin@123', 10);
  
  for (const tenant of tenants) {
    const tenantSubdomain = tenant.name === 'ACME Corporation' ? 'acme' : 
                            tenant.name === 'TechStart Solutions' ? 'techstart' : null;
    
    if (!tenantSubdomain) continue; // Skip if subdomain not found
    
    // Use tenantId (camelCase) because Knex converts it
    const employeeRoleForTenant = employeeRoles.find(r => r.tenantId === tenant.id);
    const customerRoleForTenant = customerRoles.find(r => r.tenantId === tenant.id);
    
    // Create 2 employees
    for (let i = 1; i <= 2; i++) {
      const empEmail = `employee${i}@${tenantSubdomain}.com`;
      const [employee] = await knex('users').insert({
        tenant_id: tenant.id,
        email: empEmail,
        password_hash: employeePasswordHash,
        first_name: `Employee${i}`,
        last_name: tenant.name.split(' ')[0],
        status: 'active',
        email_verified: true
      }).returning('*');
      
      // Assign employee role
      await knex('user_roles').insert({
        user_id: employee.id,
        role_id: employeeRoleForTenant.id
      });
      
      // Create employee profile
      const [profile] = await knex('employee_profiles').insert({
        tenant_id: tenant.id,
        user_id: employee.id,
        employee_code: `EMP-${tenantSubdomain.toUpperCase()}-${String(i).padStart(3, '0')}`,
        position: i === 1 ? 'Loan Officer' : 'Collections Specialist',
        department: 'Operations',
        employment_type: 'full-time',
        employment_status: 'active',
        hire_date: i === 1 ? '2024-01-15' : '2024-02-01',
        basic_salary: 30000 + (i * 5000),
        status: 'active'
      }).returning('id');
      
      // Assign Money Loan platform access
      await knex('employee_product_access').insert({
        tenant_id: tenant.id,
        user_id: employee.id,
        employee_id: profile.id,
        platform_type: 'money_loan',
        access_level: 'manage',
        is_primary: true,
        can_approve_loans: i === 1,
        max_approval_amount: i === 1 ? 100000 : 50000,
        can_disburse_funds: true,
        can_view_reports: true,
        can_modify_interest: false,
        can_waive_penalties: i === 1,
        status: 'active',
        assigned_date: new Date()
      });

      const employeeFirstName = employee.first_name || employee.firstName || `Employee${i}`;
      const employeeLastName = employee.last_name || employee.lastName || tenant.name.split(' ')[0];
      const employeeContactPhone = `+63 917 ${String(5000000 + tenant.id * 100 + i).padStart(7, '0')}`;
      const employeeContactName = `${employeeFirstName} ${employeeLastName}`.trim();

      const employeeHomeAddress = createAddressPayload(tenant.id, 'employee_profile', profile.id, {
        subdomain: tenantSubdomain,
        sequence: i - 1,
        addressType: 'home',
        label: 'Home Address',
        isPrimary: true,
        contactPerson: employeeContactName,
        contactPhone: employeeContactPhone,
      });

      const employeeWorkAddress = createAddressPayload(tenant.id, 'employee_profile', profile.id, {
        subdomain: tenantSubdomain,
        sequence: i,
        addressType: 'work',
        label: 'Office Address',
        isPrimary: false,
        contactPerson: employeeContactName,
        contactPhone: employeeContactPhone,
        landmark: tenantSubdomain === 'acme' ? 'ACME Corporate Center' : 'TechStart Innovation Hub',
      });

      await knex('addresses').insert([employeeHomeAddress, employeeWorkAddress]);
    }
    
    // Create 2 additional customers (with user accounts for portal access)
    for (let i = 1; i <= 2; i++) {
      const customerCode = `CUST-${tenantSubdomain.toUpperCase()}-${String(i).padStart(4, '0')}`;
      const customerEmail = `customer${i}@${tenantSubdomain}.com`;
      
      // Create user account for customer
      const [customerUser] = await knex('users').insert({
        tenant_id: tenant.id,
        email: customerEmail,
        password_hash: additionalCustomerPasswordHash,
        first_name: `Customer${i}`,
        last_name: tenant.name.split(' ')[0],
        status: 'active',
        email_verified: true
      }).returning('*');
      
      // Assign customer role
      await knex('user_roles').insert({
        user_id: customerUser.id,
        role_id: customerRoleForTenant.id
      });
      
      // Create customer record (only shared personal info)
      const [customer] = await knex('customers').insert({
        tenant_id: tenant.id,
        user_id: customerUser.id, // With login access
        customer_code: customerCode,
        customer_type: 'individual',
        first_name: `Customer${i}`,
        last_name: tenant.name.split(' ')[0],
        email: customerEmail,
        phone: `+63 917 ${String(tenant.id * 100000 + i).padStart(7, '0')}`,
        date_of_birth: i === 1 ? '1985-05-15' : '1990-08-22',
        gender: i === 1 ? 'male' : 'female',
        nationality: 'Filipino',
        civil_status: i === 1 ? 'single' : 'married',
        employment_status: 'employed',
        employer_name: i === 1 ? 'ABC Company' : 'XYZ Corporation',
        occupation: i === 1 ? 'Software Engineer' : 'Sales Manager',
        monthly_income: 50000 + (i * 10000),
        status: 'active',
        preferred_language: 'en',
        preferred_contact_method: 'sms',
        platform_tags: JSON.stringify(['moneyloan'])
      }).returning('*');
      
      // Create Money Loan customer profile with business-specific data
      await knex('money_loan_customer_profiles').insert({
        customer_id: customer.id,
        tenant_id: tenant.id,
        credit_score: 700 + (i * 50),
        risk_level: 'low',
        kyc_status: 'verified',
        max_loan_amount: 100000,
        current_loan_limit: 100000,
        outstanding_balance: 0,
        on_time_payment_rate: 100,
        auto_debit_enabled: false,
        preferred_payment_day: 15,
        status: 'active'
      });

      const additionalCustomerName = `Customer${i} ${tenant.name.split(' ')[0]}`.trim();
      const customerHomeAddress = createAddressPayload(tenant.id, 'customer', customer.id, {
        subdomain: tenantSubdomain,
        sequence: i - 1,
        addressType: 'home',
        label: 'Home Address',
        isPrimary: true,
        contactPerson: additionalCustomerName,
        contactPhone: `+63 917 ${String(tenant.id * 100000 + i).padStart(7, '0')}`,
      });

      const customerWorkAddress = createAddressPayload(tenant.id, 'customer', customer.id, {
        subdomain: tenantSubdomain,
        sequence: i,
        addressType: 'billing',
        label: 'Billing Address',
        isPrimary: false,
        contactPerson: additionalCustomerName,
        contactPhone: `+63 917 ${String(tenant.id * 100000 + i).padStart(7, '0')}`,
        landmark: tenantSubdomain === 'acme' ? 'Glorietta Mall' : 'Central Square',
      });

      await knex('addresses').insert([customerHomeAddress, customerWorkAddress]);
    }
  }
  
  console.log(`✅ Employees and customers created for all tenants`);
  
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
  
  // Grant Employee permissions (dashboard + customers + money-loan)
  console.log(`\n7b. Assigning employee permissions to Employee roles...`);
  for (const employeeRole of employeeRoles) {
    // Get dashboard permission
    const dashboardPerm = allPermissions.find(p => p.permissionKey === 'tenant-dashboard:view');
    
    // Get customer permissions
    const customerPerms = allPermissions.filter(p => p.resource === 'tenant-customers');
    
    // Get all money-loan permissions
    const moneyLoanPerms = allPermissions.filter(p => p.resource === 'money-loan' || p.permissionKey.startsWith('money-loan:'));
    
    const employeePermissions = [];
    if (dashboardPerm) employeePermissions.push(dashboardPerm);
    employeePermissions.push(...customerPerms);
    employeePermissions.push(...moneyLoanPerms);
    
    if (employeePermissions.length > 0) {
      await knex('role_permissions').where('role_id', employeeRole.id).del();
      
      const employeeRolePermissions = employeePermissions.map(perm => ({
        role_id: employeeRole.id,
        permission_id: perm.id
      }));
      await knex('role_permissions').insert(employeeRolePermissions);
      console.log(`   ✅ Granted ${employeeRolePermissions.length} permissions to Employee role (tenant_id: ${employeeRole.tenant_id})`);
      console.log(`      • Dashboard: 1, Customers: ${customerPerms.length}, Money Loan: ${moneyLoanPerms.length}`);
    }
  }
  
  // Grant customer permissions to Customer roles
  const customerPermissions = allPermissions.filter(p => p.permissionKey.startsWith('customer-'));
  console.log(`\n7c. Assigning customer permissions to Customer roles...`);
  for (const customerRole of customerRoles) {
    if (customerPermissions.length > 0) {
      // Clear existing permissions for this role to avoid duplicates
      await knex('role_permissions').where('role_id', customerRole.id).del();
      
      const customerRolePermissions = customerPermissions.map(perm => ({
        role_id: customerRole.id,
        permission_id: perm.id
      }));
      await knex('role_permissions').insert(customerRolePermissions);
      console.log(`   ✅ Granted ${customerRolePermissions.length} CUSTOMER permissions to Customer role (tenant_id: ${customerRole.tenant_id})`);
    }
  }
  console.log(`✅ All roles granted appropriate permissions (space-separated)`);

  console.log('\n✨ Seed completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`   • ${tenants.length} tenants`);
  console.log(`   • ${modules.length} modules`);
  console.log(`   • ${allPermissions.length} comprehensive permissions`);
  console.log(`   • ${1 + tenantAdminRoles.length + customerRoles.length} roles (1 system + ${tenantAdminRoles.length} tenant + ${customerRoles.length} customer)`);
  console.log(`   • ${1 + tenantAdmins.length} users (1 system + ${tenantAdmins.length} tenant)`);
  
  console.log('\n🔐 Permission Assignments:');
  console.log(`   • Super Admin: ${systemPermissions.length} system permissions (100%)`);
  console.log(`   • Tenant Admin(s): ${tenantPermissions.length} tenant permissions each (100%)`);
  console.log(`   • Customer(s): ${allPermissions.filter(p => p.permissionKey.startsWith('customer-')).length} customer permissions each (100%)`);
  console.log(`   • Total System Permissions: ${systemPermissions.length}`);
  console.log(`   • Total Tenant Permissions: ${tenantPermissions.length}`);
  console.log(`   • Total Customer Permissions: ${allPermissions.filter(p => p.permissionKey.startsWith('customer-')).length}`);
  
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
