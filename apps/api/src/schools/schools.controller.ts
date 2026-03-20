import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import type { User } from '@prisma/client'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RoleGuard } from '../auth/guards/role.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { CreateSchoolDto } from './dto/create-school.dto'
import { SchoolsService } from './schools.service'

@Controller('schools')
@UseGuards(JwtAuthGuard)
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Get('current')
  getCurrentSchool(@CurrentUser() user: User) {
    return this.schoolsService.getCurrentSchool(user.id)
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateSchoolDto) {
    return this.schoolsService.create(user.id, dto)
  }

  @Get('me')
  @UseGuards(RoleGuard)
  @Roles('SCHOOL_ADMIN')
  findMySchool(@CurrentUser() user: User) {
    return this.schoolsService.findMySchool(user.id)
  }

  @Get('me/students')
  @UseGuards(RoleGuard)
  @Roles('SCHOOL_ADMIN')
  findStudents(@CurrentUser() user: User) {
    return this.schoolsService.findStudents(user.id)
  }

  @Get('me/students/:studentId/applications')
  @UseGuards(RoleGuard)
  @Roles('SCHOOL_ADMIN')
  findStudentApplications(@CurrentUser() user: User, @Param('studentId') studentId: string) {
    return this.schoolsService.findStudentApplications(user.id, studentId)
  }

  @Post('me/students/:studentId/remind')
  @UseGuards(RoleGuard)
  @Roles('SCHOOL_ADMIN')
  remindStudent(@CurrentUser() user: User, @Param('studentId') studentId: string) {
    return this.schoolsService.remindStudent(user.id, studentId)
  }

  @Delete('me/students/:studentId')
  @UseGuards(RoleGuard)
  @Roles('SCHOOL_ADMIN')
  removeStudent(@CurrentUser() user: User, @Param('studentId') studentId: string) {
    return this.schoolsService.removeStudent(user.id, studentId)
  }

  @Patch('me/invite-code')
  @UseGuards(RoleGuard)
  @Roles('SCHOOL_ADMIN')
  regenerateInviteCode(@CurrentUser() user: User) {
    return this.schoolsService.regenerateInviteCode(user.id)
  }
}
