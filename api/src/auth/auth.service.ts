import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { KnexService } from '../database/knex.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private knexService: KnexService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(email: string, password: string, ipAddress: string) {
    const knex = this.knexService.instance;

    // Fetch user with role
    const user = await knex('users')
      .select(
        'users.id',
        'users.email',
        'users.password_hash',
        'users.first_name',
        'users.last_name',
        'users.status',
        'users.tenant_id',
        'users.mfa_enabled',
        'roles.name as role_name',
      )
      .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
      .leftJoin('roles', 'user_roles.role_id', 'roles.id')
      .where({ 'users.email': email, 'users.status': 'active' })
      .first();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if MFA is enabled
    if (user.mfaEnabled) {
      return {
        mfaRequired: true,
        userId: user.id,
        email: user.email,
      };
    }

    // Fetch user permissions
    const permissions = await knex('user_roles')
      .select('permissions.permission_key')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .join('role_permissions', 'roles.id', 'role_permissions.role_id')
      .join('permissions', 'role_permissions.permission_id', 'permissions.id')
      .where({ 'user_roles.user_id': user.id, 'roles.status': 'active' })
      .distinct()
      .pluck('permission_key');

    console.log('🔐 AuthService.login() permissions for user', user.id, permissions);

    // Fetch user roles
    const roles = await knex('user_roles')
      .select('roles.id', 'roles.name', 'roles.description', 'roles.space', 'roles.status', 'roles.tenant_id')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where({ 'user_roles.user_id': user.id })
      .orderBy('roles.name');

    // Fetch user's platforms from employee_product_access table
    let platforms = [];
    if (user.tenantId) {
      try {
        platforms = await knex('employee_product_access')
          .select('platform_type as productType', 'access_level as accessLevel', 'is_primary as isPrimary')
          .where({ user_id: user.id, status: 'active' })
          .orderBy([
            { column: 'is_primary', order: 'desc' },
            { column: 'platform_type', order: 'asc' }
          ]);
      } catch (platformErr) {
        // employee_product_access table might not exist - okay for admin logins
        platforms = [];
      }
    }

    // Generate tokens
    const payload = {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      permissions,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN') || '24h',
    });

    const refreshToken = this.jwtService.sign(
      { id: user.id, email: user.email, tenantId: user.tenantId },
      {
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
      },
    );

    // Store session
    const sessionHash = crypto
      .createHash('sha256')
      .update(accessToken)
      .digest('hex');

    await knex('user_sessions').insert({
      user_id: user.id,
      token_hash: sessionHash,
      refresh_token_hash: refreshToken,
      ip_address: ipAddress,
      user_agent: 'NestJS API',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      status: 'active',
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        tenantId: user.tenantId,
        role: user.roleName,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
      permissions,
      roles,
      platforms,
    };
  }

  async logout(userId: number) {
    const knex = this.knexService.instance;

    await knex('user_sessions')
      .where({ user_id: userId, status: 'active' })
      .update({ status: 'revoked', updated_at: knex.fn.now() });

    return { message: 'Logged out successfully' };
  }

  async refreshToken(oldRefreshToken: string) {
    try {
      const payload = this.jwtService.verify(oldRefreshToken);
      const knex = this.knexService.instance;

      // Verify session exists
      const session = await knex('user_sessions')
        .where({
          refresh_token_hash: oldRefreshToken,
          status: 'active',
        })
        .first();

      if (!session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Fetch user permissions
      const permissions = await knex('user_roles')
        .select('permissions.permission_key')
        .join('roles', 'user_roles.role_id', 'roles.id')
        .join('role_permissions', 'roles.id', 'role_permissions.role_id')
        .join('permissions', 'role_permissions.permission_id', 'permissions.id')
        .where({ 'user_roles.user_id': payload.id, 'roles.status': 'active' })
        .distinct()
        .pluck('permission_key');

      console.log('🔐 AuthService.refreshToken() permissions for user', payload.id, permissions);

      // Generate new tokens
      const newAccessToken = this.jwtService.sign(
        {
          id: payload.id,
          email: payload.email,
          tenantId: payload.tenantId,
          permissions,
        },
        {
          expiresIn: this.configService.get('JWT_EXPIRES_IN') || '24h',
        },
      );

      const newRefreshToken = this.jwtService.sign(
        { id: payload.id, email: payload.email, tenantId: payload.tenantId },
        {
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
        },
      );

      // Update session
      const newSessionHash = crypto
        .createHash('sha256')
        .update(newAccessToken)
        .digest('hex');

      await knex('user_sessions')
        .where({ id: session.id })
        .update({
          token_hash: newSessionHash,
          refresh_token_hash: newRefreshToken,
          updated_at: knex.fn.now(),
        });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(userId: number) {
    const knex = this.knexService.instance;

    const user = await knex('users')
      .select('id', 'email', 'first_name', 'last_name', 'tenant_id', 'status')
      .where({ id: userId })
      .first();

    if (!user || user.status !== 'active') {
      return null;
    }

    return user;
  }

  async getUserPermissions(userId: number) {
    const knex = this.knexService.instance;

    const permissions = await knex('user_roles')
      .select(
        'permissions.id',
        'permissions.permission_key as permissionKey',
        'permissions.resource',
        'permissions.action',
        'permissions.description',
        'permissions.space'
      )
      .join('roles', 'user_roles.role_id', 'roles.id')
      .join('role_permissions', 'roles.id', 'role_permissions.role_id')
      .join('permissions', 'role_permissions.permission_id', 'permissions.id')
      .where({ 'user_roles.user_id': userId, 'roles.status': 'active' })
      .distinct();

    return permissions;
  }

  async checkEmailExists(email: string, excludeUserId?: number): Promise<boolean> {
    const knex = this.knexService.instance;

    const query = knex('users')
      .where({ email })
      .first();

    // If updating an existing user, exclude their current email from the check
    if (excludeUserId) {
      query.whereNot({ id: excludeUserId });
    }

    const user = await query;
    return !!user;
  }
}
