// ============================================================
// ARCHIVO: frontend/components/busqueda/SearchResults.tsx
// PROPÓSITO: Panel de resultados de búsqueda inteligente.
//
// QUÉ VA AQUÍ:
//  - Lista de resultados agrupados por tipo:
//      CLIENTES (ej: "Juan Pérez — Cédula 123456 — Caja 12, Carpeta 3")
//      EXPEDIENTES (ej: "EXP-2024-001 — Activo — Sede Principal")
//      DOCUMENTOS (ej: "Contrato.pdf — 15 Ene 2024 — fragmento del texto...")
//  - Para cada resultado:
//      • Ícono según el tipo
//      • Resaltado (highlight) del término buscado dentro del fragmento
//      • Miniatura (para imágenes y PDFs)
//      • Badge de estado (activo, prestado, inactivo)
//      • Ubicación física si es un expediente
//  - Estado "Sin resultados" con sugerencias
//  - Estado de carga con skeleton placeholders
//  - Ordenar por: relevancia, fecha, nombre
//
// PROPS:
//  results: SearchResult[]
//  query: string
//  isLoading: boolean
//  onResultClick: (result: SearchResult) => void
// ============================================================

export function SearchResults() {
  // TODO: Implementar highlight del texto buscado
  // TODO: Separar resultados por tipo con secciones
  return (
    <div>
      {/* TODO: Sección Clientes */}
      {/* TODO: Sección Expedientes */}
      {/* TODO: Sección Documentos */}
    </div>
  )
}
