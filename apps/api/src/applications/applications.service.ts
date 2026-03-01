import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { ApplicationStatus, Plan } from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import type { CreateApplicationDto } from './dto/create-application.dto'
import type { UpdateApplicationDto, UpdateStatusDto } from './dto/update-application.dto'

interface FindAllOptions {
  userId: string
  status?: ApplicationStatus
  search?: string
  page?: number
  limit?: number
  sortBy?: 'appliedAt' | 'company' | 'status'
  sortOrder?: 'asc' | 'desc'
}

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({ userId, status, search, page = 1, limit = 20, sortBy = 'appliedAt', sortOrder = 'desc' }: FindAllOptions) {
    const where = {
      userId,
      ...(status && { status }),
      ...(search && {
        OR: [
          { company: { contains: search, mode: 'insensitive' as const } },
          { position: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.application.count({ where }),
    ])

    return { data, total, page, limit }
  }

  async findOne(id: string, userId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: { statusHistory: { orderBy: { changedAt: 'desc' } } },
    })

    if (!application) throw new NotFoundException()
    if (application.userId !== userId) throw new ForbiddenException()

    return application
  }

  async create(userId: string, dto: CreateApplicationDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } })

    if (user.plan === Plan.FREE) {
      const count = await this.prisma.application.count({ where: { userId } })
      if (count >= 10) throw new ForbiddenException('Free plan is limited to 10 applications')
    }

    return this.prisma.application.create({ data: { ...dto, userId } })
  }

  async update(id: string, userId: string, dto: UpdateApplicationDto) {
    await this.findOne(id, userId)
    return this.prisma.application.update({ where: { id }, data: dto })
  }

  async updateStatus(id: string, userId: string, dto: UpdateStatusDto) {
    await this.findOne(id, userId)

    const [application] = await this.prisma.$transaction([
      this.prisma.application.update({ where: { id }, data: { status: dto.status } }),
      this.prisma.statusHistory.create({
        data: { applicationId: id, status: dto.status, note: dto.note },
      }),
    ])

    return application
  }

  async delete(id: string, userId: string) {
    await this.findOne(id, userId)
    await this.prisma.application.delete({ where: { id } })
  }

  async importFromCsv(userId: string, csvText: string, columnMapping?: Record<string, string>) {
    const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim())
    if (lines.length < 2) return { imported: 0, skipped: 0 }

    const rawHeaders = this.parseCsvRow(lines[0]).map((h) => h.trim())
    const headersLower = rawHeaders.map((h) => h.toLowerCase())

    let cols: { company: number; position: number; location: number; url: number; salary: number; status: number; appliedAt: number; notes: number }

    if (columnMapping && Object.keys(columnMapping).length > 0) {
      const colByName = (name?: string): number => {
        if (!name) return -1
        const exact = rawHeaders.indexOf(name)
        if (exact !== -1) return exact
        return headersLower.indexOf(name.toLowerCase())
      }
      cols = {
        company: colByName(columnMapping.company),
        position: colByName(columnMapping.position),
        location: colByName(columnMapping.location),
        url: colByName(columnMapping.url),
        salary: colByName(columnMapping.salary),
        status: colByName(columnMapping.status),
        appliedAt: colByName(columnMapping.appliedAt),
        notes: colByName(columnMapping.notes),
      }
    } else {
      const col = (aliases: string[]) => {
        for (const a of aliases) {
          const idx = headersLower.indexOf(a)
          if (idx !== -1) return idx
        }
        return -1
      }
      cols = {
        company: col(['company', 'entreprise', 'société', 'societe']),
        position: col(['position', 'poste', 'intitulé', 'intitule', 'titre']),
        location: col(['location', 'lieu', 'ville', 'localisation']),
        url: col(['url', 'lien', 'link']),
        salary: col(['salary', 'salaire']),
        status: col(['status', 'statut']),
        appliedAt: col(['appliedat', 'date', 'date de candidature', 'date_candidature']),
        notes: col(['notes', 'note', 'commentaire', 'commentaires']),
      }
    }

    const statusMap: Record<string, ApplicationStatus> = {
      envoyee: ApplicationStatus.SENT, envoyée: ApplicationStatus.SENT, sent: ApplicationStatus.SENT,
      relancer: ApplicationStatus.FOLLOW_UP, 'à relancer': ApplicationStatus.FOLLOW_UP, follow_up: ApplicationStatus.FOLLOW_UP, follow: ApplicationStatus.FOLLOW_UP,
      entretien: ApplicationStatus.INTERVIEW, interview: ApplicationStatus.INTERVIEW,
      offre: ApplicationStatus.OFFER, offer: ApplicationStatus.OFFER,
      refuse: ApplicationStatus.REJECTED, refusé: ApplicationStatus.REJECTED, rejected: ApplicationStatus.REJECTED,
      archivee: ApplicationStatus.ARCHIVED, archivée: ApplicationStatus.ARCHIVED, archived: ApplicationStatus.ARCHIVED,
    }

    const rows = lines.slice(1).map((l) => this.parseCsvRow(l))
    const toCreate: { userId: string; company: string; position: string; location?: string; url?: string; salary?: string; status: ApplicationStatus; appliedAt: Date; notes?: string }[] = []

    let skipped = 0

    for (const row of rows) {
      const get = (idx: number) => (idx !== -1 ? (row[idx] ?? '').trim() : '')
      const company = get(cols.company)
      const position = get(cols.position)
      if (!company || !position) { skipped++; continue }

      const rawStatus = get(cols.status).toLowerCase()
      const status = statusMap[rawStatus] ?? ApplicationStatus.SENT

      const rawDate = get(cols.appliedAt)
      const appliedAt = rawDate ? new Date(rawDate) : new Date()
      if (isNaN(appliedAt.getTime())) { skipped++; continue }

      const rawUrl = get(cols.url)

      toCreate.push({
        userId,
        company,
        position,
        location: get(cols.location) || undefined,
        url: rawUrl || undefined,
        salary: get(cols.salary) || undefined,
        status,
        appliedAt,
        notes: get(cols.notes) || undefined,
      })
    }

    if (toCreate.length > 0) {
      await this.prisma.application.createMany({ data: toCreate })
    }

    return { imported: toCreate.length, skipped }
  }

  private parseCsvRow(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += ch
      }
    }
    result.push(current)
    return result
  }
}
