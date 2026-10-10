// ============================================================
// ARCHIVO: backend/src/modules/notificaciones/notificaciones.gateway.ts
// PROPÓSITO: WebSocket Gateway para notificaciones en tiempo real.
//
// QUÉ VA AQUÍ:
//  - Gateway de WebSocket con Socket.io para enviar notificaciones
//    en tiempo real al frontend sin que el usuario tenga que recargar
//
//  EVENTOS QUE EMITE EL SERVIDOR AL CLIENTE:
//    'notificacion:nueva'     → cuando llega una nueva notificación
//    'prestamo:vencimiento'   → cuando un préstamo está por vencer
//    'prestamo:vencido'       → cuando un préstamo ya venció
//    'ocr:completado'         → cuando termina el procesamiento OCR
//    'documento:clasificado'  → cuando la IA clasifica un documento
//    'duplicado:detectado'    → cuando la IA detecta un duplicado
//    'dashboard:actualizar'   → para refrescar las estadísticas del dashboard
//
//  EVENTOS QUE RECIBE DEL CLIENTE:
//    'notificacion:leer'      → marcar notificación como leída
//    'notificacion:leer:todas'→ marcar todas como leídas
//
//  SALAS (rooms):
//    Cada usuario conectado se une a una sala con su userId
//    Esto permite enviar notificaciones específicas a un usuario
//    Los administradores también se unen a la sala 'admin'
//
// AUTENTICACIÓN:
//  El cliente debe enviar el JWT al conectarse
//  El gateway verifica el token antes de aceptar la conexión
//
// DEPENDENCIA: npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
// ============================================================

// TODO: @WebSocketGateway({ cors: { origin: '*' } })
// TODO: export class NotificacionesGateway
//   implements OnGatewayConnection, OnGatewayDisconnect
