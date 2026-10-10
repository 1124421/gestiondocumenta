import { BadRequestException, Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWorker, Worker } from 'tesseract.js';
import { tmpdir } from 'os';
import { join } from 'path';
import { IaService } from '../ia/ia.service';

export interface EntidadesDetectadas {
  nit?: string;
  cedula?: string;
  nombre?: string;
  monto?: string;
  fecha?: string; // ISO yyyy-mm-dd
  numeroDocumento?: string;
}

export interface ResultadoOcr {
  texto: string;
  confianza: number; // 0-100
  palabrasClave: string[];
  metodo: 'OCR_IMAGEN' | 'CAPA_TEXTO_PDF' | 'OCR_PDF_ESCANEADO' | 'MIXTO_PDF';
  paginasTotales: number;
  paginasProcesadas: number;
  entidades: EntidadesDetectadas;
  clasificacion: {
    tipoDocumental: string;
    serieSugerida: string;
    subserieSugerida: string;
    confianza: number; // 0-100
  };
  metadatos: Record<string, any>;
}

const MIME_IMAGEN = [
  'image/jpeg', 'image/png', 'image/tiff', 'image/gif', 'image/bmp', 'image/webp',
];
const MIME_PDF = 'application/pdf';

/** Máximo de páginas de un PDF que se procesan con OCR por solicitud. */
const MAX_PAGINAS = 10;
/** Una página con menos caracteres que esto en su capa de texto se considera escaneada. */
const MIN_CHARS_CAPA_TEXTO = 30;
/** Escala de rasterizado de PDF escaneado (2 ≈ 144 dpi). */
const ESCALA_RASTER = 2;

/**
 * OcrService — Extracción REAL de texto con Tesseract.js (+ pdfjs para PDF).
 *
 *  - Imágenes: OCR directo sobre el buffer recibido.
 *  - PDF digital: lee la capa de texto (exacta, sin OCR).
 *  - PDF escaneado: rasteriza cada página y aplica OCR.
 *
 * Nunca devuelve datos de ejemplo: si no se puede leer el archivo, lanza error.
 */
