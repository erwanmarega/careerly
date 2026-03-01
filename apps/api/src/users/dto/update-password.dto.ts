import { IsOptional, IsString, MinLength } from 'class-validator'

export class UpdatePasswordDto {
  @IsString()
  @IsOptional()
  currentPassword?: string

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  newPassword: string
}
