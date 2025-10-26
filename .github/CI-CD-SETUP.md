<!-- # GitHub Actions CI/CD Configuration

## Overview

This project uses GitHub Actions to automate testing, building, linting, and deployment of all application components.

## Workflows

### 1. **api-test.yml** - API Testing & Linting
- **Triggers:** Push/PR to `main` or `develop` on `api/` changes
- **Services:** PostgreSQL 15 Alpine (test database)
- **Jobs:**
  - ESLint: Code style validation
  - Jest: Unit tests with coverage
  - Coverage upload to Codecov
- **Environment Variables:**
  - `DB_HOST`: localhost
  - `DB_PORT`: 5432
  - `DB_NAME`: exitsaas_test
  - `NODE_ENV`: test

### 2. **web-build.yml** - Angular Web Build & Test
- **Triggers:** Push/PR to `main` or `develop` on `web/` changes
- **Jobs:**
  - **build:** ESLint, production build
  - **test:** Jest tests with coverage
- **Artifacts:** Angular dist directory (5 days retention)

### 3. **mobile-build.yml** - Ionic Mobile Build & Test
- **Triggers:** Push/PR to `main` or `develop` on `mobile/` changes
- **Jobs:**
  - **build:** ESLint, production build
  - **test:** Jest tests with coverage
- **Artifacts:** Ionic www directory (5 days retention)

### 4. **docker-build.yml** - Docker Image Validation
- **Triggers:** Push/PR with Docker-related changes
- **Jobs:**
  - **build:** Docker Buildx multi-platform builds (cache only, no push)
  - **compose-test:** Validates docker-compose.yml syntax
  - **hadolint:** Dockerfile linting and best practices
- **Caching:** GitHub Actions Docker layer cache for faster builds

### 5. **deploy-staging.yml** - Staging Deployment
- **Triggers:** 
  - Auto: Push to `develop` branch
  - Manual: Workflow dispatch with environment selection
- **Jobs:**
  - Builds and pushes images to Docker registry
  - Deploys via SSH to staging server
  - Runs database migrations
  - Health checks verification
  - Slack notification
- **Secrets Required:**
  - `DOCKER_REGISTRY`: Docker registry URL (e.g., ghcr.io)
  - `DOCKER_USERNAME`: Registry username
  - `DOCKER_PASSWORD`: Registry PAT/token
  - `DEPLOY_HOST`: Staging server hostname
  - `DEPLOY_USER`: SSH user
  - `DEPLOY_KEY`: SSH private key
  - `DEPLOY_PATH`: Application path on server
  - `SLACK_WEBHOOK`: Slack notification webhook (optional)

### 6. **deploy-production.yml** - Production Deployment
- **Triggers:**
  - Push to `main` branch
  - Manual: Workflow dispatch
- **Jobs:**
  - **validate:** Code linting and build validation
  - **security:** Trivy vulnerability scanning
  - **deploy:** Production deployment with approval gate
- **Features:**
  - Pre-deployment validation
  - Security scanning (Trivy)
  - Database backup before deployment
  - Blue-green deployment strategy
  - Automatic release creation
  - Slack notifications
  - Failure alerts
- **Secrets Required:**
  - All staging secrets plus:
  - `PROD_DEPLOY_HOST`: Production server hostname
  - `PROD_DEPLOY_USER`: Production SSH user
  - `PROD_DEPLOY_KEY`: Production SSH private key
  - `PROD_DEPLOY_PATH`: Production app path

## Required Secrets

Add these secrets to your GitHub repository settings (`Settings → Secrets and variables → Actions`):

### Docker Registry
```
DOCKER_REGISTRY=ghcr.io
DOCKER_USERNAME=<your-username>
DOCKER_PASSWORD=<your-github-pat>
```

### Staging Deployment
```
DEPLOY_HOST=staging.example.com
DEPLOY_USER=deploy
DEPLOY_KEY=<your-ssh-private-key>
DEPLOY_PATH=/opt/exitsaas
```

### Production Deployment
```
PROD_DEPLOY_HOST=api.example.com
PROD_DEPLOY_USER=deploy
PROD_DEPLOY_KEY=<your-ssh-private-key>
PROD_DEPLOY_PATH=/opt/exitsaas-prod
```

### Notifications
```
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## Setup Instructions

### 1. Generate SSH Keys

```bash
# Generate SSH key pair (no passphrase)
ssh-keygen -t ed25519 -f ~/.ssh/github-deploy -N ""

# Add public key to server authorized_keys
cat ~/.ssh/github-deploy.pub | ssh user@server 'cat >> ~/.ssh/authorized_keys'

