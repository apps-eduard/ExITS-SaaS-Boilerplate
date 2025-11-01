import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract tenant ID from various sources
    const tenantId = 
      req.params.tenantId || 
      req.query.tenantId || 
      req.headers['x-tenant-id'] || 
      req.body?.tenantId;

    if (tenantId) {
      (req as any).tenantId = parseInt(tenantId as string, 10);
    }

    // Extract subdomain if needed
    const host = req.headers.host || '';
    const subdomain = host.split('.')[0];
    
    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      (req as any).subdomain = subdomain;
    }

    next();
  }
}
