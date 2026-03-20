import { IsString, Length } from 'class-validator'

export class JoinSchoolDto {
  @IsString()
  @Length(8, 8)
  inviteCode: string
}
