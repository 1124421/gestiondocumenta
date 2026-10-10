'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScanLine,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Cpu,
  RefreshCw,
  FolderPlus,
  Search,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  apiClient,
  type OcrResultado,
  type ClienteConExpediente,
  type DocumentoGuardado,
} from '@/lib/api';

const EXTENSIONES_PERMITIDAS = ['pdf', 'png', 'jpg', 'jpeg', 'tif', 'tiff', 'bmp', 'gif', 'webp'];
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB (igual que el backend)

const METODO_LABEL: Record<OcrResultado['metodo'], string> = {
  OCR_IMAGEN: 'OCR sobre imagen',
  CAPA_TEXTO_PDF: 'Texto nativo del PDF',
  OCR_PDF_ESCANEADO: 'OCR sobre PDF escaneado',
  MIXTO_PDF: 'PDF mixto (texto + OCR)',
};

/** Convierte cualquier error del API en un mensaje legible. */
function mensajeError(err: any): string {
  if (err?.statusCode === 401) {
    return 'Tu sesión no es válida para el servidor. Cierra sesión e ingresa de nuevo con el backend encendido.';
  }
  const m = err?.message;
  if (Array.isArray(m)) return m.join(' · ');
  if (typeof m === 'string' && m === 'Failed to fetch') {
    return 'No se pudo conectar con el servidor (backend apagado o sin red).';
  }
  return m || 'Ocurrió un error inesperado.';
}

function nombreCliente(c: ClienteConExpediente): string {
  return c.razonSocial || `${c.nombre} ${c.apellido ?? ''}`.trim();
}

