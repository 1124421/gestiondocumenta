'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderArchive,
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Download,
  Share2,
  Box,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Expediente {
  id: string;
  radicado: string;
  codigoExpediente: string;
  titulo: string;
  cliente: string;
  serie: string;
  subserie: string;
  ubicacionFisica: {
    bodega: string;
    estante: string;
    caja: string;
    carpeta: string;
  };
  totalFolios: number;
  estado: string;
  fechaCreacion: string;
  retencionActivoAnios: number;
}

const mockExpedientes: Expediente[] = [
  {
    id: '1',
    radicado: 'RAD-2026-00892',
    codigoExpediente: 'EXP-BANC-2026-001',
    titulo: 'Contrato de Arrendamiento Financiero Leasing #4492',
    cliente: 'Bancolombia S.A.',
    serie: 'Contratos y Convenios',
    subserie: 'Contratos de Leasing',
    ubicacionFisica: {
      bodega: 'Bodega Principal Central',
      estante: 'E-04',
      caja: 'CAJA-882',
      carpeta: 'CARP-12',
    },
    totalFolios: 84,
    estado: 'CUSTODIA',
    fechaCreacion: '2026-01-15',
    retencionActivoAnios: 10,
  },
  {
    id: '2',
    radicado: 'RAD-2026-00891',
    codigoExpediente: 'EXP-ECOP-2026-042',
    titulo: 'Historia Laboral - Carlos Mario Restrepo',
    cliente: 'Ecopetrol S.A.',
    serie: 'Historias Laborales',
    subserie: 'Personal Activo',
    ubicacionFisica: {
      bodega: 'Bodega Norte Sede 2',
      estante: 'E-12',
      caja: 'CAJA-104',
      carpeta: 'CARP-03',
    },
    totalFolios: 215,
    estado: 'DIGITALIZADO',
    fechaCreacion: '2026-02-10',
    retencionActivoAnios: 80,
  },
  {
    id: '3',
    radicado: 'RAD-2026-00890',
    codigoExpediente: 'EXP-SERV-2026-118',
    titulo: 'Comprobantes Contables Egresos Trimestre 1',
    cliente: 'Servientrega S.A.',
    serie: 'Comprobantes Contables',
    subserie: 'Comprobantes de Egreso',
    ubicacionFisica: {
      bodega: 'Bodega Principal Central',
      estante: 'E-08',
      caja: 'CAJA-551',
      carpeta: 'CARP-01',
    },
    totalFolios: 140,
    estado: 'CUSTODIA',
    fechaCreacion: '2026-03-01',
    retencionActivoAnios: 5,
  },
  {
    id: '4',
    radicado: 'RAD-2026-00889',
    codigoExpediente: 'EXP-NUTR-2026-009',
    titulo: 'Auditoría de Calidad y BPM Planta Medellín',
    cliente: 'Nutresa S.A.',
    serie: 'Auditorías y Control',
    subserie: 'Auditorías de Calidad',
    ubicacionFisica: {
      bodega: 'Bodega Principal Central',
      estante: 'E-02',
      caja: 'CAJA-310',
      carpeta: 'CARP-07',
    },
    totalFolios: 62,
    estado: 'PRESTADO',
    fechaCreacion: '2026-03-05',
    retencionActivoAnios: 20,
  },
];

