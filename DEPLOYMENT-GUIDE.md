# DEPLOYMENT-GUIDE.md - Comprehensive Production Deployment

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Database Deployment](#database-deployment)
4. [Application Deployment](#application-deployment)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)

---

## Pre-Deployment Checklist

### Environment Preparation
- [ ] All tests passing (>80% coverage)
- [ ] Code reviewed and approved
- [ ] Docker images built and tested
- [ ] SSL/TLS certificates ready
- [ ] DNS records configured
- [ ] Load balancer configured
- [ ] Database backups current
- [ ] Disaster recovery plan in place

### Security Verification
- [ ] No secrets committed to repository
- [ ] All environment variables documented
- [ ] SSH keys rotated recently
- [ ] Security scanning (Trivy) passed
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Security headers configured

### Infrastructure
- [ ] Production server ready
- [ ] Staging environment mirrors production
- [ ] Database server running
- [ ] Redis cache configured (optional)
- [ ] Monitoring tools installed
- [ ] Backup strategy verified
- [ ] Firewall rules configured
- [ ] Load balancing configured

---

## Infrastructure Setup

### Docker Compose Production Deployment

```bash
# Pull latest images
docker pull <registry>/exitsaas-api:prod
docker pull <registry>/exitsaas-web:prod

# Deploy with production config
docker-compose -f docker-compose.yml \
  -f docker-compose.prod.yml \
  up -d

# Verify services
docker-compose ps
docker-compose logs -f api
docker-compose logs -f web
```

### Nginx Configuration

```nginx
# SSL/TLS Configuration
listen 443 ssl http2;
ssl_certificate /etc/ssl/certs/example.com.crt;
ssl_certificate_key /etc/ssl/private/example.com.key;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
```

### Load Balancer Setup

```yaml
# Example: AWS ALB configuration
- Port: 443 (HTTPS)
- Protocol: HTTPS
- Certificate: ACM certificate
- Target Group: Port 8080 (Nginx)
- Health Check: /health (30s interval)
- Sticky Sessions: Enabled (1 day)
```

---

## Database Deployment

### Initial Setup

```bash
# Connect to PostgreSQL
psql -h db.example.com -U postgres

# Create database
CREATE DATABASE exitsaas_prod;

# Create user
CREATE USER exitsaas_user WITH PASSWORD 'secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE exitsaas_prod TO exitsaas_user;
```

### Run Migrations

```bash
# From API container
docker-compose exec api npm run migrate

# Or manually
npm run migrate:up

# Verify schema
psql -d exitsaas_prod -c "\dt"
```

### Backup Strategy

```bash
# Daily automated backup
0 2 * * * pg_dump -U postgres exitsaas_prod > /backups/db_$(date +\%Y\%m\%d_\%H\%M\%S).sql

# Verify backup
ls -lh /backups/db_*.sql

# Test restore (on separate server)
psql -d exitsaas_test < /backups/db_20240101_020000.sql
```

---

## Application Deployment

### Step 1: Pull Latest Code

```bash
cd /opt/exitsaas
git fetch origin
git checkout main
git pull origin main
```

### Step 2: Update Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with production values
nano .env

# Verify critical variables
grep -E "DB_PASSWORD|JWT_SECRET|API_PORT" .env
```

### Step 3: Build Images

```bash
# Build API image
docker build -f api/Dockerfile -t exitsaas-api:prod ./api

# Build Web image
docker build -f web/Dockerfile -t exitsaas-web:prod ./web

# Tag for registry
docker tag exitsaas-api:prod <registry>/exitsaas-api:prod
docker tag exitsaas-web:prod <registry>/exitsaas-web:prod

# Push to registry
docker push <registry>/exitsaas-api:prod
docker push <registry>/exitsaas-web:prod
```

### Step 4: Blue-Green Deployment

```bash
# Start new version (blue)
docker-compose -f docker-compose.yml \
  -f docker-compose.prod.yml \
  up -d api-blue web-blue

# Run migrations
docker-compose exec api-blue npm run migrate

# Health check
curl -f http://localhost:3001/health

# If successful, switch traffic
# Update load balancer to point to blue

# Keep old version (green) running for rollback
```

### Step 5: Verify Deployment

```bash
# Check service health
curl -s https://api.example.com/health | jq .

# Check logs
docker-compose logs -f --tail=100 api web

# Monitor performance
docker stats
```

---

## Post-Deployment Verification

### Health Checks

```bash
#!/bin/bash
set -e

echo "Checking API health..."
API_HEALTH=$(curl -s https://api.example.com/health)
if [ $? -ne 0 ]; then
  echo "ERROR: API health check failed"
  exit 1
fi

echo "Checking Web health..."
WEB_HEALTH=$(curl -s https://example.com/health)
if [ $? -ne 0 ]; then
  echo "ERROR: Web health check failed"
  exit 1
fi

echo "Checking database..."
docker-compose exec -T postgres pg_isready -U postgres
if [ $? -ne 0 ]; then
  echo "ERROR: Database connection failed"
  exit 1
fi

echo "✓ All health checks passed"
```

### Smoke Tests

```bash
# Test login endpoint
curl -X POST https://api.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Test user list
curl -H "Authorization: Bearer <token>" \
  https://api.example.com/api/users

# Test web application
curl -s https://example.com | grep -q "ExITS"
```

### Performance Baseline

```bash
# Capture response times
ab -n 100 -c 10 https://api.example.com/api/users

# Monitor system resources
watch -n 1 'docker stats --no-stream'

# Check error logs
docker-compose logs api | grep ERROR
```

---

## Monitoring & Maintenance

### Monitoring Setup

```bash
# Install monitoring agent
curl -fsSL https://monitoring-provider.com/install.sh | bash

# Configure alerts
- CPU > 80%
- Memory > 85%
- Disk > 90%
- API errors > 1%
- Response time > 500ms
```

### Log Management

```bash
# Configure log rotation
cat > /etc/logrotate.d/exitsaas << EOF
/var/log/exitsaas/*.log {
  daily
  rotate 14
  compress
  delaycompress
  notifempty
  create 0640 exitsaas exitsaas
}
EOF

# View logs
docker-compose logs -f --tail=50 api

# Search logs
docker-compose logs api | grep "ERROR"
```

### Performance Tuning

```bash
# Database connection pooling
# In docker-compose.yml
environment:
  - POOL_MIN=5
  - POOL_MAX=20

# Nginx caching
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m;
proxy_cache_valid 200 60m;

# Redis caching
# Add to API configuration
REDIS_URL=redis://redis:6379
CACHE_TTL=3600
```

---

## Troubleshooting

### Common Issues

#### 1. Container Won't Start
```bash
# Check logs
docker-compose logs api

# Verify image
docker images | grep exitsaas

# Rebuild image
docker-compose build --no-cache api

# Run with foreground
docker-compose run api npm start
```

#### 2. Database Connection Failed
```bash
# Test connection
docker-compose exec -T postgres psql -U postgres -c "SELECT 1"

# Check credentials
grep DB_ .env

# Verify network
docker network ls
docker network inspect <network_name>
```

#### 3. High Memory Usage
```bash
# Check memory
docker stats

# Clear cache
docker system prune -a

# Rebuild with smaller base image
docker build --build-arg BASE=node:18-alpine ...

# Monitor over time
watch -n 5 'docker stats --no-stream'
```

#### 4. Slow API Response
```bash
# Check database queries
docker-compose exec -T postgres \
  psql -d exitsaas_prod -c "SELECT * FROM pg_stat_statements LIMIT 10"

# Check Nginx latency
curl -w "@curl-format.txt" https://api.example.com/health

# Monitor active connections
docker-compose exec -T postgres \
  psql -d exitsaas_prod -c "SELECT count(*) FROM pg_stat_activity"
```

---

## Rollback Procedures

### Quick Rollback (Green Deployment)

```bash
# If using green-blue deployment
docker-compose up -d api-green web-green

# Update load balancer to point to green

# Verify
curl -f http://localhost:3001/health
```

### Database Rollback

```bash
# List backups
ls -la /backups/db_*.sql

# Restore from backup
psql -d exitsaas_prod < /backups/db_20240101_020000.sql

# Verify restore
psql -d exitsaas_prod -c "SELECT COUNT(*) FROM users"
```

### Git Rollback

```bash
# Revert to previous version
git log --oneline | head -5
git revert <commit_hash>
git push origin main

# Redeploy
docker-compose down
git pull origin main
docker-compose up -d
```

---

## Maintenance Schedule

### Daily
- [ ] Monitor error logs
- [ ] Check system resources
- [ ] Verify backups ran

### Weekly
- [ ] Review performance metrics
- [ ] Check SSL certificate expiry (< 30 days)
- [ ] Update Docker images

### Monthly
- [ ] Security audit
- [ ] Database optimization
- [ ] Disaster recovery test

### Quarterly
- [ ] Load testing
- [ ] Capacity planning
- [ ] Security patching

---

## Support & Escalation

### Getting Help

1. Check logs: `docker-compose logs -f api`
2. Check monitoring dashboard
3. Review runbooks (this guide)
4. Contact DevOps team
5. Emergency hotline: XXX-XXX-XXXX

### Production Runbook

**Issue**: Service down  
**Action**: Check health endpoint, review logs, perform rollback if needed  
**Escalate**: If unresolved in 15 minutes

**Issue**: High latency  
**Action**: Check database performance, monitor connections  
**Escalate**: If persists > 5 minutes

---

*Last Updated: 2024*  
*Version: 1.0*
