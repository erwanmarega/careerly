import { Body, Controller, Headers, HttpCode, HttpStatus, Post, RawBodyRequest, Req, UseGuards } from '@nestjs/common'
import type { User } from '@prisma/client'
import type { Request } from 'express'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { StripeService } from './stripe.service'

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('create-checkout')
  @UseGuards(JwtAuthGuard)
  createCheckout(@CurrentUser() user: User, @Body('priceId') priceId: string) {
    return this.stripeService.createCheckoutSession(user.id, priceId)
  }

  @Post('portal')
  @UseGuards(JwtAuthGuard)
  createPortal(@CurrentUser() user: User) {
    return this.stripeService.createPortalSession(user.id)
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.stripeService.handleWebhook(req.rawBody!, signature)
  }
}
