# Architecture Guide

Complete system architecture for ExITS-SaaS-Boilerplate.

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Client Layer                       │
├─────────────────────────┬───────────────────────────────┤
│   Angular Web Dashboard │    Ionic Mobile Client        │
│  (System Admin/Tenant)  │      (MyPortal)              │
└────────────┬────────────┴────────────┬──────────────────┘
             │                         │
             └────────────┬────────────┘
                          │ (HTTPS/WebSocket)
             ┌────────────▼────────────┐
             │   API Gateway/Nginx     │
             │    (Load Balancer)      │
             └────────────┬────────────┘
                          │ (HTTP)
    ┌─────────────────────┴──────────────────────┐
    │         Express.js REST API Server         │
    │         (Port 3000, Stateless)             │
    │  ┌─────────────────────────────────────┐  │
    │  │ Controllers (7)                     │  │
    │  │ - Auth, User, Role, Module,         │  │
    │  │   Tenant, Audit, Permission         │  │
    │  └─────────┬───────────────────────────┘  │
    │            │                               │
    │  ┌─────────▼───────────────────────────┐  │
    │  │ Middleware Pipeline                 │  │
    │  │ 1. Logger & Correlation ID          │  │
    │  │ 2. CORS & Security (Helmet)         │  │
    │  │ 3. Auth (JWT Verification)          │  │
    │  │ 4. RBAC (Menu & Action Keys)        │  │
    │  │ 5. Tenant Isolation                 │  │
    │  │ 6. Error Handling                   │  │
    │  └─────────┬───────────────────────────┘  │
    │            │                               │
    │  ┌─────────▼───────────────────────────┐  │
    │  │ Services (6)                        │  │
    │  │ - Auth, User, Role, Permission,     │  │
    │  │   Tenant, Audit, Cache              │  │
    │  └─────────┬───────────────────────────┘  │
    │            │                               │
    └────────────┼───────────────────────────────┘
                 │
    ┌────────────┼────────────┬─────────────┐
    │            │            │             │
    │            ▼            ▼             ▼
 ┌──┴────┐  ┌────────┐  ┌───────┐  ┌─────────┐
 │        │  │        │  │       │  │         │
 │ Postgres│  │ Redis  │  │ Logs  │  │ Metrics │
 │(Primary)│  │(Cache) │  │Storage│  │Service  │
 │  Data   │  │        │  │       │  │         │
 └─────────┘  └────────┘  └───────┘  └─────────┘
```

## Core Components

### 1. Client Layer

#### Angular Web Dashboard
- **System Admin Space**
  - Dashboard with KPI cards, charts, activities
  - Tenant management
  - System user management
  - System role management
  - Billing & subscriptions
  - Audit logs
  - System settings

- **Tenant Admin Space**
  - Tenant dashboard
  - User management
  - Role management
  - Module-specific pages (Loans, Customers, Payments, etc.)
  - Reports & analytics
  - Audit logs
  - Tenant settings

#### Ionic Mobile Client
- MyPortal application
- User profile & settings
- Activity feeds
- Quick actions
- Responsive touch UI

### 2. Authentication & Authorization

#### JWT Token Flow
```
1. User Login
   - Email + Password
   - Backend validates credentials
   - Generates JWT token + refresh token
   - Returns tokens to client

2. Token Storage (Client)
   - Access token: localStorage/sessionStorage
   - Refresh token: httpOnly cookie (secure)

3. API Requests
   - Add JWT to Authorization header
   - Include tenant_id
   - Backend verifies token

4. Token Refresh
   - When token expires
   - Use refresh token to get new access token
   - Automatic via interceptor
```

#### Permission Model
```
USER → ROLES → PERMISSIONS → MENU_KEYS + ACTION_KEYS

