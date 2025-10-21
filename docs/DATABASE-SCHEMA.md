# Database Schema

Complete PostgreSQL database schema for ExITS-SaaS-Boilerplate.

## Tables Overview

```
Tenants (1) ──┐
              ├─→ Users (many)
Roles (1) ────┤    ├─→ User_Roles (many)
              │
Modules ──┐
          ├─→ Role_Permissions
Roles ────┘
              └─→ Audit_Logs

Users ────────→ Sessions (one user, many sessions)
Users ────────→ Audit_Logs (tracking user actions)
```

## Core Tables

### 1. Tenants Table

```sql
CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  plan VARCHAR(50) NOT NULL DEFAULT 'basic', -- basic, pro, enterprise
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, suspended, deleted
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Tenant details
  logo_url VARCHAR(500),
  primary_color VARCHAR(7), -- hex color
  secondary_color VARCHAR(7),
  
  -- Configuration
  max_users INT,
  data_residency VARCHAR(50) DEFAULT 'US', -- data location
  billing_email VARCHAR(255),
  
  -- Metadata
  metadata JSONB, -- custom fields
  
  INDEX idx_subdomain (subdomain),
  INDEX idx_status (status)
);
```

### 2. Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Authentication
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, suspended, deleted
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP,
  
  -- MFA
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret VARCHAR(255),
  
  -- Last Activity
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(45),
  
  -- Preferences
  preferences JSONB DEFAULT '{}', -- theme, language, etc.
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  UNIQUE(tenant_id, email),
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_email (email),
  INDEX idx_status (status)
);
```

### 3. Roles Table

```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  tenant_id INT,
  
  name VARCHAR(100) NOT NULL,
  description TEXT,
  space VARCHAR(20) NOT NULL, -- 'system' or 'tenant'
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  
  -- Inheritance
  parent_role_id INT REFERENCES roles(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- If space = 'system', tenant_id IS NULL
  -- If space = 'tenant', tenant_id IS NOT NULL
  CHECK (
    (space = 'system' AND tenant_id IS NULL) OR
    (space = 'tenant' AND tenant_id IS NOT NULL)
  ),
  
  UNIQUE(space, tenant_id, name),
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_space (space)
);
```

### 4. User_Roles Table (Join Table)

```sql
CREATE TABLE user_roles (
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INT REFERENCES users(id) ON DELETE SET NULL,
  
  -- Optional: expiration for temporary roles
  expires_at TIMESTAMP,
  
  PRIMARY KEY (user_id, role_id),
  INDEX idx_user_id (user_id),
  INDEX idx_role_id (role_id)
);
```

### 5. Modules Table (Menu Registry)

```sql
CREATE TABLE modules (
  id SERIAL PRIMARY KEY,
  
  menu_key VARCHAR(100) NOT NULL UNIQUE, -- 'dashboard', 'loans', 'customers'
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Menu structure
  parent_menu_key VARCHAR(100) REFERENCES modules(menu_key),
  menu_order INT DEFAULT 0,
  
  -- Icon & UI
  icon VARCHAR(50), -- unicode or icon name
  color VARCHAR(7), -- hex color (optional)
  
  -- Scope
  space VARCHAR(20) NOT NULL, -- 'system' or 'tenant'
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, disabled, hidden
  
  -- Available actions (comma-separated or array in JSONB)
  action_keys JSONB DEFAULT '["view"]', -- ["view", "create", "edit", "delete", "approve"]
  
  -- Module configuration
  route_path VARCHAR(255),
  component_name VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_menu_key (menu_key),
  INDEX idx_parent_menu_key (parent_menu_key),
  INDEX idx_space (space)
);
```

### 6. Role_Permissions Table

```sql
CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  module_id INT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  
  -- Permission type (action on module)
  action_key VARCHAR(50) NOT NULL, -- 'view', 'create', 'edit', 'delete', 'approve'
  
  -- Optional: permission constraints
  constraints JSONB DEFAULT '{}', -- e.g., {"max_amount": 10000}
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, conditional, revoked
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(role_id, module_id, action_key),
  INDEX idx_role_id (role_id),
  INDEX idx_module_id (module_id)
);
```

### 7. Audit_Logs Table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Who performed the action
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  
  -- What happened
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'approve', 'login'
  entity_type VARCHAR(100), -- 'loan', 'user', 'role', 'customer'
  entity_id INT,
  
  -- Details
  description TEXT,
  changes JSONB DEFAULT '{}', -- {before: {}, after: {}}
  status VARCHAR(20) DEFAULT 'success', -- success, failure, pending
  error_message TEXT,
  
  -- Request context
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_id VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_user_id (user_id),
  INDEX idx_entity_type (entity_type),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at),
  INDEX idx_composite (tenant_id, created_at)
);
```

