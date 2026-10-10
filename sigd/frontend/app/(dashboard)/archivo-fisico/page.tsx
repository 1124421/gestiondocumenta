'use client';

import React, { useState } from 'react';
import {
  Boxes, MapPin, Plus, Box, Tag, Search, Scale,
  RefreshCw, DollarSign, Shield, Building2, User,
  QrCode, ChevronDown, Info, Filter, FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Tipos de Proceso con metadatos normativos ─────────────────────────────
const TIPOS_PROCESO = {
  ORDINARIO: {
    label: 'Proceso Ordinario',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: FileText,
    normativa: null,
    descripcion: 'Procesos ordinarios estándar de gestión documental.',
  },
  DEVOLUCION: {
    label: 'Proceso de Devolución',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: RefreshCw,
    normativa: null,
    descripcion: 'Procesos relacionados con devolución de documentos o activos.',
  },
  LIQUIDACION: {
    label: 'Proceso de Liquidación',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: Scale,
    normativa: null,
    descripcion: 'Procesos de liquidación de entidades o contratos.',
  },
  COBRO_JURIDICO: {
    label: 'Cobro Jurídico',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: DollarSign,
    normativa: null,
    descripcion: 'Procesos de cobro por vía jurídica.',
  },
  GARANTIA_SERVICIO: {
    label: 'Garantía de Servicio',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Shield,
    normativa: null,
    descripcion: 'Documentos de garantías de servicio vigentes.',
  },
  INSOLVENCIA_LEY_1116: {
    label: 'Insolvencia / Reorganización Empresarial',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: Building2,
    normativa: 'Ley 1116 de 2006',
    descripcion: 'Aplicable a la reorganización y liquidación de empresas insolventes.',
  },
  INSOLVENCIA_PERSONA_LEY_1564: {
    label: 'Insolvencia P. Natural (con bienes)',
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    icon: User,
    normativa: 'Ley 1564 de 2012',
    descripcion: 'Procesos para personas naturales cuando existen bienes.',
  },
  INSOLVENCIA_PERSONA_LEY_2445: {
    label: 'Insolvencia P. Natural (sin bienes)',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: User,
    normativa: 'Ley 2445 de 2025',
    descripcion: 'Procesos para personas naturales cuando no existen bienes.',
  },
} as const;

type TipoProceso = keyof typeof TIPOS_PROCESO;

interface Caja {
  id: string;
  numero: string;
  tipoProceso: TipoProceso | null;
  normativaAplicable: string | null;
  etiquetaFrontal: string | null;
  etiquetaLateral: string | null;
  estante: string;
  expedientesCount: number;
}

interface Bodega {
  id: string;
  nombre: string;
  ciudad: string;
  direccion: string;
  estantes: number;
  cajasOcupadas: number;
  capacidadTotalCajas: number;
  porcentajeOcupacion: number;
  cajas: Caja[];
}

const mockBodegas: Bodega[] = [
  {
    id: '1',
    nombre: 'Bodega Principal Central',
    ciudad: 'Bogotá D.C.',
    direccion: 'Zona Industrial Montevideo, Calle 19 #68-40',
    estantes: 24,
    cajasOcupadas: 4820,
    capacidadTotalCajas: 6000,
    porcentajeOcupacion: 80.3,
    cajas: [
      { id: 'c1', numero: 'CAJA-001', tipoProceso: 'ORDINARIO', normativaAplicable: null, etiquetaFrontal: 'PROC. ORDINARIOS · BLOQUE A', etiquetaLateral: 'EST-01 · PAS-A', estante: 'EST-01', expedientesCount: 8 },
      { id: 'c2', numero: 'CAJA-002', tipoProceso: 'INSOLVENCIA_LEY_1116', normativaAplicable: 'Ley 1116 de 2006', etiquetaFrontal: 'INSOLVENCIA EMPRESARIAL · Ley 1116/2006', etiquetaLateral: 'EST-02 · PAS-A', estante: 'EST-02', expedientesCount: 5 },
      { id: 'c3', numero: 'CAJA-003', tipoProceso: 'COBRO_JURIDICO', normativaAplicable: null, etiquetaFrontal: 'COBRO JURÍDICO · BLOQUE B', etiquetaLateral: 'EST-03 · PAS-B', estante: 'EST-03', expedientesCount: 10 },
      { id: 'c4', numero: 'CAJA-004', tipoProceso: 'INSOLVENCIA_PERSONA_LEY_1564', normativaAplicable: 'Ley 1564 de 2012', etiquetaFrontal: 'INSOLVENCIA P. NATURAL CON BIENES · Ley 1564/2012', etiquetaLateral: 'EST-04 · PAS-B', estante: 'EST-04', expedientesCount: 7 },
      { id: 'c5', numero: 'CAJA-005', tipoProceso: 'DEVOLUCION', normativaAplicable: null, etiquetaFrontal: 'DEVOLUCIONES · SECTOR C', etiquetaLateral: 'EST-05 · PAS-C', estante: 'EST-05', expedientesCount: 3 },
      { id: 'c6', numero: 'CAJA-006', tipoProceso: 'INSOLVENCIA_PERSONA_LEY_2445', normativaAplicable: 'Ley 2445 de 2025', etiquetaFrontal: 'INSOLVENCIA P. NATURAL SIN BIENES · Ley 2445/2025', etiquetaLateral: 'EST-06 · PAS-C', estante: 'EST-06', expedientesCount: 4 },
    ],
  },
  {
    id: '2',
    nombre: 'Bodega Regional Norte Sede 2',
    ciudad: 'Medellín',
    direccion: 'Sector Guayabal, Cra 52 #14-20',
    estantes: 16,
    cajasOcupadas: 2310,
    capacidadTotalCajas: 4000,
    porcentajeOcupacion: 57.7,
    cajas: [
      { id: 'c7', numero: 'CAJA-101', tipoProceso: 'LIQUIDACION', normativaAplicable: null, etiquetaFrontal: 'LIQUIDACIONES · MED-A', etiquetaLateral: 'EST-01 · PAS-A', estante: 'EST-01', expedientesCount: 9 },
      { id: 'c8', numero: 'CAJA-102', tipoProceso: 'GARANTIA_SERVICIO', normativaAplicable: null, etiquetaFrontal: 'GARANTÍAS DE SERVICIO · MED-A', etiquetaLateral: 'EST-02 · PAS-A', estante: 'EST-02', expedientesCount: 6 },
    ],
  },
  {
    id: '3',
    nombre: 'Bodega Occidente',
    ciudad: 'Cali',
    direccion: 'Parque Industrial Yumbo, Bodega 12',
    estantes: 12,
    cajasOcupadas: 1450,
    capacidadTotalCajas: 3000,
    porcentajeOcupacion: 48.3,
    cajas: [
      { id: 'c9', numero: 'CAJA-201', tipoProceso: 'ORDINARIO', normativaAplicable: null, etiquetaFrontal: 'PROC. ORDINARIOS · CALI-A', etiquetaLateral: 'EST-01 · PAS-A', estante: 'EST-01', expedientesCount: 10 },
    ],
  },
];

function TipoProcesoBadge({ tipo }: { tipo: TipoProceso | null }) {
  if (!tipo) return <span className="text-xs text-slate-400 italic">Sin clasificar</span>;
  const meta = TIPOS_PROCESO[tipo];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${meta.color}`}>
      <Icon className="w-3 h-3" />
      {meta.label}
      {meta.normativa && (
        <span className="font-mono text-[10px] opacity-75 ml-0.5">· {meta.normativa.replace('Ley ', '').replace(' de ', '/')}</span>
      )}
    </span>
  );
}

function EtiquetaCaja({ caja }: { caja: Caja }) {
  const meta = caja.tipoProceso ? TIPOS_PROCESO[caja.tipoProceso] : null;
  return (
    <div className="border-2 border-slate-300 rounded-lg p-3 bg-white font-mono text-xs space-y-1.5">
      <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-1.5">
        <span className="font-bold text-slate-800 text-sm">{caja.numero}</span>
        <QrCode className="w-5 h-5 text-slate-400" />
      </div>
      {meta && (
        <div className={`text-center font-bold py-1 rounded text-[10px] border ${meta.color}`}>
          {caja.etiquetaFrontal || meta.label}
        </div>
      )}
      {meta?.normativa && (
        <div className="text-center text-[10px] text-slate-500 font-semibold">📋 {meta.normativa}</div>
      )}
      <div className="text-center text-[10px] text-slate-400">{caja.etiquetaLateral} · {caja.expedientesCount} expedientes</div>
    </div>
  );
}

export default function ArchivoFisicoPage() {
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<TipoProceso | 'TODOS'>('TODOS');
  const [mostrarProcedimiento, setMostrarProcedimiento] = useState(false);

  const todasLasCajas = mockBodegas.flatMap((b) =>
    b.cajas.map((c) => ({ ...c, bodegaNombre: b.nombre }))
  );

  const cajasFiltradas = todasLasCajas.filter((c) => {
    const q = busqueda.toLowerCase();
    const matchBusqueda =
      q === '' ||
      c.numero.toLowerCase().includes(q) ||
      (c.tipoProceso && TIPOS_PROCESO[c.tipoProceso].label.toLowerCase().includes(q)) ||
      (c.normativaAplicable && c.normativaAplicable.toLowerCase().includes(q)) ||
      (c.etiquetaFrontal && c.etiquetaFrontal.toLowerCase().includes(q));
    const matchTipo = filtroTipo === 'TODOS' || c.tipoProceso === filtroTipo;
    return matchBusqueda && matchTipo;
  });

  const mostrarResultados = busqueda !== '' || filtroTipo !== 'TODOS';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900">
            Topografía de Archivo Físico & Custodia
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Control de bodegas, estanterías, cajas y clasificación por tipo de proceso con normativa aplicable
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMostrarProcedimiento(!mostrarProcedimiento)} className="btn-secondary-light text-xs">
            <Info className="w-4 h-4 text-indigo-600" />
            <span>Procedimiento</span>
          </button>
          <button onClick={() => toast.success('Generador de etiquetas QR abierto')} className="btn-secondary-light text-xs">
            <QrCode className="w-4 h-4 text-indigo-600" />
            <span>Rotular Cajas (QR)</span>
          </button>
          <button onClick={() => toast.success('Modal para registrar nueva caja abierto')} className="btn-primary-light text-xs">
            <Plus className="w-4 h-4" />
            <span>Nueva Caja</span>
          </button>
        </div>
      </div>

      {/* Panel de procedimiento normativo */}
      {mostrarProcedimiento && (
        <div className="card-white p-5 border-l-4 border-indigo-500 space-y-3">
          <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Scale className="w-4 h-4 text-indigo-600" />
            Procedimiento de Organización y Archivo de Cajas por Tipo de Proceso
          </h2>
          <p className="text-xs text-slate-500">
            Para optimizar la gestión, almacenamiento y localización de los expedientes, las cajas deben rotularse
            con el tipo de proceso y su normativa aplicable en la etiqueta frontal y lateral antes de ser asignadas a su estante definitivo.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {(Object.entries(TIPOS_PROCESO) as [TipoProceso, typeof TIPOS_PROCESO[TipoProceso]][]).map(([key, meta]) => {
              const Icon = meta.icon;
              return (
                <div key={key} className={`rounded-lg border p-3 space-y-1 ${meta.color}`}>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Icon className="w-3.5 h-3.5" />
                    {meta.label}
                  </div>
                  {meta.normativa && (
                    <div className="text-[10px] font-mono font-semibold opacity-80">📋 {meta.normativa}</div>
                  )}
                  <p className="text-[10px] opacity-70">{meta.descripcion}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            id="busqueda-cajas"
            placeholder="Buscar caja por número, tipo de proceso, normativa..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            id="filtro-tipo-proceso"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as TipoProceso | 'TODOS')}
            className="pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white appearance-none min-w-[230px]"
          >
            <option value="TODOS">Todos los tipos de proceso</option>
            {(Object.entries(TIPOS_PROCESO) as [TipoProceso, typeof TIPOS_PROCESO[TipoProceso]][]).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}{meta.normativa ? ` (${meta.normativa.replace('Ley ', '').replace(' de ', '/')})` : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Resultados de búsqueda global */}
      {mostrarResultados && (
        <div className="card-white p-4 space-y-3">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-500" />
            {cajasFiltradas.length} caja(s) encontrada(s)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cajasFiltradas.map((caja) => (
              <div key={caja.id} className="rounded-xl border border-slate-200 p-3 space-y-2 bg-slate-50 hover:bg-white hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-800">{caja.numero}</span>
                  <span className="text-[10px] text-slate-400">{(caja as any).bodegaNombre}</span>
                </div>
                <TipoProcesoBadge tipo={caja.tipoProceso} />
                {caja.normativaAplicable && (
                  <div className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 rounded px-2 py-0.5">
                    📋 {caja.normativaAplicable}
                  </div>
                )}
                <div className="text-[10px] text-slate-400">{caja.estante} · {caja.expedientesCount} expedientes</div>
              </div>
            ))}
            {cajasFiltradas.length === 0 && (
              <div className="col-span-3 text-center text-sm text-slate-400 py-6">
                No se encontraron cajas con ese criterio.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bodegas Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockBodegas.map((bodega) => (
          <div key={bodega.id} className="card-white p-6 space-y-4 hover:shadow-soft-md transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="badge-blue text-[10px] mb-1.5">{bodega.ciudad}</span>
                <h3 className="text-base font-bold text-slate-900 font-display">{bodega.nombre}</h3>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{bodega.direccion}</span>
                </p>
              </div>
            </div>

            {/* Ocupación */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Ocupación de Cajas:</span>
                <span className="text-indigo-600">{bodega.porcentajeOcupacion}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${bodega.porcentajeOcupacion > 75 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                  style={{ width: `${bodega.porcentajeOcupacion}%` }}
                />
              </div>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Estanterías:</span>
                <span className="font-bold text-slate-800">{bodega.estantes} módulos</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Cajas Almacenadas:</span>
                <span className="font-bold text-slate-800 font-mono">{bodega.cajasOcupadas} / {bodega.capacidadTotalCajas}</span>
              </div>
            </div>

            {/* Tipos de proceso en esta bodega */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                <Tag className="w-3 h-3" /> Tipos de proceso:
              </span>
              <div className="flex flex-wrap gap-1">
                {[...new Set(bodega.cajas.map((c) => c.tipoProceso).filter(Boolean))].map((tipo) => (
                  <TipoProcesoBadge key={tipo} tipo={tipo as TipoProceso} />
                ))}
              </div>
            </div>

            {/* Vista previa etiquetas */}
            <details className="group">
              <summary className="cursor-pointer text-xs text-indigo-600 font-semibold flex items-center gap-1 list-none">
                <Box className="w-3.5 h-3.5" />
                Ver etiquetas ({bodega.cajas.length} cajas)
                <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform ml-auto" />
              </summary>
              <div className="mt-3 grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
                {bodega.cajas.map((caja) => <EtiquetaCaja key={caja.id} caja={caja} />)}
              </div>
            </details>

            <button
              onClick={() => toast.success(`Abriendo plano topográfico de ${bodega.nombre}`)}
              className="w-full btn-secondary-light text-xs py-2"
            >
              <Boxes className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ver Mapa de Estantes</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
