import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EstadoExpediente, EstadoPrestamo } from '@prisma/client';

/**
 * DashboardService — KPIs, métricas e indicadores del sistema.
 *
 * Devuelve todos los datos para el dashboard principal en una sola consulta optimizada.
 */
@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * KPIs principales del dashboard.
   * Ejecuta todas las consultas en paralelo para máxima velocidad.
   */
  async getKpis() {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const en7Dias = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalClientes,
      totalExpedientes,
      expedientesActivos,
      expedientesInactivos,
      expedientesPrestados,
      totalDocumentos,
      documentosSinOcr,
      prestamosActivos,
      prestamosVencidos,
      prestamosProximosVencer,
      clientesEstesMes,
      totalCajas,
      totalSedes,
      totalUsuarios,
    ] = await Promise.all([
      // Clientes
      this.prisma.cliente.count({ where: { deletedAt: null } }),

      // Expedientes
      this.prisma.expediente.count({ where: { deletedAt: null } }),
      this.prisma.expediente.count({ where: { deletedAt: null, estado: EstadoExpediente.ACTIVO } }),
      this.prisma.expediente.count({ where: { deletedAt: null, estado: EstadoExpediente.INACTIVO } }),
      this.prisma.expediente.count({ where: { deletedAt: null, estado: EstadoExpediente.PRESTADO } }),

      // Documentos
      this.prisma.documento.count({ where: { deletedAt: null } }),
      this.prisma.documento.count({ where: { deletedAt: null, textoOcr: null } }),

      // Préstamos
      this.prisma.prestamo.count({ where: { estado: EstadoPrestamo.ACTIVO } }),
      this.prisma.prestamo.count({
        where: { estado: EstadoPrestamo.ACTIVO, fechaLimite: { lt: ahora } },
      }),
      this.prisma.prestamo.count({
        where: {
          estado: EstadoPrestamo.ACTIVO,
          fechaLimite: { gte: ahora, lte: en7Dias },
        },
      }),

      // Crecimiento
      this.prisma.cliente.count({
        where: { deletedAt: null, creadoEn: { gte: inicioMes } },
      }),

      // Infraestructura
      this.prisma.caja.count({ where: { activa: true } }),
      this.prisma.sede.count({ where: { activa: true } }),
      this.prisma.usuario.count({ where: { deletedAt: null, estado: 'ACTIVO' } }),
    ]);

    return {
      clientes: {
        total: totalClientes,
        nuevosEsteMes: clientesEstesMes,
      },
      expedientes: {
        total: totalExpedientes,
        activos: expedientesActivos,
        inactivos: expedientesInactivos,
        prestados: expedientesPrestados,
      },
      documentos: {
        total: totalDocumentos,
        pendientesDigitalizacion: documentosSinOcr,
        digitalizados: totalDocumentos - documentosSinOcr,
        porcentajeDigitalizado:
          totalDocumentos > 0
            ? Math.round(((totalDocumentos - documentosSinOcr) / totalDocumentos) * 100)
            : 0,
      },
      prestamos: {
        activos: prestamosActivos,
        vencidos: prestamosVencidos,
        proximosVencer: prestamosProximosVencer,
      },
      infraestructura: {
        cajas: totalCajas,
        sedes: totalSedes,
        usuariosActivos: totalUsuarios,
      },
      generadoEn: new Date().toISOString(),
    };
  }

  /**
   * Actividad reciente para el timeline del dashboard.
   */
  async getActividadReciente(limit = 20) {
    return this.prisma.auditLog.findMany({
      orderBy: { creadoEn: 'desc' },
      take: limit,
      include: {
        usuario: { select: { nombre: true, apellido: true, rol: true } },
      },
    });
  }

  /**
   * Distribución de documentos por tipo para gráfico de dona.
   */
  async getDistribucionDocumentos() {
    return this.prisma.documento.groupBy({
      by: ['tipoDocumento'],
      _count: { tipoDocumento: true },
      where: { deletedAt: null },
      orderBy: { _count: { tipoDocumento: 'desc' } },
    });
  }

  /**
   * Préstamos por mes para gráfico de líneas (últimos 12 meses).
   */
  async getPrestamosPorMes() {
    const hace12Meses = new Date();
    hace12Meses.setMonth(hace12Meses.getMonth() - 12);

    return this.prisma.prestamo.findMany({
      where: { creadoEn: { gte: hace12Meses } },
      select: { creadoEn: true, estado: true },
      orderBy: { creadoEn: 'asc' },
    });
  }

  /**
   * Top 10 clientes con más documentos.
   */
  async getTopClientes() {
    return this.prisma.expediente.findMany({
      where: { deletedAt: null },
      select: {
        numero: true,
        folios: true,
        cliente: {
          select: { nombre: true, apellido: true, numeroIdentificacion: true },
        },
        _count: { select: { documentos: true } },
      },
      orderBy: { folios: 'desc' },
      take: 10,
    });
  }
}
