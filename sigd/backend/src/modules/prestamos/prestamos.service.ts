import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AccionAudit, EstadoPrestamo } from '@prisma/client';
import { IsString, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePrestamoDto {
  @ApiProperty({ description: 'ID del expediente a prestar' })
  @IsUUID()
  expedienteId: string;

  @ApiProperty({ description: 'Motivo del préstamo' })
  @IsString()
  motivo: string;

  @ApiProperty({ description: 'Fecha límite de devolución (ISO 8601)' })
  @IsDateString()
  fechaLimite: string;

  @ApiPropertyOptional({ description: 'Dependencia o área que solicita' })
  @IsOptional()
  @IsString()
  dependencia?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class DevolucionDto {
  @ApiPropertyOptional({ description: 'Observaciones de la devolución' })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

/**
 * PrestamosService — Gestión de préstamos de expedientes físicos.
 *
 * Reglas de negocio:
 *  - Un expediente solo puede tener UN préstamo activo a la vez
 *  - Al crear un préstamo, el expediente cambia a estado PRESTADO
 *  - Al devolver, el expediente regresa a ACTIVO
 *  - Los préstamos vencidos se detectan por cron job
 */
@Injectable()
export class PrestamosService {
  private readonly logger = new Logger(PrestamosService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, limit = 25, estado?: EstadoPrestamo) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (estado) where.estado = estado;

    const [prestamos, total] = await Promise.all([
      this.prisma.prestamo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { creadoEn: 'desc' },
        include: {
          expediente: {
            include: {
              cliente: { select: { nombre: true, apellido: true, numeroIdentificacion: true } },
              ubicacionFisica: {
                include: { caja: { include: { estante: { include: { pasillo: true } } } } },
              },
            },
          },
          solicitante: { select: { nombre: true, apellido: true, email: true } },
          aprobadoPor: { select: { nombre: true, apellido: true } },
        },
      }),
      this.prisma.prestamo.count({ where }),
    ]);

    return { data: prestamos, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const prestamo = await this.prisma.prestamo.findUnique({
      where: { id },
      include: {
        expediente: {
          include: {
            cliente: true,
            ubicacionFisica: true,
          },
        },
        solicitante: { select: { nombre: true, apellido: true, email: true } },
        aprobadoPor: { select: { nombre: true, apellido: true } },
      },
    });

    if (!prestamo) throw new NotFoundException(`Préstamo ${id} no encontrado`);
    return prestamo;
  }

  async registrarPrestamo(dto: CreatePrestamoDto, solicitanteId: string) {
    // Verificar que el expediente existe
    const expediente = await this.prisma.expediente.findUnique({
      where: { id: dto.expedienteId },
      include: { cliente: { select: { nombre: true, apellido: true } } },
    });

    if (!expediente) {
      throw new NotFoundException('Expediente no encontrado');
    }

    // Verificar que no hay préstamo activo
    const prestamoActivo = await this.prisma.prestamo.findFirst({
      where: { expedienteId: dto.expedienteId, estado: EstadoPrestamo.ACTIVO },
    });

    if (prestamoActivo) {
      throw new BadRequestException(
        'El expediente ya tiene un préstamo activo. Debe devolverse primero.',
      );
    }

    // Crear préstamo y actualizar estado del expediente en transacción
    const prestamo = await this.prisma.$transaction(async (tx) => {
      const nuevoPrestamo = await tx.prestamo.create({
        data: {
          expedienteId: dto.expedienteId,
          motivo: dto.motivo,
          fechaLimite: new Date(dto.fechaLimite),
          dependencia: dto.dependencia,
          observaciones: dto.observaciones,
          solicitanteId,
          aprobadoPorId: solicitanteId, // Auto-aprobado por quien lo crea (ajustable)
        },
        include: {
          expediente: {
            include: { cliente: { select: { nombre: true, apellido: true } } },
          },
          solicitante: { select: { nombre: true, apellido: true } },
        },
      });

      // Cambiar estado del expediente a PRESTADO
      await tx.expediente.update({
        where: { id: dto.expedienteId },
        data: { estado: 'PRESTADO' },
      });

      return nuevoPrestamo;
    });

    // Registrar en audit log
    await this.prisma.auditLog.create({
      data: {
        accion: AccionAudit.PRESTAMO_CREAR,
        entidad: 'Prestamo',
        entidadId: prestamo.id,
        descripcion: `Préstamo registrado para expediente ${expediente.numero}`,
        usuarioId: solicitanteId,
        expedienteId: dto.expedienteId,
        prestamoId: prestamo.id,
      },
    });

    this.logger.log(`Préstamo creado: ${prestamo.id} | Expediente: ${expediente.numero}`);
    return prestamo;
  }

  async registrarDevolucion(prestamoId: string, usuarioId: string, dto: DevolucionDto) {
    const prestamo = await this.findOne(prestamoId);

    if (prestamo.estado !== EstadoPrestamo.ACTIVO) {
      throw new BadRequestException(
        `El préstamo ya fue ${prestamo.estado.toLowerCase()}`,
      );
    }

    const ahora = new Date();
    const estaVencido = ahora > prestamo.fechaLimite;

    await this.prisma.$transaction(async (tx) => {
      await tx.prestamo.update({
        where: { id: prestamoId },
        data: {
          estado: EstadoPrestamo.DEVUELTO,
          fechaDevolucion: ahora,
          observaciones: dto.observaciones
            ? `${prestamo.observaciones || ''}\n[DEVOLUCIÓN]: ${dto.observaciones}`
            : prestamo.observaciones,
        },
      });

      // Restaurar estado del expediente
      await tx.expediente.update({
        where: { id: prestamo.expedienteId },
        data: { estado: 'ACTIVO' },
      });
    });

    await this.prisma.auditLog.create({
      data: {
        accion: AccionAudit.PRESTAMO_DEVOLVER,
        entidad: 'Prestamo',
        entidadId: prestamoId,
        descripcion: `Devolución registrada${estaVencido ? ' (VENCIDO)' : ''}`,
        usuarioId,
        expedienteId: prestamo.expedienteId,
        prestamoId,
      },
    });

    this.logger.log(`Devolución registrada: préstamo ${prestamoId}`);
    return { message: 'Devolución registrada exitosamente', estaVencido };
  }

  async getPrestamosActivos() {
    return this.prisma.prestamo.findMany({
      where: { estado: EstadoPrestamo.ACTIVO },
      include: {
        expediente: {
          include: { cliente: { select: { nombre: true, apellido: true, numeroIdentificacion: true } } },
        },
        solicitante: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fechaLimite: 'asc' },
    });
  }

  async getPrestamosVencidos() {
    return this.prisma.prestamo.findMany({
      where: {
        estado: EstadoPrestamo.ACTIVO,
        fechaLimite: { lt: new Date() },
      },
      include: {
        expediente: {
          include: { cliente: { select: { nombre: true, apellido: true } } },
        },
        solicitante: { select: { nombre: true, apellido: true, email: true } },
      },
      orderBy: { fechaLimite: 'asc' },
    });
  }
}
