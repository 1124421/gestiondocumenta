'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FolderArchive,
  FileCheck2,
  BookOpenCheck,
  HardDrive,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ScanLine,
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  FileText,
  History as HistoryIcon,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();

  const kpis = [
    {
      title: 'Total Expedientes',
      value: '14,820',
      change: '+12% este mes',
      trend: 'up',
      icon: FolderArchive,
      color: 'indigo',
      href: '/expedientes',
    },
    {
      title: 'Documentos Digitalizados',
      value: '128,450',
      change: '+3,410 hoy',
      trend: 'up',
      icon: FileCheck2,
      color: 'emerald',
      href: '/digitalizacion',
    },
    {
      title: 'Préstamos Activos',
      value: '42',
      change: '3 por vencer',
      trend: 'warning',
      icon: BookOpenCheck,
      color: 'amber',
      href: '/prestamos',
    },
    {
      title: 'Almacenamiento MinIO',
      value: '1.84 TB',
      change: 'de 5.0 TB asignados',
      trend: 'neutral',
      icon: HardDrive,
      color: 'purple',
      href: '/reportes',
    },
  ];

  const recentDocs = [
    {
      radicado: 'RAD-2026-00892',
      titulo: 'Contrato de Prestación de Servicios - Servientrega',
      cliente: 'Servientrega S.A.',
      serie: 'Contratos Comerciales',
      estado: 'CUSTODIA',
      fecha: 'Hace 10 min',
      expedienteId: '1',
    },
    {
      radicado: 'RAD-2026-00891',
      titulo: 'Historia Laboral - Carlos Mario Restrepo',
      cliente: 'Bancolombia S.A.',
      serie: 'Historias Laborales',
      estado: 'DIGITALIZADO',
      fecha: 'Hace 25 min',
      expedienteId: '2',
    },
    {
      radicado: 'RAD-2026-00890',
      titulo: 'Factura Electrónica FE-9921',
      cliente: 'Ecopetrol S.A.',
      serie: 'Comprobantes Contables',
      estado: 'EN_PROCESO_OCR',
      fecha: 'Hace 1 hora',
      expedienteId: '3',
    },
    {
      radicado: 'RAD-2026-00889',
      titulo: 'Acta de Junta Directiva #45',
      cliente: 'Grupo Aval',
      serie: 'Actas de Junta',
      estado: 'CUSTODIA',
      fecha: 'Hace 3 horas',
      expedienteId: '4',
    },
  ];

  const alertas = [
    {
      id: '1',
      tipo: 'warning',
      titulo: 'Préstamo por vencer',
      badge: 'Hoy 17:00',
      descripcion: 'Expediente #EXP-0045 prestado a Dirección Jurídica.',
      href: '/prestamos',
      bgColor: 'bg-amber-50 border-amber-200 text-amber-900',
      badgeColor: 'bg-amber-200/60 text-amber-800',
    },
    {
      id: '2',
      tipo: 'info',
      titulo: 'Transferencia Secundaria TRD',
      badge: null,
      descripcion: '84 expedientes listos para transferencia a archivo histórico.',
      href: '/expedientes',
      bgColor: 'bg-blue-50 border-blue-200 text-blue-900',
      badgeColor: '',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white shadow-md">
        <div>
          <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
            Panel de Control
          </span>
          <h1 className="text-2xl font-bold font-display mt-2">
            Bienvenido al Sistema SIGD
          </h1>
          <p className="text-sm text-indigo-100 mt-1">
            Gestión integral de archivos físicos, digitalización inteligente con OCR y trazabilidad certificada.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/digitalizacion"
            className="px-4 py-2.5 rounded-xl bg-white text-indigo-700 font-semibold text-xs hover:bg-indigo-50 shadow-sm transition-all"
          >
            Escanear / OCR
          </Link>
          <Link
            href="/expedientes"
            className="px-4 py-2.5 rounded-xl bg-indigo-500/40 hover:bg-indigo-500/60 border border-white/20 text-white font-semibold text-xs backdrop-blur-sm transition-all"
          >
            Ver Archivos
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid — Now clickable, navigating to their corresponding module */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={idx}
              href={kpi.href}
              className="card-white p-5 hover:shadow-soft-md transition-all group cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{kpi.title}</span>
                <div
                  className={`p-2 rounded-xl ${
                    kpi.color === 'indigo'
                      ? 'bg-indigo-50 text-indigo-600'
                      : kpi.color === 'emerald'
                      ? 'bg-emerald-50 text-emerald-600'
                      : kpi.color === 'amber'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-purple-50 text-purple-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold text-slate-900 font-display">
                  {kpi.value}
                </div>
                <div className="mt-1 flex items-center justify-between gap-1.5 text-xs">
                  <span
                    className={`font-semibold ${
                      kpi.trend === 'warning'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {kpi.change}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Recent Documents */}
        <div className="lg:col-span-2 card-white p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Documentos Radicados Recientes</h2>
              <p className="text-xs text-slate-500">Últimos registros ingresados al fondo documental</p>
            </div>
            <Link
              href="/expedientes"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Radicado / Título</th>
                  <th className="py-3 px-3">Cliente</th>
                  <th className="py-3 px-3">Serie TRD</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3">Tiempo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentDocs.map((doc, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => router.push(`/expedientes/${doc.expedienteId}`)}
                  >
                    <td className="py-3 px-3">
                      <span className="font-bold text-indigo-600 block">{doc.radicado}</span>
                      <span className="text-slate-800 font-medium truncate max-w-xs block">
                        {doc.titulo}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">{doc.cliente}</td>
                    <td className="py-3 px-3 text-slate-500">{doc.serie}</td>
                    <td className="py-3 px-3">
                      <span
                        className={
                          doc.estado === 'CUSTODIA'
                            ? 'badge-emerald'
                            : doc.estado === 'DIGITALIZADO'
                            ? 'badge-blue'
                            : 'badge-amber'
                        }
                      >
                        {doc.estado}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{doc.fecha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (1 span): Alertas & Acciones Rápidas */}
        <div className="space-y-6">
          {/* Alerts Card — Now clickable */}
          <div className="card-white p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Alertas del Archivo</span>
            </h3>

            <div className="space-y-3">
              {alertas.map((alerta) => (
                <button
                  key={alerta.id}
                  onClick={() => router.push(alerta.href)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all hover:shadow-sm hover:scale-[1.01] ${alerta.bgColor}`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{alerta.titulo}</span>
                    <div className="flex items-center gap-1.5">
                      {alerta.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${alerta.badgeColor}`}>
                          {alerta.badge}
                        </span>
                      )}
                      <ExternalLink className="w-3 h-3 opacity-50" />
                    </div>
                  </div>
                  <p className="mt-1 text-slate-700">{alerta.descripcion}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="card-white p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Módulos Frecuentes</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/clientes"
                className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 text-left transition-all"
              >
                <Building2 className="w-4 h-4 text-indigo-600 mb-1.5" />
                <span className="text-xs font-bold text-slate-800 block">Clientes</span>
                <span className="text-[10px] text-slate-500">12 contratos activos</span>
              </Link>

              <Link
                href="/prestamos"
                className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 text-left transition-all"
              >
                <BookOpenCheck className="w-4 h-4 text-amber-600 mb-1.5" />
                <span className="text-xs font-bold text-slate-800 block">Préstamos</span>
                <span className="text-[10px] text-slate-500">Control físico</span>
              </Link>

              <Link
                href="/trazabilidad"
                className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 text-left transition-all"
              >
                <HistoryIcon className="w-4 h-4 text-emerald-600 mb-1.5" />
                <span className="text-xs font-bold text-slate-800 block">Auditoría</span>
                <span className="text-[10px] text-slate-500">Log de operaciones</span>
              </Link>

              <Link
                href="/usuarios"
                className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 text-left transition-all"
              >
                <Users className="w-4 h-4 text-purple-600 mb-1.5" />
                <span className="text-xs font-bold text-slate-800 block">Usuarios</span>
                <span className="text-[10px] text-slate-500">Roles y permisos</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
