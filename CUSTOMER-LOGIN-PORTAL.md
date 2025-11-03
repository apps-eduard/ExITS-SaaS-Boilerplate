# Customer Login Portal - Quick Reference

## ✅ Implementation Complete

### Customer Login Page
**URL:** `http://localhost:4200/customer/login`

**Features:**
- 🎨 Beautiful gradient design with dark mode support
- 📱 Fully responsive
- 🔒 Secure authentication with JWT tokens
- 👁️ Password visibility toggle
- ✅ Remember me functionality
- 🔗 Links to forgot password and staff login
- 🎭 Theme toggle (light/dark mode)

---

## 🔐 Test Credentials

**Email:** `customer@test.com`  
**Password:** `Customer@123`

**Customer Details:**
- Name: Test Portal Customer
- Customer Code: CUST-TEST-001
- Credit Score: 700
- KYC Status: Verified
- Money Loan: Approved ✅

---

## 🌐 API Endpoints

### Customer Authentication
**Base URL:** `http://localhost:3000/api/customer`

#### 1. Login
```http
POST /api/customer/auth/login
Content-Type: application/json

{
  "identifier": "customer@test.com",  // Email or phone
  "password": "Customer@123",
  "rememberMe": true                  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "customer": {
      "id": 4,
      "customerId": 4,
      "userId": 123,
      "tenantId": 2,
      "customerCode": "CUST-TEST-001",
      "firstName": "Test",
      "lastName": "Customer",
      "email": "customer@test.com",
      "phone": "+639991234567",
      "kycStatus": "verified",
      "creditScore": 700,
      "riskLevel": "low",
      "moneyLoanApproved": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1...",
      "refreshToken": "eyJhbGciOiJIUzI1..."
    }
  }
}
```

#### 2. Get Profile
```http
GET /api/customer/auth/profile
Authorization: Bearer <customerToken>
```

#### 3. Logout
```http
POST /api/customer/auth/logout
Authorization: Bearer <customerToken>
```

---

## 📁 File Structure

### Backend
```
api/src/
├── modules/customer/
│   ├── controllers/
│   │   └── AuthController.js       # Customer authentication logic
│   └── routes/
│       ├── authRoutes.js           # Auth endpoints
│       └── index.js                # Customer router
└── middleware/
    └── customerAuth.js             # Customer JWT middleware
```

### Frontend
```
web/src/app/
├── features/
│   ├── auth/customer-login/
│   │   └── customer-login.component.ts     # Login page
│   └── customer/
│       └── customer-dashboard.component.ts # Dashboard
└── app.routes.ts                           # Routes configuration
```

---

## 🎯 How It Works

### Authentication Flow

1. **User enters credentials** (email/phone + password)
2. **Frontend sends** `POST /api/customer/auth/login`
3. **Backend validates**:
   - Customer exists and is active
   - Customer has user account (user_id not null)
   - Money Loan is approved
   - Password is correct
4. **Backend generates** JWT tokens:
   - Access token (1 day or 30 days if "Remember Me")
   - Refresh token (90 days)
5. **Frontend stores**:
   - `customerToken` → localStorage
   - `customerData` → localStorage
6. **Redirect** to customer dashboard

### Customer-User Relationship

The `customers` table has an optional `user_id` field:
```sql
customers
├── id (primary key)
├── user_id (foreign key to users.id) -- For portal access
├── customer_code
├── first_name
├── last_name
└── money_loan_approved -- Must be true to login
```

**Portal Access Requirements:**
- ✅ Customer must have linked user account (`user_id` not null)
- ✅ Money Loan must be approved (`money_loan_approved = true`)
- ✅ Customer status must be active
- ✅ User account must have password set

---

## 🔑 Creating New Customer Portal Accounts

### Method 1: Re-run Initial Seed (Dev Reset)
```bash
cd api
npx knex seed:run --specific=01_initial_data.js
```

> ⚠️ This resets tenants, users, roles, and default customers. Only use on local/dev data sets.

### Method 2: Manual SQL
```sql
-- 1. Create user account
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, status, email_verified)
VALUES (2, 'newcustomer@test.com', '$2a$10$...', 'John', 'Doe', 'active', true);

-- 2. Link customer to user
UPDATE customers
SET user_id = (SELECT id FROM users WHERE email = 'newcustomer@test.com'),
    money_loan_approved = true
WHERE email = 'newcustomer@test.com';
```

