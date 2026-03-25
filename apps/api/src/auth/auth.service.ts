import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import type { User } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { randomBytes } from 'crypto'

import { MailService } from '../mail/mail.service'
import { PrismaService } from '../prisma/prisma.service'
import type { LoginDto } from './dto/login.dto'
import type { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthService {
  private readonly usedOAuthCodes = new Set<string>()

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    await this.verifyTurnstile(dto.cfTurnstileToken)

    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (exists) throw new BadRequestException('Impossible de créer ce compte')

    const hashed = await bcrypt.hash(dto.password, 10)
    const user = await this.prisma.user.create({
      data: { email: dto.email, password: hashed, name: dto.name },
    })

    const tokens = await this.generateTokens(user)
    await this.updateRefreshToken(user.id, tokens.refreshToken)
    return { tokens, user: this.sanitize(user) }
  }

  async login(dto: LoginDto) {
    await this.verifyTurnstile(dto.cfTurnstileToken)

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user || !user.password) throw new UnauthorizedException('Invalid credentials')

    const valid = await bcrypt.compare(dto.password, user.password)
    if (!valid) throw new UnauthorizedException('Email ou mot de passe incorrects')

    const tokens = await this.generateTokens(user)
    await this.updateRefreshToken(user.id, tokens.refreshToken)
    return { tokens, user: this.sanitize(user) }
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    })
  }

  async refresh(userId: string, rawRefreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.refreshToken) throw new UnauthorizedException()

    const valid = await bcrypt.compare(rawRefreshToken, user.refreshToken)
    if (!valid) throw new UnauthorizedException()

    const tokens = await this.generateTokens(user)
    await this.updateRefreshToken(user.id, tokens.refreshToken)
    return tokens
  }

  async googleLogin(googleUser: { email: string; name: string; avatar?: string }) {
    let user = await this.prisma.user.findUnique({ where: { email: googleUser.email } })

    if (!user) {
      user = await this.prisma.user.create({
        data: { email: googleUser.email, name: googleUser.name, avatar: googleUser.avatar },
      })
    }

    return user
  }

  async generateOAuthCode(userId: string): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, type: 'oauth_code' },
      { secret: this.config.getOrThrow('JWT_SECRET'), expiresIn: '30s' },
    )
  }

  async exchangeOAuthCode(code: string) {
    if (this.usedOAuthCodes.has(code)) throw new UnauthorizedException('Code déjà utilisé')

    let payload: { sub: string; type: string }
    try {
      payload = await this.jwt.verifyAsync(code, {
        secret: this.config.getOrThrow('JWT_SECRET'),
      })
    } catch {
      throw new UnauthorizedException('Code invalide ou expiré')
    }

    if (payload.type !== 'oauth_code') throw new UnauthorizedException('Code invalide')

    this.usedOAuthCodes.add(code)
    setTimeout(() => this.usedOAuthCodes.delete(code), 30_000).unref()

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) throw new UnauthorizedException()

    const tokens = await this.generateTokens(user)
    await this.updateRefreshToken(user.id, tokens.refreshToken)
    return { tokens, user: this.sanitize(user) }
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) return

    const token = randomBytes(32).toString('hex')
    const expiry = new Date(Date.now() + 60 * 60 * 1000)

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: token, resetPasswordExpiry: expiry },
    })

    await this.mail.sendPasswordResetEmail(user.email, user.name ?? '', token)
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpiry: { gt: new Date() },
      },
    })
    if (!user) throw new BadRequestException('Token invalide ou expiré')

    const hashed = await bcrypt.hash(newPassword, 10)
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetPasswordToken: null, resetPasswordExpiry: null },
    })
  }

  private async verifyTurnstile(token: string | undefined) {
    const secret = this.config.get<string>('TURNSTILE_SECRET')
    if (!secret) return
    if (!token) throw new BadRequestException('Vérification anti-bot requise')

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
    })
    const data = (await res.json()) as { success: boolean }
    if (!data.success) throw new BadRequestException('Vérification anti-bot échouée')
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email }
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_SECRET'),
        expiresIn: this.config.getOrThrow('JWT_EXPIRES_IN'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.config.getOrThrow('JWT_REFRESH_EXPIRES_IN'),
      }),
    ])
    return { accessToken, refreshToken }
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10)
    await this.prisma.user.update({ where: { id: userId }, data: { refreshToken: hashed } })
  }

  private sanitize(user: User) {
    const { password: _p, refreshToken: _r, ...safe } = user
    return safe
  }
}
