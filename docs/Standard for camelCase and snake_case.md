# **Industry Standard Summary**

## **The Universal Standard for Full-Stack Applications:**

### **1. Database Layer**
- **PostgreSQL/MySQL**: Use **snake_case** 
  - `user_id`, `first_name`, `created_at`
  - ✅ This is SQL/PostgreSQL convention
  - ✅ Readable in SQL queries
  - ✅ Compatible with all database tools

### **2. Backend/API Layer (Node.js/JavaScript)**
- **JavaScript/Node.js**: Use **camelCase**
  - `userId`, `firstName`, `createdAt`
  - ✅ This is JavaScript convention
  - ✅ Follows ESLint standards
  - ✅ Matches language style guide

### **3. Frontend Layer (Angular/React/Vue)**
- **JavaScript/TypeScript**: Use **camelCase**
  - `userId`, `firstName`, `createdAt`
  - ✅ This is TypeScript/JavaScript convention
  - ✅ Consistent with backend JavaScript
  - ✅ Better IDE autocomplete

### **4. API Contract (REST/GraphQL)**
- **JSON Responses**: Use **camelCase**
  - `{ "userId": 1, "firstName": "John" }`
  - ✅ This is JSON standard (Google, Airbnb, Stripe)
  - ✅ Consistent across platforms
  - ✅ No conversion needed in frontend

---

## **What Top Companies Do:**

- **Google APIs**: camelCase JSON
- **Stripe API**: camelCase JSON
- **GitHub API**: snake_case JSON (legacy, not recommended)
- **Airbnb**: camelCase JSON + snake_case DB
- **Netflix**: camelCase JSON + snake_case DB

**Industry consensus: 90% use camelCase for APIs**

---



## **The Golden Rule:**

**"Database speaks SQL (snake_case), Application speaks JavaScript (camelCase)"**

**Conversion happens at the ORM layer** (Knex, Sequelize, TypeORM) using:
- Global hooks/interceptors
- Automatic bidirectional transformation
- Zero manual conversion in business logic

## **Target State:**

```
Database (PostgreSQL)          →  snake_case
↓ (Knex auto-converts)
Backend Services (Node.js)     →  camelCase
↓ (JSON response)
API Response                   →  camelCase
↓ (no conversion needed)
Frontend (Angular)             →  camelCase
```

**One conversion point. Zero manual work. Maximum consistency.**