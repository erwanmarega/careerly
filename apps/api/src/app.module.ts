import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'

import { AiModule } from './ai/ai.module'
import { DocumentsModule } from './documents/documents.module'
import { ApplicationsModule } from './applications/applications.module'
import { AuthModule } from './auth/auth.module'
import { MailModule } from './mail/mail.module'
import { PrismaModule } from './prisma/prisma.module'
import { RemindersModule } from './reminders/reminders.module'
import { SchoolsModule } from './schools/schools.module'
import { StatsModule } from './stats/stats.module'
import { StripeModule } from './stripe/stripe.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => ({
        throttlers: [{ name: 'default', ttl: 60000, limit: 100 }],
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: config.get<string>('REDIS_URL'),
      }),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ApplicationsModule,
    StatsModule,
    RemindersModule,
    SchoolsModule,
    StripeModule,
    MailModule,
    AiModule,
    DocumentsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
