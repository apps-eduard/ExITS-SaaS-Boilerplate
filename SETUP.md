# Setup Guide

Quick start guide for setting up ExITS-SaaS-Boilerplate locally.

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Docker & Docker Compose (optional but recommended)
- PostgreSQL 14+ (if not using Docker)
- Git

## Quick Start with Docker

The easiest way to get started:

```bash
# Clone repository
git clone https://github.com/apps-eduard/ExITS-SaaS-Boilerplate.git
cd ExITS-SaaS-Boilerplate

# Start all services
docker-compose up -d

# Wait for services to be ready (about 30 seconds)
docker-compose ps

# Access services:
# - API: http://localhost:3000
# - Web: http://localhost:4200
# - Database: localhost:5432 (postgres/postgres)
```

### Stop Services

```bash
docker-compose down
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f postgres
```

## Manual Setup (Development)

### 1. Setup API

```bash
cd api

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Create database (ensure PostgreSQL is running)
npm run migrate:fresh

# Start API server
npm run dev

# API will be available at: http://localhost:3000
```

### 2. Setup Web (Angular)

```bash
cd web

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Start Angular development server
npm start

# Web will be available at: http://localhost:4200
```

### 3. Setup Mobile (Ionic)

```bash
cd mobile

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Start Ionic development server
npm start

# Mobile will be available at: http://localhost:8100
```

## Environment Variables

### API (.env)

```env
# Server
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=exits_saas
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:4200

# Logging
LOG_LEVEL=debug
```

### Web (.env)

```env
# Environment
ENVIRONMENT=development

# API
API_URL=http://localhost:3000
API_TIMEOUT=30000

# Features
ENABLE_DARK_MODE=true
ENABLE_NOTIFICATIONS=true
```

### Mobile (.env)

```env
# Environment
ENVIRONMENT=development

# API
API_URL=http://localhost:3000
API_TIMEOUT=30000
```

## Database Setup

### Using Docker Compose (Recommended)

PostgreSQL runs automatically in Docker:

```bash
docker-compose up postgres -d

# Wait for postgres to be ready, then run migrations
docker-compose exec api npm run migrate:fresh
```

### Using Local PostgreSQL

```bash
# Create database
createdb exits_saas

# Run migrations
cd api
npm run migrate:fresh

# Seed test data
npm run seed
```

## Running Tests

### API Tests

```bash
cd api

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Web Tests

```bash
cd web

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Linting

```bash
cd api
npm run lint

cd web
npm run lint
```

## Build for Production

### API

```bash
cd api

# Build
npm run build

# Start production build
npm start
```

### Web

```bash
cd web

# Build
npm run build

# Output will be in dist/
```

### Docker Build

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build api
docker-compose build web
```

## Troubleshooting

### Port Already in Use

If ports 3000 or 4200 are already in use:

```bash
# Find process using port 3000
lsof -i :3000

# Find process using port 4200
lsof -i :4200

# Kill process
kill -9 <PID>

# Or change ports in docker-compose.yml or .env
```

### Database Connection Error

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check database credentials in .env
# Make sure DB_HOST, DB_USER, DB_PASSWORD match

# Test connection
psql -h localhost -U postgres -d exits_saas
```

### Node Modules Issues

```bash
# Clear node modules
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Clear npm cache if needed
npm cache clean --force
```

### Docker Issues

```bash
# Remove all containers and volumes
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# Start fresh
docker-compose up -d
```

## Test Credentials

Login with these test accounts:

| Role | Email | Password |
|------|-------|----------|
| System Super Admin | admin@template.local | admin123 |
| System Admin | sys-admin@template.local | sysadmin123 |
| Support Staff | support@template.local | support123 |
| Tenant Admin | tenant-admin@template.local | tenant123 |
| Loan Officer | officer@template.local | officer123 |
| Cashier | cashier@template.local | cashier123 |
| Viewer | viewer@template.local | viewer123 |

## API Documentation

- Postman Collection: (To be added)
- Swagger/OpenAPI: `http://localhost:3000/api-docs` (when available)

## Next Steps

1. Read [Architecture Guide](./docs/ARCHITECTURE.md)
2. Review [RBAC Guide](./docs/RBAC-GUIDE.md)
3. Check [Database Schema](./docs/DATABASE-SCHEMA.md)
4. Start developing!

## Need Help?

- Check [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)
- Review [Contributing Guidelines](./docs/CONTRIBUTING.md)
- Open an [Issue](https://github.com/apps-eduard/ExITS-SaaS-Boilerplate/issues)
