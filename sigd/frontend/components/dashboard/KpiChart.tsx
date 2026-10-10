// ============================================================
// ARCHIVO: frontend/components/dashboard/KpiChart.tsx
// PROPÓSITO: Gráficos de KPIs para el dashboard principal.
//
// QUÉ VA AQUÍ:
//  - Gráfico de barras: expedientes creados por mes
//  - Gráfico de dona: distribución de expedientes por estado
//  - Gráfico de línea: actividad del sistema (consultas por día)
//  - Todos los gráficos son responsivos e interactivos (tooltip al hover)
//  - Soporte para modo oscuro/claro
//
// DEPENDENCIA:
//  npm install recharts
//  Librería elegida: Recharts (más simple y bonito que Chart.js para React)
//
// PROPS:
//  type: 'bar' | 'donut' | 'line'
//  data: ChartDataPoint[]
//  title: string
//  height?: number
//
// SE USA EN:
//  - app/(dashboard)/dashboard/page.tsx
// ============================================================

export function KpiChart() {
  // TODO: Importar BarChart, DonutChart, LineChart de recharts
  // TODO: Adaptar colores al tema oscuro/claro
  return (
    <div>
      {/* TODO: Gráficos con Recharts */}
    </div>
  )
}
