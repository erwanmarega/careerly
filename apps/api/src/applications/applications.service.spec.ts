import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ApplicationStatus, Plan } from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import { ApplicationsService } from './applications.service'

const mockUser = { id: 'user-1', email: 'test@example.com', plan: Plan.FREE }
const mockApp = {
  id: 'app-1',
  userId: 'user-1',
  company: 'Acme',
  position: 'Dev',
  status: ApplicationStatus.SENT,
  appliedAt: new Date('2024-01-15'),
  location: null,
  url: null,
  salary: null,
  notes: null,
}

describe('ApplicationsService', () => {
  let service: ApplicationsService
  let prisma: {
    user: jest.Mocked<Record<string, jest.Mock>>
    application: jest.Mocked<Record<string, jest.Mock>>
    statusHistory: jest.Mocked<Record<string, jest.Mock>>
    $transaction: jest.Mock
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        {
          provide: PrismaService,
          useValue: {
            user: { findUniqueOrThrow: jest.fn() },
            application: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              count: jest.fn(),
              create: jest.fn(),
              createMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            statusHistory: { create: jest.fn() },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get(ApplicationsService)
    prisma = module.get(PrismaService)
  })

  afterEach(() => jest.clearAllMocks())

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated data with total', async () => {
      prisma.application.findMany.mockResolvedValue([mockApp])
      prisma.application.count.mockResolvedValue(1)

      const result = await service.findAll({ userId: 'user-1' })

      expect(result).toEqual({ data: [mockApp], total: 1, page: 1, limit: 20 })
    })

    it('applies status filter when provided', async () => {
      prisma.application.findMany.mockResolvedValue([])
      prisma.application.count.mockResolvedValue(0)

      await service.findAll({ userId: 'user-1', status: ApplicationStatus.INTERVIEW })

      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: ApplicationStatus.INTERVIEW }) }),
      )
    })

    it('applies search filter when provided', async () => {
      prisma.application.findMany.mockResolvedValue([])
      prisma.application.count.mockResolvedValue(0)

      await service.findAll({ userId: 'user-1', search: 'google' })

      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        }),
      )
    })

    it('uses custom page and limit', async () => {
      prisma.application.findMany.mockResolvedValue([])
      prisma.application.count.mockResolvedValue(0)

      const result = await service.findAll({ userId: 'user-1', page: 3, limit: 5 })

      expect(result.page).toBe(3)
      expect(result.limit).toBe(5)
      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      )
    })
  })

  // ─── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('throws NotFoundException when application does not exist', async () => {
      prisma.application.findUnique.mockResolvedValue(null)

      await expect(service.findOne('app-1', 'user-1')).rejects.toThrow(NotFoundException)
    })

    it('throws ForbiddenException when application belongs to another user', async () => {
      prisma.application.findUnique.mockResolvedValue({ ...mockApp, userId: 'other-user' })

      await expect(service.findOne('app-1', 'user-1')).rejects.toThrow(ForbiddenException)
    })

    it('returns application when user is the owner', async () => {
      prisma.application.findUnique.mockResolvedValue(mockApp)

      const result = await service.findOne('app-1', 'user-1')

      expect(result).toEqual(mockApp)
    })
  })

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates application for PRO user without limit check', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue({ ...mockUser, plan: Plan.PRO })
      prisma.application.create.mockResolvedValue(mockApp)

      await service.create('user-1', { company: 'Acme', position: 'Dev', status: ApplicationStatus.SENT, appliedAt: '2024-01-15' })

      expect(prisma.application.count).not.toHaveBeenCalled()
    })

    it('throws ForbiddenException when FREE user reaches 10 applications', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue(mockUser)
      prisma.application.count.mockResolvedValue(10)

      await expect(
        service.create('user-1', { company: 'Acme', position: 'Dev', status: ApplicationStatus.SENT, appliedAt: '2024-01-15' }),
      ).rejects.toThrow(ForbiddenException)
    })

    it('allows FREE user to create when under 10 applications', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue(mockUser)
      prisma.application.count.mockResolvedValue(9)
      prisma.application.create.mockResolvedValue(mockApp)

      const result = await service.create('user-1', { company: 'Acme', position: 'Dev', status: ApplicationStatus.SENT, appliedAt: '2024-01-15' })

      expect(result).toEqual(mockApp)
    })
  })

  // ─── delete ──────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('deletes application when user is the owner', async () => {
      prisma.application.findUnique.mockResolvedValue(mockApp)
      prisma.application.delete.mockResolvedValue(mockApp)

      await service.delete('app-1', 'user-1')

      expect(prisma.application.delete).toHaveBeenCalledWith({ where: { id: 'app-1' } })
    })

    it('throws ForbiddenException when trying to delete another users application', async () => {
      prisma.application.findUnique.mockResolvedValue({ ...mockApp, userId: 'other-user' })

      await expect(service.delete('app-1', 'user-1')).rejects.toThrow(ForbiddenException)
    })
  })

  // ─── exportCsv ───────────────────────────────────────────────────────────────

  describe('exportCsv', () => {
    it('throws ForbiddenException for FREE plan users', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue(mockUser)

      await expect(service.exportCsv('user-1')).rejects.toThrow(ForbiddenException)
    })

    it('returns CSV string with header row for PRO user', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue({ ...mockUser, plan: Plan.PRO })
      prisma.application.findMany.mockResolvedValue([mockApp])

      const csv = await service.exportCsv('user-1')

      expect(csv).toContain('Company,Position')
      expect(csv).toContain('Acme')
      expect(csv).toContain('Dev')
    })

    it('wraps values containing commas in double quotes', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue({ ...mockUser, plan: Plan.PRO })
      prisma.application.findMany.mockResolvedValue([
        { ...mockApp, company: 'Acme, Inc.', notes: null },
      ])

      const csv = await service.exportCsv('user-1')

      expect(csv).toContain('"Acme, Inc."')
    })

    it('escapes double quotes inside values', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue({ ...mockUser, plan: Plan.PRO })
      prisma.application.findMany.mockResolvedValue([
        { ...mockApp, notes: 'Said "hello"' },
      ])

      const csv = await service.exportCsv('user-1')

      expect(csv).toContain('"Said ""hello"""')
    })

    it('returns empty body (header only) when no applications', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue({ ...mockUser, plan: Plan.PRO })
      prisma.application.findMany.mockResolvedValue([])

      const csv = await service.exportCsv('user-1')
      const lines = csv.split('\n')

      expect(lines).toHaveLength(1)
      expect(lines[0]).toContain('Company')
    })
  })

  // ─── parseCsvRow (private — tested via importFromCsv) ────────────────────────

  describe('parseCsvRow (via importFromCsv)', () => {
    it('handles quoted fields containing commas', async () => {
      prisma.application.createMany.mockResolvedValue({ count: 1 })

      const csv = 'Company,Position,Status\n"Acme, Inc.",Developer,sent'
      const result = await service.importFromCsv('user-1', csv)

      expect(result.imported).toBe(1)
    })

    it('handles escaped double-quotes inside quoted fields', async () => {
      prisma.application.createMany.mockResolvedValue({ count: 1 })

      const csv = 'Company,Position,Status\n"Acme ""Corp""",Developer,sent'
      const result = await service.importFromCsv('user-1', csv)

      expect(result.imported).toBe(1)
    })
  })

  // ─── importFromCsv ───────────────────────────────────────────────────────────

  describe('importFromCsv', () => {
    it('returns 0 imported when CSV has no data rows', async () => {
      const result = await service.importFromCsv('user-1', 'Company,Position')

      expect(result).toEqual({ imported: 0, skipped: 0 })
    })

    it('returns 0 imported when CSV is empty', async () => {
      const result = await service.importFromCsv('user-1', '')

      expect(result).toEqual({ imported: 0, skipped: 0 })
    })

    it('skips rows missing company or position', async () => {
      prisma.application.createMany.mockResolvedValue({ count: 0 })

      const csv = 'Company,Position,Status\n,Developer,sent\nAcme,,sent'
      const result = await service.importFromCsv('user-1', csv)

      expect(result.imported).toBe(0)
      expect(result.skipped).toBe(2)
    })

    it('skips rows with invalid dates', async () => {
      prisma.application.createMany.mockResolvedValue({ count: 0 })

      const csv = 'Company,Position,Status,AppliedAt\nAcme,Dev,sent,not-a-date'
      const result = await service.importFromCsv('user-1', csv)

      expect(result.skipped).toBe(1)
    })

    it('maps known status aliases correctly', async () => {
      let captured: unknown[] = []
      prisma.application.createMany.mockImplementation(async ({ data }) => {
        captured = data
        return { count: data.length }
      })

      const csv = 'Company,Position,Status\nAcme,Dev,entretien'
      await service.importFromCsv('user-1', csv)

      expect((captured[0] as { status: ApplicationStatus }).status).toBe(ApplicationStatus.INTERVIEW)
    })

    it('defaults unknown status to SENT', async () => {
      let captured: unknown[] = []
      prisma.application.createMany.mockImplementation(async ({ data }) => {
        captured = data
        return { count: data.length }
      })

      const csv = 'Company,Position,Status\nAcme,Dev,unknownstatus'
      await service.importFromCsv('user-1', csv)

      expect((captured[0] as { status: ApplicationStatus }).status).toBe(ApplicationStatus.SENT)
    })

    it('uses custom column mapping when provided', async () => {
      prisma.application.createMany.mockResolvedValue({ count: 1 })

      const csv = 'Nom,Poste,Statut\nAcme,Dev,sent'
      const result = await service.importFromCsv('user-1', csv, {
        company: 'Nom',
        position: 'Poste',
        status: 'Statut',
      })

      expect(result.imported).toBe(1)
    })

    it('imports valid rows and returns correct counts', async () => {
      prisma.application.createMany.mockResolvedValue({ count: 2 })

      const csv = 'Company,Position,Status\nAcme,Dev,sent\nGoogle,Engineer,interview'
      const result = await service.importFromCsv('user-1', csv)

      expect(result.imported).toBe(2)
      expect(result.skipped).toBe(0)
    })
  })
})
