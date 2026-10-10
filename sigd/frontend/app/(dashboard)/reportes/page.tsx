// ============================================================
// ARCHIVO: frontend/app/(dashboard)/reportes/page.tsx
// PROPÓSITO: Generación y descarga de reportes del sistema.
//
// QUÉ VA AQUÍ:
//  - Catálogo de reportes disponibles:
//      • Inventario completo del archivo físico
//      • Expedientes por estado (activo/inactivo/prestado)
//      • Préstamos activos y vencidos
//      • Documentos digitalizados vs. pendientes
//      • Actividad de usuarios (período seleccionable)
//      • Transferencias documentales pendientes
//      • TRD aplicada (Series y subseries)
//      • Reporte de auditoría
//  - Configuración del reporte (fechas, filtros, formato)
//  - Previsualización antes de descargar
//  - Descarga en: PDF, Excel, CSV
//  - Programar reportes automáticos (semanal/mensual por email)
//
// DATOS:
//  - POST /api/reportes/generar → genera reporte con filtros
//  - GET /api/reportes/historial → reportes generados anteriormente
//  - El backend usa: pdfmake o jsPDF para PDF, exceljs para Excel
//
// SE CONECTA CON:
//  - backend/src/modules/reportes/reportes.service.ts
// ============================================================

export default function ReportesPage() {
  return (
    <div>
      <h1>Reportes</h1>
      {/* TODO: Catálogo de reportes */}
      {/* TODO: Configurador de parámetros */}
      {/* TODO: Botón de descarga */}
    </div>
  )
}
