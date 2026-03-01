import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'

interface ReminderEmailOptions {
  to: string
  name: string
  company: string
  position: string
  applicationId: string
  message: string | null
}

@Injectable()
export class MailService {
  private readonly resend: Resend
  private readonly from: string
  private readonly frontendUrl: string
  private readonly logger = new Logger(MailService.name)

  constructor(config: ConfigService) {
    this.resend = new Resend(config.getOrThrow('RESEND_API_KEY'))
    this.from = config.getOrThrow('MAIL_FROM')
    this.frontendUrl = config.get('FRONTEND_URL') ?? 'http://localhost:3000'
  }

  async sendReminderEmail(options: ReminderEmailOptions) {
    const appUrl = `${this.frontendUrl}/applications/${options.applicationId}`
    const subject = `🔔 Rappel — ${options.position} chez ${options.company}`

    const html = `<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
    <div style="background:#6d28d9;padding:20px 28px;">
      <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em;">Careerly</span>
    </div>
    <div style="padding:28px 28px 8px;">
      <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">Bonjour ${options.name},</p>
      <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111827;">🔔 Votre rappel est arrivé</h2>
      ${options.message ? `<div style="background:#f9fafb;border-left:3px solid #6d28d9;border-radius:4px;padding:12px 16px;margin-bottom:20px;"><p style="margin:0;font-size:14px;color:#374151;">${options.message}</p></div>` : ''}
      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 3px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;">Candidature</p>
        <p style="margin:0 0 12px;font-size:16px;font-weight:600;color:#111827;">${options.position}</p>
        <p style="margin:0 0 3px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;">Entreprise</p>
        <p style="margin:0;font-size:15px;font-weight:500;color:#111827;">${options.company}</p>
      </div>
      <a href="${appUrl}" style="display:inline-block;background:#6d28d9;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:11px 22px;border-radius:8px;margin-bottom:28px;">Voir la candidature →</a>
    </div>
    <div style="padding:12px 28px 16px;border-top:1px solid #f3f4f6;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">Vous recevez cet email car vous avez configuré un rappel sur Careerly. Pour ne plus en recevoir, supprimez vos rappels dans l'application.</p>
    </div>
  </div>
</body>
</html>`

    const { error } = await this.resend.emails.send({ from: this.from, to: options.to, subject, html })
    if (error) {
      this.logger.error('Failed to send reminder email', error)
      throw new Error(`Resend error: ${error.message}`)
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
