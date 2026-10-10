import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Rol } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  @Roles(Rol.ADMINISTRADOR, Rol.GERENCIA, Rol.AUXILIAR_ARCHIVO, Rol.AUDITOR)
  @ApiOperation({ summary: 'KPIs principales del dashboard (clientes, expedientes, documentos, préstamos)' })
  getKpis() {
    return this.dashboardService.getKpis();
  }

  @Get('actividad-reciente')
  @Roles(Rol.ADMINISTRADOR, Rol.GERENCIA, Rol.AUDITOR)
  @ApiOperation({ summary: 'Últimas acciones del sistema para el timeline' })
  getActividadReciente(@Query('limit') limit = 20) {
    return this.dashboardService.getActividadReciente(+limit);
  }

  @Get('distribucion-documentos')
  @Roles(Rol.ADMINISTRADOR, Rol.GERENCIA, Rol.AUXILIAR_ARCHIVO, Rol.AUDITOR)
  @ApiOperation({ summary: 'Distribución de documentos por tipo (para gráfico de dona)' })
  getDistribucionDocumentos() {
    return this.dashboardService.getDistribucionDocumentos();
  }

  @Get('prestamos-por-mes')
  @Roles(Rol.ADMINISTRADOR, Rol.GERENCIA, Rol.AUDITOR)
  @ApiOperation({ summary: 'Historial de préstamos por mes (últimos 12 meses)' })
  getPrestamosPorMes() {
    return this.dashboardService.getPrestamosPorMes();
  }

  @Get('top-clientes')
  @Roles(Rol.ADMINISTRADOR, Rol.GERENCIA, Rol.AUXILIAR_ARCHIVO, Rol.AUDITOR)
  @ApiOperation({ summary: 'Top 10 clientes con más documentos' })
  getTopClientes() {
    return this.dashboardService.getTopClientes();
  }
}