Example:
User: john@acme.com
├─ Role 1: Loan Officer
│  ├─ Permission: loans:view
│  ├─ Permission: loans:create
│  └─ Permission: loans:edit
├─ Role 2: Approver
│  └─ Permission: loans:approve
└─ Result: Can view, create, edit, and approve loans
```

### 3. RBAC System

#### Components

**Modules Table** (Menu Registry)
- menu_key: unique identifier (dashboard, loans, etc.)
- display_name: label shown in UI
- parent_menu_key: null for top-level, references parent for children
- icon: icon name/unicode
- space: "system" or "tenant"
- action_keys: associated actions (view, create, edit, delete, etc.)

**Roles Table**
- role_id: unique identifier
- role_name: display name
- space: "system" or "tenant"
- description: role description

**Role_Permissions Table**
- role_id: FK to roles
- menu_key: FK to modules
- action_key: specific action (view, create, edit, delete, approve, etc.)
- created_at, updated_at

#### Permission Checking

**Frontend (Angular)**
```typescript
// Check menu visibility
this.permissionService.hasPermission('loans:view')

// Use in template
<div *appHasPermission="'loans:view'">
  Visible if user has permission
</div>

// Conditionally show button
<button *appHasPermission="'loans:create'">
  Create Loan
</button>
```

**Backend (Express)**
```javascript
// Route middleware
router.post('/loans',
  authMiddleware,
  rbacMiddleware('loans:create'),
  loanController.create
);

// Manual check in controller
if (!await permissionService.hasPermission(userId, 'loans:create')) {
  throw new ForbiddenError('Permission denied');
}
```

### 4. Multi-Tenancy Architecture

#### Isolation Levels

**1. Database Level**
```sql
-- Option A: Separate schemas per tenant
CREATE SCHEMA tenant_123;
CREATE TABLE tenant_123.loans (...)

-- Option B: Separate databases per tenant
CREATE DATABASE tenant_123_db;

-- Option C: Shared database with tenant_id column
CREATE TABLE loans (
  id SERIAL,
  tenant_id INT,
  ...
);
CREATE INDEX idx_loans_tenant ON loans(tenant_id);
```

**2. API Level**
```javascript
// Every query includes tenant_id filter
const getUserLoans = async (userId, tenantId) => {
  return db.query(
    'SELECT * FROM loans WHERE user_id = $1 AND tenant_id = $2',
    [userId, tenantId]
  );
}

// Middleware enforces tenant isolation
app.use((req, res, next) => {
  req.tenantId = extractTenantIdFromJWT(req.headers.authorization);
  req.query.tenantId = req.tenantId; // Inject into all queries
  next();
});
```

**3. Application Level**
```typescript
// Frontend routes enforce tenant
// /system/dashboard (system space)
// /tenant/dashboard (tenant space)

// Data filtering on API response
const response = await api.get('/loans');
// Only returns loans for current tenant
```

### 5. Audit & Compliance

#### Audit Trail

```
Audit Log Entry:
├── id: UUID
├── tenant_id: INT (for filtering)
├── user_id: INT (who performed action)
├── action: STRING (create, update, delete, approve, etc.)
├── entity_type: STRING (loan, user, role, etc.)
├── entity_id: INT (which loan, user, etc.)
├── changes: JSON (before/after values)
├── ip_address: STRING (from request)
├── user_agent: STRING (browser info)
├── timestamp: DATETIME
└── status: STRING (success, failure, pending)
```

#### Compliance Reports
- User access logs (who logged in when)
- Role change history
- Permission change history
- Data export requests (GDPR)
- Compliance dashboards

### 6. Data Flow

#### Create Loan Workflow

```
1. Frontend
   ├─ User fills form
   ├─ Validates locally
   └─ Sends POST /api/loans

2. API Request
   ├─ Logger middleware logs request
   ├─ Auth middleware verifies JWT
   ├─ RBAC middleware checks "loans:create" permission
   ├─ Tenant isolation middleware injects tenant_id
   └─ Router dispatches to controller

3. Controller (loanController.create)
   ├─ Validates request body (schema validation)
   ├─ Calls service

4. Service (loanService.create)
   ├─ Performs business logic
   ├─ Calls database
   ├─ Calls audit service to log action
   └─ Returns created loan