# Get private key for GitHub secret
cat ~/.ssh/github-deploy
```

### 2. GitHub Token for Docker Registry

```bash
# Create Personal Access Token (PAT) with read:packages, write:packages scope
# Use your GitHub username as DOCKER_USERNAME
# Use the PAT as DOCKER_PASSWORD
```

### 3. Configure Branch Protection

Enable branch protection on `main`:
- Require status checks to pass:
  - api-test
  - web-build
  - mobile-build
  - docker-build
- Require deployment approval for production

### 4. Create Environment Variables

**Staging Environment** (`Settings → Environments → staging`):
```
AUTO_DEPLOY=true
ENVIRONMENT=staging
```

**Production Environment** (`Settings → Environments → production`):
```
AUTO_DEPLOY=false
ENVIRONMENT=production
```
- Require manual approval
- Add approval branches: main

## Workflow Status Badges

Add to README.md:

```markdown
![API Tests](https://github.com/YOUR_ORG/ExITS-SaaS-Boilerplate/actions/workflows/api-test.yml/badge.svg)
![Web Build](https://github.com/YOUR_ORG/ExITS-SaaS-Boilerplate/actions/workflows/web-build.yml/badge.svg)
![Mobile Build](https://github.com/YOUR_ORG/ExITS-SaaS-Boilerplate/actions/workflows/mobile-build.yml/badge.svg)
![Production Deployment](https://github.com/YOUR_ORG/ExITS-SaaS-Boilerplate/actions/workflows/deploy-production.yml/badge.svg)
```

## Deployment Sequence

### Staging (Automatic on develop push)
1. Code pushed to `develop`
2. All tests run in parallel (API, Web, Mobile, Docker)
3. On success, images built and pushed
4. SSH deployed to staging server
5. Migrations run
6. Health checks verify
7. Slack notification sent

### Production (Manual approval on main push)
1. Code pushed to `main`
2. Validation and security scanning
3. Wait for manual approval
4. Build images
5. Create backup
6. Blue-green deployment
7. Migrations run
8. Health checks verify
9. Release created
10. Slack notification sent

## Monitoring & Troubleshooting

### View Workflow Logs
1. Go to `Actions` tab
2. Select workflow
3. Click run to see detailed logs
4. Each job has expandable sections

### Common Issues

**Build Cache Not Working**
- GitHub Actions cache limited to 5GB per branch
- Cleanup old workflows: `Settings → Actions → General → Artifact and log retention`

**Deployment Failing**
- Check SSH connectivity: `ssh -i ~/.ssh/github-deploy user@server`
- Verify `.env` file exists on server
- Check Docker Compose version: `docker-compose --version`

**Security Scanning Fails**
- Review Trivy scan results in Security tab
- Update base images to latest versions
- Create `.trivyignore` for approved vulnerabilities

**Database Migration Issues**
- Check migration files in `api/src/migrations/`
- Verify database credentials in `.env`
- Check PostgreSQL logs on server

## Best Practices

1. **Branch Strategy**
   - `main`: Production (stable releases)
   - `develop`: Staging (integration branch)
   - Feature branches: Feature-specific work

2. **Commit Messages**
   - Use conventional commits: `feat:`, `fix:`, `docs:`, etc.
   - Reference issues: `Closes #123`

3. **Testing**
   - Maintain >80% code coverage
   - Write tests before features (TDD)
   - Test edge cases and error scenarios

4. **Secrets Management**
   - Never commit `.env` files
   - Rotate secrets regularly
   - Use least privilege for deploy user
   - Use environment-specific secrets

5. **Deployment Safety**
   - Always backup database before production deploy
   - Use blue-green deployment for zero downtime
   - Monitor error logs post-deployment
   - Have rollback plan ready

## Performance Optimization

### Caching
- Node packages: `actions/setup-node@v3` with npm cache
- Docker layers: GitHub Actions Docker cache
- Build artifacts: 5-day retention

### Parallel Execution
- API, Web, Mobile builds run in parallel
- Staging deploy starts immediately after all builds pass
- Security scan runs alongside deployment preparation

### Reduced Build Times
- Alpine base images for smaller Docker images
- Multi-stage builds to exclude dev dependencies
- Shallow clones (default with actions/checkout@v3)

## Production Checklist

Before first production deployment:

- [ ] All secrets configured in GitHub
- [ ] SSH keys working for all servers
- [ ] Docker registry credentials valid
- [ ] Database backups working
- [ ] Slack webhooks configured
- [ ] Load balancer/DNS pointing to correct server
- [ ] SSL certificates configured on Nginx
- [ ] Monitoring/alerting configured
- [ ] Runbooks documented
- [ ] Rollback procedure tested

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Best Practices](https://docs.github.com/en/packages/container-registry)
- [SSH Keys with GitHub](https://docs.github.com/en/authentication/connecting-to-github-with-ssh) -->