### Method 3: Via Admin Portal (Future)
- Admin can create customer
- Admin can enable portal access
- System sends invitation email with password setup link

---

## 🎨 UI Features

### Login Page Elements

**Header:**
- Logo with gradient background
- "Customer Portal" title
- Subtitle: "Access your loan account and manage payments"

**Form Fields:**
- 📧 Email or Phone Number (identifier)
- 🔒 Password (with show/hide toggle)
- ☑️ Remember me checkbox
- 🔗 Forgot password link

**Buttons:**
- Primary: Sign In (with loading spinner)
- Theme toggle: ☀️/🌙

**Footer:**
- Security message
- Link to staff login

### Dashboard Features

**Header:**
- Logo and branding
- Customer name and code
- Logout button

**Stats Cards:**
- 📝 Active Loans
- 💵 Total Outstanding
- 📅 Next Payment
- ⭐ Credit Score

**Quick Actions:**
- 💳 Make Payment
- 📝 Apply for Loan
- 📊 View Statement

**Notice:**
- "Under Development" banner (temporary)

---

## 🔒 Security Features

1. **Password Hashing:** bcryptjs with 10 salt rounds
2. **JWT Tokens:** Signed with secret key, includes customer/tenant ID
3. **Token Expiry:** 
   - Access: 1 day (default) or 30 days (remember me)
   - Refresh: 90 days
4. **Authorization:** Customer-specific middleware validates token type
5. **Tenant Isolation:** Customer ID includes tenant context
6. **HTTPS Ready:** Secure token transmission

---

## 🧪 Testing Guide

### 1. Start the API Server
```bash
cd api
npm run dev
```

### 2. Start the Web App
```bash
cd web
npm start
```

### 3. Test Login Flow
1. Navigate to `http://localhost:4200/customer/login`
2. Enter credentials:
   - Email: `customer@test.com`
   - Password: `Customer@123`
3. Click "Sign In"
4. Should redirect to `/customer/dashboard`
5. Verify customer name appears in header
6. Click Logout → Should redirect to login page

### 4. Test API Directly (Postman)
```http
POST http://localhost:3000/api/customer/auth/login
Content-Type: application/json

{
  "identifier": "customer@test.com",
  "password": "Customer@123"
}
```

---

## 📝 Next Steps

### Immediate
- [ ] Add forgot password functionality
- [ ] Add customer profile editing
- [ ] Create customer guard for protected routes

### Short Term
- [ ] Integrate with Money Loan customer components
- [ ] Add loan viewing for logged-in customer
- [ ] Add payment history
- [ ] Add loan application

### Future Enhancements
- [ ] Email verification
- [ ] Two-factor authentication
- [ ] Biometric login (mobile)
- [ ] Password strength meter
- [ ] Login activity tracking
- [ ] Session management
- [ ] Auto-logout on inactivity

---

## 🐛 Troubleshooting

### "Invalid credentials"
- Check email/phone is correct
- Verify password is `Customer@123`
- Ensure customer exists in database

### "Account not activated"
- Check `money_loan_approved = true` in customers table
- Verify customer status is `active`

### "Cannot find module"
- Run `npm install` in api folder
- Check all dependencies installed

### Token expired
- Token expires after 1 day (or 30 days with remember me)
- User needs to login again
- Implement refresh token flow (future)

---

## 📊 Database Schema

### Customers Table (Relevant Fields)
```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  user_id INTEGER REFERENCES users(id),  -- Portal access link
  customer_code VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  kyc_status VARCHAR(20),
  credit_score INTEGER,
  money_loan_approved BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active'
);
```

### Users Table (For Portal Access)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  email_verified BOOLEAN DEFAULT FALSE
);
```

---

## 🎉 Summary

**What's Working:**
- ✅ Separate customer login page at `/customer/login`
- ✅ Customer authentication API
- ✅ JWT token generation and validation
- ✅ Customer dashboard at `/customer/dashboard`
- ✅ Test customer account created
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Secure password handling

**Technologies:**
- Backend: Express.js, JWT, bcryptjs
- Frontend: Angular 17+, Signals, Standalone Components
- Database: PostgreSQL with Knex.js
- Authentication: JWT with customer type validation

**Date:** January 24, 2025  
**Status:** Customer Portal Login - Phase 1 Complete ✅
