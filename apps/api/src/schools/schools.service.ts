import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { randomBytes } from 'crypto'

import { MailService } from '../mail/mail.service'
import { PrismaService } from '../prisma/prisma.service'
import type { CreateSchoolDto } from './dto/create-school.dto'

@Injectable()
export class SchoolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async getCurrentSchool(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } })
    if (!user.schoolId) return null
    return this.prisma.school.findUnique({ where: { id: user.schoolId } })
  }

  async create(userId: string, dto: CreateSchoolDto) {
    const secret = process.env.SCHOOL_CREATION_SECRET
    if (!secret || dto.adminSecret !== secret) {
      throw new UnauthorizedException('Code secret invalide')
    }

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } })

    if (user.role === 'SCHOOL_ADMIN') {
      throw new BadRequestException('Vous administrez déjà une école')
    }
    if (user.schoolId) {
      throw new BadRequestException('Quittez votre école actuelle avant d\'en créer une')
    }

    const inviteCode = randomBytes(4).toString('hex').toUpperCase()

    const school = await this.prisma.school.create({
      data: { name: dto.name, inviteCode },
    })

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'SCHOOL_ADMIN', schoolId: school.id },
    })

    return school
  }

  async findMySchool(adminId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: adminId } })

    if (!user.schoolId) throw new NotFoundException('Aucune école associée')

    const school = await this.prisma.school.findUniqueOrThrow({
      where: { id: user.schoolId },
      include: { _count: { select: { users: { where: { role: 'STUDENT' } } } } },
    })

    return {
      ...school,
      studentCount: school._count.users,
    }
  }

  async findStudents(adminId: string) {
    const admin = await this.prisma.user.findUniqueOrThrow({ where: { id: adminId } })
    if (!admin.schoolId) throw new NotFoundException('Aucune école associée')

    const students = await this.prisma.user.findMany({
      where: { schoolId: admin.schoolId, role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        applications: {
          select: {
            status: true,
            appliedAt: true,
          },
          orderBy: { appliedAt: 'desc' },
        },
      },
    })

    return students.map((s) => {
      const apps = s.applications
      const lastApplicationAt = apps.length > 0 ? apps[0].appliedAt : null

      const statusBreakdown = apps.reduce<Record<string, number>>((acc, a) => {
        acc[a.status] = (acc[a.status] ?? 0) + 1
        return acc
      }, {})

      const { applications: _a, ...studentData } = s

      return {
        ...studentData,
        applicationCount: apps.length,
        lastApplicationAt,
        statusBreakdown,
        hasOffer: statusBreakdown['OFFER'] > 0,
      }
    })
  }

  async findStudentApplications(adminId: string, studentId: string) {
    const admin = await this.prisma.user.findUniqueOrThrow({ where: { id: adminId } })
    if (!admin.schoolId) throw new NotFoundException('Aucune école associée')

    const student = await this.prisma.user.findUnique({ where: { id: studentId } })

    if (!student || student.schoolId !== admin.schoolId) {
      throw new ForbiddenException('Cet étudiant n\'appartient pas à votre école')
    }

    return this.prisma.application.findMany({
      where: { userId: studentId },
      include: { statusHistory: { orderBy: { changedAt: 'desc' } } },
      orderBy: { appliedAt: 'desc' },
    })
  }

  async remindStudent(adminId: string, studentId: string) {
    const admin = await this.prisma.user.findUniqueOrThrow({ where: { id: adminId } })
    if (!admin.schoolId) throw new NotFoundException('Aucune école associée')

    const school = await this.prisma.school.findUniqueOrThrow({ where: { id: admin.schoolId } })

    const student = await this.prisma.user.findUnique({ where: { id: studentId } })
    if (!student || student.schoolId !== admin.schoolId) {
      throw new ForbiddenException("Cet étudiant n'appartient pas à votre école")
    }

    await this.mail.sendSchoolReminderEmail(
      student.email,
      student.name ?? student.email,
      school.name,
    )

    return { sent: true }
  }

  async removeStudent(adminId: string, studentId: string) {
    const admin = await this.prisma.user.findUniqueOrThrow({ where: { id: adminId } })
    if (!admin.schoolId) throw new NotFoundException('Aucune école associée')

    const student = await this.prisma.user.findUnique({ where: { id: studentId } })
    if (!student || student.schoolId !== admin.schoolId) {
      throw new ForbiddenException("Cet étudiant n'appartient pas à votre école")
    }

    const school = await this.prisma.school.findUniqueOrThrow({ where: { id: admin.schoolId } })

    await this.prisma.user.update({
      where: { id: studentId },
      data: { schoolId: null, schoolRemovedAt: new Date() },
    })

    await this.mail.sendRemovedFromSchoolEmail(
      student.email,
      student.name ?? student.email,
      school.name,
    )

    return { removed: true }
  }

  async regenerateInviteCode(adminId: string) {
    const admin = await this.prisma.user.findUniqueOrThrow({ where: { id: adminId } })
    if (!admin.schoolId) throw new NotFoundException('Aucune école associée')

    const inviteCode = randomBytes(4).toString('hex').toUpperCase()

    return this.prisma.school.update({
      where: { id: admin.schoolId },
      data: { inviteCode },
    })
  }
}
