import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';
import { JwtPayLoad, type RequestWithJWT } from '../../auth/types/auth-types';

// Adjust these two imports to wherever your JWT types actually live.
// RequestWithJWT/JwtPayLoad already exist per your AuthController —
// this guard just assumes `role` has been added to JwtPayLoad.

/**
 * Must run AFTER JwtGuard (JwtGuard populates req.user):
 *   @UseGuards(JwtGuard, RolesGuard)
 *   @Roles(Role.ADMIN)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() on the route -> any authenticated user may proceed
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<RequestWithJWT>();
    const user = request.user as JwtPayLoad;

    if (!user) {
      throw new ForbiddenException('Not authenticated');
    }

    // Superadmin implicitly holds every privilege
    if (user.role === Role.SUPERADMIN) return true;

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return true;
  }
}
