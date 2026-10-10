-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMINISTRADOR', 'AUXILIAR_ARCHIVO', 'GERENCIA', 'AUDITOR', 'CONSULTA', 'INVITADO');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('ACTIVO', 'INACTIVO', 'BLOQUEADO', 'PENDIENTE_ACTIVACION');

-- CreateEnum
CREATE TYPE "EstadoExpediente" AS ENUM ('ACTIVO', 'INACTIVO', 'PRESTADO', 'TRANSFERIDO', 'BAJA', 'EN_PROCESO');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('PDF', 'WORD', 'EXCEL', 'POWERPOINT', 'IMAGEN', 'CORREO', 'VIDEO', 'AUDIO', 'ESCANEADO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoDocumento" AS ENUM ('ACTIVO', 'INACTIVO', 'EN_REVISION', 'VENCIDO');

-- CreateEnum
CREATE TYPE "AccionAudit" AS ENUM ('LOGIN', 'LOGOUT', 'LOGIN_FALLIDO', 'CREAR', 'LEER', 'ACTUALIZAR', 'ELIMINAR', 'DESCARGAR', 'IMPRIMIR', 'BUSCAR', 'PRESTAMO_CREAR', 'PRESTAMO_DEVOLVER', 'TRANSFERIR', 'DIGITALIZAR', 'OCR_PROCESAR', 'EXPORTAR', 'MFA_SETUP', 'MFA_VERIFICAR', 'CAMBIO_PASSWORD', 'RESET_PASSWORD');

-- CreateEnum
CREATE TYPE "EstadoPrestamo" AS ENUM ('ACTIVO', 'DEVUELTO', 'VENCIDO', 'PERDIDO');

-- CreateEnum
CREATE TYPE "TipoUbicacion" AS ENUM ('ARCHIVO_ACTIVO', 'ARCHIVO_CENTRAL', 'ARCHIVO_HISTORICO');

-- CreateEnum
CREATE TYPE "EstadoNotificacion" AS ENUM ('NO_LEIDA', 'LEIDA', 'ARCHIVADA');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('PRESTAMO_VENCIDO', 'PRESTAMO_PROXIMO_VENCER', 'DIGITALIZACION_PENDIENTE', 'TRANSFERENCIA_PROXIMA', 'DUPLICADO_DETECTADO', 'SISTEMA', 'ALERTA');

-- CreateEnum
CREATE TYPE "DisposicionFinal" AS ENUM ('CONSERVACION_TOTAL', 'ELIMINACION', 'SELECCION', 'MICROFILMACION');

-- CreateTable
CREATE TABLE "sedes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sedes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pasillos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT,
    "sedeId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pasillos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estantes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "fila" INTEGER NOT NULL,
    "columna" INTEGER NOT NULL,
    "descripcion" TEXT,
    "pasilloId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cajas" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "capacidadMaxima" INTEGER NOT NULL DEFAULT 10,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "estanteId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cajas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ubicaciones_fisicas" (
    "id" TEXT NOT NULL,
    "numeroCarpeta" TEXT NOT NULL,
    "tipoUbicacion" "TipoUbicacion" NOT NULL DEFAULT 'ARCHIVO_ACTIVO',
    "fechaIngreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaUltimaRevision" TIMESTAMP(3),
    "observaciones" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "cajaId" TEXT NOT NULL,
    "expedienteId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ubicaciones_fisicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_fisicos" (
    "id" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "observaciones" TEXT,
    "ubicacionFisicaId" TEXT NOT NULL,
    "responsableId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_fisicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'CONSULTA',
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'ACTIVO',
    "telefono" TEXT,
    "avatar" TEXT,
    "mfaSecret" TEXT,
    "mfaHabilitado" BOOLEAN NOT NULL DEFAULT false,
    "refreshTokenHash" TEXT,
    "resetPasswordToken" TEXT,
    "resetPasswordExpiry" TIMESTAMP(3),
    "activationToken" TEXT,
    "ultimoAcceso" TIMESTAMP(3),
    "intentosFallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoHasta" TIMESTAMP(3),
    "sedeId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "series" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subseries" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "serieId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subseries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tablas_retencion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "vigente" BOOLEAN NOT NULL DEFAULT true,
    "retencionArchivoActivo" INTEGER NOT NULL,
    "retencionArchivoCentral" INTEGER NOT NULL,
    "disposicionFinal" "DisposicionFinal" NOT NULL,
    "soporte" TEXT,
    "procedimiento" TEXT,
    "subserieId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tablas_retencion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "tipoIdentificacion" TEXT NOT NULL,
    "numeroIdentificacion" TEXT NOT NULL,
    "digitoVerificacion" TEXT,
    "tipoPersona" TEXT NOT NULL DEFAULT 'NATURAL',
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "razonSocial" TEXT,
    "nombreComercial" TEXT,
    "email" TEXT,
    "emailAdicional" TEXT,
    "telefono" TEXT,
    "telefonoMovil" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "pais" TEXT DEFAULT 'Colombia',
    "codigoInterno" TEXT,
    "palabrasClave" TEXT[],
    "observaciones" TEXT,
    "numeroContrato" TEXT,
    "fechaContrato" TIMESTAMP(3),
    "fechaVencimiento" TIMESTAMP(3),
    "responsableId" TEXT,
    "sedeId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expedientes" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "estado" "EstadoExpediente" NOT NULL DEFAULT 'ACTIVO',
    "tieneArchivioFisico" BOOLEAN NOT NULL DEFAULT false,
    "tieneArchivoDigital" BOOLEAN NOT NULL DEFAULT false,
    "folios" INTEGER NOT NULL DEFAULT 0,
    "rutaDigital" TEXT,
    "fechaApertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaCierre" TIMESTAMP(3),
    "observaciones" TEXT,
    "serieId" TEXT,
    "subserieId" TEXT,
    "clienteId" TEXT NOT NULL,
    "responsableId" TEXT,
    "sedeId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "expedientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreOriginal" TEXT NOT NULL,
    "tipoDocumento" "TipoDocumento" NOT NULL,
    "estado" "EstadoDocumento" NOT NULL DEFAULT 'ACTIVO',
    "version" INTEGER NOT NULL DEFAULT 1,
    "esVersionActual" BOOLEAN NOT NULL DEFAULT true,
    "rutaMinio" TEXT NOT NULL,
    "urlThumbnail" TEXT,
    "tamanioBytes" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "hashSha256" TEXT NOT NULL,
    "textoOcr" TEXT,
    "metadatosIA" JSONB,
    "palabrasClave" TEXT[],
    "tipoDocumental" TEXT,
    "fechaDocumento" TIMESTAMP(3),
    "expedienteId" TEXT NOT NULL,
    "subidoPorId" TEXT NOT NULL,
    "versionAnteriorId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos_versiones" (
    "id" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_versiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prestamos" (
    "id" TEXT NOT NULL,
    "estado" "EstadoPrestamo" NOT NULL DEFAULT 'ACTIVO',
    "motivo" TEXT NOT NULL,
    "observaciones" TEXT,
    "fechaPrestamo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaLimite" TIMESTAMP(3) NOT NULL,
    "fechaDevolucion" TIMESTAMP(3),
    "dependencia" TEXT,
    "expedienteId" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "aprobadoPorId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prestamos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "accion" "AccionAudit" NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "descripcion" TEXT NOT NULL,
    "metadatos" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "usuarioId" TEXT,
    "expedienteId" TEXT,
    "prestamoId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "estado" "EstadoNotificacion" NOT NULL DEFAULT 'NO_LEIDA',
    "enlace" TEXT,
    "metadatos" JSONB,
    "usuarioId" TEXT NOT NULL,
    "leidaEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sedes_codigo_key" ON "sedes"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "pasillos_codigo_sedeId_key" ON "pasillos"("codigo", "sedeId");

-- CreateIndex
CREATE UNIQUE INDEX "ubicaciones_fisicas_expedienteId_key" ON "ubicaciones_fisicas"("expedienteId");

-- CreateIndex
CREATE INDEX "ubicaciones_fisicas_cajaId_idx" ON "ubicaciones_fisicas"("cajaId");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_rol_idx" ON "usuarios"("rol");

-- CreateIndex
CREATE UNIQUE INDEX "series_codigo_key" ON "series"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "subseries_codigo_serieId_key" ON "subseries"("codigo", "serieId");

-- CreateIndex
CREATE UNIQUE INDEX "tablas_retencion_subserieId_key" ON "tablas_retencion"("subserieId");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_numeroIdentificacion_key" ON "clientes"("numeroIdentificacion");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_codigoInterno_key" ON "clientes"("codigoInterno");

-- CreateIndex
CREATE INDEX "clientes_numeroIdentificacion_idx" ON "clientes"("numeroIdentificacion");

-- CreateIndex
CREATE INDEX "clientes_nombre_idx" ON "clientes"("nombre");

-- CreateIndex
CREATE INDEX "clientes_codigoInterno_idx" ON "clientes"("codigoInterno");

-- CreateIndex
CREATE INDEX "clientes_numeroContrato_idx" ON "clientes"("numeroContrato");

-- CreateIndex
CREATE UNIQUE INDEX "expedientes_numero_key" ON "expedientes"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "expedientes_clienteId_key" ON "expedientes"("clienteId");

-- CreateIndex
CREATE INDEX "expedientes_numero_idx" ON "expedientes"("numero");

-- CreateIndex
CREATE INDEX "expedientes_estado_idx" ON "expedientes"("estado");

-- CreateIndex
CREATE INDEX "expedientes_clienteId_idx" ON "expedientes"("clienteId");

-- CreateIndex
CREATE INDEX "documentos_expedienteId_idx" ON "documentos"("expedienteId");

-- CreateIndex
CREATE INDEX "documentos_tipoDocumento_idx" ON "documentos"("tipoDocumento");

-- CreateIndex
CREATE INDEX "documentos_hashSha256_idx" ON "documentos"("hashSha256");

-- CreateIndex
CREATE UNIQUE INDEX "documentos_versiones_documentoId_versionId_key" ON "documentos_versiones"("documentoId", "versionId");

-- CreateIndex
CREATE INDEX "prestamos_estado_idx" ON "prestamos"("estado");

-- CreateIndex
CREATE INDEX "prestamos_expedienteId_idx" ON "prestamos"("expedienteId");

-- CreateIndex
CREATE INDEX "prestamos_solicitanteId_idx" ON "prestamos"("solicitanteId");

-- CreateIndex
CREATE INDEX "prestamos_fechaLimite_idx" ON "prestamos"("fechaLimite");

-- CreateIndex
CREATE INDEX "audit_logs_usuarioId_idx" ON "audit_logs"("usuarioId");

-- CreateIndex
CREATE INDEX "audit_logs_entidad_entidadId_idx" ON "audit_logs"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "audit_logs_accion_idx" ON "audit_logs"("accion");

-- CreateIndex
CREATE INDEX "audit_logs_creadoEn_idx" ON "audit_logs"("creadoEn");

-- CreateIndex
CREATE INDEX "notificaciones_usuarioId_estado_idx" ON "notificaciones"("usuarioId", "estado");

-- AddForeignKey
ALTER TABLE "pasillos" ADD CONSTRAINT "pasillos_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estantes" ADD CONSTRAINT "estantes_pasilloId_fkey" FOREIGN KEY ("pasilloId") REFERENCES "pasillos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_estanteId_fkey" FOREIGN KEY ("estanteId") REFERENCES "estantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ubicaciones_fisicas" ADD CONSTRAINT "ubicaciones_fisicas_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "cajas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ubicaciones_fisicas" ADD CONSTRAINT "ubicaciones_fisicas_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "expedientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_fisicos" ADD CONSTRAINT "movimientos_fisicos_ubicacionFisicaId_fkey" FOREIGN KEY ("ubicacionFisicaId") REFERENCES "ubicaciones_fisicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_fisicos" ADD CONSTRAINT "movimientos_fisicos_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subseries" ADD CONSTRAINT "subseries_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tablas_retencion" ADD CONSTRAINT "tablas_retencion_subserieId_fkey" FOREIGN KEY ("subserieId") REFERENCES "subseries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expedientes" ADD CONSTRAINT "expedientes_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expedientes" ADD CONSTRAINT "expedientes_subserieId_fkey" FOREIGN KEY ("subserieId") REFERENCES "subseries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expedientes" ADD CONSTRAINT "expedientes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expedientes" ADD CONSTRAINT "expedientes_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expedientes" ADD CONSTRAINT "expedientes_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "expedientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "expedientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_aprobadoPorId_fkey" FOREIGN KEY ("aprobadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "expedientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_prestamoId_fkey" FOREIGN KEY ("prestamoId") REFERENCES "prestamos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
