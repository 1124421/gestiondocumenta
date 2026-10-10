// ============================================================
// ARCHIVO: frontend/types/usuario.ts
// PROPÓSITO: Tipos TypeScript para usuarios y roles.
// ============================================================

export type RolUsuario =
  | 'ADMINISTRADOR'
  | 'AUXILIAR_ARCHIVO'
  | 'GERENCIA'
  | 'AUDITOR'
  | 'CONSULTA'
  | 'INVITADO'

export type EstadoUsuario = 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO'

export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: RolUsuario
  estado: EstadoUsuario
  avatar?: string
  mfaHabilitado: boolean
  ultimoAcceso?: Date
  creadoEn: Date
}

// Permisos granulares por módulo
export interface Permisos {
  clientes: { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean }
  expedientes: { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean }
  documentos: { ver: boolean; subir: boolean; descargar: boolean; eliminar: boolean }
  prestamos: { ver: boolean; crear: boolean; devolver: boolean }
  trazabilidad: { ver: boolean; exportar: boolean }
  reportes: { ver: boolean; exportar: boolean }
  usuarios: { ver: boolean; crear: boolean; editar: boolean; desactivar: boolean }
  configuracion: { ver: boolean; editar: boolean }
}
