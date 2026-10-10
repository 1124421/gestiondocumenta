import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AccionAudit } from '@prisma/client';

export interface RegistrarAccionDto {
  accion: AccionAudit;
  entidad: string;
  entidadId?: string;
  descripcion: string;
  usuarioId: string;
  expedienteId?: string;
  prestamoId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadatos?: Record<string, any>;
}

/**
 * TrazabilidadService — Registro inmutable de todas las acciones del sistema.
 *
 * La tabla audit_logs NUNCA se modifica ni se elimina.
 * Esto garantiza la trazabilidad completa y la auditabilidad del sistema.
 */
@Injectable()
export class TrazabilidadService {
  private readonly logger = new Logger(TrazabilidadService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra una acción en el audit log.
   * Método principal usado por otros servicios.
   */
  async registrar(dto: RegistrarAccionDto): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          accion: dto.accion,
          entidad: dto.entidad,
          entidadId: dto.entidadId,
          descripcion: dto.descripcion,
          usuarioId: dto.usuarioId,
          expedienteId: dto.expedienteId,
          prestamoId: dto.prestamoId,
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
          metadatos: dto.metadatos,
        },
      });
    } catch (err) {
      // El fallo del log NO debe interrumpir el flujo de negocio
      this.logger.error('Error al registrar audit log', err);
    }
  }

  /**
   * Obtiene el historial de una entidad específica.
   */
  async getByEntidad(
    entidad: string,
    entidadId: string,
    page = 1,
    limit = 50,
  ) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { entidad, entidadId },
        orderBy: { creadoEn: 'desc' },
        skip,
        take: limit,
        include: {
          usuario: { select: { nombre: true, apellido: true, email: true, rol: true } },
        },
      }),
      this.prisma.auditLog.count({ where: { entidad, entidadId } }),
    ]);

    return { data: logs, total, page, limit };
  }

  /**
   * Obtiene todas las acciones de un usuario.
   */
  async getByUsuario(usuarioId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { usuarioId },
        orderBy: { creadoEn: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where: { usuarioId } }),
    ]);

    return { data: logs, total, page, limit };
  }

  /**
   * Obtiene todos los logs con filtros avanzados.
   */
  async findAll(params: {
    page?: number;
    limit?: number;
    accion?: AccionAudit;
    entidad?: string;
    usuarioId?: string;
    desde?: string;
    hasta?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.accion) where.accion = params.accion;
    if (params.entidad) where.entidad = params.entidad;
    if (params.usuarioId) where.usuarioId = params.usuarioId;
    if (params.desde || params.hasta) {
      where.creadoEn = {};
      if (params.desde) where.creadoEn.gte = new Date(params.desde);
      if (params.hasta) where.creadoEn.lte = new Date(params.hasta);
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { creadoEn: 'desc' },
        skip,
        take: limit,
        include: {
          usuario: { select: { nombre: true, apellido: true, email: true, rol: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Estadísticas del audit log para el dashboard.
   */
  async getEstadisticas() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [totalLogs, logsHoy, loginsFallidos, accionesPorTipo] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.count({ where: { creadoEn: { gte: hoy } } }),
      this.prisma.auditLog.count({ where: { accion: AccionAudit.LOGIN_FALLIDO } }),
      this.prisma.auditLog.groupBy({
        by: ['accion'],
        _count: { accion: true },
        orderBy: { _count: { accion: 'desc' } },
        take: 10,
      }),
    ]);

    return { totalLogs, logsHoy, loginsFallidos, accionesPorTipo };
  }
}
