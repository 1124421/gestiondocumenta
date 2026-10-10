'use client';

import React, { useState } from 'react';
import {
  History as HistoryIcon,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Lock,
  User,
  Globe,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AuditEntry {
  id: string;
  fecha: string;
  hora: string;
  usuario: string;
  rol: string;
  accion: string;
  recurso: string;
  ip: string;
  hashSha256: string;
  estado: 'EXITOSO' | 'ADVERTENCIA' | 'BLOQUEADO';
}

const mockAuditLogs: AuditEntry[] = [
  {
    id: 'LOG-8842',
    fecha: '2026-03-15',
    hora: '16:04:12',
    usuario: 'admin@sigd.com',
    rol: 'ADMINISTRADOR',
    accion: 'LOGIN_MFA_SUCCESS',
    recurso: 'Sesión Principal',
    ip: '192.168.1.45',
    hashSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    estado: 'EXITOSO',
  },
  {
    id: 'LOG-8841',
    fecha: '2026-03-15',
    hora: '15:48:30',
    usuario: 'auxiliar@sigd.com',
    rol: 'AUXILIAR_ARCHIVO',
    accion: 'DIGITALIZACION_OCR',
    recurso: 'EXP-BANC-2026-001 (84 folios)',
    ip: '192.168.1.50',
    hashSha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    estado: 'EXITOSO',
  },
  {
    id: 'LOG-8840',
    fecha: '2026-03-15',
    hora: '14:20:11',
    usuario: 'auxiliar@sigd.com',
    rol: 'AUXILIAR_ARCHIVO',
    accion: 'PRESTAMO_ENTREGA',
    recurso: 'PREST-2026-0041',
    ip: '192.168.1.50',
    hashSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    estado: 'EXITOSO',
  },
  {
    id: 'LOG-8839',
    fecha: '2026-03-15',
    hora: '12:10:05',
    usuario: 'consultor@externo.com',
    rol: 'CONSULTA_EXTERNA',
    accion: 'ACCESO_NO_AUTORIZADO',
    recurso: 'EXP-ECOP-2026-042 (Historia Laboral)',
    ip: '186.84.120.14',
    hashSha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    estado: 'BLOQUEADO',
  },
];

export default function TrazabilidadPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<AuditEntry[]>(mockAuditLogs);

  const filtered = logs.filter(
    l =>
      l.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.recurso.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-slate-900">
              Trazabilidad & Registro de Auditoría
            </h1>
            <span className="badge-emerald">
              <ShieldCheck className="w-3 h-3" />
              <span>Inmutable SHA-256</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Log forense de cada operación, consulta, préstamo y descarga con firma digital
          </p>
        </div>

        <button
          onClick={() => toast.success('Reporte de auditoría exportado en formato Excel / CSV')}
          className="btn-secondary-light text-xs"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Exportar Bitácora</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="card-white p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por usuario, acción, recurso o ID..."
            className="input-light pl-10 text-xs py-2"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="card-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">ID / Timestamp</th>
                <th className="py-3 px-4">Usuario & Rol</th>
                <th className="py-3 px-4">Acción Realizada</th>
                <th className="py-3 px-4">Recurso Afectado</th>
                <th className="py-3 px-4">IP Origen</th>
                <th className="py-3 px-4">Hash Integridad</th>
                <th className="py-3 px-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{log.id}</span>
                    <span className="text-[10px] text-slate-400 font-sans">{log.fecha} {log.hora}</span>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <div className="font-medium text-slate-800">{log.usuario}</div>
                    <div className="text-[10px] text-slate-500 font-semibold">{log.rol}</div>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {log.accion}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-700 font-medium">
                    {log.recurso}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{log.ip}</td>
                  <td className="py-3 px-4 text-slate-400 truncate max-w-[120px]" title={log.hashSha256}>
                    {log.hashSha256.substring(0, 16)}...
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span
                      className={
                        log.estado === 'EXITOSO'
                          ? 'badge-emerald'
                          : log.estado === 'BLOQUEADO'
                          ? 'badge-rose'
                          : 'badge-amber'
                      }
                    >
                      {log.estado}
                    </span>
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
