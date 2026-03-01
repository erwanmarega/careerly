import { Injectable } from '@nestjs/common'
import { ApplicationStatus } from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  private getDateFilter(period?: string): Date | undefined {
    const now = new Date()
    if (period === '7d') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    if (period === '30d') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    if (period === '90d') return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    return undefined
  }

  private getThisMonday(): Date {
    const now = new Date()
    const day = now.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const monday = new Date(now)
    monday.setDate(now.getDate() + diff)
    monday.setHours(0, 0, 0, 0)
    return monday
  }

  async getOverview(userId: string, period?: string) {
    const since = this.getDateFilter(period)
    const dateWhere = since ? { appliedAt: { gte: since } } : {}

    const applications = await this.prisma.application.findMany({
      where: { userId, ...dateWhere },
    })

    const total = applications.length

    const noResponse: ApplicationStatus[] = [ApplicationStatus.SENT, ApplicationStatus.ARCHIVED]
    const interviewStatuses: ApplicationStatus[] = [ApplicationStatus.INTERVIEW, ApplicationStatus.OFFER]
    const closedStatuses: ApplicationStatus[] = [ApplicationStatus.REJECTED, ApplicationStatus.ARCHIVED]

    const responded = applications.filter((a) => !noResponse.includes(a.status)).length
    const interviewed = applications.filter((a) => interviewStatuses.includes(a.status)).length
    const offered = applications.filter((a) => a.status === ApplicationStatus.OFFER).length
    const active = applications.filter((a) => !closedStatuses.includes(a.status)).length

    const respondedApps = await this.prisma.application.findMany({
      where: {
        userId,
        ...dateWhere,
        status: { in: [ApplicationStatus.FOLLOW_UP, ApplicationStatus.INTERVIEW, ApplicationStatus.OFFER, ApplicationStatus.REJECTED] },
      },
      include: {
        statusHistory: { orderBy: { changedAt: 'asc' }, take: 1 },
      },
    })

    const deltas = respondedApps
      .filter((a) => a.statusHistory.length > 0)
      .map((a) => Math.round((a.statusHistory[0].changedAt.getTime() - a.appliedAt.getTime()) / 86400000))
      .filter((d) => d >= 0)

    const avgResponseDays = deltas.length > 0
      ? Math.round(deltas.reduce((s, d) => s + d, 0) / deltas.length)
      : null

    const thisMonday = this.getThisMonday()
    const lastMonday = new Date(thisMonday)
    lastMonday.setDate(thisMonday.getDate() - 7)

    const [thisWeekCount, lastWeekCount] = await Promise.all([
      this.prisma.application.count({ where: { userId, appliedAt: { gte: thisMonday } } }),
      this.prisma.application.count({ where: { userId, appliedAt: { gte: lastMonday, lt: thisMonday } } }),
    ])

    return {
      total: total === 0 ? 0 : total,
      responseRate: total > 0 ? Math.round((responded / total) * 100) : 0,
      interviewRate: total > 0 ? Math.round((interviewed / total) * 100) : 0,
      offerRate: total > 0 ? Math.round((offered / total) * 100) : 0,
      activeApplications: active,
      avgResponseDays,
      thisWeekCount,
      lastWeekCount,
    }
  }

  async getByStatus(userId: string, period?: string) {
    const since = this.getDateFilter(period)
    const dateWhere = since ? { appliedAt: { gte: since } } : {}

    const groups = await this.prisma.application.groupBy({
      by: ['status'],
      where: { userId, ...dateWhere },
      _count: { _all: true },
    })

    const total = groups.reduce((sum, g) => sum + g._count._all, 0)

    return groups.map((g) => ({
      status: g.status,
      count: g._count._all,
      percentage: total > 0 ? Math.round((g._count._all / total) * 100) : 0,
    }))
  }

  async getTimeline(userId: string, period?: string) {
    const since = this.getDateFilter(period)
    const dateWhere = since ? { appliedAt: { gte: since } } : {}

    const applications = await this.prisma.application.findMany({
      where: { userId, ...dateWhere },
      select: { appliedAt: true },
      orderBy: { appliedAt: 'asc' },
    })

    const map = new Map<string, number>()
    for (const app of applications) {
      const date = app.appliedAt.toISOString().split('T')[0]
      map.set(date, (map.get(date) ?? 0) + 1)
    }

    return {
      data: Array.from(map.entries()).map(([date, count]) => ({ date, count })),
    }
  }
}
