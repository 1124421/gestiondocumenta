// ============================================================
// ARCHIVO: frontend/app/(dashboard)/expedientes/[id]/page.tsx
// PROPÓSITO: Vista detallada de un expediente específico.
//
// QUÉ VA AQUÍ:
//  - Información del expediente (número, serie, subserie, tipo)
//  - Ubicación física completa (sede, pasillo, estante, fila, columna, caja, carpeta)
//  - Árbol de documentos digitales asociados con metadatos
//  - Visor de documentos PDF embebido (react-pdf)
//  - Historial de foliación y radicación
//  - Metadatos del expediente (TRD, TVD, fecha de retención)
//  - Timeline de actividad del expediente
//  - Panel de IA: resumen automático, clasificación, duplicados detectados
//
// DATOS:
//  - GET /api/expedientes/:id
//  - GET /api/expedientes/:id/documentos
//  - GET /api/expedientes/:id/trazabilidad
//
// DEPENDENCIAS:
//  npm install react-pdf @react-pdf-viewer/core
// ============================================================

export default function ExpedienteDetallePage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <div>
      <h1>Expediente #{params.id}</h1>
      {/* TODO: Pestañas: Info / Documentos / Trazabilidad / IA */}
    </div>
  )
}
