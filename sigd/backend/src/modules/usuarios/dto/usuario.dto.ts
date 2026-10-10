import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { PartialType, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Rol } from '@prisma/client';

export class CreateUsuarioDto {
  @ApiProperty({ example: 'Juan', description: 'Nombre del usuario' })
  @IsString()
  nombre: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del usuario' })
  @IsString()
  apellido: string;

  @ApiProperty({ example: 'juan.perez@empresa.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Clave123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: Rol, example: Rol.AUXILIAR_ARCHIVO })
  @IsEnum(Rol)
  rol: Rol;

  @ApiPropertyOptional({ example: '+57 300 123 4567' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ description: 'ID de la sede asignada' })
  @IsOptional()
  @IsUUID()
  sedeId?: string;
}

export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {
  @ApiPropertyOptional({ description: 'Activar o desactivar MFA' })
  @IsOptional()
  @IsBoolean()
  mfaHabilitado?: boolean;
}

export class GetUsuariosDto {
  @ApiPropertyOptional({ description: 'Filtrar por rol' })
  @IsOptional()
  @IsEnum(Rol)
  rol?: Rol;

  @ApiPropertyOptional({ description: 'Filtrar por sede' })
  @IsOptional()
  @IsUUID()
  sedeId?: string;

  @ApiPropertyOptional({ description: 'Búsqueda por nombre o email' })
  @IsOptional()
  @IsString()
  search?: string;

  page?: number;
  limit?: number;
}
