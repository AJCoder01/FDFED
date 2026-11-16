import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  applyDecorators,
} from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Database } from "../common/database";
export const Public = () => applyDecorators(SetMetadata("public", true), ApiOperation({ security: [] }));
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private db: Database,
    private jwt: JwtService,
    private reflector: Reflector,
  ) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const optional = this.reflector.getAllAndOverride("public", [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (!token) {
      if (optional) return true;
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwt.verifyAsync(token);
      const s = await this.db.userSession.findUnique({
        where: { id: payload.sid },
        include: { user: true },
      });
      if (
        !s ||
        s.userId !== payload.sub ||
        s.revokedAt ||
        s.expiresAt < new Date() ||
        s.user.deletedAt
      )
        throw new Error();
      req.user = { ...s.user, sessionId: s.id, demoOriginId: s.demoOriginId };
      return true;
    } catch {
      throw new UnauthorizedException("Session expired.");
    }
  }
}
