import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { MinioService } from '../storage/minio.service';
import { TipoDocumento, EstadoDocumento, Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';

export interface RegistrarDocumentoInput {
  nombre: string;
  nombreOriginal: string;
  expedienteId: string;
  subidoPorId: string;
  tamanioBytes: number;
  mimeType: string;
  fileBuffer: Buffer;
  tipoDocumento?: TipoDocumento;
  // Resultado del OCR / IA (opcional)
  textoOcr?: string;
  palabrasClave?: string[];
  metadatosIA?: Record<string, any>;
  tipoDocumental?: string;
  fechaDocumento?: Date;
}

/**
 * DocumentosService — Gestión de documentos digitales en el SIGD.
 *
 * Flujo de subida (registrarDocumento):
 *  1. Valida tipo de archivo y que el expediente exista
 *  2. Calcula hash SHA-256 (detección de duplicados)
 *  3. Sube el archivo REAL a MinIO
 *  4. Guarda metadatos + texto OCR en PostgreSQL (transacción)
 *  5. Si la BD falla, elimina el objeto de MinIO (sin huérfanos)
 */
@Injectable()
export class DocumentosService {
  private readonly logger = new Logger(DocumentosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
    private readonly config: ConfigService,
  ) {}

  async findByExpediente(expedienteId: string, page = 1, limit = 25) {
    const skip = (page - 1) * limit;

    const [documentos, total] = await Promise.all([
      this.prisma.documento.findMany({
        where: { expedienteId, deletedAt: null },
        skip,
        take: limit,
        orderBy: { creadoEn: 'desc' },
        include: {
          subidoPor: { select: { nombre: true, apellido: true } },
        },
      }),
      this.prisma.documento.count({ where: { expedienteId, deletedAt: null } }),
    ]);

    return { data: documentos, total, page, limit };
  }

  async findOne(id: string) {
    const doc = await this.prisma.documento.findUnique({
      where: { id },
      include: {
        expediente: {
          include: { cliente: { select: { nombre: true, apellido: true, numeroIdentificacion: true } } },
        },
        subidoPor: { select: { nombre: true, apellido: true } },
      },
    });

    if (!doc || doc.deletedAt) throw new NotFoundException(`Documento ${id} no encontrado`);
    return doc;
  }

  /**
   * Sube el archivo a MinIO y registra el documento (con su texto OCR y
   * metadatos extraídos) en la base de datos.
   */
  async registrarDocumento(dto: RegistrarDocumentoInput) {
    // 1. Validar tipo de archivo
    const permitidos: string[] = this.config.get('upload.allowedMimeTypes') || [];
    if (permitidos.length && !permitidos.includes(dto.mimeType)) {
      throw new BadRequestException(`Tipo de archivo no permitido: ${dto.mimeType}`);
    }

    // 2. El expediente debe existir
    const expediente = await this.prisma.expediente.findUnique({
      where: { id: dto.expedienteId },
      select: { id: true, deletedAt: true },
    });
    if (!expediente || expediente.deletedAt) {
      throw new NotFoundException(`Expediente ${dto.expedienteId} no encontrado`);
    }

    // 3. Duplicados (mismo contenido en el mismo expediente)
    const hashSha256 = createHash('sha256').update(dto.fileBuffer).digest('hex');
    const duplicado = await this.prisma.documento.findFirst({
      where: { expedienteId: dto.expedienteId, hashSha256, deletedAt: null },
    });
    if (duplicado) {
      throw new BadRequestException(`Ya existe un documento idéntico: "${duplicado.nombre}"`);
    }

    // 4. Subir el archivo real a MinIO
    const key = `${dto.expedienteId}/${randomUUID()}_${this.sanearNombre(dto.nombreOriginal)}`;
    const rutaMinio = await this.minio.subir(key, dto.fileBuffer, dto.mimeType);

    // 5. Guardar en BD (documento + expediente en una sola transacción)
    try {
      const [documento] = await this.prisma.$transaction([
        this.prisma.documento.create({
          data: {
            nombre: dto.nombre,
            nombreOriginal: dto.nombreOriginal,
            expedienteId: dto.expedienteId,
            subidoPorId: dto.subidoPorId,
            rutaMinio,
            tamanioBytes: dto.tamanioBytes,
            mimeType: dto.mimeType,
            hashSha256,
            tipoDocumento: dto.tipoDocumento ?? this.inferirTipo(dto.mimeType),
            textoOcr: dto.textoOcr || null,
            palabrasClave: dto.palabrasClave ?? [],
            metadatosIA: (dto.metadatosIA ?? undefined) as Prisma.InputJsonValue | undefined,
            tipoDocumental: dto.tipoDocumental || null,
            fechaDocumento: dto.fechaDocumento ?? null,
          },
          include: {
            subidoPor: { select: { nombre: true, apellido: true } },
          },
        }),
        this.prisma.expediente.update({
          where: { id: dto.expedienteId },
          data: { folios: { increment: 1 }, tieneArchivoDigital: true },
        }),
      ]);

      this.logger.log(
        `Documento guardado: ${documento.nombre} | Expediente: ${dto.expedienteId} | MinIO: ${rutaMinio}`,
      );
      return documento;
    } catch (err) {
      // Compensación: no dejar el archivo huérfano en MinIO
      await this.minio.eliminar(rutaMinio);
      this.logger.error(`Fallo al registrar documento en BD, se revirtió MinIO: ${(err as Error).message}`);
      throw err;
    }
  }

  /**
   * Actualiza el texto OCR y metadatos IA de un documento ya existente.
   */
  async actualizarOcr(
    id: string,
    textoOcr: string,
    palabrasClave: string[],
    metadatosIA?: Record<string, any>,
  ) {
    return this.prisma.documento.update({
      where: { id },
      data: {
        textoOcr,
        palabrasClave,
        metadatosIA: (metadatosIA ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  /**
   * Soft delete de documento.
   */
  async softDelete(id: string, usuarioId: string): Promise<void> {
    await this.findOne(id);

    await this.prisma.documento.update({
      where: { id },
      data: { deletedAt: new Date(), estado: EstadoDocumento.INACTIVO },
    });

    this.logger.log(`Documento eliminado (soft): ${id}`);
  }

  /**
   * URL pre-firmada REAL de MinIO (15 minutos de vigencia).
   */
  async generarUrlDescarga(id: string): Promise<{ url: string; expiraEn: Date }> {
    const doc = await this.findOne(id);
    const url = await this.minio.urlDescarga(doc.rutaMinio, doc.nombreOriginal, 15 * 60);
    return { url, expiraEn: new Date(Date.now() + 15 * 60 * 1000) };
  }

  private sanearNombre(nombre: string): string {
    return nombre
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(-120);
  }

  private inferirTipo(mimeType: string): TipoDocumento {
    if (mimeType === 'application/pdf') return TipoDocumento.PDF;
    if (mimeType.includes('word')) return TipoDocumento.WORD;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return TipoDocumento.EXCEL;
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return TipoDocumento.POWERPOINT;
    if (mimeType.startsWith('image/')) return TipoDocumento.IMAGEN;
    if (mimeType.startsWith('video/')) return TipoDocumento.VIDEO;
    if (mimeType.startsWith('audio/')) return TipoDocumento.AUDIO;
    if (mimeType === 'message/rfc822') return TipoDocumento.CORREO;
    return TipoDocumento.OTRO;
  }
}
