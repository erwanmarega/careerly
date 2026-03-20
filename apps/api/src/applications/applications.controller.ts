import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import type { Response } from 'express'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApplicationStatus } from '@prisma/client'
import type { User } from '@prisma/client'
import { memoryStorage } from 'multer'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { ApplicationsService } from './applications.service'
import { CreateApplicationDto } from './dto/create-application.dto'
import { UpdateApplicationDto, UpdateStatusDto } from './dto/update-application.dto'

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('status') status?: ApplicationStatus,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: 'appliedAt' | 'company' | 'status',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.applicationsService.findAll({
      userId: user.id,
      status,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      sortBy,
      sortOrder,
    })
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(user.id, dto)
  }

  @Get('export')
  async exportCsv(@CurrentUser() user: User, @Res() res: Response) {
    const csv = await this.applicationsService.exportCsv(user.id)
    const date = new Date().toISOString().split('T')[0]
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="postulo-${date}.csv"`)
    res.send('\uFEFF' + csv)
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  importCsv(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Body('mapping') mappingJson?: string,
  ) {
    if (!file) throw new BadRequestException('No file provided')
    const csvText = file.buffer.toString('utf-8')
    let columnMapping: Record<string, string> | undefined
    if (mappingJson) {
      try {
        columnMapping = JSON.parse(mappingJson)
      } catch {
      }
    }
    return this.applicationsService.importFromCsv(user.id, csvText, columnMapping)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.applicationsService.findOne(id, user.id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: User, @Body() dto: UpdateApplicationDto) {
    return this.applicationsService.update(id, user.id, dto)
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @CurrentUser() user: User, @Body() dto: UpdateStatusDto) {
    return this.applicationsService.updateStatus(id, user.id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.applicationsService.delete(id, user.id)
  }
}
