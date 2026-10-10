import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../database/prisma.service';
import { AccionAudit } from '@prisma/client';
import { Request } from 'express';

/**
 * AuditInterceptor — Interceptor que registra automáticamente las acciones
 * en la tabla audit_logs después de cada respuesta exitosa.
 *
 * Mapeo HTTP Method → AccionAudit:
 *  POST   → CREAR
 *  GET    → LEER
 *  PUT/PATCH → ACTUALIZAR
 *  DELETE → ELIMINAR
 *
 * Nota: Para acciones especializadas (DESCARGAR, IMPRIMIR, etc.),
 * usar TrazabilidadService directamente en el servicio correspondiente.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;

    return next.handle().pipe(
      tap(async (responseData) => {
        try {
          // Solo registrar si hay un usuario autenticado
          if (!user?.id) return;

          const accion = this.mapearAccion(request.method);
          if (!accion) return;

          // Extraer ID de la entidad del path o de la respuesta
          const entidadId =
            request.params?.id ||
            responseData?.id ||
            responseData?.data?.id;

          const entidad = this.inferirEntidad(request.path);

          await this.prisma.auditLog.create({
            data: {
              accion,
              entidad,
              entidadId: entidadId || null,
              descripcion: `${request.method} ${request.path}`,
              ipAddress: this.getClientIp(request),
              userAgent: request.headers['user-agent'],
              usuarioId: user.id,
            },
          });
        } catch (err) {
          // El fallo del audit NO debe interrumpir la respuesta
          this.logger.warn('Error al registrar audit log', err);
        }
      }),
    );
  }

  private mapearAccion(method: string): AccionAudit | null {
    const mapa: Record<string, AccionAudit> = {
      POST: AccionAudit.CREAR,
      GET: AccionAudit.LEER,
      PUT: AccionAudit.ACTUALIZAR,
      PATCH: AccionAudit.ACTUALIZAR,
      DELETE: AccionAudit.ELIMINAR,
    };
    return mapa[method.toUpperCase()] || null;
  }

  private inferirEntidad(path: string): string {
    // Extrae el nombre de la entidad del path: /api/v1/clientes/... → Cliente
    const segmentos = path.split('/').filter(Boolean);
    const index = segmentos.findIndex((s) => s === 'v1');
    const entidad = segmentos[index + 1] || 'Desconocido';
    return entidad.charAt(0).toUpperCase() + entidad.slice(1, -1); // plural → singular
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    }
    return request.socket?.remoteAddress || 'unknown';
  }
}
