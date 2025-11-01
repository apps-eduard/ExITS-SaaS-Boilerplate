import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissionsService } from '../../rbac/permissions.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    if (Array.isArray(user.permissions) && user.permissions.length) {
      const requirement = new Set(requiredPermissions);
      const granted = new Set(user.permissions);
      const intersection = [...requirement].filter((permission) => granted.has(permission));
      if (intersection.length > 0) {
        return true;
      }
    }

    // For customer tokens without explicit permission records, allow read-only money-loan access
    if (user.type === 'customer') {
      const customerAllowed = new Set(['money-loan:read', 'money-loan:payments', 'money-loan:create']);
      if (requiredPermissions.every((permission) => customerAllowed.has(permission))) {
        return true;
      }
      return false;
    }

    // Check if user has any of the required permissions via RBAC service
    if (!user.id) {
      return false;
    }

    const checks = [];
    for (const permission of requiredPermissions) {
      const segments = permission.split(':');
      if (segments.length < 2) {
        checks.push({ permission, granted: false, reason: 'invalid-format' });
        continue;
      }
      const action = segments.pop();
      if (!action) {
        checks.push({ permission, granted: false, reason: 'missing-action' });
        continue;
      }
      const resource = segments.join(':');
      const hasPermission = await this.permissionsService.hasPermission(user.id, resource, action);
      checks.push({ permission, granted: hasPermission });
      if (hasPermission) {
        return true;
      }
    }

    console.warn('PermissionsGuard denied request', {
      userId: user.id,
      requiredPermissions,
      checks,
    });

    return false;
  }
}
