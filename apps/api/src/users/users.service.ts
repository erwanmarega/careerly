import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import type { User } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { unlinkSync } from 'fs'
import { join } from 'path'

import { PrismaService } from '../prisma/prisma.service'
import type { UpdatePasswordDto } from './dto/update-password.dto'
import type { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } })
    return this.sanitize(user)
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({ where: { id }, data: dto })
    return this.sanitize(user)
  }

  async updateAvatar(id: string, filename: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } })
    if (existing?.avatar) {
      const match = existing.avatar.match(/\/uploads\/avatars\/(.+)$/)
      if (match) {
        const oldPath = join(process.cwd(), 'public', 'uploads', 'avatars', match[1])
        try {
          unlinkSync(oldPath)
        } catch {
        }
      }
    }

    const apiUrl = `http://localhost:${process.env.PORT ?? 3001}`
    const avatarUrl = `${apiUrl}/uploads/avatars/${filename}`

    const user = await this.prisma.user.update({
      where: { id },
      data: { avatar: avatarUrl },
    })
    return this.sanitize(user)
  }

  async updatePassword(id: string, dto: UpdatePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } })

    if (user.password) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Le mot de passe actuel est requis')
      }
      const valid = await bcrypt.compare(dto.currentPassword, user.password)
      if (!valid) throw new UnauthorizedException('Mot de passe actuel incorrect')
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10)
    await this.prisma.user.update({ where: { id }, data: { password: hashed } })
  }

  async completeOnboarding(id: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { onboardingCompleted: true },
    })
    return this.sanitize(user)
  }

  async delete(id: string) {
    await this.prisma.user.delete({ where: { id } })
  }

  private sanitize(user: User) {
    const { password: _p, refreshToken: _r, ...safe } = user
    return safe
  }
}
