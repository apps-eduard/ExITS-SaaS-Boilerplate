# ExITS-SaaS-Boilerplate

A comprehensive, production-ready SaaS template with complete RBAC, multi-tenancy, and modern architecture.

## 🎯 Overview

**ExITS-SaaS-Boilerplate** is a full-stack template designed for building scalable, multi-tenant SaaS applications. It includes:

- **Express.js API** - Enterprise REST API with advanced RBAC and tenant isolation
- **Angular Dashboard** - Modern admin interface with System Admin & Tenant Admin spaces
- **Ionic Mobile** - Native mobile app for MyPortal client
- **PostgreSQL** - Robust relational database with migrations
- **Docker** - Containerized deployment with Docker Compose
- **GitHub Actions** - CI/CD pipelines for testing and deployment

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+ (or use Docker)
- Git

### Local Development

```bash
# Clone repository
git clone https://github.com/apps-eduard/ExITS-SaaS-Boilerplate.git
cd ExITS-SaaS-Boilerplate

# Start with Docker Compose
docker-compose up -d

# Services will be available at:
# - API: http://localhost:3000
# - Web: http://localhost:4200
# - Database: localhost:5432
```

### Manual Setup

See [SETUP.md](./SETUP.md) for detailed setup instructions.

## 📚 Documentation

- [Architecture Guide](./docs/ARCHITECTURE.md) - System design and structure
- [RBAC Guide](./docs/RBAC-GUIDE.md) - Role-based access control details
- [Database Schema](./docs/DATABASE-SCHEMA.md) - Database design and relationships
- [API Documentation](./docs/API-DOCUMENTATION.md) - REST API endpoints
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment
- [Security Guide](./docs/SECURITY.md) - Security best practices
- [Troubleshooting](./docs/TROUBLESHOOTING.md) - Common issues and solutions

## 🏗️ Project Structure

```
ExITS-SaaS-Template/
├── api/                    # Express.js REST API
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── middleware/    # Express middleware
│   │   ├── controllers/   # Route handlers
│   │   ├── services/      # Business logic
│   │   ├── routes/        # API routes
│   │   └── utils/         # Utilities
│   ├── tests/             # Jest tests
│   └── Dockerfile
├── web/                    # Angular Admin Dashboard
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/      # Services, guards, interceptors
│   │   │   ├── shared/    # Reusable components
│   │   │   └── pages/     # Page components
│   │   └── styles/        # Global styles
│   └── Dockerfile
├── mobile/                 # Ionic Mobile App
│   ├── src/
│   │   └── app/
│   └── Dockerfile
├── devops/                 # DevOps configuration
│   ├── docker-compose.yml
│   └── nginx.conf
├── .github/
│   └── workflows/          # GitHub Actions CI/CD
└── docs/                   # Documentation
```

## 🔐 Core Features

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Bcrypt password hashing
- Session management
- MFA support ready

### RBAC System
- Data-driven role-based access control
- No hardcoded permissions
- Menu-based authorization (menu_key)
- Action-based authorization (action_key)
- Role inheritance support

### Multi-Tenancy
- Complete tenant isolation
- Tenant-specific databases (or schemas)
- SQL-level filtering
- API-level enforcement
- Audit trails per tenant

### Two-Space Architecture
- **System Space** - Platform administration
- **Tenant Space** - Organization operations
- Complete isolation and security

### Audit & Compliance
- Complete audit logs (who, what, when, why)
- Separation of duties
- Permission delegation
- Change tracking
- GDPR compliance features

### Performance & Scalability
- Permission caching (Redis ready)
- Database query optimization
- Connection pooling
- Pagination & lazy loading
- Stateless API design

## 🎨 UI/UX

### Design System
- Compact, minimal layout
- Professional typography
- Consistent spacing (8px base unit)
- Smooth animations

### Themes
- Light mode (default)
- Dark mode
- System preference detection
- User preference persistence

### Responsive Design
- Mobile-first approach
- Tablet optimization
- Desktop excellence
- Touch-friendly
- Keyboard navigation

## 🧪 Testing

- Jest configuration for all projects
- Unit tests for services and utilities
- Integration tests for API endpoints
- E2E tests for user flows
- Code coverage reporting

## 🐳 Deployment

### Local Development
```bash
docker-compose up -d
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

See [Deployment Guide](./docs/DEPLOYMENT.md) for detailed instructions.

## 📊 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| System Super Admin | admin@template.local | admin123 |
| System Admin | sys-admin@template.local | sysadmin123 |
| Support Staff | support@template.local | support123 |
| Tenant Admin | tenant-admin@template.local | tenant123 |
| Loan Officer | officer@template.local | officer123 |
| Cashier | cashier@template.local | cashier123 |
| Viewer | viewer@template.local | viewer123 |

## 🔄 CI/CD

GitHub Actions workflows for:
- Automated testing (API, Web, Mobile)
- Code quality checks
- Build automation
- Deployment automation

## 📝 License

MIT License - See [LICENSE](./LICENSE) file for details

## 🤝 Contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for guidelines.

## 📞 Support

For issues and questions:
- Open an [Issue](https://github.com/apps-eduard/ExITS-SaaS-Boilerplate/issues)
- Check [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)

## 🎯 Roadmap

- [x] Core API with RBAC
- [x] Database schema with migrations
- [x] Angular admin dashboard
- [x] Ionic mobile app
- [x] Docker setup
- [x] GitHub Actions CI/CD
- [ ] Advanced analytics dashboards
- [ ] Webhook system
- [ ] GraphQL API option
- [ ] Real-time notifications (WebSocket)
- [ ] Rate limiting & throttling
- [ ] API versioning

---

**Built with ❤️ by Eduard**
