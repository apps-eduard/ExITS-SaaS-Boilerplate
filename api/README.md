# NestJS API Migration - Complete

## Overview

This is the complete NestJS migration of the Express.js API. The application uses NestJS 10.x with TypeScript, Knex.js for database operations, and implements a multi-tenant SaaS architecture.

## Project Structure

```
api/
├── src/
│   ├── auth/                    # Authentication module
│   │   ├── dto/                 # DTOs for login, refresh, etc.
│   │   ├── guards/              # JWT authentication guard
│   │   ├── strategies/          # Passport JWT strategy
│   │   ├── auth.controller.ts   # Auth endpoints
│   │   ├── auth.service.ts      # Auth business logic
│   │   └── auth.module.ts
│   ├── rbac/                    # Role-Based Access Control
│   │   ├── permissions.service.ts
│   │   ├── rbac.controller.ts
│   │   └── rbac.module.ts
│   ├── users/                   # User management
│   │   ├── dto/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   ├── tenants/                 # Tenant management
│   │   ├── dto/
│   │   ├── tenants.controller.ts
│   │   ├── tenants.service.ts
│   │   └── tenants.module.ts
│   ├── money-loan/              # Money Loan platform
│   │   ├── dto/
│   │   ├── money-loan.controller.ts
│   │   ├── money-loan.service.ts
│   │   └── money-loan.module.ts
│   ├── customer/                # Customer portal
│   │   ├── dto/
│   │   ├── customer.controller.ts
│   │   ├── customer.service.ts
│   │   └── customer.module.ts
│   ├── database/                # Database layer
│   │   ├── knex.module.ts
│   │   └── knex.service.ts
│   ├── common/                  # Shared resources
│   │   ├── decorators/          # Custom decorators
│   │   ├── guards/              # Custom guards
│   │   ├── interceptors/        # Logging, transform, etc.
│   │   ├── filters/             # Exception filters
│   │   └── middleware/          # Custom middleware
│   ├── migrations/              # Database migrations
│   ├── app.module.ts
│   └── main.ts
├── .env                         # Environment variables
├── knexfile.ts                  # Knex configuration
├── tsconfig.json
├── nest-cli.json
└── package.json
```

## Features

### ✅ Completed

- **Database Layer**: Knex.js integration with automatic snake_case ↔ camelCase conversion
- **Authentication**: JWT-based auth with Passport.js, login/logout/refresh/me endpoints
- **Authorization**: RBAC with permissions, roles, guards, and decorators
- **User Management**: Full CRUD with role assignment and soft delete
- **Tenant Management**: Multi-tenant support with transaction-based tenant creation
- **Money Loan Platform**: Complete loan lifecycle (application → approval → disbursement → payments)
- **Customer Portal**: Customer authentication and loan/payment viewing
- **Logging**: HTTP request/response logging interceptor
- **Error Handling**: Global exception filter with structured error responses
- **Validation**: Class-validator for all DTOs with automatic transformation

## API Endpoints

### Authentication (Admin/Staff)
```
POST   /api/auth/login          # Admin/staff login
POST   /api/auth/logout         # Logout (requires JWT)
POST   /api/auth/refresh        # Refresh access token
POST   /api/auth/me             # Get current user
```

### RBAC
```
GET    /api/rbac/roles                                    # List all roles
GET    /api/rbac/permissions                              # List all permissions
GET    /api/rbac/roles/:roleId/permissions                # Get role permissions
POST   /api/rbac/roles/:roleId/permissions/:permissionId  # Assign permission
DELETE /api/rbac/roles/:roleId/permissions/:permissionId  # Remove permission
```

### Users
```
POST   /api/users           # Create user (requires: users:create)
GET    /api/users           # List users with pagination (requires: users:read)
GET    /api/users/:id       # Get user by ID (requires: users:read)
PUT    /api/users/:id       # Update user (requires: users:update)
DELETE /api/users/:id       # Soft delete user (requires: users:delete)
```

### Tenants
```
POST   /api/tenants                          # Create tenant (requires: tenants:create)
GET    /api/tenants                          # List tenants (requires: tenants:read)
GET    /api/tenants/by-subdomain/:subdomain  # Get tenant by subdomain
GET    /api/tenants/:id                      # Get tenant by ID (requires: tenants:read)
PUT    /api/tenants/:id                      # Update tenant (requires: tenants:update)
DELETE /api/tenants/:id                      # Suspend tenant (requires: tenants:delete)
```

