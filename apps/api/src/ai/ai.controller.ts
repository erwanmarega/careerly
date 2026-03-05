import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { IsString, IsNotEmpty } from 'class-validator'
import type { User } from '@prisma/client'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { AiService } from './ai.service'

class FollowUpEmailDto {
  @IsString()
  @IsNotEmpty()
  company: string

  @IsString()
  @IsNotEmpty()
  position: string
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('follow-up-email')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async generateFollowUpEmail(@Body() dto: FollowUpEmailDto, @CurrentUser() user: User) {
    const text = await this.aiService.generateFollowUpEmail(dto.company, dto.position, user.name ?? user.email)
    return { text }
  }
}
