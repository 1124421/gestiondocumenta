import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsDateString,
  IsArray,
  IsUUID,
  MinLength,
} from 'class-validator';
import { PartialType, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateClienteDto {
  @ApiProperty({ example: 'CC', description: 'Tipo de identificación: CC, NIT, CE, PA' })
  @IsString()
  tipoIdentificacion: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  @MinLength(5)
  numeroIdentificacion: string;

  @ApiPropertyOptional({ example: '5', description: 'Dígito de verificación (NIT)' })
  @IsOptional()
  @IsString()
  digitoVerificacion?: string;

  @ApiPropertyOptional({ example: 'NATURAL', enum: ['NATURAL', 'JURIDICA'] })
  @IsOptional()
  @IsString()
  tipoPersona?: string = 'NATURAL';

  @ApiProperty({ example: 'Juan Carlos' })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ example: 'Rodríguez Pérez' })
  @IsOptional()
  @IsString()
  apellido?: string;

  @ApiPropertyOptional({ description: 'Razón social (personas jurídicas)' })
  @IsOptional()
  @IsString()
  razonSocial?: string;

  @ApiPropertyOptional({ description: 'Nombre comercial' })
  @IsOptional()
  @IsString()
  nombreComercial?: string;

  @ApiPropertyOptional({ example: 'cliente@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+57 300 123 4567' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telefonoMovil?: string;

  @ApiPropertyOptional({ example: 'Calle 123 # 45-67' })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional({ example: 'Bogotá' })
  @IsOptional()
  @IsString()
  ciudad?: string;

  @ApiPropertyOptional({ example: 'Colombia' })
  @IsOptional()
  @IsString()
  pais?: string;

  @ApiPropertyOptional({ description: 'Código interno asignado por la empresa' })
  @IsOptional()
  @IsString()
  codigoInterno?: string;

  @ApiPropertyOptional({ type: [String], description: 'Etiquetas o palabras clave' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  palabrasClave?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({ example: 'CTR-2024-001' })
  @IsOptional()
  @IsString()
  numeroContrato?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fechaContrato?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;

  @ApiPropertyOptional({ description: 'ID del usuario responsable' })
  @IsOptional()
  @IsUUID()
  responsableId?: string;

  @ApiPropertyOptional({ description: 'ID de la sede asignada' })
  @IsOptional()
  @IsUUID()
  sedeId?: string;
}

export class UpdateClienteDto extends PartialType(CreateClienteDto) {}

export class GetClientesDto {
  @ApiPropertyOptional({ description: 'Búsqueda general (nombre, cédula, contrato, etc.)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por sede' })
  @IsOptional()
  @IsUUID()
  sedeId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por responsable' })
  @IsOptional()
  @IsUUID()
  responsableId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por tipo de persona' })
  @IsOptional()
  @IsString()
  tipoPersona?: string;

  @ApiPropertyOptional({ description: 'Número de página', default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Registros por página', default: 25 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 25;
}
