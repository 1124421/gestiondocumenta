// ============================================================
// ARCHIVO: frontend/components/clientes/ClienteForm.tsx
// PROPÓSITO: Formulario para crear o editar un cliente.
//
// QUÉ VA AQUÍ:
//  Sección 1 — Datos Personales:
//    • Tipo de identificación (Cédula, NIT, Pasaporte, CE)
//    • Número de identificación
//    • Nombre completo (o razón social si es empresa)
//    • Teléfono(s) — puede agregar múltiples
//    • Correo electrónico
//    • Dirección
//
//  Sección 2 — Datos del Expediente:
//    • Número de expediente (autogenerado o manual)
//    • Número de contrato
//    • Palabras clave (etiquetas)
//    • Tipo de cliente / categoría
//    • Responsable asignado
//    • Fecha de ingreso
//    • Observaciones
//
//  Sección 3 — Ubicación Física:
//    • Sede (dropdown)
//    • Pasillo (dropdown)
//    • Estante (dropdown)
//    • Fila (número)
//    • Columna (número)
//    • Caja (dropdown o nuevo)
//    • Carpeta (número)
//
//  Validación: react-hook-form + zod
//  Modo: creación (POST) o edición (PATCH)
// ============================================================

export function ClienteForm() {
  // TODO: Configurar react-hook-form con zodResolver
  // TODO: Cargar opciones de sedes/pasillos/estantes dinámicamente
  // TODO: Generar número de expediente automáticamente si no se ingresa
  return (
    <form>
      {/* TODO: Sección datos personales */}
      {/* TODO: Sección datos expediente */}
      {/* TODO: Sección ubicación física */}
    </form>
  )
}
