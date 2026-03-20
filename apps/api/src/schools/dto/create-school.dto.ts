import { IsString, MinLength, MaxLength } from 'class-validator'

export class CreateSchoolDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string

  @IsString()
  adminSecret: string
}
