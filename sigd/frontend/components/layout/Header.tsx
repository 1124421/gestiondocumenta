'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Plus,
  Shield,
  Sparkles,
  HelpCircle,
  X,
  FileText,
  Upload,
  FolderPlus,
  BookOpen,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showRadicarModal, setShowRadicarModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showNotificaciones, setShowNotificaciones] = useState(false);

  // ── Radicación form state ───────────────────────────
  const [radicacionForm, setRadicacionForm] = useState({
    titulo: '',
    cliente: '',
    serie: '',
    subserie: '',
    observaciones: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // ── Notificaciones mock ─────────────────────────────
  const notificaciones = [
    {
      id: '1',
      tipo: 'warning',
      mensaje: 'Préstamo PREST-2026-0041 vence hoy a las 17:00',
      ruta: '/prestamos',
      fecha: 'Hace 10 min',
    },
    {
      id: '2',
      tipo: 'info',
      mensaje: '84 expedientes listos para transferencia secundaria TRD',
      ruta: '/expedientes',
      fecha: 'Hace 1 hora',
    },
    {
      id: '3',
      tipo: 'danger',
      mensaje: 'Préstamo PREST-2026-0040 está VENCIDO — Requerir devolución',
      ruta: '/prestamos',
      fecha: 'Hace 3 horas',
    },
  ];

  // ── Handlers ────────────────────────────────────────
  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/busqueda?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleRadicar = () => {
    if (!radicacionForm.titulo.trim() || !radicacionForm.cliente.trim()) {
      toast.error('Completa al menos el título y el cliente.');
      return;
    }
    const radicado = `RAD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
    toast.success(`Documento radicado exitosamente: ${radicado}`);
    setShowRadicarModal(false);
    setRadicacionForm({ titulo: '', cliente: '', serie: '', subserie: '', observaciones: '' });
    setSelectedFile(null);
    router.push('/expedientes');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast.success(`Archivo seleccionado: ${file.name}`);
    }
  };

  const handleNotificacionClick = (ruta: string) => {
    setShowNotificaciones(false);
    router.push(ruta);
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-6 flex items-center justify-between">
        {/* Global Search Bar */}
        <form onSubmit={handleGlobalSearch} className="w-96 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar expedientes, metadatos, clientes, radicado..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-all"
          />
        </form>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Quick New Document Action */}
          <button
            onClick={() => setShowRadicarModal(true)}
            className="btn-primary-light text-xs py-2 px-3.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Radicar Documento</span>
          </button>

          {/* Notifications Icon */}
          <div className="relative">
            <button
              onClick={() => setShowNotificaciones(!showNotificaciones)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 relative transition-colors"
              title="Notificaciones"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
            </button>

            {/* Notificaciones Dropdown */}
            {showNotificaciones && (
              <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Notificaciones</span>
                  <button
                    onClick={() => setShowNotificaciones(false)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notificaciones.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotificacionClick(n.ruta)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            n.tipo === 'warning'
                              ? 'bg-amber-500'
                              : n.tipo === 'danger'
                              ? 'bg-rose-500'
                              : 'bg-blue-500'
                          }`}
                        />
                        <div>
                          <p className="text-xs text-slate-800 font-medium leading-snug">{n.mensaje}</p>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">{n.fecha}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Help / Manual */}
          <button
            onClick={() => setShowManualModal(true)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Manual de Usuario"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ═══ MODAL: Radicar Documento ═══ */}
      {showRadicarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-display">Radicar Documento</h2>
                  <p className="text-[10px] text-slate-500">Ingreso rápido al fondo documental</p>
                </div>
              </div>
              <button onClick={() => setShowRadicarModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título del Documento *</label>
                <input
                  type="text"
                  value={radicacionForm.titulo}
                  onChange={(e) => setRadicacionForm({ ...radicacionForm, titulo: e.target.value })}
                  placeholder="Ej: Contrato de Prestación de Servicios N° 459"
                  className="input-light text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cliente *</label>
                  <input
                    type="text"
                    value={radicacionForm.cliente}
                    onChange={(e) => setRadicacionForm({ ...radicacionForm, cliente: e.target.value })}
                    placeholder="Ej: Servientrega S.A."
                    className="input-light text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Serie Documental</label>
                  <select
                    value={radicacionForm.serie}
                    onChange={(e) => setRadicacionForm({ ...radicacionForm, serie: e.target.value })}
                    className="input-light text-xs"
                  >
                    <option value="">Seleccionar serie...</option>
                    <option value="contratos">Contratos y Convenios</option>
                    <option value="historias">Historias Laborales</option>
                    <option value="comprobantes">Comprobantes Contables</option>
                    <option value="auditorias">Auditorías y Control</option>
                    <option value="actas">Actas de Junta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observaciones</label>
                <textarea
                  value={radicacionForm.observaciones}
                  onChange={(e) => setRadicacionForm({ ...radicacionForm, observaciones: e.target.value })}
                  rows={2}
                  placeholder="Notas adicionales..."
                  className="input-light text-xs resize-none"
                />
              </div>

              {/* File Upload Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Archivo Digital (PDF)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.tiff,.tif,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-4 text-center transition-colors group"
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs font-semibold text-slate-800">{selectedFile.name}</span>
                      <span className="text-[10px] text-slate-400">
                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto group-hover:text-indigo-500 transition-colors" />
                      <p className="text-xs text-slate-500">Haz clic para seleccionar archivo</p>
                      <p className="text-[10px] text-slate-400">PDF, TIFF, PNG, JPG</p>
                    </div>
                  )}
                </button>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button onClick={() => setShowRadicarModal(false)} className="btn-secondary-light text-xs">
                Cancelar
              </button>
              <button onClick={handleRadicar} className="btn-primary-light text-xs">
                <FolderPlus className="w-4 h-4" />
                <span>Radicar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: Manual de Usuario ═══ */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-display">Manual de Usuario — SIGD</h2>
                  <p className="text-[10px] text-slate-500">Guía rápida del Sistema de Gestión Documental</p>
                </div>
              </div>
              <button onClick={() => setShowManualModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto text-xs text-slate-700 space-y-5">
              <section>
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" /> 1. Radicación de Documentos
                </h3>
                <p>Desde el botón <strong>"Radicar Documento"</strong> en el header, puede ingresar nuevos documentos al sistema. Complete el formulario con el título, cliente, serie documental y opcionalmente adjunte el archivo PDF digital.</p>
                <p className="mt-1 text-slate-500">El sistema generará automáticamente un número de radicado con formato <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">RAD-YYYY-NNNNN</code>.</p>
              </section>

              <section>
                <h3 className="text-sm font-bold text-slate-900 mb-2">📂 2. Gestión de Expedientes</h3>
                <p>En el módulo <strong>Expedientes & Docs</strong> podrá ver, filtrar y buscar todos los expedientes en custodia. Utilice el filtro de estado para ver solo expedientes en custodia, digitalizados o prestados.</p>
              </section>

              <section>
                <h3 className="text-sm font-bold text-slate-900 mb-2">📦 3. Préstamos y Circulación</h3>
                <p>El módulo <strong>Préstamos</strong> permite solicitar, aprobar y registrar devoluciones de expedientes físicos. Los préstamos vencidos generan alertas automáticas y permiten enviar requerimientos de devolución.</p>
              </section>

              <section>
                <h3 className="text-sm font-bold text-slate-900 mb-2">🔍 4. Búsqueda Global (Elasticsearch)</h3>
                <p>Use la barra de búsqueda del header o el módulo dedicado para buscar por palabras clave, NITs, radicados o fragmentos de texto extraído por OCR. Los resultados se clasifican por relevancia semántica.</p>
              </section>

              <section>
                <h3 className="text-sm font-bold text-slate-900 mb-2">🤖 5. Digitalización e IA</h3>
                <p>El módulo <strong>Digitalización & OCR</strong> permite cargar documentos físicos escaneados. El motor Tesseract OCR extrae texto automáticamente, y el clasificador IA sugiere la serie documental TRD apropiada.</p>
              </section>

              <section>
                <h3 className="text-sm font-bold text-slate-900 mb-2">🏗️ 6. Archivo Físico</h3>
                <p>Gestione bodegas, estanterías y cajas con el módulo de <strong>Archivo Físico</strong>. Cada caja se clasifica por tipo de proceso con su normativa aplicable y se identifica con etiquetas QR.</p>
              </section>

              <section>
                <h3 className="text-sm font-bold text-slate-900 mb-2">📊 7. Reportes</h3>
                <p>Genere y descargue reportes en formato CSV/Excel desde el módulo de <strong>Reportes</strong>. Incluye inventario, préstamos, auditoría y más.</p>
              </section>

              <section className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-indigo-900 mb-1">📞 Soporte Técnico</h3>
                <p className="text-indigo-800">
                  Para soporte técnico, contacte al equipo de TI: <strong>soporte@sigd.com</strong> — Línea interna: <strong>Ext. 2040</strong>
                </p>
              </section>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 shrink-0 flex justify-end">
              <button onClick={() => setShowManualModal(false)} className="btn-primary-light text-xs">
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
