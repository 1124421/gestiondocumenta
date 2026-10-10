'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Sparkles,
  FileText,
  FolderArchive,
  Building2,
  Calendar,
  MapPin,
  ExternalLink,
  SlidersHorizontal,
  FileCode,
  Tag
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SearchResult {
  id: string;
  tipo: 'EXPEDIENTE' | 'DOCUMENTO' | 'CLIENTE';
  titulo: string;
  radicado: string;
  cliente: string;
  coincidenciaTexto: string;
  score: number;
  ubicacion: string;
  fecha: string;
  expedienteId: string;
}

const mockResults: SearchResult[] = [
  {
    id: '1',
    tipo: 'DOCUMENTO',
    titulo: 'Contrato de Prestación de Servicios N° 459-2026',
    radicado: 'RAD-2026-00892',
    cliente: 'Servientrega S.A.',
    coincidenciaTexto: '...representada legalmente por CARLOS EDUARDO LÓPEZ con NIT 860.512.330-3 por un valor de $145.000.000 COP...',
    score: 99.4,
    ubicacion: 'Caja CAJA-882 (Carpeta 12)',
    fecha: '15 Feb 2026',
    expedienteId: '1',
  },
  {
    id: '2',
    tipo: 'EXPEDIENTE',
    titulo: 'Historia Laboral - Carlos Mario Restrepo',
    radicado: 'RAD-2026-00891',
    cliente: 'Bancolombia S.A.',
    coincidenciaTexto: '...Fondo de historias laborales activas, afiliaciones a seguridad social y certificados laborales...',
    score: 94.1,
    ubicacion: 'Caja CAJA-104 (Carpeta 03)',
    fecha: '10 Feb 2026',
    expedienteId: '2',
  },
  {
    id: '3',
    tipo: 'DOCUMENTO',
    titulo: 'Factura Electrónica FE-9921',
    radicado: 'RAD-2026-00890',
    cliente: 'Ecopetrol S.A.',
    coincidenciaTexto: '...Comprobantes contables y facturas del periodo fiscal enero 2026 aprobadas por contabilidad...',
    score: 88.7,
    ubicacion: 'Caja CAJA-551 (Carpeta 01)',
    fecha: '01 Mar 2026',
    expedienteId: '3',
  },
];

export default function BusquedaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>(mockResults);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [hasSearched, setHasSearched] = useState(false);

  // Read query from URL params (from Header global search)
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery) {
      setQuery(urlQuery);
      setHasSearched(true);
      toast.success(`Búsqueda full-text en Elasticsearch ejecutada para: "${urlQuery}"`);
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setHasSearched(true);
    toast.success(`Búsqueda full-text en Elasticsearch ejecutada para: "${query}"`);
  };

  const handleOpenResult = (item: SearchResult) => {
    router.push(`/expedientes/${item.expedienteId}`);
  };

  const filtered = results.filter((r) => {
    if (filterType !== 'ALL' && r.tipo !== filterType) return false;
    if (!query) return true;
    return (
      r.titulo.toLowerCase().includes(query.toLowerCase()) ||
      r.cliente.toLowerCase().includes(query.toLowerCase()) ||
      r.coincidenciaTexto.toLowerCase().includes(query.toLowerCase()) ||
      r.radicado.toLowerCase().includes(query.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center py-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Motor de Búsqueda Elasticsearch & OCR Semántico</span>
        </div>
        <h1 className="text-3xl font-extrabold font-display text-slate-900">
          Buscador Global del Fondo Documental
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
          Encuentra cualquier expediente, documento, texto contenido en PDFs escaneados o NITs al instante.
        </p>
      </div>

      {/* Main Search Input */}
      <form onSubmit={handleSearch} className="relative">
        <div className="card-white p-2 flex items-center gap-2 shadow-lg shadow-slate-200/50">
          <div className="pl-3 text-slate-400">
            <Search className="w-5 h-5 text-indigo-600" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribe palabras clave, nombres, radicados, NITs o fragmentos de texto..."
            className="w-full px-2 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
          />
          <button type="submit" className="btn-primary-light text-xs py-2 px-5 shrink-0">
            Buscar
          </button>
        </div>
      </form>

      {/* Type Filters */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {['ALL', 'EXPEDIENTE', 'DOCUMENTO', 'CLIENTE'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                filterType === type
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {type === 'ALL'
                ? 'Todos los Resultados'
                : type === 'EXPEDIENTE'
                ? 'Expedientes'
                : type === 'DOCUMENTO'
                ? 'Documentos OCR'
                : 'Clientes'}
            </button>
          ))}
        </div>

        <span className="text-slate-500 font-medium">
          {filtered.length} coincidencias encontradas
        </span>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div key={item.id} className="card-white p-5 hover:shadow-soft-md transition-all">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={
                      item.tipo === 'EXPEDIENTE'
                        ? 'badge-blue'
                        : item.tipo === 'DOCUMENTO'
                        ? 'badge-purple'
                        : 'badge-emerald'
                    }
                  >
                    {item.tipo}
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-600">
                    {item.radicado}
                  </span>
                  <span className="text-xs text-slate-400">&bull;</span>
                  <span className="text-xs font-semibold text-slate-700">{item.cliente}</span>
                </div>

                <h3
                  className="text-base font-bold text-slate-900 font-display hover:text-indigo-600 cursor-pointer transition-colors"
                  onClick={() => handleOpenResult(item)}
                >
                  {item.titulo}
                </h3>

                {/* Text snippet matching */}
                <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans">
                  <span className="font-semibold text-slate-500 text-[10px] block uppercase">Fragmento de texto encontrado:</span>
                  <p className="italic mt-0.5 text-slate-800">{item.coincidenciaTexto}</p>
                </div>

                {/* Metadata tags */}
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{item.ubicacion}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.fecha}</span>
                  </span>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <span className="badge-emerald text-[10px]">
                  {item.score}% Relevancia
                </span>
                <button
                  onClick={() => handleOpenResult(item)}
                  className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && hasSearched && (
          <div className="card-white p-12 text-center">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">No se encontraron resultados</p>
            <p className="text-xs text-slate-400 mt-1">Intenta con otros términos de búsqueda o ajusta los filtros</p>
          </div>
        )}
      </div>
    </div>
  );
}
