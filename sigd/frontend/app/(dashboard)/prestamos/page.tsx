'use client';

import React, { useState } from 'react';
import {
  BookOpenCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  User,
  Building2,
  Calendar,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Prestamo {
  id: string;
  codigoSolicitud: string;
  expedienteTitulo: string;
  radicado: string;
  solicitante: string;
  areaSolicitante: string;
  fechaSolicitud: string;
  fechaLimiteDevolucion: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'DEVUELTO' | 'VENCIDO';
  tipo: 'FISICO' | 'DIGITAL';
}

const mockPrestamos: Prestamo[] = [
  {
    id: '1',
    codigoSolicitud: 'PREST-2026-0041',
    expedienteTitulo: 'Auditoría de Calidad y BPM Planta Medellín',
    radicado: 'RAD-2026-00889',
    solicitante: 'Dra. Carolina Villegas',
    areaSolicitante: 'Dirección de Calidad y Procesos',
    fechaSolicitud: '2026-03-05',
    fechaLimiteDevolucion: '2026-03-12',
    estado: 'APROBADO',
    tipo: 'FISICO',
  },
  {
    id: '2',
    codigoSolicitud: 'PREST-2026-0040',
    expedienteTitulo: 'Contrato Marco de Suministro #992-B',
    radicado: 'RAD-2026-00750',
    solicitante: 'Dr. Santiago Morales',
    areaSolicitante: 'Asesoría Jurídica',
    fechaSolicitud: '2026-03-01',
    fechaLimiteDevolucion: '2026-03-08',
    estado: 'VENCIDO',
    tipo: 'FISICO',
  },
  {
    id: '3',
    codigoSolicitud: 'PREST-2026-0039',
    expedienteTitulo: 'Historia Laboral - Pedro Alejandro Suárez',
    radicado: 'RAD-2026-00620',
    solicitante: 'Lic. Martha Helena Restrepo',
    areaSolicitante: 'Gestión Humana',
    fechaSolicitud: '2026-02-25',
    fechaLimiteDevolucion: '2026-03-02',
    estado: 'DEVUELTO',
    tipo: 'DIGITAL',
  },
  {
    id: '4',
    codigoSolicitud: 'PREST-2026-0042',
    expedienteTitulo: 'Balance General Consolidado 2025',
    radicado: 'RAD-2026-00810',
    solicitante: 'C.P. Julián Castro',
    areaSolicitante: 'Revisoría Fiscal Externa',
    fechaSolicitud: '2026-03-15',
    fechaLimiteDevolucion: '2026-03-22',
    estado: 'PENDIENTE',
    tipo: 'FISICO',
  },
];

export default function PrestamosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [prestamos, setPrestamos] = useState<Prestamo[]>(mockPrestamos);
  const [showModal, setShowModal] = useState(false);

  const handleAprobar = (id: string) => {
    setPrestamos(prestamos.map(p => p.id === id ? { ...p, estado: 'APROBADO' } : p));
    toast.success('Préstamo autorizado. Se generó el comprobante de entrega física.');
  };

  const handleDevolver = (id: string) => {
    setPrestamos(prestamos.map(p => p.id === id ? { ...p, estado: 'DEVUELTO' } : p));
    toast.success('Documento devuelto a custodia y verificado en inventario.');
  };

  const filtered = prestamos.filter(
    p =>
      p.codigoSolicitud.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.solicitante.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.expedienteTitulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.radicado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900">
            Control de Préstamos & Circulación
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Solicitudes, autorizaciones, actas de entrega física y alertas de devolución
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary-light text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Solicitar Préstamo</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card-white p-4">
          <span className="text-xs font-semibold text-slate-500">Pendientes por Aprobar</span>
          <div className="text-2xl font-bold font-display text-amber-600 mt-1">1 Solicitud</div>
        </div>
        <div className="card-white p-4">
          <span className="text-xs font-semibold text-slate-500">En Circulación Activa</span>
          <div className="text-2xl font-bold font-display text-indigo-600 mt-1">1 Expediente</div>
        </div>
        <div className="card-white p-4">
          <span className="text-xs font-semibold text-slate-500">Préstamos Vencidos</span>
          <div className="text-2xl font-bold font-display text-rose-600 mt-1">1 Alerta</div>
        </div>
        <div className="card-white p-4">
          <span className="text-xs font-semibold text-slate-500">Devoluciones del Mes</span>
          <div className="text-2xl font-bold font-display text-emerald-600 mt-1">38 Registradas</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card-white p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar solicitud, funcionario o radicado..."
            className="input-light pl-10 text-xs py-2"
          />
        </div>
      </div>

      {/* Prestamos Table */}
      <div className="card-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Código / Tipo</th>
                <th className="py-3 px-4">Expediente Solicitado</th>
                <th className="py-3 px-4">Solicitante & Área</th>
                <th className="py-3 px-4">Fecha Solicitud</th>
                <th className="py-3 px-4">Límite Devolución</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((prestamo) => (
                <tr key={prestamo.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 font-mono block">{prestamo.codigoSolicitud}</span>
                    <span className="badge-slate text-[10px] mt-0.5">{prestamo.tipo}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-900 block max-w-xs">{prestamo.expedienteTitulo}</span>
                    <span className="text-[10px] text-indigo-600 font-mono">{prestamo.radicado}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800">{prestamo.solicitante}</div>
                    <div className="text-[10px] text-slate-500">{prestamo.areaSolicitante}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{prestamo.fechaSolicitud}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{prestamo.fechaLimiteDevolucion}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={
                        prestamo.estado === 'APROBADO'
                          ? 'badge-blue'
                          : prestamo.estado === 'DEVUELTO'
                          ? 'badge-emerald'
                          : prestamo.estado === 'VENCIDO'
                          ? 'badge-rose'
                          : 'badge-amber'
                      }
                    >
                      {prestamo.estado}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1">
                    {prestamo.estado === 'PENDIENTE' && (
                      <button
                        onClick={() => handleAprobar(prestamo.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors"
                      >
                        Aprobar
                      </button>
                    )}
                    {prestamo.estado === 'APROBADO' && (
                      <button
                        onClick={() => handleDevolver(prestamo.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs transition-colors"
                      >
                        Registrar Devolución
                      </button>
                    )}
                    {prestamo.estado === 'VENCIDO' && (
                      <button
                        onClick={() => toast.error(`Notificación de requerimiento enviada a ${prestamo.solicitante}`)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors"
                      >
                        Requerir
                      </button>
                    )}
                    {prestamo.estado === 'DEVUELTO' && (
                      <span className="text-[11px] text-slate-400 font-medium">Finalizado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
