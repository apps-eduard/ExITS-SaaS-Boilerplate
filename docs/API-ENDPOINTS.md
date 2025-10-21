# API Endpoints Reference

Complete list of all API endpoints to be implemented in Phase 2.

## Authentication Endpoints

### POST /api/auth/login
Login with email and password.
- **Request**: { email, password }
- **Response**: { access_token, refresh_token, user }
- **Middleware**: None
- **Permissions**: None

### POST /api/auth/logout
Logout current user (invalidate session).
- **Response**: { success: true }
- **Middleware**: auth, logger
- **Permissions**: None

### POST /api/auth/refresh
Refresh access token using refresh token.
- **Request**: { refresh_token }
- **Response**: { access_token, refresh_token }
- **Middleware**: None
- **Permissions**: None

### GET /api/auth/me
Get current user profile and permissions.
- **Response**: { user, permissions, roles }
- **Middleware**: auth, logger
- **Permissions**: None

---

## User Management Endpoints

### GET /api/users
List all users (paginated).
- **Query**: { page, limit, search, status }
- **Response**: { data: [], total, page, limit }
- **Middleware**: auth, rbac, tenant-isolation, logger
- **Permissions**: users:view (or system-users:view)

### POST /api/users
Create new user.
- **Request**: { email, password, first_name, last_name, role_id }
- **Response**: { user }
- **Middleware**: auth, rbac, tenant-isolation, logger
- **Permissions**: users:create (or system-users:create)

### GET /api/users/:id
Get user details.
- **Response**: { user, roles, permissions }
- **Middleware**: auth, rbac, tenant-isolation, logger
- **Permissions**: users:view

### PUT /api/users/:id
Update user.
- **Request**: { first_name, last_name, status, email }
- **Response**: { user }
- **Middleware**: auth, rbac, tenant-isolation, logger
- **Permissions**: users:edit

### DELETE /api/users/:id
Delete user (soft delete).
- **Response**: { success: true }
- **Middleware**: auth, rbac, tenant-isolation, logger
- **Permissions**: users:delete

### GET /api/users/:id/permissions
Get user's permissions.
- **Response**: { permissions: [], roles: [] }
- **Middleware**: auth, rbac, logger
- **Permissions**: users:view

### POST /api/users/:id/roles
Assign role to user.
- **Request**: { role_id, expires_at? }
- **Response**: { success: true }
- **Middleware**: auth, rbac, logger
- **Permissions**: users:edit

### DELETE /api/users/:id/roles/:role_id
Remove role from user.
- **Response**: { success: true }
- **Middleware**: auth, rbac, logger
- **Permissions**: users:edit

---

## Role Management Endpoints

### GET /api/roles
List all roles (paginated).
- **Query**: { page, limit, search, space }
- **Response**: { data: [], total, page, limit }
- **Middleware**: auth, rbac, logger
- **Permissions**: roles:view (or system-roles:view)

### POST /api/roles
Create new role.
- **Request**: { name, description, space, parent_role_id? }
- **Response**: { role }
- **Middleware**: auth, rbac, logger
- **Permissions**: roles:create

### GET /api/roles/:id
Get role details.
- **Response**: { role, permissions }
- **Middleware**: auth, rbac, logger
- **Permissions**: roles:view

### PUT /api/roles/:id
Update role.
- **Request**: { name, description, parent_role_id? }
- **Response**: { role }
- **Middleware**: auth, rbac, logger
- **Permissions**: roles:edit

### DELETE /api/roles/:id
Delete role.
- **Response**: { success: true }
- **Middleware**: auth, rbac, logger
- **Permissions**: roles:delete

### GET /api/roles/:id/permissions
Get role's permissions matrix.
- **Response**: { permissions: [] }
- **Middleware**: auth, rbac, logger
- **Permissions**: roles:view

### POST /api/roles/:id/permissions
Assign permission to role.
- **Request**: { module_id, action_key, constraints? }
- **Response**: { success: true }
- **Middleware**: auth, rbac, logger
- **Permissions**: roles:edit

### DELETE /api/roles/:id/permissions/:permission_id
Remove permission from role.
- **Response**: { success: true }
- **Middleware**: auth, rbac, logger
- **Permissions**: roles:edit

---

## Module Management Endpoints

### GET /api/modules
List all available modules.
- **Query**: { space, status }
- **Response**: { data: [] }
- **Middleware**: auth, logger
- **Permissions**: None (public, filtered by user access)

### GET /api/modules/menus
Get user's accessible menu structure.
- **Response**: { menus: [] }
- **Middleware**: auth, logger
- **Permissions**: None (automatic filtering)

### POST /api/modules
Create new module (admin only).
- **Request**: { menu_key, display_name, space, action_keys, icon?, parent_menu_key? }
- **Response**: { module }
- **Middleware**: auth, rbac, logger
- **Permissions**: modules:create

