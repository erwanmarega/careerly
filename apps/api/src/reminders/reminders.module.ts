import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'

import { MailModule } from '../mail/mail.module'
import { RemindersController } from './reminders.controller'
import { RemindersProcessor } from './reminders.processor'
import { RemindersService } from './reminders.service'

@Module({
  imports: [
    BullModule.registerQueue({ name: 'reminders' }),
    MailModule,
  ],
  controllers: [RemindersController],
  providers: [RemindersService, RemindersProcessor],
})
export class RemindersModule {}
