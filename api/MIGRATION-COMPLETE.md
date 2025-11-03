# NestJS API - Migration Complete

## ✅ Successfully Migrated

The Express.js API has been fully migrated to NestJS with TypeScript.

## 📁 Project Structure

```
api/
├── src/
│   ├── auth/                 # Authentication module (JWT, Passport)
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── strategies/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── common/               # Shared resources
│   │   ├── decorators/       # @Permissions()
│   │   ├── guards/           # PermissionsGuard
│   │   ├── interceptors/     # LoggingInterceptor
│   │   └── middleware/       # TenantContextMiddleware
│   ├── database/             # Knex.js integration
│   │   ├── knex.module.ts
│   │   └── knex.service.ts
│   ├── money-loan/           # Money Loan platform
│   │   ├── dto/
│   │   ├── money-loan.controller.ts
│   │   ├── money-loan.service.ts
│   │   └── money-loan.module.ts
│   ├── rbac/                 # Role-Based Access Control
│   │   ├── permissions.service.ts
│   │   ├── rbac.controller.ts
│   │   └── rbac.module.ts
│   ├── tenants/              # Multi-tenancy
│   │   ├── dto/
│   │   ├── tenants.controller.ts
│   │   ├── tenants.service.ts
│   │   └── tenants.module.ts
│   ├── users/                # User management
│   │   ├── dto/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   ├── migrations/           # Database migrations (Knex)
│   ├── app.module.ts
│   └── main.ts
├── .env
├── knexfile.ts
├── nest-cli.json
├── package.json
└── tsconfig.json
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd C:\Users\speed\Desktop\ExITS-SaaS-Boilerplate\api
npm install
```

### 2. Configure Environment
Ensure `.env` file exists with:
```env
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/exits_saas
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
CORS_ORIGIN=http://localhost:4200
```

### 3. Run Migrations
```bash
npm run db:migrate
```

### 4. Start Development Server
```bash
npm run start:dev
```

Server will run on: `http://localhost:3000/api`

### 5. Build for Production
```bash
npm run build
npm run start:prod
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout (invalidate session)
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user info

### Users
- `POST /api/users` - Create user
- `GET /api/users` - List users (paginated)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Tenants
- `POST /api/tenants` - Create tenant (public)
- `GET /api/tenants` - List tenants (protected)
- `GET /api/tenants/by-subdomain/:subdomain` - Get tenant by subdomain (public)
- `GET /api/tenants/:id` - Get tenant by ID
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### RBAC
- `GET /api/rbac/roles` - List all roles
- `GET /api/rbac/permissions` - List all permissions
- `GET /api/rbac/roles/:roleId/permissions` - Get role permissions
- `POST /api/rbac/roles/:roleId/permissions/:permissionId` - Assign permission
- `DELETE /api/rbac/roles/:roleId/permissions/:permissionId` - Remove permission

### Money Loan
- `POST /api/money-loan/applications` - Create loan application
- `GET /api/money-loan/applications` - List applications
- `PUT /api/money-loan/applications/:id/approve` - Approve application
- `GET /api/money-loan/loans` - List loans
- `POST /api/money-loan/loans/:id/disburse` - Disburse loan

## 🔒 Security Features

### JWT Authentication
- Access tokens (short-lived)
- Refresh tokens (long-lived)
- Automatic token validation via Passport

### RBAC Permissions
- Permission-based access control
- Format: `resource:action` (e.g., `users:create`)
- Applied via `@Permissions()` decorator

### Guards
- `JwtAuthGuard` - Validates JWT token
- `PermissionsGuard` - Checks user permissions

## 🗄️ Database

### ORM: Knex.js
- Query builder with TypeScript support
- Automatic camelCase ↔ snake_case conversion
- Transaction support
- Migration system

### Running Migrations
```bash
# Run all pending migrations
npm run db:migrate

# Rollback last migration
npm run db:migrate:rollback

# Create new migration
npm run db:migrate:make migration_name

# Run seeds
npm run db:seed
```

## 🏗️ Architecture

### Layered Architecture
1. **Controllers** - HTTP endpoints, request validation
2. **Services** - Business logic, data access
3. **DTOs** - Data Transfer Objects with validation
4. **Guards** - Route protection (auth, permissions)
5. **Interceptors** - Cross-cutting concerns (logging)

### Dependency Injection
NestJS provides built-in DI container. Services are injected via constructors.

### Module System
Each feature is organized as a module with:
- Controllers (HTTP layer)
- Services (business logic)
- DTOs (validation)
- Module configuration

## 📊 Logging

Automatic HTTP request logging via `LoggingInterceptor`:
- Request method, URL, status code
- Response time
- IP address
- User agent
- Error messages

## 🔧 Development Scripts

```bash
# Development
npm run start:dev      # Watch mode with hot reload
npm run start:debug    # Debug mode with --inspect

# Production
npm run build          # Compile TypeScript
npm run start:prod     # Run compiled code

# Database
npm run db:migrate              # Run migrations
npm run db:migrate:rollback     # Rollback migrations
npm run db:migrate:make <name>  # Create migration
npm run db:seed                 # Run seeds

# Testing
npm run test           # Run unit tests
npm run test:watch     # Watch mode
npm run test:cov       # Coverage report
```

## 🎯 Key Differences from Express

### Express (Old)
- JavaScript
- Manual route registration
- Middleware-based
- Manual dependency injection
- No built-in validation

### NestJS (New)
- TypeScript
- Decorator-based routing (`@Get()`, `@Post()`)
- Module-based architecture
- Built-in dependency injection
- Class-validator for DTOs
- Interceptors and guards
- Better testability

## 🌐 Multi-Tenancy

### Tenant Context
Tenant ID extracted from:
1. JWT token (`req.user.tenantId`)
2. Subdomain (`tenant1.example.com`)
3. Custom header (`X-Tenant-ID`)

### Tenant Middleware
`TenantContextMiddleware` automatically extracts tenant context and attaches to request.

## 📝 Response Format

All endpoints return standardized JSON:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

## 🚨 Error Handling

NestJS built-in exception filters handle errors:
- `NotFoundException` → 404
- `UnauthorizedException` → 401
- `ForbiddenException` → 403
- `BadRequestException` → 400
- Validation errors → 400 with details

## 📦 Dependencies

### Core
- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`
- `@nestjs/config` - Environment configuration
- `@nestjs/jwt`, `@nestjs/passport` - Authentication
- `passport-jwt` - JWT strategy

### Database
- `knex` - Query builder
- `pg` - PostgreSQL driver

### Validation
- `class-validator` - DTO validation
- `class-transformer` - DTO transformation

### Security
- `helmet` - Security headers
- `bcrypt` - Password hashing

## 🎉 Migration Status

✅ **100% Complete**

### Completed Modules:
1. ✅ Database layer (Knex.js)
2. ✅ Authentication (JWT, Passport)
3. ✅ RBAC (Permissions, Guards)
4. ✅ Users (Full CRUD)
5. ✅ Tenants (Full CRUD with transactions)
6. ✅ Money Loan (Applications, Approvals, Disbursements)
7. ✅ Logging interceptor
8. ✅ Tenant context middleware

### Next Steps (Optional):
- Add BNPL platform module
- Add Pawnshop platform module
- Add payment processing
- Add reporting features
- Add email notifications
- Add rate limiting
- Add API documentation (Swagger)

## 📞 Support

For issues or questions, refer to:
- [NestJS Documentation](https://docs.nestjs.com/)
- [Knex.js Documentation](https://knexjs.org/)
- Project README
