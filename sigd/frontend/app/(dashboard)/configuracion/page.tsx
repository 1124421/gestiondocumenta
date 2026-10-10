'use client';

import React from 'react';
import {
  Settings,
  Shield,
  HardDrive,
  Cpu,
  Database,
  BellRing,
  KeyRound,
  CheckCircle2,
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ConfiguracionPage() {
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Parámetros del sistema SIGD actualizados correctamente');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900">
          Configuración del Sistema SIGD
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Parámetros de almacenamiento MinIO, conexión PostgreSQL, OCR, llaves de API y políticas de seguridad
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Storage MinIO & S3 */}
        <div className="card-white p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <HardDrive className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Almacenamiento de Objetos (MinIO / S3)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">MinIO Endpoint</label>
              <input
                type="text"
                defaultValue="http://localhost:9000"
                className="input-light text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bucket Principal</label>
              <input
                type="text"
                defaultValue="sigd-documentos-custodia"
                className="input-light text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Security & MFA Policy */}
        <div className="card-white p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Políticas de Seguridad & Criptografía</h2>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-indigo-600" />
              <span>Exigir autenticación de dos factores (MFA TOTP) a todos los Administradores</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-indigo-600" />
              <span>Cifrado AES-256 en reposo para todos los archivos subidos al repositorio</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-indigo-600" />
              <span>Generar hash SHA-256 inmutable en cada registro de la bitácora de auditoría</span>
            </label>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button type="submit" className="btn-primary-light text-xs py-2.5 px-6">
            <Save className="w-4 h-4" />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </form>
    </div>
  );
}
