import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Rol, AccionAudit } from '@prisma/client';
import { TrazabilidadService } from './trazabilidad.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('trazabilidad')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trazabilidad')
export class TrazabilidadController {
  constructor(private readonly trazabilidadService: TrazabilidadService) {}

  @Get()
  @Roles(Rol.ADMINISTRADOR, Rol.AUDITOR)
  @ApiOperation({ summary: 'Obtener todos los registros de auditoría con filtros' })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('accion') accion?: AccionAudit,
    @Query('entidad') entidad?: string,
    @Query('usuarioId') usuarioId?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.trazabilidadService.findAll({
      page: +page, limit: +limit, accion, entidad, usuarioId, desde, hasta,
    });
  }

  @Get('estadisticas')
  @Roles(Rol.ADMINISTRADOR, Rol.AUDITOR, Rol.GERENCIA)
  @ApiOperation({ summary: 'Estadísticas del audit log' })
  getEstadisticas() {
    return this.trazabilidadService.getEstadisticas();
  }

  @Get('usuario/:usuarioId')
  @Roles(Rol.ADMINISTRADOR, Rol.AUDITOR)
  @ApiOperation({ summary: 'Historial de acciones de un usuario específico' })
  getByUsuario(
    @Param('usuarioId') usuarioId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.trazabilidadService.getByUsuario(usuarioId, +page, +limit);
  }

  @Get(':entidad/:entidadId')
  @Roles(Rol.ADMINISTRADOR, Rol.AUDITOR)
  @ApiOperation({ summary: 'Historial de una entidad específica (ej: Cliente, Expediente)' })
  getByEntidad(
    @Param('entidad') entidad: string,
    @Param('entidadId') entidadId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.trazabilidadService.getByEntidad(entidad, entidadId, +page, +limit);
  }
}
