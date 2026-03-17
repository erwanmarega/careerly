import { AiService } from './ai.service'

const mockCreate = jest.fn()

jest.mock('@anthropic-ai/sdk', () =>
  jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
)

describe('AiService', () => {
  let service: AiService

  beforeEach(() => {
    service = new AiService()
  })

  afterEach(() => jest.clearAllMocks())

  describe('generateFollowUpEmail', () => {
    it('returns the text content from the AI response', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Objet : Relance\n\nBonjour,\n\nCordialement,\nErwan' }],
      })

      const result = await service.generateFollowUpEmail('Google', 'Ingénieur', 'Erwan')

      expect(result).toContain('Objet :')
      expect(result).toContain('Erwan')
    })

    it('calls the API with company, position and userName in the prompt', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Email de relance' }],
      })

      await service.generateFollowUpEmail('Acme', 'Dev', 'Alice')

      const call = mockCreate.mock.calls[0][0]
      const content = call.messages[0].content as string
      expect(content).toContain('Acme')
      expect(content).toContain('Dev')
      expect(content).toContain('Alice')
    })

    it('uses claude-sonnet-4-6 model', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Email' }],
      })

      await service.generateFollowUpEmail('Acme', 'Dev', 'Alice')

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'claude-sonnet-4-6' }),
      )
    })

    it('throws when AI returns no text block', async () => {
      mockCreate.mockResolvedValue({ content: [] })

      await expect(service.generateFollowUpEmail('Acme', 'Dev', 'Alice')).rejects.toThrow(
        'No text response from AI',
      )
    })
  })
})
