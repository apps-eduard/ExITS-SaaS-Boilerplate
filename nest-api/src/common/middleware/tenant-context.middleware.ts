import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Tenant context can be extracted from:
    // 1. JWT token (already in req.user.tenantId after JwtAuthGuard)
    // 2. Subdomain (if using subdomain routing)
    // 3. Custom header (X-Tenant-ID)

    const subdomain = this.extractSubdomain(req.hostname);
    if (subdomain) {
      (req as any).subdomain = subdomain;
    }

    const tenantHeader = req.headers['x-tenant-id'];
    if (tenantHeader) {
      (req as any).tenantId = parseInt(tenantHeader as string, 10);
    }

    next();
  }

  private extractSubdomain(hostname: string): string | null {
    // Extract subdomain from hostname (e.g., tenant1.example.com -> tenant1)
    const parts = hostname.split('.');
    if (parts.length > 2) {
      return parts[0];
    }
    return null;
  }
}
