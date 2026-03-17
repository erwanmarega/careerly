import { UnauthorizedException } from '@nestjs/common'

// Mock PassportStrategy before importing the strategy
jest.mock('@nestjs/passport', () => ({
  PassportStrategy: () => class {},
}))
jest.mock('passport-jwt', () => ({
  ExtractJwt: { fromAuthHeaderAsBearerToken: jest.fn().mockReturnValue(jest.fn()) },
  Strategy: jest.fn(),
}))

import { JwtStrategy } from './jwt.strategy'

const mockPrisma = {
  user: { findUnique: jest.fn() },
}
const mockConfig = {
  getOrThrow: jest.fn().mockReturnValue('test-secret'),
}

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
}

describe('JwtStrategy', () => {
  let strategy: JwtStrategy

  beforeEach(() => {
    strategy = new JwtStrategy(mockConfig as any, mockPrisma as any)
    jest.clearAllMocks()
  })

  it('returns the user when payload is valid and user exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser)

    const result = await strategy.validate({ sub: 'user-1', email: 'test@example.com' })

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } })
    expect(result).toEqual(mockUser)
  })

  it('throws UnauthorizedException when user does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)

    await expect(
      strategy.validate({ sub: 'unknown-id', email: 'ghost@example.com' }),
    ).rejects.toThrow(UnauthorizedException)
  })
})
