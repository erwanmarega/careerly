import Anthropic from '@anthropic-ai/sdk'
import { Injectable } from '@nestjs/common'

@Injectable()
export class AiService {
  private client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  async generateFollowUpEmail(company: string, position: string, userName: string) {
    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Génère un email de relance court et professionnel pour ${userName} qui a postulé au poste de ${position} chez ${company} et n'a pas eu de réponse. L'email doit : avoir un objet (préfixé par "Objet :"), faire 4-6 lignes maximum, être direct et chaleureux, se terminer par une signature avec le prénom uniquement. Ne pas ajouter d'explications, retourner uniquement l'email.`,
        },
      ],
    })
    const block = message.content.find((b) => b.type === 'text')
    if (!block || block.type !== 'text') throw new Error('No text response from AI')
    return block.text
  }
}
