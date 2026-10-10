import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { validationSchema } from './config/joi.validation';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { DocumentosModule } from './modules/documentos/documentos.module';
import { PrestamosModule } from './modules/prestamos/prestamos.module';
import { BusquedaModule } from './modules/busqueda/busqueda.module';
import { TrazabilidadModule } from './modules/trazabilidad/trazabilidad.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';
import { OcrModule } from './modules/ocr/ocr.module';
import { IaModule } from './modules/ia/ia.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

/**
 * AppModule — Módulo raíz que registra todos los módulos del sistema SIGD.
 */
@Module({
  imports: [
    // ── Configuración global ─────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,           // Disponible en todos los módulos
      load: [configuration],    // Configuración tipada
      validationSchema,         // Validar variables de entorno con Joi
      validationOptions: {
        abortEarly: false,      // Mostrar todos los errores, no solo el primero
      },
      cache: true,              // Cachear configuración para mejor performance
    }),

    // ── Cron Jobs ────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ── Rate Limiting Global ──────────────────────────────
    // 100 requests por minuto por IP (ajustable por módulo)
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,    // 1 segundo
        limit: 10,    // 10 requests/segundo
      },
      {
        name: 'medium',
        ttl: 60000,   // 1 minuto
        limit: 100,   // 100 requests/minuto
      },
      {
        name: 'long',
        ttl: 3600000, // 1 hora
        limit: 1000,  // 1000 requests/hora
      },
    ]),

    // ── Base de Datos ─────────────────────────────────────
    PrismaModule,

    // ── Módulos de Negocio ────────────────────────────────
    AuthModule,
    UsuariosModule,
    ClientesModule,
    DocumentosModule,
    PrestamosModule,
    BusquedaModule,
    TrazabilidadModule,
    NotificacionesModule,
    OcrModule,
    IaModule,
    DashboardModule,
  ],
  providers: [
    // Rate limiting aplicado globalmente como guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
