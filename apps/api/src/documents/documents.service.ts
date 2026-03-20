import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { unlinkSync } from 'fs'
import { join } from 'path'

import { PrismaService } from '../prisma/prisma.service'
import type { DocumentType } from '@prisma/client'

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(userId: string, name: string, type: DocumentType, filename: string, url: string) {
    return this.prisma.document.create({
      data: { name, type, filename, url, userId },
    })
  }

  async setActive(userId: string, documentId: string) {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } })
    if (!doc) throw new NotFoundException('Document introuvable')
    if (doc.userId !== userId) throw new ForbiddenException()

    await this.prisma.document.updateMany({
      where: { userId, type: doc.type },
      data: { isActive: false },
    })

    return this.prisma.document.update({
      where: { id: documentId },
      data: { isActive: true },
    })
  }

  async delete(userId: string, documentId: string) {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } })
    if (!doc) throw new NotFoundException('Document introuvable')
    if (doc.userId !== userId) throw new ForbiddenException()

    const filePath = join(process.cwd(), 'public', 'uploads', 'documents', doc.filename)
    try {
      unlinkSync(filePath)
    } catch {}

    await this.prisma.document.delete({ where: { id: documentId } })
  }
}
