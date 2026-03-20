import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Role, User } from '@prisma/client'

import { ROLES_KEY } from '../../common/decorators/roles.decorator'

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRoles) return true

    const { user } = context.switchToHttp().getRequest<{ user: User }>()

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Accès réservé aux administrateurs d\'école')
    }

    return true
  }
}
