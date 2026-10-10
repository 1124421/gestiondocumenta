// ============================================================
// ARCHIVO: frontend/app/(dashboard)/clientes/[id]/page.tsx
// PROPÓSITO: Página de detalle completo de un cliente específico.
//
// QUÉ VA AQUÍ:
//  - Datos generales del cliente (nombre, identificación, contacto)
//  - Ubicación exacta del expediente físico:
//      • Sede, Pasillo, Estante, Fila, Columna, Caja, Carpeta
//  - Expediente digital:
//      • Lista de todos los documentos digitales del cliente
//      • Previsualización de documentos (PDF viewer)
//      • Opción de subir nuevos documentos
//  - Historial de préstamos del expediente
//  - Historial de trazabilidad (quién consultó, cuándo, desde dónde)
//  - Etiquetas y metadatos del expediente
//  - Botones de acción: Editar, Prestar, Digitalizar, Imprimir ficha
//
// PARÁMETRO:
//  - [id] → ID único del cliente en la base de datos
//
// DATOS:
//  - GET /api/clientes/:id → datos completos del cliente
//  - GET /api/clientes/:id/documentos → documentos digitales
//  - GET /api/clientes/:id/prestamos → historial de préstamos
//  - GET /api/clientes/:id/trazabilidad → auditoría del expediente
//
// SE CONECTA CON:
//  - components/expedientes/ExpedienteCard.tsx
//  - components/prestamos/PrestamoForm.tsx
//  - app/(dashboard)/clientes/page.tsx → volver al listado
// ============================================================

export default function ClienteDetallePage({
  params,
}: {
  params: { id: string }
}) {
  // TODO: Obtener datos del cliente con useQuery(['cliente', params.id])
  // TODO: Mostrar pestañas: Información / Documentos / Préstamos / Trazabilidad
  return (
    <div>
      <h1>Detalle del Cliente #{params.id}</h1>
      {/* TODO: Pestañas con toda la información */}
    </div>
  )
}
