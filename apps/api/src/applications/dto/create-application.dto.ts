import { ApplicationStatus } from '@prisma/client'
import { IsDateString, IsEmail, IsEnum, IsOptional, IsString, IsUrl } from 'class-validator'

export class CreateApplicationDto {
  @IsString()
  company: string

  @IsString()
  position: string

  @IsString()
  @IsOptional()
  location?: string

  @IsUrl()
  @IsOptional()
  url?: string

  @IsString()
  @IsOptional()
  salary?: string

  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus

  @IsDateString()
  @IsOptional()
  appliedAt?: string

  @IsString()
  @IsOptional()
  notes?: string

  @IsString()
  @IsOptional()
  contactName?: string

  @IsEmail()
  @IsOptional()
  contactEmail?: string
}
