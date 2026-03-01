import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Plan, User } from '@prisma/client'

export const PLANS_KEY = 'plans'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPlans = this.reflector.getAllAndOverride<Plan[]>(PLANS_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredPlans) return true

    const { user } = context.switchToHttp().getRequest<{ user: User }>()
    return requiredPlans.includes(user.plan)
  }
}
