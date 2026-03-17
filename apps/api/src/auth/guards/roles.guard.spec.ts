import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { PLANS_KEY, RolesGuard } from './roles.guard'

const makeContext = (user: { plan: string }): ExecutionContext =>
  ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  }) as unknown as ExecutionContext

describe('RolesGuard', () => {
  let guard: RolesGuard
  let reflector: jest.Mocked<Reflector>

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as unknown as jest.Mocked<Reflector>
    guard = new RolesGuard(reflector)
  })

  it('allows access when no plan restriction is defined', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined)

    const result = guard.canActivate(makeContext({ plan: 'FREE' }))

    expect(result).toBe(true)
  })

  it('allows access when user has a required plan', () => {
    reflector.getAllAndOverride.mockReturnValue(['PRO', 'ENTERPRISE'])

    const result = guard.canActivate(makeContext({ plan: 'PRO' }))

    expect(result).toBe(true)
  })

  it('denies access when user does not have a required plan', () => {
    reflector.getAllAndOverride.mockReturnValue(['PRO', 'ENTERPRISE'])

    const result = guard.canActivate(makeContext({ plan: 'FREE' }))

    expect(result).toBe(false)
  })

  it('uses the correct metadata key', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined)
    const ctx = makeContext({ plan: 'FREE' })

    guard.canActivate(ctx)

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(PLANS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ])
  })
})
