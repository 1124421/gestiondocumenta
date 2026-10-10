import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO base para paginación.
 * Todos los endpoints de listado extienden o usan este DTO.
 */
export class PaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Número de página' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 25, minimum: 1, maximum: 100, description: 'Registros por página' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 25;

  @ApiPropertyOptional({ description: 'Término de búsqueda general' })
  @IsOptional()
  @IsString()
  search?: string;

  /** Calcula el offset para Prisma */
  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 25);
  }
}

/**
 * Respuesta paginada genérica.
 */
export class PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
    this.hasNextPage = page < this.totalPages;
    this.hasPrevPage = page > 1;
  }
}

/**
 * Helper para crear respuesta paginada.
 */
export function paginate<T>(
  data: T[],
  total: number,
  pagination: PaginationDto,
): PaginatedResponseDto<T> {
  return new PaginatedResponseDto(
    data,
    total,
    pagination.page ?? 1,
    pagination.limit ?? 25,
  );
}
