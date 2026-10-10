'use client';

import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  KeyRound,
  Mail,
  Building2,
  Lock,
  UserCheck,
  UserX
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  sede: string;
  mfaHabilitado: boolean;
  activo: boolean;
  ultimoAcceso: string;
}

const mockUsuarios: Usuario[] = [
  {
    id: '1',
    nombre: 'Administrador',
    apellido: 'Principal',
    email: 'admin@sigd.com',
    rol: 'ADMINISTRADOR',
    sede: 'Sede Central Bogotá',
    mfaHabilitado: true,
    activo: true,
    ultimoAcceso: 'Hace 5 min',
  },
  {
    id: '2',
    nombre: 'Juan Carlos',
    apellido: 'Pérez',
    email: 'auxiliar@sigd.com',
    rol: 'AUXILIAR_ARCHIVO',
    sede: 'Bodega Principal Central',
    mfaHabilitado: false,
    activo: true,
    ultimoAcceso: 'Hace 2 horas',
  },
  {
    id: '3',
    nombre: 'Carolina',
    apellido: 'Villegas',
    email: 'calidad@sigd.com',
    rol: 'USUARIO_CONSULTA',
    sede: 'Sede Medellín',
    mfaHabilitado: true,
    activo: true,
    ultimoAcceso: 'Ayer',
  },
  {
    id: '4',
    nombre: 'Santiago',
    apellido: 'Morales',
    email: 'auditor@externo.com',
    rol: 'AUDITOR',
    sede: 'Auditoría Externa',
    mfaHabilitado: true,
    activo: true,
    ultimoAcceso: '10/03/2026',
  },
];

export default function UsuariosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [usuarios, setUsuarios] = useState<Usuario[]>(mockUsuarios);

  const toggleStatus = (id: string) => {
    setUsuarios(
      usuarios.map((u) => {
        if (u.id === id) {
          const newStatus = !u.activo;
          toast.success(`Usuario ${u.email} ${newStatus ? 'activado' : 'desactivado'}`);
          return { ...u, activo: newStatus };
        }
        return u;
      })
    );
  };

  const filtered = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.rol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900">
            Usuarios, Roles & Control de Acceso
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administración de cuentas corporativas, roles RBAC y autenticación MFA
          </p>
        </div>

        <button
          onClick={() => toast.success('Modal de creación de usuario abierto')}
          className="btn-primary-light text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Usuario</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="card-white p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, correo o rol..."
            className="input-light pl-10 text-xs py-2"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="card-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Usuario / Nombre</th>
                <th className="py-3 px-4">Correo Electrónico</th>
                <th className="py-3 px-4">Rol Asignado</th>
                <th className="py-3 px-4">Sede / Ubicación</th>
                <th className="py-3 px-4">MFA (2FA)</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                        {usuario.nombre[0]}
                      </div>
                      <span>{usuario.nombre} {usuario.apellido}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{usuario.email}</td>
                  <td className="py-3.5 px-4">
                    <span className="badge-purple font-mono text-[10px]">{usuario.rol}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{usuario.sede}</td>
                  <td className="py-3.5 px-4">
                    {usuario.mfaHabilitado ? (
                      <span className="badge-emerald text-[10px]">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Activo</span>
                      </span>
                    ) : (
                      <span className="badge-slate text-[10px]">Inactivo</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {usuario.activo ? (
                      <span className="badge-emerald">ACTIVO</span>
                    ) : (
                      <span className="badge-rose">INACTIVO</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => toggleStatus(usuario.id)}
                      className={`px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
                        usuario.activo
                          ? 'bg-red-50 hover:bg-red-100 text-red-700'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {usuario.activo ? 'Desactivar' : 'Activar'}
                    </button>
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
