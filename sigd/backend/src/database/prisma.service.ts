import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService — Wrapper de PrismaClient para NestJS.
 *
 * Responsabilidades:
 *  - Conectar a PostgreSQL al iniciar el módulo
 *  - Desconectar limpiamente al destruir el módulo
 *  - Aplicar middleware de soft-delete automático
 *  - Logging de queries en modo desarrollo
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      // Logging de queries en desarrollo
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
      errorFormat: 'colorless',
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('✅ Conexión a PostgreSQL establecida');
      this.applySoftDeleteMiddleware();
    } catch (error) {
      this.logger.error('❌ Error al conectar a PostgreSQL', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('🔌 Desconectado de PostgreSQL');
  }

  /**
   * Middleware de Soft Delete.
   * Intercepta operaciones `delete` y `deleteMany` en los modelos
   * que tienen el campo `deletedAt`, y las convierte en actualizaciones.
   *
   * Modelos con soft delete: Usuario, Cliente, Expediente, Documento
   */
  private applySoftDeleteMiddleware(): void {
    const softDeleteModels = ['Usuario', 'Cliente', 'Expediente', 'Documento'];

    // Interceptar delete → update con deletedAt
    this.$use(async (params, next) => {
      if (softDeleteModels.includes(params.model)) {
        if (params.action === 'delete') {
          params.action = 'update';
          params.args['data'] = { deletedAt: new Date() };
        }

        if (params.action === 'deleteMany') {
          params.action = 'updateMany';
          if (params.args.data !== undefined) {
            params.args.data['deletedAt'] = new Date();
          } else {
            params.args['data'] = { deletedAt: new Date() };
          }
        }
      }
      return next(params);
    });

    // Filtrar automáticamente registros eliminados en findMany/findFirst
    this.$use(async (params, next) => {
      if (softDeleteModels.includes(params.model)) {
        if (params.action === 'findMany' || params.action === 'findFirst') {
          if (params.args.where) {
            if (params.args.where.deletedAt === undefined) {
              params.args.where['deletedAt'] = null;
            }
          } else {
            params.args['where'] = { deletedAt: null };
          }
        }
      }
      return next(params);
    });
  }

  /**
   * Limpia la base de datos (solo para pruebas E2E).
   * NO usar en producción.
   */
  async cleanDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('cleanDatabase no está permitido en producción');
    }

    const tablenames = await this.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;

    for (const { tablename } of tablenames) {
      if (tablename !== '_prisma_migrations') {
        try {
          await this.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
        } catch (error) {
          this.logger.warn(`No se pudo truncar la tabla ${tablename}`, error);
        }
      }
    }
  }
}
