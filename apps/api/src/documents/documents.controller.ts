import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import type { User } from '@prisma/client'
import { diskStorage } from 'multer'
import { extname, join } from 'path'
import { mkdirSync } from 'fs'
import { ConfigService } from '@nestjs/config'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { DocumentsService } from './documents.service'
import type { DocumentType } from '@prisma/client'

const docsDir = join(process.cwd(), 'public', 'uploads', 'documents')
mkdirSync(docsDir, { recursive: true })

const documentStorage = diskStorage({
  destination: docsDir,
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase()
    cb(null, `${crypto.randomUUID()}${ext}`)
  },
})

function documentFileFilter(
  _req: unknown,
  file: Express.Multer.File,
  cb: (err: Error | null, accept: boolean) => void,
) {
  const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new BadRequestException('Seuls les fichiers PDF et Word sont acceptés'), false)
  }
}

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.documentsService.findAll(user.id)
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: documentStorage,
      fileFilter: documentFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  upload(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
    @Body('type') type: string,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier reçu')
    if (!name?.trim()) throw new BadRequestException('Le nom est requis')
    if (!['CV', 'COVER_LETTER'].includes(type)) throw new BadRequestException('Type invalide')

    const apiUrl = this.config.get('API_URL') ?? `http://localhost:${this.config.get('PORT') ?? 3001}`
    const url = `${apiUrl}/uploads/documents/${file.filename}`

    return this.documentsService.create(user.id, name.trim(), type as DocumentType, file.filename, url)
  }

  @Patch(':id/active')
  setActive(@CurrentUser() user: User, @Param('id') id: string) {
    return this.documentsService.setActive(user.id, id)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.documentsService.delete(user.id, id)
  }
}
