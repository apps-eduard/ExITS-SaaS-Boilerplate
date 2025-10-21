-- Database Schema for ExITS-SaaS
-- Create ENUM types
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');
CREATE TYPE role_space AS ENUM ('system', 'tenant');
CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'deleted');
CREATE TYPE session_status AS ENUM ('active', 'revoked', 'expired');
CREATE TYPE audit_status AS ENUM ('success', 'failure', 'pending');
CREATE TYPE permission_status AS ENUM ('active', 'conditional', 'revoked');
CREATE TYPE tenant_plan AS ENUM ('basic', 'pro', 'enterprise');

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  plan tenant_plan NOT NULL DEFAULT 'basic',
  status tenant_status NOT NULL DEFAULT 'active',
  logo_url VARCHAR(500),
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  max_users INT,
  data_residency VARCHAR(50) DEFAULT 'US',
  billing_email VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_subdomain UNIQUE(subdomain)
);

CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  status user_status NOT NULL DEFAULT 'active',
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(255),
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(45),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  CONSTRAINT unique_email_per_tenant UNIQUE(tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  space role_space NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  parent_role_id INT REFERENCES roles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_space_tenant CHECK (
    (space = 'system' AND tenant_id IS NULL) OR
    (space = 'tenant' AND tenant_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_roles_tenant_id ON roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_space ON roles(space);
CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_unique_system ON roles(name) WHERE space = 'system' AND tenant_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_unique_tenant ON roles(space, tenant_id, name) WHERE space = 'tenant';

-- Modules table (Menu registry)
CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  menu_key VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_menu_key VARCHAR(100) REFERENCES modules(menu_key),
  menu_order INT DEFAULT 0,
  icon VARCHAR(50),
  color VARCHAR(7),
  space role_space NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  action_keys JSONB DEFAULT '["view"]',
  route_path VARCHAR(255),
  component_name VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_menu_key UNIQUE(menu_key)
);

CREATE INDEX IF NOT EXISTS idx_modules_menu_key ON modules(menu_key);
CREATE INDEX IF NOT EXISTS idx_modules_parent_menu_key ON modules(parent_menu_key);
CREATE INDEX IF NOT EXISTS idx_modules_space ON modules(space);

-- User_Roles join table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INT REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP,
  
  CONSTRAINT pk_user_roles PRIMARY KEY (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- Role_Permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  module_id INT REFERENCES modules(id) ON DELETE CASCADE,
  menu_key VARCHAR(100),
  action_key VARCHAR(50) NOT NULL,
  constraints JSONB DEFAULT '{}',
  status permission_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_module_id ON role_permissions(module_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_role_permissions_unique ON role_permissions(role_id, COALESCE(menu_key, ''), action_key);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
  access_token_hash VARCHAR(255),
  refresh_token_hash VARCHAR(255),
  device_info VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  status session_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Audit_Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INT,
  description TEXT,
  changes JSONB DEFAULT '{}',
  status audit_status DEFAULT 'success',
  error_message TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_composite ON audit_logs(tenant_id, created_at DESC);

-- Permissions_Delegation table
CREATE TABLE IF NOT EXISTS permissions_delegation (
  id SERIAL PRIMARY KEY,
  tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
  delegated_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delegated_to INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  reason TEXT,
  expires_at TIMESTAMP NOT NULL,
  scope JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_permissions_delegation_delegated_to ON permissions_delegation(delegated_to);
CREATE INDEX IF NOT EXISTS idx_permissions_delegation_expires_at ON permissions_delegation(expires_at);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(user_id, status);

-- Create views
CREATE OR REPLACE VIEW user_permissions_view AS
SELECT 
  u.id,
  u.tenant_id,
  u.email,
  m.menu_key,
  m.id as module_id,
  rp.action_key
FROM users u
JOIN user_roles ur ON u.id = ur.user_id AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
JOIN roles r ON ur.role_id = r.id AND r.status = 'active'
JOIN role_permissions rp ON r.id = rp.role_id AND rp.status = 'active'
JOIN modules m ON rp.module_id = m.id AND m.status = 'active'
WHERE u.status = 'active';

CREATE OR REPLACE VIEW active_sessions_view AS
SELECT *
FROM sessions
WHERE status = 'active' AND expires_at > CURRENT_TIMESTAMP;