@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly iaService: IaService,
  ) {}

  async procesar(fileBuffer: Buffer, mimeType: string): Promise<ResultadoOcr> {
    if (!fileBuffer?.length) {
      throw new BadRequestException('El archivo está vacío.');
    }
    if (!this.esCompatible(mimeType)) {
      throw new BadRequestException(
        `El tipo de archivo "${mimeType}" no se puede procesar con OCR. Usa PDF, PNG, JPG, TIFF, BMP, GIF o WebP.`,
      );
    }

    this.logger.log(`Iniciando OCR | Tipo: ${mimeType} | Tamaño: ${fileBuffer.length} bytes`);

    let base: Pick<ResultadoOcr, 'texto' | 'confianza' | 'metodo' | 'paginasTotales' | 'paginasProcesadas'>;
    try {
      base = mimeType === MIME_PDF
        ? await this.leerPdf(fileBuffer)
        : await this.leerImagen(fileBuffer);
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`Fallo en OCR: ${err?.message}`, err?.stack);
      throw new InternalServerErrorException(
        `No se pudo procesar el documento con OCR: ${err?.message || 'error desconocido'}`,
      );
    }

    const texto = base.texto.trim();
    if (!texto) {
      throw new BadRequestException(
        'No se pudo reconocer texto en el documento. Verifica que el archivo sea legible y no esté vacío o dañado.',
      );
    }

    const entidades = this.extraerEntidades(texto);
    const clasif = await this.iaService.clasificarDocumento(texto);
    const { serie, subserie } = this.mapearTrd(clasif.tipoDocumental, texto);
    const confClasif = clasif.confianza <= 1 ? clasif.confianza * 100 : clasif.confianza;

    this.logger.log(
      `OCR completado | Método: ${base.metodo} | Confianza: ${base.confianza.toFixed(1)}% | ` +
        `Páginas: ${base.paginasProcesadas}/${base.paginasTotales} | Tipo: ${clasif.tipoDocumental}`,
    );

    return {
      texto,
      confianza: Math.round(base.confianza * 10) / 10,
      palabrasClave: this.extraerPalabrasClave(texto),
      metodo: base.metodo,
      paginasTotales: base.paginasTotales,
      paginasProcesadas: base.paginasProcesadas,
      entidades,
      clasificacion: {
        tipoDocumental: clasif.tipoDocumental,
        serieSugerida: serie,
        subserieSugerida: subserie,
        confianza: Math.round(confClasif),
      },
      metadatos: this.extraerMetadatos(texto),
    };
  }

  // ──────────────────────────────────────────────────────────
  // LECTURA DE ARCHIVOS
  // ──────────────────────────────────────────────────────────

  private async leerImagen(buffer: Buffer) {
    const worker = await this.crearWorker();
    try {
      const { data } = await worker.recognize(buffer);
      return {
        texto: data.text || '',
        confianza: data.confidence ?? 0,
        metodo: 'OCR_IMAGEN' as const,
        paginasTotales: 1,
        paginasProcesadas: 1,
      };
    } finally {
      await worker.terminate();
    }
  }

  private async leerPdf(buffer: Buffer) {
    const { createCanvas } = this.cargarCanvas();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');

    const canvasFactory = {
      create: (w: number, h: number) => {
        const canvas = createCanvas(w, h);
        return { canvas, context: canvas.getContext('2d') };
      },
      reset: (cc: any, w: number, h: number) => { cc.canvas.width = w; cc.canvas.height = h; },
      destroy: (cc: any) => { cc.canvas.width = 0; cc.canvas.height = 0; cc.canvas = null; cc.context = null; },
    };

    let doc: any;
    try {
      doc = await pdfjs.getDocument({
        data: new Uint8Array(buffer),
        canvasFactory,
        useSystemFonts: true,
        disableFontFace: true,
        isEvalSupported: false,
        verbosity: 0,
      }).promise;
    } catch (err: any) {
      throw new BadRequestException(`El PDF está dañado o protegido con contraseña: ${err?.message}`);
    }

    const paginasTotales: number = doc.numPages;
    const paginasProcesadas = Math.min(paginasTotales, MAX_PAGINAS);
    if (paginasTotales > MAX_PAGINAS) {
      this.logger.warn(`PDF con ${paginasTotales} páginas: se procesan solo las primeras ${MAX_PAGINAS}`);
    }

    const partes: string[] = [];
    const confianzas: number[] = [];
    let paginasConOcr = 0;
    let worker: Worker | null = null;

    try {
      for (let i = 1; i <= paginasProcesadas; i++) {
        const page = await doc.getPage(i);

        // 1. Capa de texto nativa (PDF digital)
        const tc = await page.getTextContent();
        const textoCapa = tc.items.map((it: any) => it.str).join(' ').trim();
        if (textoCapa.length >= MIN_CHARS_CAPA_TEXTO) {
          partes.push(textoCapa);
          confianzas.push(100);
          continue;
        }

        // 2. Página escaneada: rasterizar + OCR
        const viewport = page.getViewport({ scale: ESCALA_RASTER });
        const cc = canvasFactory.create(Math.ceil(viewport.width), Math.ceil(viewport.height));
        await page.render({ canvasContext: cc.context, viewport, canvasFactory }).promise;
        const png: Buffer = cc.canvas.toBuffer('image/png');
        canvasFactory.destroy(cc);

        worker = worker ?? (await this.crearWorker());
        const { data } = await worker.recognize(png);
        if (data.text?.trim()) partes.push(data.text.trim());
        confianzas.push(data.confidence ?? 0);
        paginasConOcr++;
      }
    } finally {
      if (worker) await worker.terminate();
      await doc.destroy();
    }

    const metodo =
      paginasConOcr === 0 ? 'CAPA_TEXTO_PDF'
      : paginasConOcr === paginasProcesadas ? 'OCR_PDF_ESCANEADO'
      : 'MIXTO_PDF';

    return {
      texto: partes.join('\n\n'),
      confianza: confianzas.length ? confianzas.reduce((a, b) => a + b, 0) / confianzas.length : 0,
      metodo: metodo as ResultadoOcr['metodo'],
      paginasTotales,
      paginasProcesadas,
    };
  }

  private async crearWorker(): Promise<Worker> {
    const langPath = this.config.get<string>('ocr.langPath');
    try {
      return await createWorker(['spa', 'eng'], 1, {
        // Si OCR_LANG_PATH está definido se usan los idiomas locales (sin internet);
        // si no, Tesseract.js los descarga una vez y los cachea en la carpeta temporal.
        ...(langPath ? { langPath } : {}),
        cachePath: join(tmpdir(), 'sigd-tesseract'),
      });
    } catch (err: any) {
      throw new InternalServerErrorException(
        'No se pudo iniciar el motor OCR (¿sin acceso a internet para descargar los idiomas?). ' +
          'Define OCR_LANG_PATH con los archivos spa/eng .traineddata.gz. Detalle: ' + err?.message,
      );
    }
  }

  /** Carga @napi-rs/canvas y registra los polyfills que pdfjs necesita en Node. */
  private cargarCanvas(): { createCanvas: (w: number, h: number) => any } {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const napi = require('@napi-rs/canvas');
    const g = globalThis as any;
    if (!g.DOMMatrix && napi.DOMMatrix) g.DOMMatrix = napi.DOMMatrix;
    if (!g.Path2D && napi.Path2D) g.Path2D = napi.Path2D;
    if (!g.ImageData && napi.ImageData) g.ImageData = napi.ImageData;
    return { createCanvas: napi.createCanvas };
  }

  // ──────────────────────────────────────────────────────────
  // EXTRACCIÓN DE ENTIDADES (sobre el texto REAL reconocido)
  // ──────────────────────────────────────────────────────────

  extraerEntidades(texto: string): EntidadesDetectadas {
    const e: EntidadesDetectadas = {};

    // NIT: 900.123.456-7 | 900123456-7 | NIT 900123456
    const nit = texto.match(/\bNIT\.?\s*(?:N[º°o.]*)?\s*[:#]?\s*(\d{1,3}(?:[.\s]\d{3}){2}\s?-\s?\d|\d{9,10}\s?-\s?\d)/i)
      || texto.match(/\b(\d{3}\.\d{3}\.\d{3}-\d)\b/);
    if (nit) e.nit = nit[1].replace(/\s+/g, '');

    // Cédula
    const cc = texto.match(/\b(?:C\.?\s?C\.?|c[eé]dula(?:\s+de\s+ciudadan[ií]a)?)\s*(?:N[º°o.]*)?\s*[:#]?\s*(\d{1,3}(?:[.,]\d{3}){1,3}|\d{6,10})\b/i);
    if (cc) e.cedula = cc[1];

    // Razón social (empresa) o, si no hay, persona citada
    const empresa = texto.match(
      /\b([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ0-9&.,\- ]{2,80}?\s(?:S\.?\s?A\.?\s?S\.?|S\.?\s?A\.?|LTDA\.?|E\.?\s?U\.?|S\.?\s?EN\s?C\.?))(?=[\s,;.]|$)/,
    );
    if (empresa) {
      e.nombre = empresa[1].trim().replace(/[,\s]+$/, '');
    } else {
      const persona = texto.match(
        /(?:[Rr]epresentad[oa]\s+(?:legalmente\s+)?por|[Ss]e[ñn]or(?:a)?|[Aa]\s+nombre\s+de|[Tt]itular)\s+:?\s*([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚáéíóúñÑ]+(?:\s+[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚáéíóúñÑ]+){1,3})/,
      );
      if (persona) e.nombre = persona[1].trim();
    }

    // Monto: prioriza el que está junto a "valor / total / monto"; si no, el mayor
    const montos = [...texto.matchAll(/\$\s*\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?(?:\s*(?:COP|M\/?\s?CTE|pesos))?/gi)];
    if (montos.length) {
      const num = (s: string) => Number(s.replace(/[^\d]/g, ''));
      const clave = montos.find((m) => {
        const antes = texto.slice(Math.max(0, (m.index ?? 0) - 25), m.index).toLowerCase();
        return /valor|total|monto|cuant[ií]a/.test(antes);
      });
      const elegido = clave ?? montos.reduce((a, b) => (num(b[0]) > num(a[0]) ? b : a));
      e.monto = elegido[0].replace(/\s+/g, ' ').trim();
    }

    // Fecha
    const fecha = this.extraerFecha(texto);
    if (fecha) e.fecha = fecha;

    // Número de contrato / documento
    // Exige que "N°/No./Nro./N.º/#" sea una palabra aparte y que el número empiece por dígito
    // (o por un prefijo corto como CTO-123), para no confundir la "N" de "PRESTACION".
    const num = texto.match(/(?:contrato|convenio|resoluci[oó]n|factura|radicado)[^\n]{0,60}?(?:\bN(?:[º°o*]|ro|úm)?\.?|#)\s*((?:[A-Z]{1,5}[-\s]?)?\d[\w\-./]{0,24})/i);
    if (num) e.numeroDocumento = num[1].replace(/[.,;]$/, '');

    return e;
  }

  private extraerFecha(texto: string): string | null {
    const meses: Record<string, string> = {
      enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
      julio: '07', agosto: '08', septiembre: '09', setiembre: '09', octubre: '10',
      noviembre: '11', diciembre: '12',
    };
    const candidatos: { iso: string; pos: number }[] = [];

    for (const m of texto.matchAll(/\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+(?:de(?:l)?\s+)?(\d{4})\b/gi)) {
      candidatos.push({ iso: `${m[3]}-${meses[m[2].toLowerCase()]}-${m[1].padStart(2, '0')}`, pos: m.index ?? 0 });
    }
    for (const m of texto.matchAll(/\b(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/g)) {
      candidatos.push({ iso: `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`, pos: m.index ?? 0 });
    }
    for (const m of texto.matchAll(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})\b/g)) {
      candidatos.push({ iso: `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`, pos: m.index ?? 0 });
    }

    const validos = candidatos.filter((c) => !Number.isNaN(Date.parse(c.iso)));
    if (!validos.length) return null;

    const conClave = validos.find((c) =>
      /fecha|suscrip|expedi|firma/.test(texto.slice(Math.max(0, c.pos - 40), c.pos).toLowerCase()),
    );
    return (conClave ?? validos.sort((a, b) => a.pos - b.pos)[0]).iso;
  }

  /** Metadatos genéricos adicionales (posibles identificaciones, correos, etc.). */
  private extraerMetadatos(texto: string): Record<string, any> {
    const metadatos: Record<string, any> = {};

    const ids = texto.match(/\b\d{6,12}\b/g);
    if (ids?.length) metadatos.posiblesIdentificaciones = [...new Set(ids)];

    const contratos = texto.match(/(?:contrato|ctr|contract)\s*[#Nº°]?\s*[\w\-.]+/gi);
    if (contratos?.length) metadatos.posiblesContratos = [...new Set(contratos)];

    const emails = texto.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g);
    if (emails?.length) metadatos.emailsDetectados = [...new Set(emails)];

    return metadatos;
  }

  /** Mapea el tipo documental detectado a una serie/subserie TRD sugerida. */
  private mapearTrd(tipo: string, texto: string): { serie: string; subserie: string } {
    switch (tipo) {
      case 'Contrato':
        return {
          serie: 'Contratos y Convenios',
          subserie: /prestaci[oó]n\s+de\s+servicios/i.test(texto)
            ? 'Contratos de Prestación de Servicios'
            : 'Contratos',
        };
      case 'Factura':
        return { serie: 'Gestión Financiera', subserie: 'Facturas' };
      case 'Cédula de Ciudadanía':
        return { serie: 'Identificación', subserie: 'Documentos de Identidad' };
      case 'Acto Administrativo':
        return { serie: 'Actos Administrativos', subserie: 'Resoluciones' };
      case 'Documento Notarial':
        return { serie: 'Documentos Notariales', subserie: 'Escrituras y Poderes' };
      case 'Solicitud':
        return { serie: 'Peticiones', subserie: 'Solicitudes' };
      case 'Certificado':
        return { serie: 'Certificaciones', subserie: 'Certificados y Constancias' };
      case 'Informe':
        return { serie: 'Informes', subserie: 'Informes Técnicos' };
      default:
        return { serie: 'Gestión Documental', subserie: 'Expedientes de Clientes' };
    }
  }

  private extraerPalabrasClave(texto: string): string[] {
    const STOPWORDS = new Set([
      'de', 'la', 'el', 'en', 'y', 'a', 'los', 'las', 'un', 'una',
      'es', 'por', 'con', 'para', 'que', 'del', 'al', 'se', 'su',
      'le', 'lo', 'como', 'más', 'pero', 'sus', 'no', 'fue',
    ]);

    return texto
      .toLowerCase()
      .replace(/[^a-záéíóúüñ\s]/gi, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 4 && !STOPWORDS.has(w))
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 30);
  }

  private esCompatible(mimeType: string): boolean {
    return mimeType === MIME_PDF || MIME_IMAGEN.includes(mimeType);
  }
}
