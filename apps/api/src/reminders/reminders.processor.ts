import { Process, Processor } from '@nestjs/bull'
import type { Job } from 'bull'

import { MailService } from '../mail/mail.service'
import { PrismaService } from '../prisma/prisma.service'

@Processor('reminders')
export class RemindersProcessor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  @Process('send-reminder')
  async handleReminder(job: Job<{ reminderId: string }>) {
    const reminder = await this.prisma.reminder.findUnique({
      where: { id: job.data.reminderId },
      include: {
        user: true,
        application: { select: { company: true, position: true } },
      },
    })

    if (!reminder || reminder.sent) return

    await this.mailService.sendReminderEmail({
      to: reminder.user.email,
      name: reminder.user.name ?? reminder.user.email,
      company: reminder.application.company,
      position: reminder.application.position,
      message: reminder.message,
    })

    await this.prisma.reminder.update({ where: { id: reminder.id }, data: { sent: true } })
  }
}
