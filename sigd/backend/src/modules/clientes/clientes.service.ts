import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateClienteDto,
  UpdateClienteDto,
  GetClientesDto,
} from './dto/cliente.dto';
import { paginate, PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

/**
 * ClientesService — Gestión completa de clientes y expedientes.
 *
 * Un cliente siempre tiene UN expediente (relación 1:1).
 * El expediente se crea automáticamente al crear un cliente.
 */
@Injectable()
export class ClientesService {
  private readonly logger = new Logger(ClientesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────
  // LISTAR CLIENTES (paginado + búsqueda multi-campo)
  // ──────────────────────────────────────────────────────────
  async findAll(params: GetClientesDto): Promise<PaginatedResponseDto<any>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 25;
    const skip = (page - 1) * limit;

    const where: Prisma.ClienteWhereInput = { deletedAt: null };

    if (params.sedeId) where.sedeId = params.sedeId;
    if (params.responsableId) where.responsableId = params.responsableId;
    if (params.tipoPersona) where.tipoPersona = params.tipoPersona;

    if (params.search) {
      const s = params.search.trim();
      where.OR = [
        { nombre: { contains: s, mode: 'insensitive' } },
        { apellido: { contains: s, mode: 'insensitive' } },
        { razonSocial: { contains: s, mode: 'insensitive' } },
        { numeroIdentificacion: { contains: s, mode: 'insensitive' } },
        { codigoInterno: { contains: s, mode: 'insensitive' } },
        { numeroContrato: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { telefono: { contains: s, mode: 'insensitive' } },
        { telefonoMovil: { contains: s, mode: 'insensitive' } },
        { palabrasClave: { has: s } },
      ];
    }

    const [clientes, total] = await Promise.all([
      this.prisma.cliente.findMany({
        where,
        skip,
        take: limit,
        orderBy: { creadoEn: 'desc' },
        include: {
          responsable: {
            select: { id: true, nombre: true, apellido: true, email: true },
          },
          sede: { select: { id: true, nombre: true, ciudad: true } },
          expediente: {
            select: {
              id: true,
              numero: true,
              estado: true,
              tieneArchivioFisico: true,
              tieneArchivoDigital: true,
              ubicacionFisica: {
                include: {
                  caja: {
                    include: { estante: { include: { pasillo: true } } },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.cliente.count({ where }),
    ]);

    return paginate(clientes, total, { page, limit } as any);
  }

  // ──────────────────────────────────────────────────────────
  // OBTENER CLIENTE POR ID
  // ──────────────────────────────────────────────────────────
  async findOne(id: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
      include: {
        responsable: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
        sede: true,
        expediente: {
          include: {
            ubicacionFisica: {
              include: {
                caja: {
                  include: {
                    estante: {
                      include: { pasillo: { include: { sede: true } } },
                    },
                  },
                },
              },
            },
            _count: { select: { documentos: true, prestamos: true } },
          },
        },
      },
    });

    if (!cliente || cliente.deletedAt) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    return cliente;
  }

  // ──────────────────────────────────────────────────────────
  // CREAR CLIENTE + EXPEDIENTE (transacción atómica)
  // ──────────────────────────────────────────────────────────
  async create(dto: CreateClienteDto, usuarioId: string) {
    // Verificar unicidad de número de identificación
    const existente = await this.prisma.cliente.findUnique({
      where: { numeroIdentificacion: dto.numeroIdentificacion },
    });

    if (existente) {
      throw new ConflictException(
        `Ya existe un cliente con la identificación ${dto.numeroIdentificacion}`,
      );
    }

    // Verificar unicidad de código interno
    if (dto.codigoInterno) {
      const existeCodigo = await this.prisma.cliente.findUnique({
        where: { codigoInterno: dto.codigoInterno },
      });
      if (existeCodigo) {
        throw new ConflictException(
          `El código interno ${dto.codigoInterno} ya está en uso`,
        );
      }
    }

    // Generar número de expediente
    const numeroExpediente = await this.generarNumeroExpediente();

    // Transacción: crear cliente + expediente juntos
    const cliente = await this.prisma.$transaction(async (tx) => {
      const nuevoCliente = await tx.cliente.create({
        data: {
          tipoIdentificacion: dto.tipoIdentificacion.toUpperCase(),
          numeroIdentificacion: dto.numeroIdentificacion.trim(),
          digitoVerificacion: dto.digitoVerificacion,
          tipoPersona: dto.tipoPersona ?? 'NATURAL',
          nombre: dto.nombre.trim(),
          apellido: dto.apellido?.trim(),
          razonSocial: dto.razonSocial?.trim(),
          nombreComercial: dto.nombreComercial?.trim(),
          email: dto.email?.toLowerCase().trim(),
          emailAdicional: undefined,
          telefono: dto.telefono,
          telefonoMovil: dto.telefonoMovil,
          direccion: dto.direccion,
          ciudad: dto.ciudad,
          pais: dto.pais ?? 'Colombia',
          codigoInterno: dto.codigoInterno,
          palabrasClave: dto.palabrasClave ?? [],
          observaciones: dto.observaciones,
          numeroContrato: dto.numeroContrato,
          fechaContrato: dto.fechaContrato ? new Date(dto.fechaContrato) : undefined,
          fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : undefined,
          responsableId: dto.responsableId,
          sedeId: dto.sedeId,
          // Crear expediente automáticamente
          expediente: {
            create: {
              numero: numeroExpediente,
              rutaDigital: `CLIENTES/${dto.numeroIdentificacion}/`,
              responsableId: dto.responsableId,
              sedeId: dto.sedeId,
            },
          },
        },
        include: {
          expediente: true,
          responsable: { select: { id: true, nombre: true, apellido: true } },
          sede: { select: { id: true, nombre: true } },
        },
      });

      return nuevoCliente;
    });

    this.logger.log(
      `Cliente creado: ${cliente.nombre} ${cliente.apellido ?? ''} | Expediente: ${cliente.expediente?.numero}`,
    );

    return cliente;
  }

  // ──────────────────────────────────────────────────────────
  // ACTUALIZAR CLIENTE
  // ──────────────────────────────────────────────────────────
  async update(id: string, dto: UpdateClienteDto, usuarioId: string) {
    await this.findOne(id); // Verificar existencia

    const data: Prisma.ClienteUpdateInput = {};

    if (dto.nombre) data.nombre = dto.nombre.trim();
    if (dto.apellido !== undefined) data.apellido = dto.apellido;
    if (dto.razonSocial !== undefined) data.razonSocial = dto.razonSocial;
    if (dto.email !== undefined) data.email = dto.email?.toLowerCase().trim();
    if (dto.telefono !== undefined) data.telefono = dto.telefono;
    if (dto.telefonoMovil !== undefined) data.telefonoMovil = dto.telefonoMovil;
    if (dto.direccion !== undefined) data.direccion = dto.direccion;
    if (dto.ciudad !== undefined) data.ciudad = dto.ciudad;
    if (dto.palabrasClave !== undefined) data.palabrasClave = dto.palabrasClave;
    if (dto.observaciones !== undefined) data.observaciones = dto.observaciones;
    if (dto.numeroContrato !== undefined) data.numeroContrato = dto.numeroContrato;
    if (dto.fechaVencimiento !== undefined)
      data.fechaVencimiento = dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null;
    if (dto.responsableId !== undefined)
      data.responsable = dto.responsableId
        ? { connect: { id: dto.responsableId } }
        : { disconnect: true };
    if (dto.sedeId !== undefined)
      data.sede = dto.sedeId
        ? { connect: { id: dto.sedeId } }
        : { disconnect: true };

    return this.prisma.cliente.update({
      where: { id },
      data,
      include: {
        expediente: { select: { id: true, numero: true, estado: true } },
        responsable: { select: { id: true, nombre: true, apellido: true } },
      },
    });
  }

  // ──────────────────────────────────────────────────────────
  // SOFT DELETE
  // ──────────────────────────────────────────────────────────
  async softDelete(id: string, usuarioId: string): Promise<void> {
    await this.findOne(id);

    await this.prisma.cliente.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Cliente eliminado (soft): ${id} por usuario ${usuarioId}`);
  }

  // ──────────────────────────────────────────────────────────
  // SUB-RECURSOS
  // ──────────────────────────────────────────────────────────

  async getDocumentos(clienteId: string) {
    const cliente = await this.findOne(clienteId);
    if (!cliente.expediente) return [];

    return this.prisma.documento.findMany({
      where: {
        expedienteId: cliente.expediente.id,
        deletedAt: null,
      },
      orderBy: { creadoEn: 'desc' },
      include: {
        subidoPor: { select: { nombre: true, apellido: true } },
      },
    });
  }

  async getPrestamos(clienteId: string) {
    const cliente = await this.findOne(clienteId);
    if (!cliente.expediente) return [];

    return this.prisma.prestamo.findMany({
      where: { expedienteId: cliente.expediente.id },
      orderBy: { creadoEn: 'desc' },
      include: {
        solicitante: { select: { nombre: true, apellido: true } },
        aprobadoPor: { select: { nombre: true, apellido: true } },
      },
    });
  }

  async getTrazabilidad(clienteId: string) {
    const cliente = await this.findOne(clienteId);

    return this.prisma.auditLog.findMany({
      where: {
        OR: [
          { entidadId: clienteId, entidad: 'Cliente' },
          { expedienteId: cliente.expediente?.id },
        ],
      },
      orderBy: { creadoEn: 'desc' },
      take: 200,
      include: {
        usuario: { select: { nombre: true, apellido: true, email: true } },
      },
    });
  }

  // ──────────────────────────────────────────────────────────
  // GENERADOR DE NÚMERO DE EXPEDIENTE
  // ──────────────────────────────────────────────────────────

  /**
   * Genera número de expediente secuencial.
   * Formato: EXP-{AÑO}-{SECUENCIAL_5_DÍGITOS}
   * Ejemplo: EXP-2024-00127
   */
  private async generarNumeroExpediente(): Promise<string> {
    const año = new Date().getFullYear();
    const prefijo = `EXP-${año}-`;

    // Buscar el último expediente del año actual
    const ultimoExpediente = await this.prisma.expediente.findFirst({
      where: { numero: { startsWith: prefijo } },
      orderBy: { numero: 'desc' },
    });

    let secuencial = 1;
    if (ultimoExpediente) {
      const partes = ultimoExpediente.numero.split('-');
      secuencial = parseInt(partes[2], 10) + 1;
    }

    return `${prefijo}${secuencial.toString().padStart(5, '0')}`;
  }
}
