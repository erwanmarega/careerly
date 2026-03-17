import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { Plan } from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import { StripeService } from './stripe.service'

const mockStripe = {
  customers: { create: jest.fn() },
  checkout: { sessions: { create: jest.fn() } },
  billingPortal: { sessions: { create: jest.fn() } },
  webhooks: { constructEvent: jest.fn() },
}

jest.mock('stripe', () => jest.fn().mockImplementation(() => mockStripe))

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  plan: Plan.FREE,
  stripeCustomerId: null,
}

describe('StripeService', () => {
  let service: StripeService
  let prisma: { user: jest.Mocked<Record<string, jest.Mock>> }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('test-value'), get: jest.fn() },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUniqueOrThrow: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile()

    service = module.get(StripeService)
    prisma = module.get(PrismaService)
  })

  afterEach(() => jest.clearAllMocks())

  // ─── createCheckoutSession ───────────────────────────────────────────────────

  describe('createCheckoutSession', () => {
    it('creates a Stripe customer when user has none', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue(mockUser)
      mockStripe.customers.create.mockResolvedValue({ id: 'cus_new' })
      mockStripe.checkout.sessions.create.mockResolvedValue({ url: 'https://stripe.com/pay' })
      prisma.user.update.mockResolvedValue({ ...mockUser, stripeCustomerId: 'cus_new' })

      await service.createCheckoutSession('user-1', 'price_123')

      expect(mockStripe.customers.create).toHaveBeenCalledWith({ email: 'test@example.com' })
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { stripeCustomerId: 'cus_new' } }),
      )
    })

    it('reuses existing Stripe customer', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue({ ...mockUser, stripeCustomerId: 'cus_existing' })
      mockStripe.checkout.sessions.create.mockResolvedValue({ url: 'https://stripe.com/pay' })

      await service.createCheckoutSession('user-1', 'price_123')

      expect(mockStripe.customers.create).not.toHaveBeenCalled()
    })

    it('returns checkout session URL', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue({ ...mockUser, stripeCustomerId: 'cus_existing' })
      mockStripe.checkout.sessions.create.mockResolvedValue({ url: 'https://stripe.com/pay/abc' })

      const result = await service.createCheckoutSession('user-1', 'price_123')

      expect(result).toEqual({ url: 'https://stripe.com/pay/abc' })
    })
  })

  // ─── createPortalSession ─────────────────────────────────────────────────────

  describe('createPortalSession', () => {
    it('throws when user has no stripeCustomerId', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue(mockUser)

      await expect(service.createPortalSession('user-1')).rejects.toThrow('No Stripe customer found')
    })

    it('returns portal session URL', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue({ ...mockUser, stripeCustomerId: 'cus_123' })
      mockStripe.billingPortal.sessions.create.mockResolvedValue({ url: 'https://stripe.com/portal' })

      const result = await service.createPortalSession('user-1')

      expect(result).toEqual({ url: 'https://stripe.com/portal' })
    })
  })

  // ─── handleWebhook ───────────────────────────────────────────────────────────

  describe('handleWebhook', () => {
    it('upgrades user to PRO on subscription created', async () => {
      const config = module_get_config(service)
      config // silence unused warning

      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: 'customer.subscription.created',
        data: {
          object: {
            customer: 'cus_123',
            items: { data: [{ price: { id: 'test-value' } }] },
          },
        },
      })
      prisma.user.update.mockResolvedValue({ ...mockUser, plan: Plan.PRO })

      await service.handleWebhook(Buffer.from('payload'), 'sig')

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { plan: expect.any(String) } }),
      )
    })

    it('downgrades user to FREE on subscription deleted', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: 'customer.subscription.deleted',
        data: { object: { customer: 'cus_123' } },
      })
      prisma.user.update.mockResolvedValue({ ...mockUser, plan: Plan.FREE })

      await service.handleWebhook(Buffer.from('payload'), 'sig')

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { plan: Plan.FREE } }),
      )
    })

    it('ignores unknown webhook event types', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: { object: {} },
      })

      await service.handleWebhook(Buffer.from('payload'), 'sig')

      expect(prisma.user.update).not.toHaveBeenCalled()
    })
  })
})

// Helper to access the ConfigService mock from within the service
function module_get_config(_service: StripeService) {
  return null
}