### 8. Sessions Table

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Token info
  access_token_hash VARCHAR(255),
  refresh_token_hash VARCHAR(255),
  
  -- Session details
  device_info VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, revoked, expired
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_expires_at (expires_at)
);
```

### 9. Permissions_Delegation Table (Optional - for temporary access)

```sql
CREATE TABLE permissions_delegation (
  id SERIAL PRIMARY KEY,
  tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Who is granting permission
  delegated_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Who receives temporary permission
  delegated_to INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Which role's permissions are being delegated
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  
  -- Constraints
  reason TEXT,
  expires_at TIMESTAMP NOT NULL,
  scope JSONB DEFAULT '{}', -- e.g., {"entities": [1, 2, 3]}
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, revoked, expired
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP,
  
  INDEX idx_delegated_to (delegated_to),
  INDEX idx_expires_at (expires_at)
);
```

## Module Examples (Seed Data)

```sql
-- System Admin Modules
INSERT INTO modules (menu_key, display_name, space, icon, action_keys)
VALUES 
  ('dashboard', 'Dashboard', 'system', '🏠', '["view"]'),
  ('tenants', 'Tenants', 'system', '🏢', '["view"]'),
  ('tenant-list', 'List All Tenants', 'system', '📋', '["view"]'),
  ('tenant-create', 'Create Tenant', 'system', '➕', '["view", "create"]'),
  ('system-users', 'System Users', 'system', '👥', '["view"]'),
  ('user-list', 'List All Users', 'system', '📋', '["view"]'),
  ('user-create', 'Create User', 'system', '➕', '["view", "create"]'),
  ('system-roles', 'System Roles', 'system', '👤', '["view"]'),
  ('role-list', 'List All Roles', 'system', '📋', '["view"]'),
  ('role-create', 'Create Role', 'system', '➕', '["view", "create"]'),
  ('billing', 'Billing', 'system', '💰', '["view"]'),
  ('audit', 'Audit Logs', 'system', '📋', '["view"]'),
  ('settings', 'Settings', 'system', '⚙️', '["view", "edit"]');

-- Tenant Modules
INSERT INTO modules (menu_key, display_name, space, icon, action_keys, parent_menu_key)
VALUES 
  ('dashboard', 'Dashboard', 'tenant', '🏠', '["view"]', NULL),
  ('users', 'Users', 'tenant', '👥', '["view"]', NULL),
  ('user-list', 'List All Users', 'tenant', '📋', '["view"]', 'users'),
  ('user-create', 'Create User', 'tenant', '➕', '["view", "create"]', 'users'),
  ('roles', 'Roles', 'tenant', '👤', '["view"]', NULL),
  ('role-list', 'List All Roles', 'tenant', '📋', '["view"]', 'roles'),
  ('role-create', 'Create Role', 'tenant', '➕', '["view", "create"]', 'roles'),
  ('loans', 'Loans', 'tenant', '📊', '["view"]', NULL),
  ('loan-list', 'List All Loans', 'tenant', '📋', '["view", "create"]', 'loans'),
  ('loan-create', 'Create Loan', 'tenant', '➕', '["view", "create"]', 'loans'),
  ('loan-approve', 'Approve Loan', 'tenant', '✅', '["view"]', 'loans');
