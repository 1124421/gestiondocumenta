import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Rol, EstadoPrestamo } from '@prisma/client';
import { PrestamosService, CreatePrestamoDto, DevolucionDto } from './prestamos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('prestamos')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('prestamos')
export class PrestamosController {
  constructor(private readonly prestamosService: PrestamosService) {}

  @Get()
  @Roles(Rol.ADMINISTRADOR, Rol.AUXILIAR_ARCHIVO, Rol.GERENCIA, Rol.AUDITOR)
  @ApiOperation({ summary: 'Listar préstamos con filtro por estado' })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 25,
    @Query('estado') estado?: EstadoPrestamo,
  ) {
    return this.prestamosService.findAll(+page, +limit, estado);
  }

  @Get('activos')
  @Roles(Rol.ADMINISTRADOR, Rol.AUXILIAR_ARCHIVO, Rol.GERENCIA)
  @ApiOperation({ summary: 'Listar todos los préstamos activos' })
  getPrestamosActivos() {
    return this.prestamosService.getPrestamosActivos();
  }

  @Get('vencidos')
  @Roles(Rol.ADMINISTRADOR, Rol.AUXILIAR_ARCHIVO, Rol.GERENCIA)
  @ApiOperation({ summary: 'Listar préstamos vencidos (no devueltos a tiempo)' })
  getPrestamosVencidos() {
    return this.prestamosService.getPrestamosVencidos();
  }

  @Get(':id')
  @Roles(Rol.ADMINISTRADOR, Rol.AUXILIAR_ARCHIVO, Rol.GERENCIA, Rol.AUDITOR)
  @ApiOperation({ summary: 'Obtener préstamo por ID' })
  findOne(@Param('id') id: string) {
    return this.prestamosService.findOne(id);
  }

  @Post()
  @Roles(Rol.ADMINISTRADOR, Rol.AUXILIAR_ARCHIVO)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar préstamo de expediente físico' })
  create(
    @Body() dto: CreatePrestamoDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.prestamosService.registrarPrestamo(dto, userId);
  }

  @Patch(':id/devolucion')
  @Roles(Rol.ADMINISTRADOR, Rol.AUXILIAR_ARCHIVO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar devolución de expediente' })
  devolucion(
    @Param('id') id: string,
    @Body() dto: DevolucionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.prestamosService.registrarDevolucion(id, userId, dto);
  }
}