5. Audit Service (auditService.log)
   ├─ Records: user, action, entity, changes
   ├─ Stores in audit_logs table
   └─ Returns

6. Controller Response
   ├─ Returns 201 Created
   ├─ Includes new loan data
   └─ Sends to frontend

7. Frontend
   ├─ Shows toast: "Loan created successfully"
   ├─ Refreshes list
   └─ Updates state
```

### 7. Caching Strategy

#### Permission Cache (Redis)

```
Cache Key: permissions:user:{userId}
Value: {
  "loans:view": true,
  "loans:create": true,
  "loans:edit": true,
  "loans:delete": false,
  "loans:approve": false
}
TTL: 1 hour (or until updated)

Cache Invalidation:
- When role assigned to user → Invalidate cache
- When permission added/removed → Invalidate cache
- When user status changed → Invalidate cache
```

#### Menu Cache

```
Cache Key: menus:role:{roleId}:space:{space}
Value: [
  {
    menuKey: "dashboard",
    label: "Dashboard",
    children: []
  },
  ...
]
TTL: 24 hours
```

## Technology Stack

### Backend (API)
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4
- **Language**: JavaScript/TypeScript
- **ORM**: Sequelize or Knex.js
- **Auth**: JWT (jsonwebtoken), bcryptjs
- **Validation**: Joi
- **Logging**: Winston
- **Testing**: Jest, Supertest
- **Database**: PostgreSQL
- **Cache**: Redis (optional)
- **Security**: Helmet, CORS

### Frontend (Web)
- **Framework**: Angular 15+
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: RxJS/Services
- **HTTP**: HttpClient
- **Forms**: Reactive Forms
- **Testing**: Jest, Karma
- **Build**: Webpack

### Mobile
- **Framework**: Ionic 7+
- **Language**: TypeScript
- **Runtime**: Capacitor
- **Platform**: iOS/Android/Web
- **UI**: Ionic Components

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **CI/CD**: GitHub Actions
- **Reverse Proxy**: Nginx
- **Database**: PostgreSQL

## Security Layers

### 1. Network Security
- HTTPS/TLS encryption
- CORS policy
- Helmet middleware (XSS, clickjacking protection)

### 2. Authentication
- JWT tokens with strong secrets
- Bcrypt password hashing (cost: 10)
- Token expiration (24h access, 7d refresh)
- Secure refresh token storage

### 3. Authorization
- Default deny principle
- Whitelist-only permissions
- Role inheritance
- Action-level permissions

### 4. Data Security
- SQL injection prevention (parameterized queries)
- Tenant isolation
- Field-level encryption (optional)
- Audit logging

### 5. Session Security
- Session timeout
- Concurrent session limits
- IP whitelisting (optional)
- Rate limiting

## Deployment

### Local Development
```bash
docker-compose up -d
```

### Staging
```bash
docker-compose -f docker-compose.staging.yml up -d
```

### Production
```bash
# Scale API instances
docker-compose -f docker-compose.prod.yml up -d --scale api=3

# Load balancer (Nginx) distributes traffic
# Database replication (optional)
# CDN for static assets
# Backup strategy
```

## Performance Considerations

### Optimization

1. **Database**
   - Indexed queries
   - Connection pooling
   - Query caching
   - Pagination

2. **API**
   - Response compression (gzip)
   - Caching headers
   - Permission caching
   - Lazy loading

3. **Frontend**
   - Bundle optimization
   - Code splitting
   - Lazy loading
   - Image optimization

4. **Infrastructure**
   - Horizontal scaling
   - Load balancing
   - CDN for static files
   - Database replication

### Metrics to Monitor

- Response time (API)
- Database query time
- Permission cache hit rate
- Error rate
- Concurrent users
- Database connections

---

For detailed information, see other documentation files:
- [RBAC Guide](./RBAC-GUIDE.md)
- [Database Schema](./DATABASE-SCHEMA.md)
- [Security Guide](./SECURITY.md)
