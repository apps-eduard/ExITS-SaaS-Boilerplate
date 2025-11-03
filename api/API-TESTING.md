# NestJS API - Testing Guide

Quick reference for testing all API endpoints.

## Base URL
```
http://localhost:3000/api
```

---

## 🔐 Authentication Flow

### 1. Admin Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

Save the `accessToken` for subsequent requests.

### 2. Get Current User
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Refresh Token
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### 4. Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 👥 Users Management

### Create User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "roleId": 2,
    "tenantId": 1
  }'
```

### List Users
```bash
curl "http://localhost:3000/api/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get User by ID
```bash
curl http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update User
```bash
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith"
  }'
```

### Delete User
```bash
curl -X DELETE http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🏢 Tenant Management

### Create Tenant
```bash
curl -X POST http://localhost:3000/api/tenants \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "subdomain": "acme",
    "contactName": "John Doe",
    "contactEmail": "contact@acme.com",
    "contactPhone": "+1234567890",
    "adminEmail": "admin@acme.com",
    "adminPassword": "SecurePass123!",
    "adminFirstName": "Admin",
    "adminLastName": "User"
  }'
```

### List Tenants
```bash
curl "http://localhost:3000/api/tenants?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Tenant by Subdomain
```bash
curl http://localhost:3000/api/tenants/by-subdomain/acme \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Tenant
```bash
curl -X PUT http://localhost:3000/api/tenants/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation Ltd"
  }'
```

---

## 💰 Money Loan Platform

### Create Loan Application
```bash
curl -X POST http://localhost:3000/api/money-loan/applications \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "loanProductId": 1,
    "requestedAmount": 10000,
    "requestedTermDays": 30,
    "purpose": "Business expansion",
    "creditScore": 750,
    "annualIncome": 50000,
    "employmentStatus": "employed"
  }'
```

### List Loan Applications
```bash
curl http://localhost:3000/api/money-loan/applications \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Approve Loan Application
```bash
curl -X PUT http://localhost:3000/api/money-loan/applications/1/approve \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approvedAmount": 10000,
    "approvedTermDays": 30,
    "interestRate": 15,
    "interestType": "flat",
    "notes": "Approved based on credit score"
  }'
```

### List Loans
```bash
curl "http://localhost:3000/api/money-loan/loans?status=active" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Disburse Loan
```bash
curl -X POST http://localhost:3000/api/money-loan/loans/1/disburse \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "disbursementMethod": "bank_transfer",
    "disbursementReference": "TXN123456",
    "disbursementNotes": "Transferred to account ending in 1234"
  }'
```

### Record Payment
```bash
curl -X POST http://localhost:3000/api/money-loan/loans/1/payments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "loanId": 1,
    "amount": 1500,
    "paymentMethod": "bank_transfer",
    "reference": "PAY123456",
    "notes": "Monthly payment"
  }'
```

### Get Loan Payments
```bash
curl http://localhost:3000/api/money-loan/loans/1/payments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Loan Products
```bash
curl http://localhost:3000/api/money-loan/products \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Loan Overview
```bash
curl http://localhost:3000/api/money-loan/overview \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 👤 Customer Portal

### Customer Login
```bash
curl -X POST http://localhost:3000/api/customer/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "customer@example.com",
    "password": "customer_password",
    "rememberMe": true
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "customer": { ... }
}
```

### Get Customer Profile
```bash
curl http://localhost:3000/api/customer/profile \
  -H "Authorization: Bearer CUSTOMER_ACCESS_TOKEN"
```

### Get Customer Loans
```bash
curl http://localhost:3000/api/customer/loans \
  -H "Authorization: Bearer CUSTOMER_ACCESS_TOKEN"
```

### Get Customer Applications
```bash
curl http://localhost:3000/api/customer/applications \
  -H "Authorization: Bearer CUSTOMER_ACCESS_TOKEN"
```

### Get Customer Payments
```bash
curl "http://localhost:3000/api/customer/payments?loanId=1" \
  -H "Authorization: Bearer CUSTOMER_ACCESS_TOKEN"
```

---

## 🔒 RBAC Management

### List Roles
```bash
curl http://localhost:3000/api/rbac/roles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### List Permissions
```bash
curl http://localhost:3000/api/rbac/permissions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Role Permissions
```bash
curl http://localhost:3000/api/rbac/roles/1/permissions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Assign Permission to Role
```bash
curl -X POST http://localhost:3000/api/rbac/roles/2/permissions/5 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Remove Permission from Role
```bash
curl -X DELETE http://localhost:3000/api/rbac/roles/2/permissions/5 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🏥 System Health

### Health Check
```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-31T10:17:21.000Z"
}
```

### API Info
```bash
curl http://localhost:3000/api
```

---

## 📝 Testing with Postman

### Import Collection

1. Create a new collection in Postman
2. Add base URL as variable: `{{baseUrl}}` = `http://localhost:3000/api`
3. Add authorization header variable: `{{token}}`

### Environment Setup

```json
{
  "baseUrl": "http://localhost:3000/api",
  "token": "your_jwt_token_here"
}
```

### Pre-request Script (for authenticated requests)

```javascript
pm.request.headers.add({
  key: 'Authorization',
  value: 'Bearer ' + pm.environment.get('token')
});
```

---

## 🐛 Common Issues

### 401 Unauthorized
- Check if token is valid and not expired
- Ensure token is included in Authorization header
- Token format: `Bearer YOUR_TOKEN`

### 403 Forbidden
- User lacks required permission
- Check user's role and permissions
- Admin users have full access

### 404 Not Found
- Verify the endpoint URL
- Check if resource ID exists
- Ensure API is running

### 500 Internal Server Error
- Check server logs: `pm2 logs nestjs-api`
- Verify database connection
- Check .env configuration

---

## 🧪 Automated Testing

### Using Jest (Unit Tests)
```bash
cd api
npm test
```

### Using Supertest (E2E Tests)
```bash
npm run test:e2e
```

---

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "timestamp": "2025-10-31T10:17:21.000Z",
  "path": "/api/users",
  "method": "POST",
  "message": ["email must be an email", "password must be longer than 8 characters"]
}
```

---

## 🔑 Required Permissions

| Endpoint | Permission |
|----------|------------|
| POST /api/users | users:create |
| GET /api/users | users:read |
| PUT /api/users/:id | users:update |
| DELETE /api/users/:id | users:delete |
| POST /api/tenants | tenants:create |
| GET /api/tenants | tenants:read |
| POST /api/money-loan/applications | money-loan:create |
| PUT /api/money-loan/applications/:id/approve | money-loan:approve |
| POST /api/money-loan/loans/:id/disburse | money-loan:disburse |
| POST /api/money-loan/loans/:id/payments | money-loan:payment |

---

**Happy Testing! 🚀**
