import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AuthGuard } from '@nestjs/passport'
import { Throttle } from '@nestjs/throttler'
import type { User } from '@prisma/client'
import type { Request, Response } from 'express'

import { CurrentUser } from '../common/decorators/current-user.decorator'
import { AuthService } from './auth.service'
import { ExchangeCodeDto } from './dto/exchange-code.dto'
import { ForgotPasswordDto } from './dto/forgot-password.dto'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(@CurrentUser() user: User) {
    return this.authService.logout(user.id)
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(HttpStatus.OK)
  refresh(@CurrentUser() user: User & { refreshToken: string }) {
    return this.authService.refresh(user.id, user.refreshToken)
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email)
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password)
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const user = await this.authService.googleLogin(
      req.user as { email: string; name: string; avatar?: string },
    )
    const code = await this.authService.generateOAuthCode(user.id)
    const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL')
    res.redirect(`${frontendUrl}/callback?code=${code}`)
  }

  @Post('exchange-code')
  @HttpCode(HttpStatus.OK)
  exchangeCode(@Body() dto: ExchangeCodeDto) {
    return this.authService.exchangeOAuthCode(dto.code)
  }
}
