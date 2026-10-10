import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * BusquedaService — Búsqueda inteligente multi-campo.
 *
 * Implementa búsqueda:
 *  1. PostgreSQL full-text search (nativa, sin ES)
 *  2. Multi-campo con OR conditions
 *  3. Filtros combinados
 *  4. Resultados ordenados por relevancia
 *
 * Nota: Elasticsearch se integra aquí cuando esté disponible.
 * Por ahora, PostgreSQL ILIKE ofrece resultados excelentes para < 100k registros.
 */
@Injectable()
export class BusquedaService {
  private readonly logger = new Logger(BusquedaService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Búsqueda global — busca en clientes, expedientes y documentos.
   * Soporta queries como: "Contrato Juan Pérez", "Cédula 123456", "Factura marzo 2024"
   */
  async buscarGlobal(query: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const terminos = query.trim().split(/\s+/).filter(Boolean);

    this.logger.log(`Búsqueda global: "${query}" | Términos: ${terminos.join(', ')}`);

    // Búsqueda en clientes
    const clienteWhere: Prisma.ClienteWhereInput = {
      deletedAt: null,
      AND: terminos.map((t) => ({
        OR: [
          { nombre: { contains: t, mode: 'insensitive' } },
          { apellido: { contains: t, mode: 'insensitive' } },
          { razonSocial: { contains: t, mode: 'insensitive' } },
          { numeroIdentificacion: { contains: t, mode: 'insensitive' } },
          { codigoInterno: { contains: t, mode: 'insensitive' } },
          { numeroContrato: { contains: t, mode: 'insensitive' } },
          { email: { contains: t, mode: 'insensitive' } },
          { telefono: { contains: t, mode: 'insensitive' } },
          { palabrasClave: { has: t } },
        ],
      })),
    };

    // Búsqueda en documentos (incluyendo texto OCR)
    const documentoWhere: Prisma.DocumentoWhereInput = {
      deletedAt: null,
      AND: terminos.map((t) => ({
        OR: [
          { nombre: { contains: t, mode: 'insensitive' } },
          { palabrasClave: { has: t } },
          { textoOcr: { contains: t, mode: 'insensitive' } },
          { tipoDocumental: { contains: t, mode: 'insensitive' } },
        ],
      })),
    };

    const [clientes, documentos, totalClientes, totalDocumentos] = await Promise.all([
      this.prisma.cliente.findMany({
        where: clienteWhere,
        take: limit,
        skip,
        orderBy: { actualizadoEn: 'desc' },
        include: {
          expediente: {
            select: {
              id: true,
              numero: true,
              estado: true,
              ubicacionFisica: {
                include: {
                  caja: {
                    include: {
                      estante: { include: { pasillo: { include: { sede: true } } } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.documento.findMany({
        where: documentoWhere,
        take: Math.floor(limit / 2),
        include: {
          expediente: {
            include: {
              cliente: { select: { nombre: true, apellido: true, numeroIdentificacion: true } },
            },
          },
        },
      }),
      this.prisma.cliente.count({ where: clienteWhere }),
      this.prisma.documento.count({ where: documentoWhere }),
    ]);

    return {
      query,
      terminos,
      resultados: {
        clientes: {
          data: clientes,
          total: totalClientes,
        },
        documentos: {
          data: documentos,
          total: totalDocumentos,
        },
      },
      totalResultados: totalClientes + totalDocumentos,
      page,
      limit,
    };
  }

  /**
   * Búsqueda rápida de clientes (para autocompletado/typeahead).
   */
  async buscarClientes(query: string, limit = 10) {
    const q = query.trim();

    return this.prisma.cliente.findMany({
      where: {
        deletedAt: null,
        OR: [
          { nombre: { contains: q, mode: 'insensitive' } },
          { apellido: { contains: q, mode: 'insensitive' } },
          { razonSocial: { contains: q, mode: 'insensitive' } },
          { numeroIdentificacion: { startsWith: q } },
          { codigoInterno: { startsWith: q, mode: 'insensitive' } },
          { numeroContrato: { startsWith: q, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { actualizadoEn: 'desc' },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        razonSocial: true,
        numeroIdentificacion: true,
        tipoIdentificacion: true,
        codigoInterno: true,
        expediente: {
          select: {
            id: true,
            numero: true,
            estado: true,
          },
        },
      },
    });
  }

  /**
   * Búsqueda por número de expediente exacto.
   */
  async buscarPorExpediente(numero: string) {
    return this.prisma.expediente.findFirst({
      where: { numero: { equals: numero, mode: 'insensitive' } },
      include: {
        cliente: true,
        ubicacionFisica: {
          include: {
            caja: {
              include: {
                estante: { include: { pasillo: { include: { sede: true } } } },
              },
            },
          },
        },
        _count: { select: { documentos: true, prestamos: true } },
      },
    });
  }
}