export default function ExpedientesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [expedientes] = useState(mockExpedientes);
  const [selectedExp, setSelectedExp] = useState<Expediente | null>(null);

  const filtered = expedientes.filter((e) => {
    const matchSearch =
      !searchTerm ||
      e.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.radicado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.codigoExpediente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.cliente.toLowerCase().includes(searchTerm.toLowerCase());

    const matchEstado = !filterEstado || e.estado === filterEstado;

    return matchSearch && matchEstado;
  });

  const handleDownload = (exp: Expediente) => {
    // Generate a simulated document content and trigger download
    const content = `
═══════════════════════════════════════════════════════════
          COPIA CERTIFICADA — SISTEMA SIGD
═══════════════════════════════════════════════════════════

RADICADO: ${exp.radicado}
CÓDIGO:   ${exp.codigoExpediente}
TÍTULO:   ${exp.titulo}
CLIENTE:  ${exp.cliente}

SERIE DOCUMENTAL TRD:  ${exp.serie}
SUBSERIE:              ${exp.subserie}

UBICACIÓN FÍSICA:
  Bodega:   ${exp.ubicacionFisica.bodega}
  Estante:  ${exp.ubicacionFisica.estante}
  Caja:     ${exp.ubicacionFisica.caja}
  Carpeta:  ${exp.ubicacionFisica.carpeta}

TOTAL FOLIOS: ${exp.totalFolios}
ESTADO:       ${exp.estado}
FECHA:        ${exp.fechaCreacion}
RETENCIÓN:    ${exp.retencionActivoAnios} años en archivo activo

═══════════════════════════════════════════════════════════
Documento generado el: ${new Date().toLocaleString('es-CO')}
Sistema Inteligente de Gestión Documental — SIGD v1.0
═══════════════════════════════════════════════════════════
`.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exp.radicado}_copia_certificada.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Descargando copia certificada de ${exp.radicado}`);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterEstado('');
    toast.success('Filtros limpiados');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900">
            Expedientes & Unidades Documentales
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Custodia física, tablas de retención documental (TRD) y archivo digital
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/digitalizacion')}
            className="btn-primary-light text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Radicar Expediente</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card-white p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por radicado, código, título o cliente..."
            className="input-light pl-10 text-xs py-2"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="input-light text-xs py-2 pr-8 w-auto"
          >
            <option value="">Todos los Estados</option>
            <option value="CUSTODIA">En Custodia</option>
            <option value="DIGITALIZADO">Digitalizado</option>
            <option value="PRESTADO">Prestado</option>
          </select>

          <button
            onClick={handleClearFilters}
            className="btn-secondary-light text-xs py-2 px-3"
            title="Limpiar filtros"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {/* Filter Summary */}
      {(searchTerm || filterEstado) && (
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-indigo-500" />
          <span>
            Mostrando <strong className="text-slate-800">{filtered.length}</strong> de {expedientes.length} expedientes
            {filterEstado && <> — Estado: <span className="font-semibold text-indigo-600">{filterEstado}</span></>}
            {searchTerm && <> — Búsqueda: <span className="font-semibold text-indigo-600">"{searchTerm}"</span></>}
          </span>
        </div>
      )}

      {/* Expedientes Table */}
      <div className="card-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Radicado / Código</th>
                <th className="py-3 px-4">Título del Expediente</th>
                <th className="py-3 px-4">Cliente & Serie TRD</th>
                <th className="py-3 px-4">Ubicación Física</th>
                <th className="py-3 px-4">Folios</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-indigo-600 block font-mono">{exp.radicado}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{exp.codigoExpediente}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-900 block max-w-sm">{exp.titulo}</span>
                    <span className="text-[10px] text-slate-500">Creado el {exp.fechaCreacion}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800">{exp.cliente}</div>
                    <div className="text-[10px] text-slate-500">{exp.serie} &bull; {exp.subserie}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <div className="flex items-center gap-1 font-mono text-[11px] text-slate-700">
                      <Box className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{exp.ubicacionFisica.caja} / {exp.ubicacionFisica.carpeta}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">{exp.ubicacionFisica.bodega} ({exp.ubicacionFisica.estante})</div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">
                    {exp.totalFolios} fls.
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={
                        exp.estado === 'CUSTODIA'
                          ? 'badge-emerald'
                          : exp.estado === 'DIGITALIZADO'
                          ? 'badge-blue'
                          : 'badge-amber'
                      }
                    >
                      {exp.estado}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1">
                    <button
                      onClick={() => setSelectedExp(exp)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Ver Detalle"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(exp)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Descargar Copia Certificada"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                    <FolderArchive className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                    No se encontraron expedientes con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalle Expediente */}
      {selectedExp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="badge-blue text-[10px] mb-1 font-mono">{selectedExp.radicado}</span>
                <h2 className="text-base font-bold text-slate-900 font-display">{selectedExp.titulo}</h2>
                <p className="text-xs text-slate-500">{selectedExp.cliente}</p>
              </div>
              <span className="badge-emerald">{selectedExp.estado}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block font-medium">Serie Documental TRD:</span>
                <span className="font-semibold text-slate-800">{selectedExp.serie}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Subserie:</span>
                <span className="font-semibold text-slate-800">{selectedExp.subserie}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Ubicación Física:</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {selectedExp.ubicacionFisica.caja} | {selectedExp.ubicacionFisica.estante}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Tiempo de Retención:</span>
                <span className="font-semibold text-slate-800">{selectedExp.retencionActivoAnios} años en archivo activo</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedExp(null)}
                className="btn-secondary-light text-xs"
              >
                Cerrar
              </button>
              <button
                onClick={() => handleDownload(selectedExp)}
                className="btn-secondary-light text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar</span>
              </button>
              <button
                onClick={() => {
                  router.push(`/expedientes/${selectedExp.id}`);
                  setSelectedExp(null);
                }}
                className="btn-primary-light text-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Ver Detalle Completo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
