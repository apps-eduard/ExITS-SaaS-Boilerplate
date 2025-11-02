import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    if (payload?.type === 'customer') {
      return {
        id: payload.userId,
        customerId: payload.customerId,
        tenantId: payload.tenantId,
        type: payload.type,
        permissions: payload.permissions || [],
      };
    }

    const userId = payload?.id ?? payload?.userId;
    if (!userId) {
      return null;
    }

    const user = await this.authService.validateUser(userId);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      permissions: payload.permissions || [],
    };
  }
}
