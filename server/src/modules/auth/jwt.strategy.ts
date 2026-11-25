import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthRepository } from './auth.repository';
import { toUiRole } from '../../common/utils/serializers';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authRepo: AuthRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'servicehub-dev-jwt-secret-change-in-production',
    });
  }

  async validate(payload: { sub: string; email: string; role: string; isSuperUser?: boolean }) {
    const account = await this.authRepo.findAccountById(payload.sub);
    if (!account) throw new UnauthorizedException('User session is no longer valid.');
    return {
      id: account.id,
      email: account.email,
      name: account.name,
      role: toUiRole(account.role),
      isSuperUser:
        Boolean(account.isSuperUser) ||
        String(account.role).toUpperCase() === 'SUPER_ADMIN' ||
        account.id === 'user-admin-1',
    };
  }
}
