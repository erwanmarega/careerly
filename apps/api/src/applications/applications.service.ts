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
}