export default function DigitalizacionPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Archivo REAL seleccionado (no solo su nombre)
  const [archivo, setArchivo] = useState<File | null>(null);
  const [arrastrando, setArrastrando] = useState(false);

  // Proceso OCR
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResultado | null>(null);
  const [errorOcr, setErrorOcr] = useState<string | null>(null);

  // Guardado
  const [isSaving, setIsSaving] = useState(false);
  const [guardado, setGuardado] = useState<DocumentoGuardado | null>(null);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);

  // Expediente destino
  const [clientes, setClientes] = useState<ClienteConExpediente[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargandoClientes, setCargandoClientes] = useState(false);
  const [errorClientes, setErrorClientes] = useState<string | null>(null);
  const [expedienteSel, setExpedienteSel] = useState<{ id: string; numero: string; cliente: string } | null>(null);

  const [sinSesionBackend, setSinSesionBackend] = useState(false);

  useEffect(() => {
    setSinSesionBackend(!apiClient.getAccessToken());
  }, []);

  // Cargar clientes/expedientes (con búsqueda y pequeño debounce)
  const cargarClientes = useCallback(async (texto: string) => {
    setCargandoClientes(true);
    setErrorClientes(null);
    try {
      const res: any = await apiClient.clientes.listar(texto.trim() || undefined);
      setClientes((res?.data ?? res ?? []) as ClienteConExpediente[]);
    } catch (err) {
      setClientes([]);
      setErrorClientes(mensajeError(err));
    } finally {
      setCargandoClientes(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => cargarClientes(busqueda), 300);
    return () => clearTimeout(t);
  }, [busqueda, cargarClientes]);

  // ── Selección de archivo ────────────────────────────
  const aceptarArchivo = (file: File | undefined | null) => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!EXTENSIONES_PERMITIDAS.includes(ext)) {
      toast.error(`Formato ".${ext}" no soportado. Usa PDF, PNG, JPG, TIFF, BMP, GIF o WebP.`);
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('El archivo supera el límite de 50 MB.');
      return;
    }
    setArchivo(file);
    setOcrResult(null);
    setErrorOcr(null);
    setGuardado(null);
    setErrorGuardado(null);
    toast.success(`Archivo cargado: ${file.name}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    aceptarArchivo(e.target.files?.[0]);
    e.target.value = ''; // permite volver a elegir el mismo archivo
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setArrastrando(false);
    aceptarArchivo(e.dataTransfer.files?.[0]);
  };

  // ── OCR real: envía el archivo al backend ───────────
  const handleEjecutarOcr = async () => {
    if (!archivo) {
      fileInputRef.current?.click();
      return;
    }
    setIsProcessing(true);
    setOcrResult(null);
    setErrorOcr(null);
    setGuardado(null);
    try {
      const resultado = await apiClient.ocr.procesar(archivo);
      setOcrResult(resultado);
      toast.success(`OCR completado (${resultado.confianza}% de precisión)`);
    } catch (err) {
      const msg = mensajeError(err);
      setErrorOcr(msg);
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Guardado real: archivo → MinIO, metadatos → BD ──
  const handleGuardar = async () => {
    if (!archivo || !ocrResult) return;
    if (!expedienteSel) {
      toast.error('Selecciona primero el expediente al que pertenece el documento.');
      return;
    }
    setIsSaving(true);
    setErrorGuardado(null);
    try {
      const doc = await apiClient.documentos.subir({
        archivo,
        expedienteId: expedienteSel.id,
        ocr: ocrResult,
      });
      setGuardado(doc);
      toast.success(`Documento guardado en el expediente ${expedienteSel.numero}`);
      // Listo para el siguiente documento
      setArchivo(null);
      setOcrResult(null);
    } catch (err) {
      const msg = mensajeError(err);
      setErrorGuardado(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const ent = ocrResult?.entidades;
  const noDetectado = <span className="text-slate-400 font-normal italic">No detectado</span>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-slate-900">
              Digitalización Inteligente & OCR
            </h1>
            <span className="badge-purple">
              <Sparkles className="w-3 h-3" />
              <span>OCR Tesseract + Clasificación TRD</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Reconocimiento óptico de caracteres sobre el archivo que subes, con clasificación documental sugerida
          </p>
        </div>
      </div>

      {sinSesionBackend && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            Estás en <b>modo demo</b> (sin sesión del servidor). El OCR y el guardado necesitan el backend:
            enciéndelo, cierra sesión e ingresa de nuevo.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda: carga + expediente */}
        <div className="space-y-6">
          <div className="card-white p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-600" />
              <span>1. Carga o Escaneo de Documentos</span>
            </h2>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff,.bmp,.gif,.webp"
              className="hidden"
              onChange={handleFileChange}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group ${
                arrastrando
                  ? 'border-indigo-500 bg-indigo-50/60'
                  : 'border-slate-300 hover:border-indigo-500 bg-slate-50/60 hover:bg-indigo-50/30'
              }`}
            >
              <div className="p-3.5 rounded-2xl bg-indigo-100 text-indigo-600 inline-flex mb-3 group-hover:scale-110 transition-transform">
                <ScanLine className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 break-all">
                {archivo ? archivo.name : 'Haz clic o arrastra un archivo PDF / Imagen'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {archivo
                  ? `${(archivo.size / 1024 / 1024).toFixed(2)} MB · ${archivo.type || 'tipo desconocido'}`
                  : 'Soporta PDF (digital o escaneado), TIFF, PNG, JPG, BMP, GIF y WebP. Máximo 50 MB.'}
              </p>
              <button
                type="button"
                disabled={isProcessing}
                onClick={(e) => { e.stopPropagation(); handleEjecutarOcr(); }}
                className="mt-4 btn-primary-light text-xs py-2 px-4 disabled:opacity-60"
              >
                {isProcessing ? 'Procesando con Tesseract…' : archivo ? 'Ejecutar OCR' : 'Seleccionar Archivo'}
              </button>
            </div>

            {errorOcr && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorOcr}</span>
              </div>
            )}
          </div>

          {/* Selector de expediente */}
          <div className="card-white p-6 space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-indigo-600" />
              <span>2. Expediente destino</span>
            </h2>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar cliente por nombre, cédula/NIT o contrato…"
                className="input-light pl-9 text-xs"
              />
            </div>

            {errorClientes && (
              <p className="text-xs text-red-700">{errorClientes}</p>
            )}

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {cargandoClientes && (
                <p className="text-xs text-slate-400 py-2">Buscando…</p>
              )}
              {!cargandoClientes && !errorClientes && clientes.filter((c) => c.expediente).length === 0 && (
                <p className="text-xs text-slate-500 py-2">
                  No hay clientes con expediente. Crea un cliente en el módulo Clientes: su expediente se genera
                  automáticamente.
                </p>
              )}
              {clientes
                .filter((c) => c.expediente)
                .map((c) => {
                  const activo = expedienteSel?.id === c.expediente!.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setExpedienteSel({ id: c.expediente!.id, numero: c.expediente!.numero, cliente: nombreCliente(c) })
                      }
                      className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                        activo
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                          : 'border-slate-200 hover:border-indigo-300 bg-white text-slate-700'
                      }`}
                    >
                      <span className="font-semibold">{nombreCliente(c)}</span>
                      <span className="block text-[10px] text-slate-500">
                        {c.numeroIdentificacion} · {c.expediente!.numero}
                      </span>
                    </button>
                  );
                })}
            </div>

            {expedienteSel && (
              <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Expediente seleccionado: {expedienteSel.numero} — {expedienteSel.cliente}
              </p>
            )}
          </div>
        </div>

        {/* Columna derecha: resultados reales del OCR */}
        <div className="card-white p-6 space-y-4 self-start">
          <h2 className="text-base font-bold text-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-600" />
              <span>3. Metadatos extraídos del documento</span>
            </div>
            {ocrResult && <span className="badge-emerald">Precisión: {ocrResult.confianza}%</span>}
          </h2>

          {isProcessing ? (
            <div className="p-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-700">
                Leyendo “{archivo?.name}”… los PDF escaneados pueden tardar unos segundos por página.
              </p>
            </div>
          ) : ocrResult && ent ? (
            <div className="space-y-4 animate-fade-in">
              <p className="text-[11px] text-slate-500">
                {METODO_LABEL[ocrResult.metodo]} · {ocrResult.paginasProcesadas} de {ocrResult.paginasTotales} página(s)
              </p>

              {/* Clasificación TRD sugerida */}
              <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Clasificación documental sugerida ({ocrResult.clasificacion.confianza}%):</span>
                </div>
                <p className="text-slate-700 font-semibold">
                  {ocrResult.clasificacion.tipoDocumental} &middot; {ocrResult.clasificacion.serieSugerida} &rarr;{' '}
                  {ocrResult.clasificacion.subserieSugerida}
                </p>
              </div>

              {/* Entidades detectadas en el texto REAL */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Campo etiqueta="NIT:" valor={ent.nit} mono vacio={noDetectado} />
                <Campo etiqueta="Cédula:" valor={ent.cedula} mono vacio={noDetectado} />
                <Campo etiqueta="Razón social / Nombre:" valor={ent.nombre} vacio={noDetectado} />
                <Campo etiqueta="N.º de documento:" valor={ent.numeroDocumento} mono vacio={noDetectado} />
                <Campo etiqueta="Valor:" valor={ent.monto} mono verde vacio={noDetectado} />
                <Campo etiqueta="Fecha del documento:" valor={ent.fecha} vacio={noDetectado} />
              </div>

              {/* Texto OCR */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Texto reconocido (OCR):
                </label>
                <textarea
                  readOnly
                  rows={7}
                  value={ocrResult.texto}
                  className="input-light font-mono text-[11px] leading-relaxed resize-y bg-slate-50"
                />
              </div>

              {errorGuardado && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{errorGuardado}</span>
                </div>
              )}

              <button
                onClick={handleGuardar}
                disabled={isSaving || !expedienteSel}
                className="w-full btn-primary-light text-xs py-2.5 disabled:opacity-60"
              >
                <FolderPlus className="w-4 h-4" />
                <span>
                  {isSaving
                    ? 'Guardando…'
                    : expedienteSel
                      ? `Guardar en el expediente ${expedienteSel.numero}`
                      : 'Selecciona un expediente para guardar'}
                </span>
              </button>
            </div>
          ) : guardado ? (
            <div className="p-8 text-center space-y-2 animate-fade-in">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="text-sm font-bold text-slate-800">Documento guardado correctamente</p>
              <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5 break-all">
                <FileText className="w-3.5 h-3.5" /> {guardado.nombre}
              </p>
              <p className="text-[11px] text-slate-400 break-all">Almacenado en: {guardado.rutaMinio}</p>
              <p className="text-[11px] text-slate-500">Puedes cargar otro documento a la izquierda.</p>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Sube un documento y pulsa “Ejecutar OCR”: aquí verás la información real extraída del archivo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Campo({
  etiqueta,
  valor,
  mono,
  verde,
  vacio,
}: {
  etiqueta: string;
  valor?: string;
  mono?: boolean;
  verde?: boolean;
  vacio: React.ReactNode;
}) {
  return (
    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
      <span className="text-[10px] text-slate-400 font-semibold block">{etiqueta}</span>
      <span
        className={`font-bold break-words ${mono ? 'font-mono' : ''} ${verde ? 'text-emerald-700' : 'text-slate-800'}`}
      >
        {valor || vacio}
      </span>
    </div>
  );
}
