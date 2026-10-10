// ============================================================
// ARCHIVO: frontend/types/documento.ts
// PROPÓSITO: Tipos TypeScript para documentos digitales.
// ============================================================

export type TipoDocumento =
  | 'PDF'
  | 'WORD'
  | 'EXCEL'
  | 'POWERPOINT'
  | 'IMAGEN'
  | 'CORREO'
  | 'VIDEO'
  | 'AUDIO'
  | 'ESCANEADO'
  | 'OTRO'

export type EstadoOcr = 'PENDIENTE' | 'PROCESANDO' | 'COMPLETADO' | 'ERROR'

export interface Documento {
  id: string
  nombre: string
  tipo: TipoDocumento
  extension: string       // 'pdf', 'docx', 'jpg', etc.
  tamanoBytes: number
  urlAlmacenamiento: string  // URL en MinIO/S3
  clienteId: string
  expedienteId?: string
  // Metadatos de gestión documental
  serie?: string           // Serie documental (TRD)
  subserie?: string        // Subserie documental
  tipoDocumental?: string  // Tipo documental específico
  version: number          // Versionado: 1, 2, 3...
  esVersionActual: boolean
  // OCR
  estadoOcr: EstadoOcr
  textoExtraido?: string   // Texto completo extraído por OCR
  // Metadatos detectados por IA
  nombreDetectado?: string
  identificacionDetectada?: string
  fechaDetectada?: Date
  firmaDetectada?: boolean
  // Clasificación IA
  clasificacionIa?: string
  confianzaClasificacion?: number // 0-100
  // Radicación
  numeroRadicado?: string
  fechaRadicacion?: Date
  folioInicio?: number
  folioFin?: number
  // Auditoría
  subidoPorId: string
  creadoEn: Date
  actualizadoEn: Date
}

export interface DocumentoUploadPayload {
  archivo: File
  clienteId: string
  expedienteId?: string
  nombre?: string          // Si no se pone, se usa el nombre del archivo
  serie?: string
  subserie?: string
}
