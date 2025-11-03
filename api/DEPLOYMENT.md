# NestJS API - Deployment Guide

## Production Deployment Checklist

### 1. Environment Configuration

Create production `.env` file:

```env
# Server
NODE_ENV=production
PORT=3000

# Database (Use production credentials)
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=exits_saas_production
DB_USER=your_db_user
DB_PASSWORD=your_secure_db_password

# JWT (Use strong random secrets)
JWT_SECRET=use-openssl-rand-hex-64-to-generate
JWT_REFRESH_SECRET=use-openssl-rand-hex-64-to-generate

# CORS (Your frontend domain)
CORS_ORIGIN=https://your-domain.com

# Optional: Redis (if using caching)
REDIS_HOST=localhost
REDIS_PORT=6379
```

Generate secure secrets:
```bash
openssl rand -hex 64  # For JWT_SECRET
openssl rand -hex 64  # For JWT_REFRESH_SECRET
```

### 2. Build Application

```bash
cd api
npm install --production
npm run build
```

This creates the `dist/` folder with compiled JavaScript.

### 3. Database Setup

```bash
# Run migrations on production database
npm run migrate:latest

# Verify migration status
npm run migrate:status
```

### 4. Start Application

#### Option A: Direct Start
```bash
npm run start:prod
```

#### Option B: PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start dist/main.js --name "nestjs-api" -i max

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

#### Option C: Systemd Service
Create `/etc/systemd/system/nestjs-api.service`:

```ini
[Unit]
Description=NestJS API Service
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/api
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /var/www/api/dist/main.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable nestjs-api
sudo systemctl start nestjs-api
sudo systemctl status nestjs-api
```

### 5. Nginx Configuration

#### Reverse Proxy Setup

```nginx
upstream nestjs_api {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name api.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Proxy to NestJS
    location / {
        proxy_pass http://nestjs_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://nestjs_api;
        access_log off;
    }
}
```

Test and reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.your-domain.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

### 7. Firewall Configuration

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Block direct access to Node.js port
sudo ufw deny 3000/tcp

# Enable firewall
sudo ufw enable
```

### 8. Monitoring Setup

#### PM2 Monitoring
```bash
# View logs
pm2 logs nestjs-api

# Monitor resources
pm2 monit

# Application info
pm2 info nestjs-api
```

#### Log Rotation
Create `/etc/logrotate.d/nestjs-api`:

```
/var/www/api/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 9. Health Checks

#### Application Health Check
```bash
curl https://api.your-domain.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-31T10:17:21.000Z"
}
```

#### Database Connection Check
The application logs will show:
```
✅ Database connection established successfully
```

### 10. Backup Strategy

#### Database Backups
```bash
# Create backup script: /var/scripts/backup-db.sh
#!/bin/bash
BACKUP_DIR="/var/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U your_db_user exits_saas_production > $BACKUP_DIR/db_$DATE.sql
gzip $BACKUP_DIR/db_$DATE.sql
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete
```

Add to crontab:
```bash
# Daily backup at 2 AM
0 2 * * * /var/scripts/backup-db.sh
```

#### Application Backups
```bash
# Backup application files and .env
tar -czf nestjs-api-backup-$(date +%Y%m%d).tar.gz \
  /var/www/api \
  --exclude=/var/www/api/node_modules \
  --exclude=/var/www/api/dist
```

## Docker Deployment (Alternative)

### Dockerfile
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/knexfile.ts ./
COPY --from=builder /app/src/migrations ./src/migrations

EXPOSE 3000

CMD ["node", "dist/main"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  api:
    build: ./api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=exits_saas
      - DB_USER=postgres
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=exits_saas
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

Build and run:
```bash
docker-compose up -d
```

## CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy NestJS API

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd api
          npm ci
      
      - name: Run tests
        run: |
          cd api
          npm test
      
      - name: Build
        run: |
          cd api
          npm run build
      
      - name: Deploy to server
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          source: "api/dist,api/package*.json"
          target: "/var/www/"
      
      - name: Restart application
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /var/www/api
            npm ci --production
            pm2 restart nestjs-api
```

## Performance Optimization

### 1. Enable Compression
Already handled by Nginx, but can add to NestJS:

```typescript
// main.ts
import * as compression from 'compression';
app.use(compression());
```

### 2. Add Redis Caching (Optional)
```bash
npm install @nestjs/cache-manager cache-manager-redis-store
```

### 3. Database Connection Pooling
Already configured in Knex:
```typescript
pool: { min: 2, max: 10 }
```

### 4. Rate Limiting
```bash
npm install @nestjs/throttler
```

## Security Hardening

### 1. Environment Variables
- Never commit `.env` to git
- Use secrets management (AWS Secrets Manager, HashiCorp Vault)

### 2. Database Security
- Use strong passwords
- Limit database user permissions
- Enable SSL for database connections

### 3. API Security
- Helmet (already enabled)
- CORS (configured)
- Rate limiting (can add)
- Input validation (already enabled)

### 4. Server Security
- Keep system updated: `sudo apt update && sudo apt upgrade`
- Disable root login via SSH
- Use SSH keys, not passwords
- Install fail2ban: `sudo apt install fail2ban`

## Troubleshooting

### Application Won't Start
```bash
# Check logs
pm2 logs nestjs-api

# Common issues:
# - Database connection failed (check DB_HOST, credentials)
# - Port already in use (check with: lsof -i :3000)
# - Missing environment variables (verify .env file)
```

### 502 Bad Gateway
```bash
# Check if application is running
pm2 status

# Check Nginx error log
sudo tail -f /var/log/nginx/error.log

# Restart application
pm2 restart nestjs-api
```

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Check if migrations are applied
npm run migrate:status
```

### High Memory Usage
```bash
# Check PM2 cluster mode
pm2 start dist/main.js -i max

# Monitor memory
pm2 monit

# Restart if needed
pm2 restart nestjs-api
```

## Rollback Procedure

If deployment fails:

```bash
# 1. Stop new version
pm2 stop nestjs-api

# 2. Restore previous version
cd /var/www/api
git checkout <previous-commit>
npm ci --production
npm run build

# 3. Restart
pm2 restart nestjs-api

# 4. Rollback database migrations (if needed)
npm run migrate:rollback
```

## Post-Deployment Verification

```bash
# 1. Health check
curl https://api.your-domain.com/api/health

# 2. Test login
curl -X POST https://api.your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your_password"}'

# 3. Check logs for errors
pm2 logs nestjs-api --lines 100

# 4. Monitor for 24 hours
pm2 monit
```

---

## Support Contacts

- **DevOps**: devops@your-company.com
- **Backend Team**: backend@your-company.com
- **On-call**: +1-xxx-xxx-xxxx

**Deployment Status**: ✅ Ready for Production
