import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Plan } from '@prisma/client'
import Stripe from 'stripe'

import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class StripeService {
  private readonly stripe: Stripe
  private readonly frontendUrl: string

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.stripe = new Stripe(config.getOrThrow('STRIPE_SECRET_KEY'))
    this.frontendUrl = config.getOrThrow('FRONTEND_URL')
  }

  async createCheckoutSession(userId: string, priceId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } })

    let customerId = user.stripeCustomerId

    if (!customerId) {
      const customer = await this.stripe.customers.create({ email: user.email })
      customerId = customer.id
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      })
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.frontendUrl}/settings?success=true`,
      cancel_url: `${this.frontendUrl}/settings?canceled=true`,
      metadata: { userId },
    })

    return { url: session.url }
  }

  async createPortalSession(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } })

    if (!user.stripeCustomerId) {
      throw new Error('No Stripe customer found')
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${this.frontendUrl}/settings`,
    })

    return { url: session.url }
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.config.getOrThrow('STRIPE_WEBHOOK_SECRET')
    const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret)

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await this.syncSubscription(subscription)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await this.cancelSubscription(subscription.customer as string)
        break
      }
    }
  }

  private async syncSubscription(subscription: Stripe.Subscription) {
    const priceId = subscription.items.data[0]?.price.id
    const proPriceId = this.config.get('STRIPE_PRO_PRICE_ID')

    const plan = priceId === proPriceId ? Plan.PRO : Plan.FREE

    await this.prisma.user.update({
      where: { stripeCustomerId: subscription.customer as string },
      data: { plan },
    })
  }

  private async cancelSubscription(customerId: string) {
    await this.prisma.user.update({
      where: { stripeCustomerId: customerId },
      data: { plan: Plan.FREE },
    })
  }
}
