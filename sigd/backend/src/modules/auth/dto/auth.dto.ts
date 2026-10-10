import { IsEmail, IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@sigd.com', description: 'Email del usuario' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({ example: 'Admin123!', description: 'Contraseña del usuario' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @ApiPropertyOptional({ description: 'Código MFA de 6 dígitos (si MFA está habilitado)' })
  @IsOptional()
  @IsString()
  mfaCode?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token obtenido al hacer login' })
  @IsString()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'usuario@empresa.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token de reset recibido por email' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'NuevaClave123!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  newPassword: string;
}

export class VerifyMfaDto {
  @ApiProperty({ example: '123456', description: 'Código OTP de 6 dígitos' })
  @IsString()
  codigo: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Contraseña actual' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: 'Nueva contraseña', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
