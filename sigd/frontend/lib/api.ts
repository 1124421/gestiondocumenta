/**
 * API Client centralizado para el SIGD.
 *
 * Wrapper sobre fetch nativo con:
 *  - Base URL configurable
 *  - Auto-inyección de JWT en headers
 *  - Auto-refresh de token cuando expira (401)
 *  - Manejo de errores tipado
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshTokenValue: string | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshTokenValue = refreshToken;

    // Persist in localStorage for session recovery
    if (typeof window !== 'undefined') {
      localStorage.setItem('sigd_access_token', accessToken);
      localStorage.setItem('sigd_refresh_token', refreshToken);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshTokenValue = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sigd_access_token');
      localStorage.removeItem('sigd_refresh_token');
    }
  }

  getAccessToken(): string | null {
    if (this.accessToken) return this.accessToken;
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('sigd_access_token');
    }
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    if (this.refreshTokenValue) return this.refreshTokenValue;
    if (typeof window !== 'undefined') {
      this.refreshTokenValue = localStorage.getItem('sigd_refresh_token');
    }
    return this.refreshTokenValue;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers as Record<string, string>),
    };

    const token = this.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    // Si es 401, intentar refresh
    if (response.status === 401 && this.getRefreshToken()) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        // Reintentar con nuevo token
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        const retryResponse = await fetch(url, { ...options, headers });
        if (!retryResponse.ok) {
          const error = await retryResponse.json().catch(() => ({}));
          throw { statusCode: retryResponse.status, message: error.message || 'Error del servidor', ...error };
        }
        return retryResponse.json();
      } else {
        // Refresh falló → limpiar y redirigir al login
        this.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw { statusCode: 401, message: 'Sesión expirada' };
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw {
        statusCode: response.status,
        message: error.message || `Error ${response.status}`,
        ...error,
      } as ApiError;
    }

    // Respuestas 204 No Content
    if (response.status === 204) return {} as T;

    return response.json();
  }

  private async tryRefresh(): Promise<boolean> {
    // Evitar múltiples refreshes simultáneos
    if (this.isRefreshing) {
      return this.refreshPromise!;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.getRefreshToken() }),
        });

        if (!response.ok) return false;

        const data = await response.json();
        this.setTokens(data.accessToken, data.refreshToken || this.refreshTokenValue!);
        return true;
      } catch {
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // ── Métodos HTTP ──────────────────────────────────
  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /** POST multipart/form-data (subida de archivos). No fija Content-Type: lo hace el navegador. */
  postForm<T>(endpoint: string, formData: FormData) {
    return this.request<T>(endpoint, { method: 'POST', body: formData });
  }

  patch<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ── AUTH API ──────────────────────────────────────
  auth = {
    login: (email: string, password: string, mfaCode?: string) =>
      this.post<{
        accessToken?: string;
        refreshToken?: string;
        user?: any;
        requiresMfa?: boolean;
        message?: string;
      }>('/auth/login', { email, password, mfaCode }),

    refresh: () =>
      this.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
        refreshToken: this.getRefreshToken(),
      }),

    logout: () => this.post('/auth/logout'),

    me: () => this.get<any>('/auth/me'),

    forgotPassword: (email: string) =>
      this.post('/auth/forgot-password', { email }),

    resetPassword: (token: string, newPassword: string) =>
      this.post('/auth/reset-password', { token, newPassword }),

    changePassword: (currentPassword: string, newPassword: string) =>
      this.patch('/auth/change-password', { currentPassword, newPassword }),

    setupMfa: () => this.post<{ qrCode: string; secret: string }>('/auth/mfa/setup'),

    verifyMfa: (codigo: string) =>
      this.post<{ valido: boolean }>('/auth/mfa/verify', { codigo }),
  };

  // ── OCR API ───────────────────────────────────────
  ocr = {
    /** Envía el archivo REAL al backend y devuelve el texto/entidades reconocidos. */
    procesar: (archivo: File) => {
      const fd = new FormData();
      fd.append('archivo', archivo);
      return this.postForm<OcrResultado>('/ocr/procesar', fd);
    },
  };

  // ── DOCUMENTOS API ────────────────────────────────
  documentos = {
    /** Sube el archivo a MinIO y guarda sus metadatos + texto OCR en la base de datos. */
    subir: (params: {
      archivo: File;
      expedienteId: string;
      nombre?: string;
      ocr?: OcrResultado | null;
    }) => {
      const fd = new FormData();
      fd.append('archivo', params.archivo);
      fd.append('expedienteId', params.expedienteId);
      if (params.nombre) fd.append('nombre', params.nombre);
      const o = params.ocr;
      if (o) {
        fd.append('textoOcr', o.texto);
        fd.append('tipoDocumental', o.clasificacion.tipoDocumental);
        fd.append('palabrasClave', JSON.stringify(o.palabrasClave));
        fd.append(
          'metadatosIA',
          JSON.stringify({
            entidades: o.entidades,
            clasificacion: o.clasificacion,
            confianzaOcr: o.confianza,
            metodoOcr: o.metodo,
            paginasProcesadas: o.paginasProcesadas,
            paginasTotales: o.paginasTotales,
            ...o.metadatos,
          }),
        );
        if (o.entidades.fecha) fd.append('fechaDocumento', o.entidades.fecha);
      }
      return this.postForm<DocumentoGuardado>('/documentos/subir', fd);
    },
  };

  // ── CLIENTES API (para elegir el expediente destino) ──
  clientes = {
    listar: (search?: string) =>
      this.get<{ data: ClienteConExpediente[] }>(
        `/clientes?limit=20${search ? `&search=${encodeURIComponent(search)}` : ''}`,
      ),
  };
}

// ── Tipos de las respuestas ─────────────────────────
export interface OcrResultado {
  texto: string;
  confianza: number;
  palabrasClave: string[];
  metodo: 'OCR_IMAGEN' | 'CAPA_TEXTO_PDF' | 'OCR_PDF_ESCANEADO' | 'MIXTO_PDF';
  paginasTotales: number;
  paginasProcesadas: number;
  entidades: {
    nit?: string;
    cedula?: string;
    nombre?: string;
    monto?: string;
    fecha?: string;
    numeroDocumento?: string;
  };
  clasificacion: {
    tipoDocumental: string;
    serieSugerida: string;
    subserieSugerida: string;
    confianza: number;
  };
  metadatos: Record<string, unknown>;
}

export interface DocumentoGuardado {
  id: string;
  nombre: string;
  rutaMinio: string;
  tamanioBytes: number;
  expedienteId: string;
}

export interface ClienteConExpediente {
  id: string;
  nombre: string;
  apellido?: string | null;
  razonSocial?: string | null;
  numeroIdentificacion: string;
  expediente?: { id: string; numero: string; estado: string } | null;
}

export const apiClient = new ApiClient();
