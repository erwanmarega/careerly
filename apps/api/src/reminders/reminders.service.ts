import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bull'
import type { Queue } from 'bull'
import { Plan } from '@prisma/client'
import { IsDateString, IsOptional, IsString } from 'class-validator'

import { PrismaService } from '../prisma/prisma.service'

export class CreateReminderDto {
  @IsDateString()
  scheduledAt: string

  @IsString()
  @IsOptional()
  message?: string

  @IsString()
  applicationId: string
}

@Injectable()
export class RemindersService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('reminders') private readonly remindersQueue: Queue,
  ) {}

  async findAll(userId: string) {
    return this.prisma.reminder.findMany({
      where: { userId },
      include: { application: { select: { id: true, company: true, position: true, status: true } } },
      orderBy: { scheduledAt: 'asc' },
    })
  }

  async create(userId: string, dto: CreateReminderDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } })
    if (user.plan === Plan.FREE) throw new ForbiddenException('Reminders require a Pro plan')

    const application = await this.prisma.application.findUnique({
      where: { id: dto.applicationId },
    })
    if (!application) throw new NotFoundException('Application not found')
    if (application.userId !== userId) throw new ForbiddenException()

    const reminder = await this.prisma.reminder.create({
      data: { ...dto, userId, scheduledAt: new Date(dto.scheduledAt) },
    })

    const delay = Math.max(0, new Date(dto.scheduledAt).getTime() - Date.now())
    await this.remindersQueue.add('send-reminder', { reminderId: reminder.id }, { delay, attempts: 3 })

    return reminder
  }

  async delete(id: string, userId: string) {
    const reminder = await this.prisma.reminder.findUnique({ where: { id } })
    if (!reminder) throw new NotFoundException()
    if (reminder.userId !== userId) throw new ForbiddenException()

    await this.prisma.reminder.delete({ where: { id } })
  }
}
