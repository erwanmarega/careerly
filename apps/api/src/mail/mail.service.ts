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
      <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em;">Postulo</span>
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
      <p style="margin:0;font-size:11px;color:#9ca3af;">Vous recevez cet email car vous avez configuré un rappel sur Postulo. Pour ne plus en recevoir, supprimez vos rappels dans l'application.</p>
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

  async sendPasswordResetEmail(to: string, name: string, token: string) {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`
    const html = `<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
    <div style="background:#6d28d9;padding:20px 28px;">
      <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em;">Postulo</span>
    </div>
    <div style="padding:28px 28px 8px;">
      <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">Bonjour ${name},</p>
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#111827;">Réinitialisation de mot de passe</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#374151;">Vous avez demandé à réinitialiser votre mot de passe. Ce lien est valable <strong>1 heure</strong>.</p>
      <a href="${resetUrl}" style="display:inline-block;background:#6d28d9;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:11px 22px;border-radius:8px;margin-bottom:28px;">Réinitialiser mon mot de passe →</a>
      <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
    </div>
    <div style="padding:12px 28px 16px;border-top:1px solid #f3f4f6;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">Postulo — Votre assistant de recherche d'emploi</p>
    </div>
  </div>
</body>
</html>`

    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject: 'Réinitialisation de votre mot de passe Postulo',
      html,
    })
    if (error) {
      this.logger.error('Failed to send password reset email', error)
      throw new Error(`Resend error: ${error.message}`)
    }
  }

  async sendSchoolReminderEmail(to: string, studentName: string, schoolName: string, frontendUrl?: string) {
    const url = frontendUrl ?? this.frontendUrl
    const html = `<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
    <div style="background:#6d28d9;padding:20px 28px;">
      <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em;">Postulo</span>
    </div>
    <div style="padding:28px 28px 8px;">
      <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">Bonjour ${studentName},</p>
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#111827;">Un petit rappel de votre école 👋</h2>
      <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">
        <strong>${schoolName}</strong> vous rappelle de ne pas oublier votre recherche d'alternance. Connectez-vous à Postulo pour ajouter vos candidatures et suivre votre avancement.
      </p>
      <a href="${url}/dashboard" style="display:inline-block;background:#6d28d9;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:11px 22px;border-radius:8px;margin-bottom:28px;">Accéder à mon espace →</a>
    </div>
    <div style="padding:12px 28px 16px;border-top:1px solid #f3f4f6;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">Ce message a été envoyé par votre responsable formation via Postulo.</p>
    </div>
  </div>
</body>
</html>`

    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject: `📬 Rappel de ${schoolName} — pensez à vos candidatures !`,
      html,
    })
    if (error) {
      this.logger.error('Failed to send school reminder email', error)
      throw new Error(`Resend error: ${error.message}`)
    }
  }

  async sendRemovedFromSchoolEmail(to: string, studentName: string, schoolName: string) {
    const html = `<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
    <div style="background:#6d28d9;padding:20px 28px;">
      <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em;">Postulo</span>
    </div>
    <div style="padding:28px 28px 8px;">
      <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">Bonjour ${studentName},</p>
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#111827;">Vous avez été retiré de votre école</h2>
      <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">
        Votre compte n'est plus associé à <strong>${schoolName}</strong> sur Postulo. Votre historique de candidatures est conservé et reste accessible.
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;">
        Si vous pensez qu'il s'agit d'une erreur, contactez directement votre responsable formation.
      </p>
      <a href="${this.frontendUrl}/dashboard" style="display:inline-block;background:#6d28d9;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:11px 22px;border-radius:8px;margin-bottom:28px;">Accéder à mon espace →</a>
    </div>
    <div style="padding:12px 28px 16px;border-top:1px solid #f3f4f6;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">Postulo — Votre assistant de recherche d'emploi</p>
    </div>
  </div>
</body>
</html>`

    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject: `Vous avez été retiré de ${schoolName}`,
      html,
    })
    if (error) {
      this.logger.error('Failed to send removed-from-school email', error)
      throw new Error(`Resend error: ${error.message}`)
    }
  }

  async sendWelcomeEmail(to: string, name: string) {
    try {
      await this.resend.emails.send({
        from: this.from,
        to,
        subject: 'Welcome to Postulo!',
        html: `
          <h2>Welcome to Postulo, ${name}!</h2>
          <p>Start tracking your job applications and stay on top of your job search.</p>
          <p>The Postulo Team</p>
        `,
      })
    } catch (error) {
      this.logger.error('Failed to send welcome email', error)
    }
  }
}
