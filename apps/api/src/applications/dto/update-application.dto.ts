import { PartialType } from '@nestjs/mapped-types'
import { ApplicationStatus } from '@prisma/client'
import { IsEnum, IsOptional, IsString } from 'class-validator'

import { CreateApplicationDto } from './create-application.dto'

export class UpdateApplicationDto extends PartialType(CreateApplicationDto) {}

export class UpdateStatusDto {
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus

  @IsString()
  @IsOptional()
  note?: string
}