### Money Loan Platform
```
POST   /api/money-loan/applications              # Create loan application (requires: money-loan:create)
GET    /api/money-loan/applications              # List applications (requires: money-loan:read)
PUT    /api/money-loan/applications/:id/approve  # Approve application (requires: money-loan:approve)
GET    /api/money-loan/loans                     # List loans (requires: money-loan:read)
POST   /api/money-loan/loans/:id/disburse        # Disburse loan (requires: money-loan:disburse)
POST   /api/money-loan/loans/:id/payments        # Record payment (requires: money-loan:payment)
GET    /api/money-loan/loans/:id/payments        # Get loan payments (requires: money-loan:read)
GET    /api/money-loan/products                  # List loan products (requires: money-loan:read)
GET    /api/money-loan/overview                  # Get loan statistics (requires: money-loan:read)
```

### Customer Portal
```
POST   /api/customer/login          # Customer login
GET    /api/customer/profile        # Get customer profile (requires JWT)
GET    /api/customer/loans          # Get customer's loans (requires JWT)
GET    /api/customer/applications   # Get customer's applications (requires JWT)
GET    /api/customer/payments       # Get customer's payments (requires JWT)
```

## Configuration

### Environment Variables (.env)

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=exits_saas_db
DB_USER=postgres
DB_PASSWORD=admin

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# CORS
CORS_ORIGIN=http://localhost:4200
```

## Running the Application

### Development Mode
```bash
cd api
npm install
npm run start:dev
```

### Production Build
```bash
npm run build
npm run start:prod
```

### Database Migrations
```bash
npm run migrate:latest      # Run all migrations
npm run migrate:rollback    # Rollback last batch
npm run migrate:make <name> # Create new migration
```

## Key Design Patterns

### 1. Dependency Injection
All services use constructor injection for dependencies:

```typescript
@Injectable()
export class MoneyLoanService {
  constructor(private knexService: KnexService) {}
}
```

### 2. Guards & Decorators
Permission-based authorization using custom guards:

```typescript
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('money-loan:create')
async createApplication() {}
```

### 3. DTOs with Validation
All inputs validated using class-validator:

```typescript
export class CreateLoanApplicationDto {
  @IsNumber()
  @IsNotEmpty()
  customerId: number;
  
  @IsNumber()
  @IsNotEmpty()
  requestedAmount: number;
}
```

### 4. Automatic Case Conversion
Knex configuration automatically converts:
- Database (snake_case) → TypeScript (camelCase)
- TypeScript (camelCase) → Database (snake_case)

### 5. Global Exception Handling
All errors caught and formatted consistently:

```json
{
  "success": false,
  "statusCode": 404,
  "timestamp": "2025-10-31T10:17:21.000Z",
  "path": "/api/users/999",
  "method": "GET",
  "message": ["User not found"]
}
```

## Security Features

- **Helmet**: Security headers
- **CORS**: Configurable origin whitelist
- **JWT**: Token-based authentication with refresh tokens
- **Password Hashing**: Bcrypt with salt rounds
- **Permission Guards**: Fine-grained access control
- **Input Validation**: All inputs validated and sanitized
- **SQL Injection Prevention**: Parameterized queries via Knex

## Database Schema

The application uses the existing PostgreSQL schema with tables:
- `users` - System users (admin, staff)
- `customers` - End customers
- `tenants` - Multi-tenant organizations
- `roles` - User roles
- `permissions` - System permissions
- `user_roles` - User-role assignments
- `role_permissions` - Role-permission assignments
- `user_sessions` - Active sessions
- `money_loan_applications` - Loan applications
- `money_loan_loans` - Active loans
- `money_loan_payments` - Payment records
- `money_loan_products` - Loan product definitions
- `money_loan_customer_profiles` - Customer KYC and credit info

## Migration from Express

The migration maintains 100% API compatibility:
- Same endpoint URLs
- Same request/response formats
- Same database schema
- Same authentication flow
- Enhanced with TypeScript type safety
- Improved with NestJS dependency injection

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Next Steps (Optional Enhancements)

1. **Swagger Documentation**: Add @nestjs/swagger for auto-generated API docs
2. **Rate Limiting**: Add throttler module for API rate limiting
3. **Caching**: Add Redis caching for frequently accessed data
4. **WebSockets**: Add Socket.IO for real-time notifications
5. **Bull Queue**: Add background job processing for long-running tasks
6. **Microservices**: Split into separate services if needed

## Support

For issues or questions, contact the development team.

---

**Migration completed**: October 31, 2025
**NestJS Version**: 10.x
**Node Version**: 18.x or higher
