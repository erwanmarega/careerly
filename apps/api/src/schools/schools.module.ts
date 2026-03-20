import { Module } from '@nestjs/common'

import { MailModule } from '../mail/mail.module'
import { PrismaModule } from '../prisma/prisma.module'
import { SchoolsController } from './schools.controller'
import { SchoolsService } from './schools.service'

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [SchoolsController],
  providers: [SchoolsService],
})
export class SchoolsModule {}
