import { Injectable } from '@nestjs/common'
import { ApplicationStatus } from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: string) {
    const applications = await this.prisma.application.findMany({ where: { userId } })
    const total = applications.length

    if (total === 0) {
      return { total: 0, responseRate: 0, interviewRate: 0, offerRate: 0, activeApplications: 0 }
    }

    const noResponse: ApplicationStatus[] = [ApplicationStatus.SENT, ApplicationStatus.ARCHIVED]
    const interviewStatuses: ApplicationStatus[] = [ApplicationStatus.INTERVIEW, ApplicationStatus.OFFER]
    const closedStatuses: ApplicationStatus[] = [ApplicationStatus.REJECTED, ApplicationStatus.ARCHIVED]

    const responded = applications.filter((a) => !noResponse.includes(a.status)).length
    const interviewed = applications.filter((a) => interviewStatuses.includes(a.status)).length
    const offered = applications.filter((a) => a.status === ApplicationStatus.OFFER).length
    const active = applications.filter((a) => !closedStatuses.includes(a.status)).length

    return {
      total,
      responseRate: Math.round((responded / total) * 100),
      interviewRate: Math.round((interviewed / total) * 100),
      offerRate: Math.round((offered / total) * 100),
      activeApplications: active,
    }
  }

  async getByStatus(userId: string) {
    const groups = await this.prisma.application.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true },
    })

    const total = groups.reduce((sum, g) => sum + g._count._all, 0)

    return groups.map((g) => ({
      status: g.status,
      count: g._count._all,
      percentage: total > 0 ? Math.round((g._count._all / total) * 100) : 0,
    }))
  }

  async getTimeline(userId: string) {
    const applications = await this.prisma.application.findMany({
      where: { userId },
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
