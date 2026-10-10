// ============================================================
// ARCHIVO: backend/src/modules/trazabilidad/trazabilidad.interceptor.ts
// PROPÓSITO: Interceptor que registra automáticamente TODAS las acciones.
//
// QUÉ VA AQUÍ:
//  - NestJS Interceptor que se ejecuta ANTES y DESPUÉS de cada request
//  - Captura automáticamente:
//      • usuarioId → del token JWT
//      • accion → determinada por el método HTTP y la ruta
//        (GET → CONSULTA, POST → INGRESO, PATCH → MODIFICACION,
//         DELETE → ELIMINACION)
//      • recurso → tipo del recurso afectado (cliente, expediente, etc.)
//      • recursoId → ID del elemento afectado
//      • ip → dirección IP del cliente (X-Forwarded-For o remoteAddress)
//      • userAgent → navegador/dispositivo del usuario
//      • fecha/hora → timestamp exacto en UTC
//      • detalles → JSON con los cambios realizados (antes/después)
//
//  - NO registra: GET a endpoints públicos, health checks, Swagger
//  - Se aplica globalmente en app.module.ts con APP_INTERCEPTOR
//
// TABLA EN BD: audit_logs
//  - Esta tabla NO tiene deletedAt (los logs son INMUTABLES)
//  - Se particiona por fecha para performance (millones de registros)
//
// SE CONECTA CON:
//  - backend/src/modules/trazabilidad/trazabilidad.service.ts
// ============================================================

// TODO: @Injectable() export class AuditInterceptor implements NestInterceptor
// TODO: Implementar intercept(context, next) con tap() del Observable
