import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

/**
 * Punto de entrada del servidor NestJS SIGD.
 *
 * Configura:
 *  - ValidationPipe global (class-validator)
 *  - CORS para el frontend
 *  - Prefijo global /api/v1
 *  - Swagger UI en /api/docs
 *  - Helmet (headers de seguridad)
 *  - Compression (gzip)
 *  - Graceful shutdown
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'verbose', 'debug'],
  });

  const configService = app.get(ConfigService);

  // ── Seguridad HTTP ──────────────────────────────────────
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
          scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
          manifestSrc: [`'self'`],
          frameSrc: [`'self'`],
        },
      },
    }),
  );

  // ── Compresión GZIP ─────────────────────────────────────
  app.use(compression());

  // ── CORS ────────────────────────────────────────────────
  const frontendUrl = configService.get<string>('app.frontendUrl');
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token'],
    credentials: true,
  });

  // ── Prefijo global de la API ─────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── Pipes globales (validación de DTOs) ─────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // Elimina campos no decorados
      forbidNonWhitelisted: true, // Lanza error si hay campos extra
      transform: true,          // Convierte tipos automáticamente
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── Filtros globales de excepciones ─────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── Swagger Documentation ────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SIGD API — Sistema Inteligente de Gestión Documental')
    .setDescription(
      `## API REST del Sistema Inteligente de Gestión Documental (SIGD)
      
Permite gestionar:
- 📁 **Expedientes** físicos y digitales de clientes
- 🔍 **Búsqueda** full-text e inteligente
- 📄 **Documentos** con OCR e IA
- 📦 **Préstamos** de expedientes físicos
- 👤 **Usuarios** con roles y permisos granulares
- 📊 **Trazabilidad** completa de todas las acciones

### Autenticación
Todos los endpoints (excepto \`/auth/login\`) requieren JWT Bearer Token.
      `,
    )
    .setVersion('1.0.0')
    .setContact('SIGD Team', 'https://sigd.com', 'soporte@sigd.com')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Token de acceso JWT obtenido al hacer login',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Autenticación y gestión de sesiones')
    .addTag('usuarios', 'Gestión de usuarios del sistema')
    .addTag('clientes', 'Gestión de clientes y expedientes')
    .addTag('documentos', 'Gestión de documentos digitales')
    .addTag('prestamos', 'Préstamos de expedientes físicos')
    .addTag('busqueda', 'Búsqueda inteligente y full-text')
    .addTag('trazabilidad', 'Auditoría y trazabilidad completa')
    .addTag('notificaciones', 'Alertas y notificaciones')
    .addTag('ocr', 'OCR y procesamiento de documentos')
    .addTag('ia', 'Inteligencia Artificial y clasificación')
    .addTag('dashboard', 'Métricas y KPIs del sistema')
    .addServer('http://localhost:3001', 'Desarrollo local')
    .addServer('https://api.sigd.com', 'Producción')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'SIGD API Docs',
  });

  // ── Graceful Shutdown ────────────────────────────────────
  app.enableShutdownHooks();

  // ── Iniciar servidor ─────────────────────────────────────
  const port = configService.get<number>('app.port') || 3001;
  await app.listen(port);

  logger.log('═══════════════════════════════════════════════════');
  logger.log('🚀  SIGD Backend corriendo en:');
  logger.log(`    API:     http://localhost:${port}/api/v1`);
  logger.log(`    Swagger: http://localhost:${port}/api/docs`);
  logger.log(`    Env:     ${configService.get('app.env')}`);
  logger.log('═══════════════════════════════════════════════════');
}

bootstrap().catch((err) => {
  console.error('❌ Error fatal al iniciar la aplicación:', err);
  process.exit(1);
});
