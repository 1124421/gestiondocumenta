'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  ExternalLink, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  Phone,
  Mail,
  User,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Cliente {
  id: string;
  razonSocial: string;
  nit: string;
  tipo: string;
  estado: string;
  totalExpedientes: number;
  totalDocumentos: number;
  contacto: string;
  email: string;
  telefono: string;
  ciudad: string;
}

const mockClientes: Cliente[] = [
  {
    id: '1',
    razonSocial: 'Bancolombia S.A.',
    nit: '890.903.938-8',
    tipo: 'Banca y Finanzas',
    estado: 'ACTIVO',
    totalExpedientes: 4520,
    totalDocumentos: 48900,
    contacto: 'María Camila Gómez',
    email: 'mgomez@bancolombia.com.co',
    telefono: '+57 (4) 404 0000',
    ciudad: 'Medellín',
  },
  {
    id: '2',
    razonSocial: 'Ecopetrol S.A.',
    nit: '860.002.013-2',
    tipo: 'Energía y Petróleo',
    estado: 'ACTIVO',
    totalExpedientes: 3120,
    totalDocumentos: 32400,
    contacto: 'Javier Restrepo',
    email: 'jrestrepo@ecopetrol.com.co',
    telefono: '+57 (1) 234 5000',
    ciudad: 'Bogotá D.C.',
  },
  {
    id: '3',
    razonSocial: 'Servientrega S.A.',
    nit: '860.512.330-3',
    tipo: 'Logística y Transporte',
    estado: 'ACTIVO',
    totalExpedientes: 2150,
    totalDocumentos: 19800,
    contacto: 'Andrés Felipe Morales',
    email: 'amorales@servientrega.com',
    telefono: '+57 (1) 770 0200',
    ciudad: 'Bogotá D.C.',
  },
  {
    id: '4',
    razonSocial: 'Nutresa S.A.',
    nit: '890.900.050-1',
    tipo: 'Alimentos y Consumo',
    estado: 'ACTIVO',
    totalExpedientes: 1840,
    totalDocumentos: 14200,
    contacto: 'Laura Sofía Díaz',
    email: 'ldiaz@gruponutresa.com',
    telefono: '+57 (4) 365 5600',
    ciudad: 'Medellín',
  },
];

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientes, setClientes] = useState(mockClientes);
  const [showModal, setShowModal] = useState(false);
  const [newCliente, setNewCliente] = useState({
    razonSocial: '',
    nit: '',
    tipo: 'Comercial',
    contacto: '',
    email: '',
    telefono: '',
    ciudad: 'Bogotá D.C.',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCliente.razonSocial || !newCliente.nit) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    const created: Cliente = {
      id: String(Date.now()),
      razonSocial: newCliente.razonSocial,
      nit: newCliente.nit,
      tipo: newCliente.tipo,
      estado: 'ACTIVO',
      totalExpedientes: 0,
      totalDocumentos: 0,
      contacto: newCliente.contacto || 'Responsable Asignado',
      email: newCliente.email || 'contacto@empresa.com',
      telefono: newCliente.telefono || '+57 (1) 000 0000',
      ciudad: newCliente.ciudad,
    };
    setClientes([created, ...clientes]);
    setShowModal(false);
    toast.success(`Cliente ${created.razonSocial} registrado exitosamente`);
  };

  const filtered = clientes.filter(
    (c) =>
      c.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nit.includes(searchTerm) ||
      c.ciudad.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900">
            Gestión de Clientes & Entidades
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administración de fondos documentales por entidad contratante y sedes
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary-light text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-white p-4">
          <span className="text-xs font-semibold text-slate-500">Total Empresas Custodiadas</span>
          <div className="text-2xl font-bold font-display text-slate-900 mt-1">{clientes.length}</div>
        </div>
        <div className="card-white p-4">
          <span className="text-xs font-semibold text-slate-500">Total Fondos Acumulados</span>
          <div className="text-2xl font-bold font-display text-indigo-600 mt-1">11,630 Expedientes</div>
        </div>
        <div className="card-white p-4">
          <span className="text-xs font-semibold text-slate-500">Cumplimiento TRD</span>
          <div className="text-2xl font-bold font-display text-emerald-600 mt-1">99.4% Conforme</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="card-white p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Razón Social, NIT o Ciudad..."
            className="input-light pl-10 text-xs py-2"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => toast('Filtros avanzados listos', { icon: '🔍' })}
            className="btn-secondary-light text-xs py-2"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros</span>
          </button>
        </div>
      </div>

      {/* Clients Table */}
      <div className="card-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Razón Social & NIT</th>
                <th className="py-3 px-4">Sector / Tipo</th>
                <th className="py-3 px-4">Ubicación</th>
                <th className="py-3 px-4">Expedientes / Docs</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>{cliente.razonSocial}</span>
                    </div>
                    <div className="text-slate-500 font-mono text-[11px] mt-0.5">NIT: {cliente.nit}</div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{cliente.tipo}</td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cliente.ciudad}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{cliente.totalExpedientes} exp.</div>
                    <div className="text-[10px] text-slate-500">{cliente.totalDocumentos} documentos</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800">{cliente.contacto}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{cliente.email}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="badge-emerald">{cliente.estado}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => toast.success(`Abriendo fondo documental de ${cliente.razonSocial}`)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors"
                    >
                      Ver Archivo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Cliente */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 font-display">Registrar Nueva Entidad Cliente</h2>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">Crea una nueva entidad para asignarle fondos y TRD</p>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Razón Social *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Grupo Sura S.A."
                  value={newCliente.razonSocial}
                  onChange={(e) => setNewCliente({ ...newCliente, razonSocial: e.target.value })}
                  className="input-light text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NIT *</label>
                  <input
                    type="text"
                    required
                    placeholder="900.123.456-7"
                    value={newCliente.nit}
                    onChange={(e) => setNewCliente({ ...newCliente, nit: e.target.value })}
                    className="input-light text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ciudad</label>
                  <input
                    type="text"
                    placeholder="Bogotá D.C."
                    value={newCliente.ciudad}
                    onChange={(e) => setNewCliente({ ...newCliente, ciudad: e.target.value })}
                    className="input-light text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Persona de Contacto</label>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={newCliente.contacto}
                    onChange={(e) => setNewCliente({ ...newCliente, contacto: e.target.value })}
                    className="input-light text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="contacto@empresa.com"
                    value={newCliente.email}
                    onChange={(e) => setNewCliente({ ...newCliente, email: e.target.value })}
                    className="input-light text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary-light text-xs"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary-light text-xs">
                  Guardar Entidad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
