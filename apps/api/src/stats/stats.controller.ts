import { Controller, Get, UseGuards } from '@nestjs/common'
import type { User } from '@prisma/client'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { StatsService } from './stats.service'

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('overview')
  getOverview(@CurrentUser() user: User) {
    return this.statsService.getOverview(user.id)
  }

  @Get('by-status')
  getByStatus(@CurrentUser() user: User) {
    return this.statsService.getByStatus(user.id)
  }

  @Get('timeline')
  getTimeline(@CurrentUser() user: User) {
    return this.statsService.getTimeline(user.id)
  }
}
