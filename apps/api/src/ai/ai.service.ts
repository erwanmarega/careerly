import Anthropic from '@anthropic-ai/sdk'
import { Injectable } from '@nestjs/common'

@Injectable()
export class AiService {
  private client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  async generateCoverLetter(company: string, position: string, userName: string) {
    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Génère une lettre de relance pour ${userName} qui a postulé pour le poste de ${position} chez ${company}. La lettre doit être professionnelle et concise.`,
        },
      ],
    })
    const block = message.content.find((b) => b.type === 'text')
    if (!block || block.type !== 'text') throw new Error('No text response from AI')
    return block.text
  }
}
