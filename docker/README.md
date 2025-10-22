# Docker & Deployment Scripts

Scripts and documentation for Docker containerization and deployment.

## Contents
- `docker-compose.yml` - Main Docker Compose configuration
- `docker-compose.prod.yml` - Production overrides
- `.env.example` - Environment variables template
- `api/Dockerfile` - API container build
- `web/Dockerfile` - Web container build
- `nginx/` - Nginx configuration

<!-- ## Quick Start -->

### 1. Setup Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 2. Build & Run
```bash
# Development
docker-compose up

# With pgAdmin
docker-compose --profile dev up

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 3. Access Services
- API: http://localhost:3000/api
- Web: http://localhost:4200
- Nginx: http://localhost:80
- pgAdmin: http://localhost:5050 (dev only)

## Services

### PostgreSQL Database
- Image: `postgres:15-alpine`
- Volume: `postgres_data` (persistent)
- Health checks enabled
- Connection pooling (20 connections)

### API Service
- Multi-stage build for small image
- Non-root user (nodejs:nodejs)
- Health checks
- Environment-based configuration
- Logs volume

### Web Frontend
- Angular production build
- Nginx server
- SPA routing configured
- Gzip compression

### Nginx Proxy
- SSL/TLS support (configure certificates)
- Rate limiting
- Caching (static & API)
- Security headers
- Health checks

## Production Deployment

### Prerequisites
- Docker & Docker Compose
- SSL certificates in `nginx/ssl/`
- Configured `.env` file
- Sufficient system resources

### Deployment Steps

1. **Prepare SSL Certificates**
   ```bash
   mkdir -p nginx/ssl
   # Add cert.pem and key.pem
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Set production values in .env
   ```

3. **Start Services**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

4. **Verify Health**
   ```bash
   docker-compose ps
   curl http://localhost/health
   ```

### Monitoring & Maintenance

View Logs
```bash
docker-compose logs -f api
docker-compose logs -f nginx
```

Database Backup
```bash
docker-compose exec postgres pg_dump -U postgres exitsaas > backup.sql
```

Database Restore
```bash
docker-compose exec -T postgres psql -U postgres exitsaas < backup.sql
```

Resource Usage
```bash
docker stats
```

Stop Services
```bash
docker-compose down

# With volume cleanup
docker-compose down -v
```

## Network
All containers are connected via `exitsaas-network` bridge network.

## Volumes
- `postgres_data` - Database persistence
- `pgadmin_data` - pgAdmin configuration
- `nginx_cache` - Nginx caching

## Resource Limits (Production)

### API
- CPU: 1 core (limit), 0.5 core (reservation)
- Memory: 512MB (limit), 256MB (reservation)

### Web
- CPU: 0.5 core (limit), 0.25 core (reservation)
- Memory: 256MB (limit), 128MB (reservation)

### Nginx
- CPU: 0.5 core (limit), 0.25 core (reservation)
- Memory: 256MB (limit), 128MB (reservation)

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs service-name

# Rebuild
docker-compose build --no-cache api
docker-compose up
```

### Database Connection Issues
```bash
# Check PostgreSQL
docker-compose exec postgres psql -U postgres -c "SELECT 1"

# Check network
docker network inspect exitsaas-network
```

### Nginx Issues
```bash
# Check configuration
docker-compose exec nginx nginx -t

# Reload configuration
docker-compose exec nginx nginx -s reload
```

## Cleanup

Remove stopped containers
```bash
docker container prune
```

Remove unused images
```bash
docker image prune
```

Remove unused volumes
```bash
docker volume prune
```

Complete cleanup
```bash
docker system prune -a --volumes
```

## Next Steps

- Configure SSL/TLS certificates
- Setup monitoring (Prometheus, Grafana)
- Configure backups
- Setup log aggregation (ELK stack)
- Configure auto-scaling for Kubernetes
