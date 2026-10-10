// ============================================================
// ARCHIVO: frontend/types/cliente.ts
// PROPÓSITO: Definición de tipos TypeScript para clientes.
//
// QUÉ VA AQUÍ:
//  - Interface Cliente: todos los campos del cliente en el sistema
//  - Interface ClienteFormData: datos del formulario de creación/edición
//  - Interface UbicacionFisica: coordenadas físicas del expediente
//  - Type EstadoExpediente: posibles estados
//  - Type TipoIdentificacion: tipos de documento de identidad
//
// SE USA EN:
//  - components/clientes/ClienteForm.tsx
//  - components/clientes/ClienteTable.tsx
//  - lib/api.ts → tipado de respuestas
// ============================================================

export type TipoIdentificacion = 'CEDULA' | 'NIT' | 'PASAPORTE' | 'CE' | 'TARJETA_IDENTIDAD'

export type EstadoExpediente = 'ACTIVO' | 'INACTIVO' | 'PRESTADO' | 'TRANSFERIDO' | 'DEPURADO'

export interface UbicacionFisica {
  sedeId: string
  sede: string
  pasillo: string
  estante: string
  fila: number
  columna: number
  caja: string
  carpeta: string
}

export interface Cliente {
  id: string
  codigoInterno: string
  tipoIdentificacion: TipoIdentificacion
  numeroIdentificacion: string
  nombreCompleto: string
  telefonos: string[]
  correo: string
  direccion?: string
  numeroExpediente: string
  numeroContrato?: string
  palabrasClave: string[]
  categoria?: string
  responsableId: string
  responsable?: string
  estado: EstadoExpediente
  ubicacionFisica: UbicacionFisica
  observaciones?: string
  fechaIngreso: Date
  fechaUltimaActividad: Date
  creadoEn: Date
  actualizadoEn: Date
}

export interface ClienteFormData {
  // Datos personales
  tipoIdentificacion: TipoIdentificacion
  numeroIdentificacion: string
  nombreCompleto: string
  telefonos: string[]
  correo: string
  direccion?: string
  // Datos del expediente
  numeroExpediente?: string // autogenerado si no se ingresa
  numeroContrato?: string
  palabrasClave?: string[]
  responsableId: string
  observaciones?: string
  // Ubicación física
  sedeId: string
  pasillo: string
  estante: string
  fila: number
  columna: number
  cajaId: string
  carpeta: string
}

export interface PaginatedClientes {
  data: Cliente[]
  total: number
  page: number
  limit: number
  totalPages: number
}
