import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'

interface ReminderEmailOptions {
  to: string
  name: string
  company: string
  position: string
  message: string | null
}

@Injectable()
export class MailService {
  private readonly resend: Resend
  private readonly from: string
  private readonly logger = new Logger(MailService.name)

  constructor(config: ConfigService) {
    this.resend = new Resend(config.getOrThrow('RESEND_API_KEY'))
    this.from = config.getOrThrow('MAIL_FROM')
  }

  async sendReminderEmail(options: ReminderEmailOptions) {
    try {
      await this.resend.emails.send({
        from: this.from,
        to: options.to,
        subject: `Reminder: Follow up with ${options.company}`,
        html: `
          <h2>Hi ${options.name},</h2>
          <p>This is a reminder to follow up on your application for <strong>${options.position}</strong> at <strong>${options.company}</strong>.</p>
          ${options.message ? `<p>${options.message}</p>` : ''}
          <p>Good luck!</p>
          <p>The Careerly Team</p>
        `,
      })
    } catch (error) {
      this.logger.error('Failed to send reminder email', error)
    }
  }

  async sendWelcomeEmail(to: string, name: string) {
    try {
      await this.resend.emails.send({
        from: this.from,
        to,
        subject: 'Welcome to Careerly!',
        html: `
          <h2>Welcome to Careerly, ${name}!</h2>
          <p>Start tracking your job applications and stay on top of your job search.</p>
          <p>The Careerly Team</p>
        `,
      })
    } catch (error) {
      this.logger.error('Failed to send welcome email', error)
    }
  }
}
