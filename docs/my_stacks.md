## 🛠️ **ExITS-SaaS-Boilerplate Tech Stack**

### **🎨 Frontend - Web Dashboard**
- **Framework**: Angular 20.3.6 (Latest version with standalone components)
- **Build Tool**: Vite 7.1.12 (Fast, modern build tool)
- **Styling**: Tailwind CSS 3.4.18
- **HTTP Client**: RxJS 7.8.0
- **Routing**: Angular Router (standalone)
- **Testing**: Jasmine 5.9.0 + Karma 6.4.0
- **TypeScript**: 5.9.2

### **🔧 Backend - API**
- **Framework**: NestJS 10.4.20 (Modern Node.js framework)
- **Runtime**: Node.js with Fastify (high-performance HTTP server)
- **Language**: TypeScript 5.9.3
- **Authentication**: 
  - Passport JWT 4.0.1
  - @nestjs/jwt 11.0.1
  - bcrypt 6.0.0 + bcryptjs 3.0.2
- **Database**: 
  - PostgreSQL (via pg 8.16.3)
  - Knex.js 3.1.0 (Query builder & migrations)
- **Validation**: class-validator 0.14.2 + class-transformer 0.5.1
- **Security**: @fastify/helmet 11.1.1 + @fastify/cors 8.5.0

### **🗄️ Database**
- **DBMS**: PostgreSQL 15 (Alpine Linux image)
- **Admin UI**: pgAdmin 4 (optional, dev profile)
- **Migrations**: Knex migrations
- **Connection Pooling**: Built-in pool management

### **🐳 DevOps & Infrastructure**
- **Containerization**: Docker + Docker Compose 3.9
- **Reverse Proxy**: Nginx 1.25 (Alpine)
- **Web Server**: Nginx (serving Angular SPA)
- **Architecture**: Microservices with Docker networking
- **Health Checks**: Built-in health monitoring for all services

### **🧪 Testing & Quality**
- **Frontend Testing**: Jasmine + Karma
- **Backend Testing**: Jest (via NestJS testing)
- **E2E Testing**: Cypress (configured with TypeScript)
- **Linting**: ESLint 9.13.0 + TypeScript ESLint 8.14.0
- **Code Formatting**: Prettier

### **📱 Mobile (Placeholder)**
- **Structure exists** but appears to be using Ionic/Capacitor based on config files

### **🔑 Key Architecture Patterns**
- **Multi-tenancy**: Built-in tenant isolation
- **RBAC**: Role-based access control system
- **JWT Auth**: Access + refresh token pattern
- **RESTful API**: Standard REST endpoints
- **Standalone Components**: Angular 20 modern architecture
- **Lazy Loading**: Route-based code splitting

### **🎯 Notable Features**
- **Compact UI Design**: Custom design system implementation
- **Money Loan Platform**: Loan management module
- **Customer Portal**: Dedicated customer interface
- **Audit Logging**: System activity tracking
- **Dark Mode**: Full theme support

This is a **modern, production-ready full-stack TypeScript SaaS boilerplate** with enterprise-grade architecture! 🚀