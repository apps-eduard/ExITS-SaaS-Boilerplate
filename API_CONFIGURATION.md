# ExITS SaaS - API Configuration Guide

## Environment Configuration

The application uses environment-specific configurations to manage API endpoints and other settings.

### Web Application (Angular)

#### File Locations
- **Development**: `web/src/environments/environment.ts`
- **Production**: `web/src/environments/environment.prod.ts`

#### Configuration Structure

**Development (environment.ts):**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

**Production (environment.prod.ts):**
```typescript
export const environment = {
  production: true,
  apiUrl: '/api'  // Uses same host as frontend (recommended for production)
};
```

### How to Use in Services

All services should import the environment configuration and use it to set API URLs:

```typescript
import { environment } from '@env';

@Injectable({ providedIn: 'root' })
export class MyService {
  private readonly API_URL = `${environment.apiUrl}/my-endpoint`;

  constructor(private http: HttpClient) {}

  getData() {
    return this.http.get<any>(this.API_URL);
  }
}
```

### TypeScript Configuration (tsconfig.json)

Path aliases are configured for easy imports:

```json
{
  "compilerOptions": {
    "paths": {
      "@env": ["src/environments/environment"]
    }
  }
}
```

This allows you to import like:
```typescript
import { environment } from '@env';
```

## API Backend (Node.js/Express)

### File Location
- `api/.env`

### Configuration Variables

```env
# Database Configuration
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=exits_saas_db

# Server Configuration
PORT=3000
NODE_ENV=development

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:4200

# Redis Configuration (if using)
REDIS_HOST=localhost
REDIS_PORT=6379

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json
```

## Development Setup

### Starting Both Servers

**Option 1: Using setup.ps1 (Windows)**
```powershell
.\setup.ps1
```

**Option 2: Manual Setup**

Terminal 1 - API Server:
```bash
cd api
npm run dev
```

Terminal 2 - Web Server:
```bash
cd web
npm start
```

### Access Points

- **Web Application**: http://localhost:4200
- **API Backend**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-docs (if Swagger enabled)

## Production Deployment

### Environment Changes

1. **Web Application**
   - Build with production configuration: `npm run build:prod`
   - Angular will use `environment.prod.ts`
   - API calls use relative paths (same origin)

2. **API Backend**
   - Set `NODE_ENV=production`
   - Set appropriate `CORS_ORIGIN` for your production domain
   - Use secure `JWT_SECRET`

### Reverse Proxy Setup (Recommended)

For production, use a reverse proxy (nginx/Apache) to:
- Serve static web files
- Forward `/api/*` requests to the backend

**Example nginx configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Serve web application
    location / {
        root /path/to/web/dist;
        try_files $uri $uri/ /index.html;
    }

    # Forward API requests
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

### Issue: 404 Not Found on API Calls

**Cause**: Web app is trying to call API at wrong URL

**Solution**:
1. Check `web/src/environments/environment.ts` has correct `apiUrl`
2. Verify API server is running on correct port (default: 3000)
3. Check browser console Network tab for actual URL being called

### Issue: CORS Errors

**Cause**: API backend not allowing requests from web app origin

**Solution**:
1. Check `api/.env` has correct `CORS_ORIGIN`
2. Ensure it matches the web app's origin (http://localhost:4200 for dev)
3. Restart API server after changing `.env`

### Issue: API Calls Timing Out

**Cause**: API server not running or network issue

**Solution**:
1. Verify API server is running: `npm run dev` in `api/` directory
2. Check API logs for errors
3. Verify localhost:3000 is accessible: `curl http://localhost:3000/health`

### Issue: Token Expiration / Auth Issues

**Cause**: JWT token expired or invalid

**Solution**:
1. Check `JWT_EXPIRY` in `api/.env`
2. Clear browser local storage and re-login
3. Check API logs for token validation errors

## Customizing API URL

### For Different Environments

**Staging (environment.staging.ts):**
```typescript
export const environment = {
  production: false,
  apiUrl: 'https://api-staging.yourdomain.com'
};
```

**Update angular.json configurations:**
```json
{
  "configurations": {
    "staging": {
      "fileReplacements": [{
        "replace": "src/environments/environment.ts",
        "with": "src/environments/environment.staging.ts"
      }]
    }
  }
}
```

Build with: `ng build --configuration=staging`

## Security Notes

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use environment variables** for sensitive data in CI/CD
3. **Enable HTTPS** in production
4. **Rotate JWT secrets** regularly
5. **Use strong database passwords**
6. **Enable CORS only for trusted domains**

## Further Reading

- [Angular Environments Guide](https://angular.io/guide/build#configuring-application-environments)
- [12 Factor App - Config](https://12factor.net/config)
- [CORS Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
