import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('Authentication required.');

    const normalizedUserRole = String(user.role || '').toLowerCase();
    const isSuper = user.isSuperUser === true || normalizedUserRole === 'super_admin';
    const expanded = normalizedUserRole === 'super_admin' ? ['admin', 'super_admin'] : [normalizedUserRole];

    const allowed = requiredRoles.some((role) => {
      const target = role.toLowerCase();
      if (target === 'super_admin') return isSuper;
      return expanded.includes(target);
    });

    if (!allowed) {
      throw new ForbiddenException('You do not have permission to perform this action.');
    }
    return true;
  }
}
