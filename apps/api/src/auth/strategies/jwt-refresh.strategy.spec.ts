import { UnauthorizedException } from '@nestjs/common'

// Mock PassportStrategy before importing the strategy
jest.mock('@nestjs/passport', () => ({
  PassportStrategy: () => class {},
}))
jest.mock('passport-jwt', () => ({
  ExtractJwt: { fromAuthHeaderAsBearerToken: jest.fn().mockReturnValue(jest.fn()) },
  Strategy: jest.fn(),
}))

import { JwtRefreshStrategy } from './jwt-refresh.strategy'

const mockPrisma = {
  user: { findUnique: jest.fn() },
}
const mockConfig = {
  getOrThrow: jest.fn().mockReturnValue('test-refresh-secret'),
}

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  refreshToken: 'hashed-refresh-token',
}

const makeRequest = (authHeader?: string) => ({
  get: jest.fn().mockReturnValue(authHeader),
})

describe('JwtRefreshStrategy', () => {
  let strategy: JwtRefreshStrategy

  beforeEach(() => {
    strategy = new JwtRefreshStrategy(mockConfig as any, mockPrisma as any)
    jest.clearAllMocks()
  })

  it('throws UnauthorizedException when Authorization header is missing', async () => {
    const req = makeRequest(undefined)

    await expect(
      strategy.validate(req as any, { sub: 'user-1', email: 'test@example.com' }),
    ).rejects.toThrow(UnauthorizedException)
  })

  it('throws UnauthorizedException when user does not exist', async () => {
    const req = makeRequest('Bearer some-refresh-token')
    mockPrisma.user.findUnique.mockResolvedValue(null)

    await expect(
      strategy.validate(req as any, { sub: 'user-1', email: 'test@example.com' }),
    ).rejects.toThrow(UnauthorizedException)
  })

  it('throws UnauthorizedException when user has no stored refreshToken', async () => {
    const req = makeRequest('Bearer some-refresh-token')
    mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, refreshToken: null })

    await expect(
      strategy.validate(req as any, { sub: 'user-1', email: 'test@example.com' }),
    ).rejects.toThrow(UnauthorizedException)
  })

  it('returns user merged with raw refreshToken on valid request', async () => {
    const req = makeRequest('Bearer raw-refresh-token')
    mockPrisma.user.findUnique.mockResolvedValue(mockUser)

    const result = await strategy.validate(req as any, { sub: 'user-1', email: 'test@example.com' })

    expect(result).toEqual({ ...mockUser, refreshToken: 'raw-refresh-token' })
  })
})
