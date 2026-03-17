import { Test, TestingModule } from '@nestjs/testing'
import type { Job } from 'bull'

import { MailService } from '../mail/mail.service'
import { PrismaService } from '../prisma/prisma.service'
import { RemindersProcessor } from './reminders.processor'

const mockReminder = {
  id: 'reminder-1',
  applicationId: 'app-1',
  message: 'Relancer',
  sent: false,
  user: { email: 'test@example.com', name: 'Test User' },
  application: { company: 'Acme', position: 'Dev' },
}

const makeJob = (reminderId: string): Job<{ reminderId: string }> =>
  ({ data: { reminderId } }) as Job<{ reminderId: string }>

describe('RemindersProcessor', () => {
  let processor: RemindersProcessor
  let prisma: { reminder: jest.Mocked<Record<string, jest.Mock>> }
  let mail: jest.Mocked<Pick<MailService, 'sendReminderEmail'>>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemindersProcessor,
        {
          provide: PrismaService,
          useValue: {
            reminder: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: MailService,
          useValue: { sendReminderEmail: jest.fn() },
        },
      ],
    }).compile()

    processor = module.get(RemindersProcessor)
    prisma = module.get(PrismaService)
    mail = module.get(MailService)
  })

  afterEach(() => jest.clearAllMocks())

  it('does nothing when reminder is not found', async () => {
    prisma.reminder.findUnique.mockResolvedValue(null)

    await processor.handleReminder(makeJob('reminder-1'))

    expect(mail.sendReminderEmail).not.toHaveBeenCalled()
    expect(prisma.reminder.update).not.toHaveBeenCalled()
  })

  it('does nothing when reminder is already sent (idempotence)', async () => {
    prisma.reminder.findUnique.mockResolvedValue({ ...mockReminder, sent: true })

    await processor.handleReminder(makeJob('reminder-1'))

    expect(mail.sendReminderEmail).not.toHaveBeenCalled()
    expect(prisma.reminder.update).not.toHaveBeenCalled()
  })

  it('sends the email with correct data when reminder is pending', async () => {
    prisma.reminder.findUnique.mockResolvedValue(mockReminder)
    ;(mail.sendReminderEmail as jest.Mock).mockResolvedValue(undefined)
    prisma.reminder.update.mockResolvedValue({ ...mockReminder, sent: true })

    await processor.handleReminder(makeJob('reminder-1'))

    expect(mail.sendReminderEmail).toHaveBeenCalledWith({
      to: 'test@example.com',
      name: 'Test User',
      company: 'Acme',
      position: 'Dev',
      applicationId: 'app-1',
      message: 'Relancer',
    })
  })

  it('marks the reminder as sent after sending the email', async () => {
    prisma.reminder.findUnique.mockResolvedValue(mockReminder)
    ;(mail.sendReminderEmail as jest.Mock).mockResolvedValue(undefined)
    prisma.reminder.update.mockResolvedValue({ ...mockReminder, sent: true })

    await processor.handleReminder(makeJob('reminder-1'))

    expect(prisma.reminder.update).toHaveBeenCalledWith({
      where: { id: 'reminder-1' },
      data: { sent: true },
    })
  })

  it('uses email as fallback name when user has no name', async () => {
    prisma.reminder.findUnique.mockResolvedValue({
      ...mockReminder,
      user: { email: 'noname@example.com', name: null },
    })
    ;(mail.sendReminderEmail as jest.Mock).mockResolvedValue(undefined)
    prisma.reminder.update.mockResolvedValue({ ...mockReminder, sent: true })

    await processor.handleReminder(makeJob('reminder-1'))

    expect(mail.sendReminderEmail).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'noname@example.com' }),
    )
  })
})
