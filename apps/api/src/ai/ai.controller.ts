import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { IsString, IsNotEmpty } from 'class-validator'
import type { User } from '@prisma/client'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { AiService } from './ai.service'

class CoverLetterDto {
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

  @Post('cover-letter')
  async generateCoverLetter(@Body() dto: CoverLetterDto, @CurrentUser() user: User) {
    const text = await this.aiService.generateCoverLetter(dto.company, dto.position, user.name ?? user.email)
    return { text }
  }
}
