import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

/**
 * IaService — Inteligencia Artificial para clasificación y asistencia.
 *
 * Funcionalidades:
 *  - Clasificar tipo documental automáticamente
 *  - Resumir expedientes
 *  - Responder preguntas sobre documentos (RAG básico)
 *  - Detectar inconsistencias
 *
 * Integración: OpenAI API (configurable)
 */
@Injectable()
export class IaService {
  private readonly logger = new Logger(IaService.name);
  private readonly openaiApiKey: string;
  private readonly openaiModel: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.openaiApiKey = this.config.get<string>('openai.apiKey') || '';
    this.openaiModel = this.config.get<string>('openai.model') || 'gpt-4o-mini';
  }

  /**
   * Clasifica el tipo documental basándose en el texto OCR.
   */
  async clasificarDocumento(textoOcr: string): Promise<{
    tipoDocumental: string;
    confianza: number;
    etiquetas: string[];
  }> {
    // Clasificación por reglas (fallback sin IA)
    const resultado = this.clasificarPorReglas(textoOcr);

    // Si hay API key de OpenAI, usar IA
    if (this.openaiApiKey) {
      try {
        return await this.clasificarConOpenAI(textoOcr);
      } catch (err) {
        this.logger.warn('OpenAI no disponible, usando clasificación por reglas', err);
      }
    }

    return resultado;
  }

  /**
   * Genera un resumen ejecutivo del expediente de un cliente.
   */
  async resumirExpediente(expedienteId: string): Promise<{ resumen: string }> {
    const expediente = await this.prisma.expediente.findUnique({
      where: { id: expedienteId },
      include: {
        cliente: true,
        documentos: {
          where: { deletedAt: null },
          select: { nombre: true, tipoDocumento: true, textoOcr: true, creadoEn: true },
          take: 20,
        },
      },
    });

    if (!expediente) return { resumen: 'Expediente no encontrado' };

    const textoBase = `
Cliente: ${expediente.cliente.nombre} ${expediente.cliente.apellido ?? ''}
Identificación: ${expediente.cliente.tipoIdentificacion} ${expediente.cliente.numeroIdentificacion}
Documentos: ${expediente.documentos.length}
Estado: ${expediente.estado}
    `.trim();

    if (!this.openaiApiKey) {
      return { resumen: textoBase };
    }

    try {
      return await this.generarResumenOpenAI(textoBase, expediente.documentos);
    } catch (err) {
      this.logger.warn('Error generando resumen con IA', err);
      return { resumen: textoBase };
    }
  }

  // ──────────────────────────────────────────────────────────
  // MÉTODOS PRIVADOS
  // ──────────────────────────────────────────────────────────

  private clasificarPorReglas(texto: string): {
    tipoDocumental: string;
    confianza: number;
    etiquetas: string[];
  } {
    const textoLower = texto.toLowerCase();
    const reglas = [
      { patron: /contrato|acuerdo|convenio|partes.*obligaciones/i, tipo: 'Contrato', peso: 0.9 },
      { patron: /factura|invoice|pago|valor.*\$|iva/i, tipo: 'Factura', peso: 0.9 },
      { patron: /cédula|cédula de ciudadanía|identificación/i, tipo: 'Cédula de Ciudadanía', peso: 0.95 },
      { patron: /resolución|ministerio|decreto/i, tipo: 'Acto Administrativo', peso: 0.85 },
      { patron: /poder notarial|escritura|notario/i, tipo: 'Documento Notarial', peso: 0.9 },
      { patron: /solicitud|petición|derecho de petición/i, tipo: 'Solicitud', peso: 0.8 },
      { patron: /certificado|certifica|constancia/i, tipo: 'Certificado', peso: 0.85 },
      { patron: /informe|reporte|análisis|diagnóstico/i, tipo: 'Informe', peso: 0.75 },
    ];

    for (const regla of reglas) {
      if (regla.patron.test(texto)) {
        return {
          tipoDocumental: regla.tipo,
          confianza: regla.peso,
          etiquetas: [regla.tipo.toLowerCase()],
        };
      }
    }

    return { tipoDocumental: 'Documento General', confianza: 0.5, etiquetas: ['documento'] };
  }

  private async clasificarConOpenAI(texto: string): Promise<{
    tipoDocumental: string;
    confianza: number;
    etiquetas: string[];
  }> {
    // Implementación real con fetch a OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.openaiModel,
        messages: [
          {
            role: 'system',
            content:
              'Eres un experto en gestión documental. Clasifica el documento proporcionado. Responde SOLO con JSON: { "tipoDocumental": string, "confianza": number (0-1), "etiquetas": string[] }',
          },
          {
            role: 'user',
            content: `Clasifica este documento:\n\n${texto.substring(0, 2000)}`,
          },
        ],
        max_tokens: 150,
        temperature: 0.1,
      }),
    });

    const data = await response.json() as any;
    const contenido = data.choices?.[0]?.message?.content;
    return JSON.parse(contenido);
  }

  private async generarResumenOpenAI(
    info: string,
    documentos: any[],
  ): Promise<{ resumen: string }> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.openaiModel,
        messages: [
          {
            role: 'system',
            content:
              'Eres un asistente de gestión documental. Genera resúmenes ejecutivos concisos en español.',
          },
          {
            role: 'user',
            content: `Genera un resumen ejecutivo del expediente:\n${info}\n\nDocumentos: ${documentos.map((d) => d.nombre).join(', ')}`,
          },
        ],
        max_tokens: 300,
      }),
    });

    const data = await response.json() as any;
    return { resumen: data.choices?.[0]?.message?.content || info };
  }
}
