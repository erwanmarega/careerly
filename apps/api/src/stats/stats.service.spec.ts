import { Test, TestingModule } from '@nestjs/testing'
import { ApplicationStatus } from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import { StatsService } from './stats.service'

describe('StatsService', () => {
  let service: StatsService
  let prisma: {
    application: jest.Mocked<Record<string, jest.Mock>>
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        {
          provide: PrismaService,
          useValue: {
            application: {
              findMany: jest.fn(),
              groupBy: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile()

    service = module.get(StatsService)
    prisma = module.get(PrismaService)
  })

  afterEach(() => jest.clearAllMocks())

  // ─── getDateFilter (private — tested via getOverview behavior) ────────────────

  describe('date period filter', () => {
    it('applies gte filter for 7d period', async () => {
      prisma.application.findMany.mockResolvedValue([])
      prisma.application.count.mockResolvedValue(0)

      await service.getOverview('user-1', '7d')

      const call = prisma.application.findMany.mock.calls[0][0]
      expect(call.where.appliedAt?.gte).toBeDefined()
    })

    it('applies no date filter when period is undefined', async () => {
      prisma.application.findMany.mockResolvedValue([])
      prisma.application.count.mockResolvedValue(0)

      await service.getOverview('user-1', undefined)

      const call = prisma.application.findMany.mock.calls[0][0]
      expect(call.where.appliedAt).toBeUndefined()
    })
  })

  // ─── getOverview ─────────────────────────────────────────────────────────────

  describe('getOverview', () => {
    it('returns all zeros when user has no applications', async () => {
      prisma.application.findMany.mockResolvedValue([])
      prisma.application.count.mockResolvedValue(0)

      const result = await service.getOverview('user-1')

      expect(result.total).toBe(0)
      expect(result.responseRate).toBe(0)
      expect(result.interviewRate).toBe(0)
      expect(result.offerRate).toBe(0)
      expect(result.avgResponseDays).toBeNull()
    })

    it('calculates responseRate correctly', async () => {
      const apps = [
        { status: ApplicationStatus.SENT },
        { status: ApplicationStatus.INTERVIEW },
        { status: ApplicationStatus.OFFER },
        { status: ApplicationStatus.REJECTED },
      ]
      prisma.application.findMany
        .mockResolvedValueOnce(apps) // getOverview main query
        .mockResolvedValueOnce([])   // respondedApps query (avg response)
      prisma.application.count.mockResolvedValue(0)

      const result = await service.getOverview('user-1')

      // 3 out of 4 responded (not SENT)
      expect(result.responseRate).toBe(75)
    })

    it('calculates interviewRate correctly', async () => {
      const apps = [
        { status: ApplicationStatus.SENT },
        { status: ApplicationStatus.INTERVIEW },
        { status: ApplicationStatus.OFFER },
        { status: ApplicationStatus.REJECTED },
      ]
      prisma.application.findMany
        .mockResolvedValueOnce(apps)
        .mockResolvedValueOnce([])
      prisma.application.count.mockResolvedValue(0)

      const result = await service.getOverview('user-1')

      // INTERVIEW + OFFER = 2 out of 4
      expect(result.interviewRate).toBe(50)
    })

    it('calculates offerRate correctly', async () => {
      const apps = [
        { status: ApplicationStatus.SENT },
        { status: ApplicationStatus.OFFER },
        { status: ApplicationStatus.REJECTED },
        { status: ApplicationStatus.REJECTED },
      ]
      prisma.application.findMany
        .mockResolvedValueOnce(apps)
        .mockResolvedValueOnce([])
      prisma.application.count.mockResolvedValue(0)

      const result = await service.getOverview('user-1')

      // 1 out of 4 → 25%
      expect(result.offerRate).toBe(25)
    })

    it('calculates avgResponseDays from status history', async () => {
      const appliedAt = new Date('2024-01-01')
      const respondedAt = new Date('2024-01-11') // 10 days later

      prisma.application.findMany
        .mockResolvedValueOnce([{ status: ApplicationStatus.INTERVIEW }])
        .mockResolvedValueOnce([
          {
            appliedAt,
            status: ApplicationStatus.INTERVIEW,
            statusHistory: [{ changedAt: respondedAt }],
          },
        ])
      prisma.application.count.mockResolvedValue(0)

      const result = await service.getOverview('user-1')

      expect(result.avgResponseDays).toBe(10)
    })

    it('returns null avgResponseDays when no status history available', async () => {
      prisma.application.findMany
        .mockResolvedValueOnce([{ status: ApplicationStatus.SENT }])
        .mockResolvedValueOnce([{ appliedAt: new Date(), status: ApplicationStatus.SENT, statusHistory: [] }])
      prisma.application.count.mockResolvedValue(0)

      const result = await service.getOverview('user-1')

      expect(result.avgResponseDays).toBeNull()
    })

    it('includes thisWeekCount and lastWeekCount from db', async () => {
      prisma.application.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      prisma.application.count
        .mockResolvedValueOnce(3) // thisWeek
        .mockResolvedValueOnce(5) // lastWeek

      const result = await service.getOverview('user-1')

      expect(result.thisWeekCount).toBe(3)
      expect(result.lastWeekCount).toBe(5)
    })
  })

  // ─── getByStatus ─────────────────────────────────────────────────────────────

  describe('getByStatus', () => {
    it('returns status groups with percentages', async () => {
      prisma.application.groupBy.mockResolvedValue([
        { status: ApplicationStatus.SENT, _count: { _all: 3 } },
        { status: ApplicationStatus.INTERVIEW, _count: { _all: 1 } },
      ])

      const result = await service.getByStatus('user-1')

      expect(result).toEqual([
        { status: ApplicationStatus.SENT, count: 3, percentage: 75 },
        { status: ApplicationStatus.INTERVIEW, count: 1, percentage: 25 },
      ])
    })

    it('returns 0% for all when total is 0', async () => {
      prisma.application.groupBy.mockResolvedValue([])

      const result = await service.getByStatus('user-1')

      expect(result).toEqual([])
    })
  })

  // ─── getTimeline ─────────────────────────────────────────────────────────────

  describe('getTimeline', () => {
    it('groups applications by date', async () => {
      prisma.application.findMany.mockResolvedValue([
        { appliedAt: new Date('2024-01-10') },
        { appliedAt: new Date('2024-01-10') },
        { appliedAt: new Date('2024-01-11') },
      ])

      const result = await service.getTimeline('user-1')

      expect(result.data).toEqual([
        { date: '2024-01-10', count: 2 },
        { date: '2024-01-11', count: 1 },
      ])
    })

    it('returns empty data array when no applications', async () => {
      prisma.application.findMany.mockResolvedValue([])

      const result = await service.getTimeline('user-1')

      expect(result.data).toEqual([])
    })
  })
})
