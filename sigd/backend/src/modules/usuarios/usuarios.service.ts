import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateUsuarioDto, UpdateUsuarioDto, GetUsuariosDto } from './dto/usuario.dto';
import { paginate, PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

/**
 * UsuariosService — Gestión completa de usuarios del sistema.
 */
@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  // ──────────────────────────────────────────────────────────
  // LISTAR USUARIOS (paginado + filtros)
  // ──────────────────────────────────────────────────────────
  async findAll(params: GetUsuariosDto): Promise<PaginatedResponseDto<any>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 25;
    const skip = (page - 1) * limit;

    const where: Prisma.UsuarioWhereInput = {
      deletedAt: null,
    };

    if (params.rol) where.rol = params.rol;
    if (params.sedeId) where.sedeId = params.sedeId;
    if (params.search) {
      where.OR = [
        { nombre: { contains: params.search, mode: 'insensitive' } },
        { apellido: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [usuarios, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        skip,
        take: limit,
        orderBy: { creadoEn: 'desc' },
        select: this.selectPublico(),
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return paginate(usuarios, total, { page, limit } as any);
  }

  // ──────────────────────────────────────────────────────────
  // OBTENER USUARIO POR ID
  // ──────────────────────────────────────────────────────────
  async findOne(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        ...this.selectPublico(),
        sede: { select: { id: true, nombre: true, ciudad: true } },
        _count: {
          select: { prestamos: true, auditLogs: true },
        },
      },
    });

    if (!usuario || (usuario as any).deletedAt) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return usuario;
  }

  // ──────────────────────────────────────────────────────────
  // CREAR USUARIO
  // ──────────────────────────────────────────────────────────
  async create(dto: CreateUsuarioDto) {
    // Verificar si ya existe el email
    const existente = await this.prisma.usuario.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existente) {
      throw new ConflictException(`El email ${dto.email} ya está en uso`);
    }

    const passwordHash = await this.authService.hashPassword(dto.password);

    const usuario = await this.prisma.usuario.create({
      data: {
        nombre: dto.nombre.trim(),
        apellido: dto.apellido.trim(),
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        rol: dto.rol,
        telefono: dto.telefono,
        sedeId: dto.sedeId,
      },
      select: this.selectPublico(),
    });

    this.logger.log(`Usuario creado: ${usuario.email} (${usuario.rol})`);
    return usuario;
  }

  // ──────────────────────────────────────────────────────────
  // ACTUALIZAR USUARIO
  // ──────────────────────────────────────────────────────────
  async update(id: string, dto: UpdateUsuarioDto) {
    await this.findOne(id); // Verificar existencia

    const data: Prisma.UsuarioUpdateInput = {};

    if (dto.nombre) data.nombre = dto.nombre.trim();
    if (dto.apellido) data.apellido = dto.apellido.trim();
    if (dto.email) data.email = dto.email.toLowerCase().trim();
    if (dto.rol) data.rol = dto.rol;
    if (dto.telefono !== undefined) data.telefono = dto.telefono;
    if (dto.mfaHabilitado !== undefined) data.mfaHabilitado = dto.mfaHabilitado;
    if (dto.sedeId !== undefined)
      data.sede = dto.sedeId
        ? { connect: { id: dto.sedeId } }
        : { disconnect: true };

    // Si se proporciona nueva contraseña
    if (dto.password) {
      data.passwordHash = await this.authService.hashPassword(dto.password);
    }

    return this.prisma.usuario.update({
      where: { id },
      data,
      select: this.selectPublico(),
    });
  }

  // ──────────────────────────────────────────────────────────
  // SOFT DELETE
  // ──────────────────────────────────────────────────────────
  async softDelete(id: string): Promise<void> {
    await this.findOne(id); // Verificar existencia

    await this.prisma.usuario.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        estado: 'INACTIVO',
        refreshTokenHash: null, // Invalidar sesión
      },
    });

    this.logger.log(`Usuario eliminado (soft): userId=${id}`);
  }

  // ──────────────────────────────────────────────────────────
  // HISTORIAL DE ACTIVIDAD
  // ──────────────────────────────────────────────────────────
  async getActividad(usuarioId: string, limit = 50) {
    await this.findOne(usuarioId);

    return this.prisma.auditLog.findMany({
      where: { usuarioId },
      orderBy: { creadoEn: 'desc' },
      take: limit,
    });
  }

  // ──────────────────────────────────────────────────────────
  // SELECTOR PRIVADO (campos a devolver públicamente)
  // ──────────────────────────────────────────────────────────
  private selectPublico() {
    return {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      rol: true,
      estado: true,
      telefono: true,
      avatar: true,
      mfaHabilitado: true,
      sedeId: true,
      ultimoAcceso: true,
      creadoEn: true,
      actualizadoEn: true,
      // NUNCA devolver: passwordHash, mfaSecret, refreshTokenHash, resetPasswordToken
    };
  }
}
