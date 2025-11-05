import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Guard to protect collector-only endpoints
 * Ensures:
 * 1. User can only access their own collector routes (or has admin permissions)
 * 2. User is actually a collector (has money-loan permissions)
 */
@Injectable()
export class CollectorGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const collectorId = request.params.collectorId;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!collectorId) {
      throw new ForbiddenException('Collector ID not provided');
    }

    const requestedCollectorId = parseInt(collectorId);
    
    // Allow if user is accessing their own collector routes
    if (user.id === requestedCollectorId) {
      return true;
    }

    // Check if user has admin/manager permissions to access other collectors
    const permissions = user.permissions || [];
    const hasManagePermission = permissions.some((p: string) => 
      p === 'money-loan:collector-management:manage' ||
      p === 'money-loan:collector-management:read' ||
      p === 'money-loan:manage'
    );

    if (hasManagePermission) {
      return true;
    }

    throw new ForbiddenException('You can only access your own collector routes');
  }
}
