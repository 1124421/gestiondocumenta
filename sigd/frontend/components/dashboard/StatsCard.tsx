// ============================================================
// ARCHIVO: frontend/components/dashboard/StatsCard.tsx
// PROPÓSITO: Tarjeta de estadística / KPI para el dashboard.
//
// QUÉ VA AQUÍ:
//  - Componente reutilizable que muestra:
//      • Ícono (de Lucide React)
//      • Título (ej: "Total Clientes")
//      • Valor principal (ej: "1,234")
//      • Indicador de tendencia (ej: +12% vs. mes anterior)
//        → Flecha verde si sube, roja si baja
//      • Subtítulo descriptivo (ej: "Expedientes activos")
//  - Animación de conteo (número sube desde 0 hasta el valor final)
//  - Efecto hover con sutil elevación (box-shadow)
//  - Variantes de color según el tipo de KPI
//
// PROPS:
//  title: string          → Título del indicador
//  value: number | string → Valor principal
//  icon: LucideIcon       → Ícono a mostrar
//  trend?: number         → Porcentaje de cambio (positivo/negativo)
//  subtitle?: string      → Texto descriptivo
//  color?: string         → Color del ícono / borde (indigo, violet, green, amber, red)
//
// SE USA EN:
//  - app/(dashboard)/dashboard/page.tsx → 6 tarjetas de KPI
// ============================================================

interface StatsCardProps {
  title: string
  value: number | string
  // icon: LucideIcon → TODO: importar tipo de lucide-react
  trend?: number
  subtitle?: string
  color?: 'indigo' | 'violet' | 'green' | 'amber' | 'red'
}

export function StatsCard({ title, value, trend, subtitle, color = 'indigo' }: StatsCardProps) {
  // TODO: Implementar animación de conteo con framer-motion
  // TODO: Mostrar flecha de tendencia con color dinámico
  return (
    <div>
      <span>{title}</span>
      <span>{value}</span>
    </div>
  )
}