```

## Indexes

Key indexes for performance:

```sql
-- Tenant isolation (most queries include tenant_id)
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);

-- Authentication
CREATE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_sessions_user ON sessions(user_id);

-- Role-based queries
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);

-- Audit queries (often filtered by date)
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_composite ON audit_logs(tenant_id, created_at DESC);
```

## Sample Data (seed.sql)

```sql
-- System tenant (for system users)
INSERT INTO tenants (name, subdomain, plan, status)
VALUES ('ExITS-SaaS', 'system', 'enterprise', 'active');

-- System roles
INSERT INTO roles (name, space, description, status)
VALUES 
  ('Super Admin', 'system', 'Full platform access', 'active'),
  ('System Admin', 'system', 'Manage tenants and system users', 'active'),
  ('Support Staff', 'system', 'Read-only system access', 'active');

-- System users
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, status)
VALUES 
  (1, 'admin@template.local', '$2b$10$...', 'Admin', 'User', 'active'),
  (1, 'sys-admin@template.local', '$2b$10$...', 'System', 'Admin', 'active'),
  (1, 'support@template.local', '$2b$10$...', 'Support', 'Staff', 'active');

-- Sample tenant
INSERT INTO tenants (name, subdomain, plan, status)
VALUES ('Demo Pawnshop', 'demo-pawnshop', 'pro', 'active');

-- Tenant roles
INSERT INTO roles (tenant_id, name, space, description, status)
VALUES 
  (2, 'Admin', 'tenant', 'Tenant administrator', 'active'),
  (2, 'Loan Officer', 'tenant', 'Create and manage loans', 'active'),
  (2, 'Cashier', 'tenant', 'Record payments', 'active'),
  (2, 'Viewer', 'tenant', 'Read-only access', 'active');

-- Tenant users
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, status)
VALUES 
  (2, 'tenant-admin@template.local', '$2b$10$...', 'Tenant', 'Admin', 'active'),
  (2, 'officer@template.local', '$2b$10$...', 'Loan', 'Officer', 'active'),
  (2, 'cashier@template.local', '$2b$10$...', 'Cashier', 'User', 'active'),
  (2, 'viewer@template.local', '$2b$10$...', 'Viewer', 'User', 'active');
```

## Entity Relationships

```
┌──────────────────┐
│    Tenants       │ (1)
└────────┬─────────┘
         │ (1:many)
         │
┌────────▼─────────┐
│     Users        │ (many)
└────────┬─────────┘
         │ (many:many)
         │
┌────────▼──────────────┐
│   User_Roles          │
└────────┬──────────────┘
         │ (many:1)
         │
┌────────▼──────────────┐
│     Roles             │ (many)
└────────┬──────────────┘
         │ (many:many)
         │
┌────────▼──────────────┐
│ Role_Permissions      │
└────────┬──────────────┘
         │ (many:1)
         │
┌────────▼──────────────┐
│    Modules           │
└──────────────────────┘

┌──────────────────┐
│  Audit_Logs      │ ← References users, tenants
└──────────────────┘

┌──────────────────┐
│   Sessions       │ ← References users, tenants
└──────────────────┘
```

## Views (Optional)

```sql
-- User permissions view (denormalized for faster queries)
CREATE VIEW user_permissions AS
SELECT 
  u.id,
  u.tenant_id,
  m.menu_key,
  m.module_id,
  rp.action_key
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN modules m ON rp.module_id = m.id
WHERE u.status = 'active'
  AND r.status = 'active'
  AND rp.status = 'active';

-- Active sessions view
CREATE VIEW active_sessions AS
SELECT *
FROM sessions
WHERE status = 'active'
  AND expires_at > CURRENT_TIMESTAMP;
```

## Backup & Recovery

```sql
-- Backup command
pg_dump -h localhost -U postgres -d exits_saas > backup.sql

-- Restore command
psql -h localhost -U postgres -d exits_saas < backup.sql
```

---

For more information, see [Architecture Guide](./ARCHITECTURE.md)
