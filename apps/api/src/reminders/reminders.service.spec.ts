import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { getQueueToken } from '@nestjs/bull'
import { Test, TestingModule } from '@nestjs/testing'
import { Plan } from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import { RemindersService } from './reminders.service'

const mockUser = { id: 'user-1', email: 'test@example.com', plan: Plan.PRO }
const mockApp = { id: 'app-1', userId: 'user-1', company: 'Acme', position: 'Dev' }
const mockReminder = {
  id: 'reminder-1',
  userId: 'user-1',
  applicationId: 'app-1',
  scheduledAt: new Date('2025-06-01T10:00:00Z'),
  message: 'Relancer',
  sent: false,
}

describe('RemindersService', () => {
  let service: RemindersService
  let prisma: {
    user: jest.Mocked<Record<string, jest.Mock>>
    application: jest.Mocked<Record<string, jest.Mock>>
    reminder: jest.Mocked<Record<string, jest.Mock>>
  }
  let queue: { add: jest.Mock }

  beforeEach(async () => {
    queue = { add: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemindersService,
        {
          provide: PrismaService,
          useValue: {
            user: { findUniqueOrThrow: jest.fn() },
            application: { findUnique: jest.fn() },
            reminder: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: getQueueToken('reminders'),
          useValue: queue,
        },
      ],
    }).compile()

    service = module.get(RemindersService)
    prisma = module.get(PrismaService)
  })

  afterEach(() => jest.clearAllMocks())

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns reminders for the given user ordered by scheduledAt', async () => {
      prisma.reminder.findMany.mockResolvedValue([mockReminder])

      const result = await service.findAll('user-1')

      expect(result).toEqual([mockReminder])
      expect(prisma.reminder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          orderBy: { scheduledAt: 'asc' },
        }),
      )
    })
  })

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = { applicationId: 'app-1', scheduledAt: '2025-06-01T10:00:00Z', message: 'Relancer' }

    it('throws ForbiddenException for FREE plan users', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue({ ...mockUser, plan: Plan.FREE })

      await expect(service.create('user-1', dto)).rejects.toThrow(ForbiddenException)
    })

    it('throws NotFoundException when application does not exist', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue(mockUser)
      prisma.application.findUnique.mockResolvedValue(null)

      await expect(service.create('user-1', dto)).rejects.toThrow(NotFoundException)
    })

    it('throws ForbiddenException when application belongs to another user', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue(mockUser)
      prisma.application.findUnique.mockResolvedValue({ ...mockApp, userId: 'other-user' })

      await expect(service.create('user-1', dto)).rejects.toThrow(ForbiddenException)
    })

    it('creates the reminder and adds a job to the queue', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue(mockUser)
      prisma.application.findUnique.mockResolvedValue(mockApp)
      prisma.reminder.create.mockResolvedValue(mockReminder)

      const result = await service.create('user-1', dto)

      expect(prisma.reminder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1', applicationId: 'app-1' }),
        }),
      )
      expect(queue.add).toHaveBeenCalledWith(
        'send-reminder',
        { reminderId: mockReminder.id },
        expect.objectContaining({ delay: expect.any(Number), attempts: 3 }),
      )
      expect(result).toEqual(mockReminder)
    })

    it('schedules the job with a non-negative delay', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue(mockUser)
      prisma.application.findUnique.mockResolvedValue(mockApp)
      // scheduledAt in the past → delay should be clamped to 0
      prisma.reminder.create.mockResolvedValue(mockReminder)

      await service.create('user-1', { ...dto, scheduledAt: '2020-01-01T00:00:00Z' })

      const { delay } = queue.add.mock.calls[0][2]
      expect(delay).toBeGreaterThanOrEqual(0)
    })
  })

  // ─── delete ──────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('throws NotFoundException when reminder does not exist', async () => {
      prisma.reminder.findUnique.mockResolvedValue(null)

      await expect(service.delete('reminder-1', 'user-1')).rejects.toThrow(NotFoundException)
    })

    it('throws ForbiddenException when reminder belongs to another user', async () => {
      prisma.reminder.findUnique.mockResolvedValue({ ...mockReminder, userId: 'other-user' })

      await expect(service.delete('reminder-1', 'user-1')).rejects.toThrow(ForbiddenException)
    })

    it('deletes the reminder when user is the owner', async () => {
      prisma.reminder.findUnique.mockResolvedValue(mockReminder)
      prisma.reminder.delete.mockResolvedValue(mockReminder)

      await service.delete('reminder-1', 'user-1')

      expect(prisma.reminder.delete).toHaveBeenCalledWith({ where: { id: 'reminder-1' } })
    })
  })
})
