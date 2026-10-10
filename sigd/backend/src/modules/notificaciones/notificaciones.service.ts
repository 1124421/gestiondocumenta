import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { TipoNotificacion, EstadoNotificacion, EstadoPrestamo } from '@prisma/client';

/**
 * NotificacionesService — Gestión de alertas y notificaciones del sistema.
 *
 * Tipos de notificaciones:
 *  - Préstamos vencidos o próximos a vencer
 *  - Documentos pendientes de digitalizar
 *  - Transferencias documentales próximas
 *  - Alertas del sistema
 */
@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea una notificación para un usuario.
   */
  async crear(
    usuarioId: string,
    titulo: string,
    mensaje: string,
    tipo: TipoNotificacion,
    enlace?: string,
    metadatos?: Record<string, any>,
  ) {
    return this.prisma.notificacion.create({
      data: { usuarioId, titulo, mensaje, tipo, enlace, metadatos },
    });
  }

  /**
   * Obtiene las notificaciones de un usuario.
   */
  async getByUsuario(usuarioId: string, soloNoLeidas = false) {
    const where: any = { usuarioId };
    if (soloNoLeidas) where.estado = EstadoNotificacion.NO_LEIDA;

    return this.prisma.notificacion.findMany({
      where,
      orderBy: { creadoEn: 'desc' },
      take: 100,
    });
  }

  /**
   * Cuenta las notificaciones no leídas de un usuario.
   */
  async contarNoLeidas(usuarioId: string): Promise<number> {
    return this.prisma.notificacion.count({
      where: { usuarioId, estado: EstadoNotificacion.NO_LEIDA },
    });
  }

  /**
   * Marca una notificación como leída.
   */
  async marcarLeida(id: string, usuarioId: string) {
    return this.prisma.notificacion.updateMany({
      where: { id, usuarioId },
      data: { estado: EstadoNotificacion.LEIDA, leidaEn: new Date() },
    });
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas.
   */
  async marcarTodasLeidas(usuarioId: string) {
    return this.prisma.notificacion.updateMany({
      where: { usuarioId, estado: EstadoNotificacion.NO_LEIDA },
      data: { estado: EstadoNotificacion.LEIDA, leidaEn: new Date() },
    });
  }

  // ──────────────────────────────────────────────────────────
  // CRON JOBS — Verificaciones automáticas
  // ──────────────────────────────────────────────────────────

  /**
   * Cron: cada día a las 8:00 AM verifica préstamos vencidos.
   */
  @Cron('0 8 * * *', { name: 'verificar-prestamos-vencidos' })
  async verificarPrestamosVencidos() {
    this.logger.log('⏰ Ejecutando cron: verificar préstamos vencidos');
    const ahora = new Date();

    const prestamosVencidos = await this.prisma.prestamo.findMany({
      where: {
        estado: EstadoPrestamo.ACTIVO,
        fechaLimite: { lt: ahora },
      },
      include: {
        expediente: {
          include: {
            cliente: { select: { nombre: true, apellido: true } },
          },
        },
        solicitante: true,
      },
    });

    for (const prestamo of prestamosVencidos) {
      const clienteNombre = `${prestamo.expediente.cliente.nombre} ${prestamo.expediente.cliente.apellido ?? ''}`.trim();

      // Notificar al solicitante
      await this.crear(
        prestamo.solicitanteId,
        '⚠️ Préstamo vencido',
        `El expediente de ${clienteNombre} debía devolverse el ${prestamo.fechaLimite.toLocaleDateString('es-CO')}`,
        TipoNotificacion.PRESTAMO_VENCIDO,
        `/prestamos/${prestamo.id}`,
        { prestamoId: prestamo.id },
      );

      // Marcar préstamo como vencido
      await this.prisma.prestamo.update({
        where: { id: prestamo.id },
        data: { estado: EstadoPrestamo.VENCIDO },
      });
    }

    this.logger.log(`✅ ${prestamosVencidos.length} préstamos vencidos procesados`);
  }

  /**
   * Cron: cada día a las 9:00 AM notifica préstamos que vencen en 2 días.
   */
  @Cron('0 9 * * *', { name: 'alertar-proximos-vencimientos' })
  async alertarProximosVencimientos() {
    const en2Dias = new Date();
    en2Dias.setDate(en2Dias.getDate() + 2);

    const proximosVencer = await this.prisma.prestamo.findMany({
      where: {
        estado: EstadoPrestamo.ACTIVO,
        fechaLimite: {
          gte: new Date(),
          lte: en2Dias,
        },
      },
      include: {
        expediente: {
          include: { cliente: { select: { nombre: true, apellido: true } } },
        },
      },
    });

    for (const prestamo of proximosVencer) {
      const clienteNombre = `${prestamo.expediente.cliente.nombre}`;
      await this.crear(
        prestamo.solicitanteId,
        '📅 Préstamo por vencer',
        `El expediente de ${clienteNombre} vence el ${prestamo.fechaLimite.toLocaleDateString('es-CO')}`,
        TipoNotificacion.PRESTAMO_PROXIMO_VENCER,
        `/prestamos/${prestamo.id}`,
      );
    }

    this.logger.log(`✅ ${proximosVencer.length} alertas de vencimiento próximo enviadas`);
  }
}
