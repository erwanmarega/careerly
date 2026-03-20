import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import type { User } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { unlinkSync } from 'fs'
import { join } from 'path'

import { PrismaService } from '../prisma/prisma.service'
import type { UpdatePasswordDto } from './dto/update-password.dto'
import type { UpdateUserDto } from './dto/update-user.dto'
import type { JoinSchoolDto } from './dto/join-school.dto'

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

  async joinSchool(id: string, dto: JoinSchoolDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } })

    if (user.role === 'SCHOOL_ADMIN') {
      throw new BadRequestException('Les administrateurs d\'école ne peuvent pas rejoindre une école')
    }
    if (user.schoolId) {
      throw new BadRequestException('Vous faites déjà partie d\'une école')
    }

    const school = await this.prisma.school.findUnique({ where: { inviteCode: dto.inviteCode } })
    if (!school) throw new NotFoundException('Code d\'invitation invalide')

    const updated = await this.prisma.user.update({
      where: { id },
      data: { schoolId: school.id, schoolRemovedAt: null },
    })

    return { school, user: this.sanitize(updated) }
  }

  async leaveSchool(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } })

    if (user.role === 'SCHOOL_ADMIN') {
      throw new BadRequestException('Supprimez votre école avant de la quitter')
    }
    if (!user.schoolId) {
      throw new BadRequestException('Vous n\'êtes dans aucune école')
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { schoolId: null },
    })

    return this.sanitize(updated)
  }

  async delete(id: string) {
    await this.prisma.user.delete({ where: { id } })
  }

  private sanitize(user: User) {
    const { password: _p, refreshToken: _r, ...safe } = user
    return safe
  }
}
