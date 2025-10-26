<!-- # GitHub Actions Secrets Template

## Environment Setup

Copy this template to `Settings → Secrets and variables → Actions` in your GitHub repository.

### Step 1: Generate SSH Keys

```bash
# Generate ED25519 SSH key pair (recommended)
ssh-keygen -t ed25519 -f ~/.ssh/github-deploy -N ""

# Or generate RSA key (4096 bits)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github-deploy -N ""

# View private key
cat ~/.ssh/github-deploy

# View public key
cat ~/.ssh/github-deploy.pub
```

### Step 2: Add Public Key to Servers

```bash
# On staging server
ssh user@staging.example.com
mkdir -p ~/.ssh
echo "PASTE_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
exit

# On production server
ssh user@api.example.com
mkdir -p ~/.ssh
echo "PASTE_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
exit
```

### Step 3: Create GitHub Personal Access Token (PAT)

1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Click "Generate new token"
3. Set scopes: `read:packages`, `write:packages`
4. Save the token (you won't see it again)

## Required Secrets Template

Add these secrets to your GitHub repository:

```
DOCKER_REGISTRY=ghcr.io
DOCKER_USERNAME=your-github-username
DOCKER_PASSWORD=github_pat_xxxxxxxxxxxxxxxxxxxxx
DEPLOY_HOST=staging.example.com
DEPLOY_USER=deploy
DEPLOY_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
           [PASTE FULL PRIVATE KEY HERE]
           -----END OPENSSH PRIVATE KEY-----
DEPLOY_PATH=/opt/exitsaas
PROD_DEPLOY_HOST=api.example.com
PROD_DEPLOY_USER=deploy
PROD_DEPLOY_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
                [PASTE FULL PRIVATE KEY HERE]
                -----END OPENSSH PRIVATE KEY-----
PROD_DEPLOY_PATH=/opt/exitsaas-prod
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
```

## Secret Descriptions

### Docker Registry (Required for image storage)
- **DOCKER_REGISTRY**: Container registry URL
  - Example: `ghcr.io` (GitHub Container Registry)
  - Or: `docker.io` (Docker Hub)
  - Or: `your-registry.azurecr.io` (Azure)

- **DOCKER_USERNAME**: Username for registry login
  - GitHub: Your username
  - Docker Hub: Your Docker Hub username
  - Azure: Service principal ID

- **DOCKER_PASSWORD**: Authentication token
  - GitHub: Personal Access Token with package write scope
  - Docker Hub: Docker Hub access token
  - Azure: Service principal password

### Staging Deployment (Required for staging environments)
- **DEPLOY_HOST**: Staging server hostname or IP
  - Example: `staging.example.com` or `192.168.1.10`
  - Must be accessible from GitHub Actions runners

- **DEPLOY_USER**: SSH user for deployment
  - Example: `deploy` or `ubuntu`
  - Must have permissions to docker commands

- **DEPLOY_KEY**: Private SSH key
  - Generated with `ssh-keygen` (ED25519 or RSA)
  - Paste entire key including BEGIN/END lines
  - Must match public key on server

- **DEPLOY_PATH**: Application directory on server
  - Example: `/opt/exitsaas`
  - Must be writable by DEPLOY_USER
  - Must contain docker-compose.yml

### Production Deployment (Required for production environments)
- **PROD_DEPLOY_HOST**: Production server hostname
  - Example: `api.example.com` or `10.0.0.5`

- **PROD_DEPLOY_USER**: Production SSH user
  - Example: `deploy` or `prod-deploy`

- **PROD_DEPLOY_KEY**: Production SSH private key
  - Separate key from staging for security
  - Generate new key pair for production

- **PROD_DEPLOY_PATH**: Production app directory
  - Example: `/opt/exitsaas-prod`
  - Must be different from staging for safety

### Notifications (Optional)
- **SLACK_WEBHOOK**: Slack incoming webhook URL
  - Create at https://api.slack.com/messaging/webhooks
  - Example: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXX`
  - Workflows will post deployment status to Slack

### AWS Integration (Optional, if using AWS)
- **AWS_ACCESS_KEY_ID**: AWS IAM access key
  - Create at https://console.aws.amazon.com/iam/
  - Must have permissions for EC2, ECR, etc.

- **AWS_SECRET_ACCESS_KEY**: AWS IAM secret key
  - Keep secret, never commit

- **AWS_REGION**: AWS region
  - Example: `us-east-1`, `eu-west-1`

## Adding Secrets to GitHub

### Via Web UI
1. Go to your repository
2. Navigate to `Settings` → `Secrets and variables` → `Actions`
3. Click `New repository secret`
4. Enter name (e.g., `DEPLOY_HOST`)
5. Paste value
6. Click `Add secret`

### Via GitHub CLI
```bash
# Install GitHub CLI
# See https://cli.github.com/

# Login
gh auth login

# Add secret
gh secret set DEPLOY_HOST -b "staging.example.com" --repo owner/repo

# View all secrets
gh secret list --repo owner/repo

# Delete secret
gh secret delete DEPLOY_HOST --repo owner/repo
```

## Secret Rotation & Security

### Rotate Deployment Keys Quarterly
```bash
# 1. Generate new key pair
ssh-keygen -t ed25519 -f ~/.ssh/github-deploy-new -N ""

# 2. Add new public key to servers
ssh user@server 'echo "NEW_PUBLIC_KEY" >> ~/.ssh/authorized_keys'

# 3. Update GitHub secret with new private key
gh secret set DEPLOY_KEY -b "$(cat ~/.ssh/github-deploy-new)"

# 4. Verify new key works by triggering workflow
# 5. Remove old public key from servers
ssh user@server 'grep -v "OLD_PUBLIC_KEY" ~/.ssh/authorized_keys > /tmp/auth && mv /tmp/auth ~/.ssh/authorized_keys'

# 6. Backup and delete old key
mv ~/.ssh/github-deploy ~/.ssh/github-deploy.backup
```

### Audit Secret Access
- Check GitHub audit log: `Settings → Audit log`
- Search for secret-related activities
- Monitor for unauthorized access attempts

## Verify Secrets are Working

### Test SSH Connection
```bash
# Test deployment user can connect
ssh -i ~/.ssh/github-deploy deploy@staging.example.com "docker ps"

# If fails, check:
# 1. Public key in ~/.ssh/authorized_keys on server
# 2. SSH permissions: chmod 600 ~/.ssh/authorized_keys
# 3. SSH daemon running: systemctl status ssh
# 4. Firewall allows SSH: sudo ufw allow 22
```

### Test Docker Registry
```bash
# Login to registry
docker login ghcr.io -u your-username -p $(cat ~/.github_pat)

# Pull test image
docker pull ghcr.io/your-username/test:latest

# If fails, check:
# 1. PAT has read:packages, write:packages scope
# 2. PAT not expired (90 days max)
# 3. Registry URL correct
```

### Test Slack Webhook
```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test message"}' \
  YOUR_WEBHOOK_URL

# Should receive message in Slack channel
```

## Secrets File Example (.env on servers)

Create `.env` files on your servers matching this template:

### Staging `.env` at `/opt/exitsaas/.env`
```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=exitsaas_staging
DB_USER=postgres
DB_PASSWORD=secure_password_here

# API Server
API_PORT=3000
NODE_ENV=staging
JWT_SECRET=staging_jwt_secret_key_here
JWT_EXPIRY=24h

# Frontend
ANGULAR_API_URL=https://api-staging.example.com
ANGULAR_ENV=staging

# Mail Service (optional)
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=noreply@example.com
MAIL_PASSWORD=email_password_here

# Monitoring
LOG_LEVEL=debug
```

### Production `.env` at `/opt/exitsaas-prod/.env`
```bash
# Database
DB_HOST=postgres-prod
DB_PORT=5432
DB_NAME=exitsaas_prod
DB_USER=postgres
DB_PASSWORD=very_secure_production_password_here

# API Server
API_PORT=3000
NODE_ENV=production
JWT_SECRET=production_jwt_secret_key_here_very_long
JWT_EXPIRY=24h

# Frontend
ANGULAR_API_URL=https://api.example.com
ANGULAR_ENV=production

# Mail Service
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USER=apikey
MAIL_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxx

# Monitoring
LOG_LEVEL=warn
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# SSL/TLS
SSL_CERT_PATH=/etc/ssl/certs/example.com.crt
SSL_KEY_PATH=/etc/ssl/private/example.com.key
```

## Troubleshooting

### Secret Not Found in Workflow
- Ensure secret name matches exactly (case-sensitive)
- Secret must be in repository, not organization
- Check secret is not restricted to specific branches

### SSH Connection Timeout
- Check firewall allows port 22 from GitHub runners
- Verify server IP/hostname is correct
- Test manual SSH: `ssh -i key.pem user@host`

### Docker Push Fails
- Verify registry credentials are correct
- Check Docker image name format
- Ensure repository exists in registry
- Check image size limits for registry

### Slack Notification Not Received
- Verify webhook URL is correct and still valid
- Check Slack app permissions
- Ensure channel is correct
- Look for failed deliveries in Slack app logs

## References

- [GitHub Actions Security Best Practices](https://docs.github.com/en/actions/security-guides)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [SSH Key Best Practices](https://wiki.debian.org/SSH) -->
