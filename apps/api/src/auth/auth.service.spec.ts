import { BadRequestException, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import * as bcrypt from 'bcrypt'

import { MailService } from '../mail/mail.service'
import { PrismaService } from '../prisma/prisma.service'
import { AuthService } from './auth.service'

jest.mock('bcrypt')

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  password: 'hashed-password',
  name: 'Test User',
  avatar: null,
  plan: 'FREE',
  refreshToken: 'hashed-refresh-token',
  resetPasswordToken: null,
  resetPasswordExpiry: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('AuthService', () => {
  let service: AuthService
  let prisma: { user: jest.Mocked<Record<string, jest.Mock>> }
  let jwt: jest.Mocked<Pick<JwtService, 'signAsync' | 'verifyAsync'>>
  let mail: jest.Mocked<Pick<MailService, 'sendPasswordResetEmail'>>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('test-secret'),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendPasswordResetEmail: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get(AuthService)
    prisma = module.get(PrismaService)
    jwt = module.get(JwtService)
    mail = module.get(MailService)
  })

  afterEach(() => jest.clearAllMocks())

  // ─── register ────────────────────────────────────────────────────────────────

  describe('register', () => {
    it('throws BadRequestException when email is already in use', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser)

      await expect(
        service.register({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(BadRequestException)
    })

    it('hashes the password before saving', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password')
      prisma.user.create.mockResolvedValue(mockUser)
      ;(jwt.signAsync as jest.Mock)
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token')
      prisma.user.update.mockResolvedValue(mockUser)

      await service.register({ email: 'test@example.com', password: 'password123' })

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10)
    })

    it('returns tokens and sanitized user (no password, no refreshToken)', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password')
      prisma.user.create.mockResolvedValue(mockUser)
      ;(jwt.signAsync as jest.Mock)
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token')
      prisma.user.update.mockResolvedValue(mockUser)

      const result = await service.register({ email: 'test@example.com', password: 'password123' })

      expect(result.tokens).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' })
      expect(result.user).not.toHaveProperty('password')
      expect(result.user).not.toHaveProperty('refreshToken')
      expect(result.user.email).toBe('test@example.com')
    })
  })

  // ─── login ───────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('throws UnauthorizedException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(
        service.login({ email: 'unknown@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('throws UnauthorizedException when user has no password (OAuth-only account)', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, password: null })

      await expect(
        service.login({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('throws UnauthorizedException when password is incorrect', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('returns tokens and sanitized user on valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(jwt.signAsync as jest.Mock)
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token')
      prisma.user.update.mockResolvedValue(mockUser)

      const result = await service.login({ email: 'test@example.com', password: 'password123' })

      expect(result.tokens).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' })
      expect(result.user).not.toHaveProperty('password')
      expect(result.user).not.toHaveProperty('refreshToken')
    })
  })

  // ─── logout ──────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('clears the refreshToken in database', async () => {
      prisma.user.update.mockResolvedValue({ ...mockUser, refreshToken: null })

      await service.logout('user-1')

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { refreshToken: null },
      })
    })
  })

  // ─── refresh ─────────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('throws UnauthorizedException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(service.refresh('user-1', 'raw-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('throws UnauthorizedException when user has no stored refreshToken', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, refreshToken: null })

      await expect(service.refresh('user-1', 'raw-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('throws UnauthorizedException when refresh token does not match', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await expect(service.refresh('user-1', 'wrong-token')).rejects.toThrow(UnauthorizedException)
    })

    it('returns new tokens when refresh token is valid', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(jwt.signAsync as jest.Mock)
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token')
      prisma.user.update.mockResolvedValue(mockUser)

      const result = await service.refresh('user-1', 'raw-refresh-token')

      expect(result).toEqual({ accessToken: 'new-access-token', refreshToken: 'new-refresh-token' })
    })
  })

  // ─── forgotPassword ──────────────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('does nothing (no error, no email) when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(service.forgotPassword('unknown@example.com')).resolves.toBeUndefined()
      expect(mail.sendPasswordResetEmail).not.toHaveBeenCalled()
    })

    it('saves a reset token and sends reset email when user exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser)
      prisma.user.update.mockResolvedValue(mockUser)
      ;(mail.sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined)

      await service.forgotPassword('test@example.com')

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({
            resetPasswordToken: expect.any(String),
            resetPasswordExpiry: expect.any(Date),
          }),
        }),
      )
      expect(mail.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
        expect.any(String),
      )
    })
  })

  // ─── resetPassword ───────────────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('throws BadRequestException when token is invalid or expired', async () => {
      prisma.user.findFirst.mockResolvedValue(null)

      await expect(service.resetPassword('invalid-token', 'newpassword123')).rejects.toThrow(
        BadRequestException,
      )
    })

    it('hashes the new password and clears the reset token', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password')
      prisma.user.update.mockResolvedValue(mockUser)

      await service.resetPassword('valid-token', 'newpassword123')

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          password: 'new-hashed-password',
          resetPasswordToken: null,
          resetPasswordExpiry: null,
        },
      })
    })
  })

  // ─── exchangeOAuthCode ───────────────────────────────────────────────────────

  describe('exchangeOAuthCode', () => {
    it('throws UnauthorizedException when code is invalid or expired', async () => {
      ;(jwt.verifyAsync as jest.Mock).mockRejectedValue(new Error('jwt expired'))

      await expect(service.exchangeOAuthCode('expired-code')).rejects.toThrow(UnauthorizedException)
    })

    it('throws UnauthorizedException when token type is not oauth_code', async () => {
      ;(jwt.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'user-1', type: 'access' })

      await expect(service.exchangeOAuthCode('wrong-type-code')).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('throws UnauthorizedException when user no longer exists', async () => {
      ;(jwt.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'user-1', type: 'oauth_code' })
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(service.exchangeOAuthCode('valid-code')).rejects.toThrow(UnauthorizedException)
    })

    it('returns tokens and sanitized user on valid code', async () => {
      ;(jwt.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'user-1', type: 'oauth_code' })
      prisma.user.findUnique.mockResolvedValue(mockUser)
      ;(jwt.signAsync as jest.Mock)
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token')
      prisma.user.update.mockResolvedValue(mockUser)

      const result = await service.exchangeOAuthCode('unique-code')

      expect(result.tokens).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' })
      expect(result.user).not.toHaveProperty('password')
      expect(result.user).not.toHaveProperty('refreshToken')
    })

    it('throws UnauthorizedException when the same code is used twice', async () => {
      ;(jwt.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'user-1', type: 'oauth_code' })
      prisma.user.findUnique.mockResolvedValue(mockUser)
      ;(jwt.signAsync as jest.Mock)
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token')
      prisma.user.update.mockResolvedValue(mockUser)

      await service.exchangeOAuthCode('reused-code')

      await expect(service.exchangeOAuthCode('reused-code')).rejects.toThrow(UnauthorizedException)
    })
  })
})
