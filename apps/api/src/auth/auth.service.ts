import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import type { User } from '@prisma/client'
import * as bcrypt from 'bcrypt'

import { PrismaService } from '../prisma/prisma.service'
import type { LoginDto } from './dto/login.dto'
import type { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (exists) throw new BadRequestException('Email already in use')

    const hashed = await bcrypt.hash(dto.password, 10)
    const user = await this.prisma.user.create({
      data: { email: dto.email, password: hashed, name: dto.name },
    })

    const tokens = await this.generateTokens(user)
    await this.updateRefreshToken(user.id, tokens.refreshToken)
    return { tokens, user: this.sanitize(user) }
  }

  async login(dto: LoginDto) {
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

    const tokens = await this.generateTokens(user)
    await this.updateRefreshToken(user.id, tokens.refreshToken)
    return { tokens, user: this.sanitize(user) }
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