### PUT /api/modules/:id
Update module.
- **Request**: { display_name, action_keys?, status? }
- **Response**: { module }
- **Middleware**: auth, rbac, logger
- **Permissions**: modules:edit

### DELETE /api/modules/:id
Delete module.
- **Response**: { success: true }
- **Middleware**: auth, rbac, logger
- **Permissions**: modules:delete

---

## Tenant Management Endpoints

### GET /api/tenants
List all tenants (system admin only).
- **Query**: { page, limit, search, status }
- **Response**: { data: [], total, page, limit }
- **Middleware**: auth, rbac, logger
- **Permissions**: tenants:view

### POST /api/tenants
Create new tenant.
- **Request**: { name, subdomain, plan, billing_email?, max_users? }
- **Response**: { tenant }
- **Middleware**: auth, rbac, logger
- **Permissions**: tenants:create

### GET /api/tenants/:id
Get tenant details.
- **Response**: { tenant, stats }
- **Middleware**: auth, rbac, logger
- **Permissions**: tenants:view

### PUT /api/tenants/:id
Update tenant.
- **Request**: { name, plan, primary_color?, secondary_color?, logo_url? }
- **Response**: { tenant }
- **Middleware**: auth, rbac, logger
- **Permissions**: tenants:edit

### DELETE /api/tenants/:id
Delete tenant.
- **Response**: { success: true }
- **Middleware**: auth, rbac, logger
- **Permissions**: tenants:delete

### PUT /api/tenants/:id/status
Change tenant status (suspend/activate).
- **Request**: { status }
- **Response**: { tenant }
- **Middleware**: auth, rbac, logger
- **Permissions**: tenants:edit

---

## Audit Log Endpoints

### GET /api/audit-logs
List audit logs (paginated).
- **Query**: { page, limit, user_id?, action?, entity_type?, start_date?, end_date? }
- **Response**: { data: [], total, page, limit }
- **Middleware**: auth, rbac, logger
- **Permissions**: audit:view

### GET /api/audit-logs/:id
Get specific audit log.
- **Response**: { log }
- **Middleware**: auth, rbac, logger
- **Permissions**: audit:view

### GET /api/audit-logs/compliance/reports
Get compliance reports.
- **Query**: { report_type, start_date, end_date }
- **Response**: { report }
- **Middleware**: auth, rbac, logger
- **Permissions**: audit:view

### POST /api/audit-logs/export
Export audit logs (CSV/PDF).
- **Request**: { format, filters? }
- **Response**: { file_url or binary }
- **Middleware**: auth, rbac, logger
- **Permissions**: audit:export

---

## Permission Delegation Endpoints

### POST /api/permissions/delegate
Delegate permissions to another user (temporary).
- **Request**: { delegated_to, role_id, expires_at, reason? }
- **Response**: { delegation }
- **Middleware**: auth, rbac, logger
- **Permissions**: permissions:delegate

### GET /api/permissions/delegations
List active delegations for user.
- **Response**: { delegations: [] }
- **Middleware**: auth, logger
- **Permissions**: None (personal info)

### DELETE /api/permissions/delegations/:id
Revoke delegation.
- **Response**: { success: true }
- **Middleware**: auth, rbac, logger
- **Permissions**: permissions:delegate

---

## Health & Status Endpoints

### GET /api/health
Health check endpoint.
- **Response**: { status: 'healthy', timestamp }
- **Middleware**: logger
- **Permissions**: None (public)

### GET /api/status
System status endpoint.
- **Response**: { api: 'ok', database: 'ok', cache: 'ok' }
- **Middleware**: logger
- **Permissions**: None (public)

---

## Error Responses

All endpoints return standard error format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "status": 400,
  "timestamp": "2025-10-21T12:00:00Z",
  "path": "/api/users"
}
```

### Common Error Codes

- `UNAUTHORIZED` - 401 - No token provided
- `FORBIDDEN` - 403 - Permission denied
- `NOT_FOUND` - 404 - Resource not found
- `VALIDATION_ERROR` - 400 - Invalid request data
- `CONFLICT` - 409 - Resource already exists
- `INTERNAL_SERVER_ERROR` - 500 - Server error

---

## Response Pagination

List endpoints return:

```json
{
  "data": [ ... ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "pages": 8
}
```

---

## Authentication

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

---

## Rate Limiting

- Standard: 100 requests/minute per user
- Auth endpoints: 5 attempts/5 minutes
- Export endpoints: 10 per hour

---

## Versioning

Current API Version: **v1**
URL: `http://localhost:3000/api`

Future versions: `/api/v2/...`

---

This reference shows all **40+ endpoints** to be implemented in Phase 2.
