import { BadRequestException, UnauthorizedException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import * as bcrypt from 'bcrypt'

import { PrismaService } from '../prisma/prisma.service'
import { UsersService } from './users.service'

jest.mock('bcrypt')
jest.mock('fs', () => ({
  ...jest.requireActual<typeof import('fs')>('fs'),
  unlinkSync: jest.fn(),
}))

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashed-password',
  refreshToken: 'hashed-token',
  avatar: null,
  plan: 'FREE',
  onboardingCompleted: false,
  stripeCustomerId: null,
  resetPasswordToken: null,
  resetPasswordExpiry: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('UsersService', () => {
  let service: UsersService
  let prisma: { user: jest.Mocked<Record<string, jest.Mock>> }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUniqueOrThrow: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile()

    service = module.get(UsersService)
    prisma = module.get(PrismaService)
  })

  afterEach(() => jest.clearAllMocks())

  // ─── findById ────────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('returns sanitized user (no password, no refreshToken)', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue(mockUser)

      const result = await service.findById('user-1')

      expect(result).not.toHaveProperty('password')
      expect(result).not.toHaveProperty('refreshToken')
      expect(result.email).toBe('test@example.com')
    })
  })

  // ─── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('returns sanitized updated user', async () => {
      const updated = { ...mockUser, name: 'New Name' }
      prisma.user.update.mockResolvedValue(updated)

      const result = await service.update('user-1', { name: 'New Name' })

      expect(result.name).toBe('New Name')
      expect(result).not.toHaveProperty('password')
    })
  })

  // ─── updatePassword ──────────────────────────────────────────────────────────

  describe('updatePassword', () => {
    it('throws BadRequestException when user has a password but currentPassword is missing', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue(mockUser)

      await expect(
        service.updatePassword('user-1', { newPassword: 'newpass123' }),
      ).rejects.toThrow(BadRequestException)
    })

    it('throws UnauthorizedException when currentPassword is wrong', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await expect(
        service.updatePassword('user-1', { currentPassword: 'wrong', newPassword: 'newpass123' }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('hashes and saves new password when currentPassword is correct', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed')
      prisma.user.update.mockResolvedValue(mockUser)

      await service.updatePassword('user-1', { currentPassword: 'correct', newPassword: 'newpass123' })

      expect(bcrypt.hash).toHaveBeenCalledWith('newpass123', 10)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { password: 'new-hashed' },
      })
    })

    it('sets password directly when user has no existing password (OAuth user)', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue({ ...mockUser, password: null })
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed')
      prisma.user.update.mockResolvedValue(mockUser)

      await service.updatePassword('user-1', { newPassword: 'newpass123' })

      expect(bcrypt.compare).not.toHaveBeenCalled()
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { password: 'new-hashed' } }),
      )
    })
  })

  // ─── completeOnboarding ──────────────────────────────────────────────────────

  describe('completeOnboarding', () => {
    it('sets onboardingCompleted to true and returns sanitized user', async () => {
      const updated = { ...mockUser, onboardingCompleted: true }
      prisma.user.update.mockResolvedValue(updated)

      const result = await service.completeOnboarding('user-1')

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { onboardingCompleted: true },
      })
      expect(result).not.toHaveProperty('password')
    })
  })

  // ─── delete ──────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('calls prisma.user.delete with correct id', async () => {
      prisma.user.delete.mockResolvedValue(mockUser)

      await service.delete('user-1')

      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } })
    })
  })

  // ─── updateAvatar ────────────────────────────────────────────────────────────

  describe('updateAvatar', () => {
    it('saves new avatar URL and returns sanitized user', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, avatar: null })
      const updated = { ...mockUser, avatar: 'http://localhost:3001/uploads/avatars/pic.jpg' }
      prisma.user.update.mockResolvedValue(updated)

      const result = await service.updateAvatar('user-1', 'pic.jpg')

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ avatar: expect.stringContaining('pic.jpg') }),
        }),
      )
      expect(result).not.toHaveProperty('password')
    })
  })
})
