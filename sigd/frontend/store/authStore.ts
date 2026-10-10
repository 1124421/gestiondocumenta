'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiClient } from '@/lib/api';
import { decodeToken } from '@/lib/auth';

export type Rol = 'ADMINISTRADOR' | 'AUXILIAR_ARCHIVO' | 'GERENCIA' | 'AUDITOR' | 'CONSULTA' | 'INVITADO';

export interface User {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  requiresMfa: boolean;
  pendingEmail?: string;
  pendingPassword?: string;

  // Acciones
  login: (email: string, password: string, mfaCode?: string) => Promise<{ success: boolean; requiereMfa?: boolean }>;
  verificarMfa: (code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
  restoreSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      requiresMfa: false,

      login: async (email: string, password: string, mfaCode?: string) => {
        set({ isLoading: true, error: null, requiresMfa: false, pendingEmail: email, pendingPassword: password });

        try {
          const response = await apiClient.auth.login(email, password, mfaCode);

          // Si requiere MFA
          if (response.requiresMfa) {
            set({ isLoading: false, requiresMfa: true });
            return { success: false, requiereMfa: true };
          }

          // Login exitoso con Backend
          if (response.accessToken && response.refreshToken) {
            apiClient.setTokens(response.accessToken, response.refreshToken);
            const payload = decodeToken(response.accessToken);
            const user: User = response.user || {
              id: payload?.sub || 'usr-1',
              nombre: payload?.nombre || 'Administrador',
              apellido: payload?.apellido || 'Principal',
              email: payload?.email || email,
              rol: (payload?.rol as Rol) || 'ADMINISTRADOR',
            };

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              requiresMfa: false,
            });

            return { success: true };
          }

          set({ isLoading: false, error: 'Respuesta inesperada del servidor' });
          return { success: false };
        } catch (err: any) {
          // Demo fallback: Si el backend aún no está encendido con Docker, permite ingresar en modo Demo
          if (email === 'admin@sigd.com' || email === 'auxiliar@sigd.com') {
            const isAux = email.includes('auxiliar');
            const demoUser: User = {
              id: isAux ? 'usr-aux' : 'usr-admin',
              nombre: isAux ? 'Auxiliar' : 'Administrador',
              apellido: isAux ? 'Archivo' : 'Principal',
              email: email,
              rol: isAux ? 'AUXILIAR_ARCHIVO' : 'ADMINISTRADOR',
            };

            set({
              user: demoUser,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              requiresMfa: false,
            });

            return { success: true };
          }

          const message =
            err?.message === 'Failed to fetch'
              ? 'No se pudo conectar con el backend. Puedes usar los accesos rápidos de prueba de abajo.'
              : err?.message || 'Credenciales incorrectas';

          set({ isLoading: false, error: message, requiresMfa: false });
          return { success: false };
        }
      },

      verificarMfa: async (code: string) => {
        const { pendingEmail, pendingPassword, login } = get();
        if (pendingEmail && pendingPassword) {
          const res = await login(pendingEmail, pendingPassword, code);
          return res.success;
        }
        return false;
      },

      logout: async () => {
        try {
          await apiClient.auth.logout();
        } catch {
          // Ignorar errores de logout
        }
        apiClient.clearTokens();
        set({
          user: null,
          isAuthenticated: false,
          error: null,
          requiresMfa: false,
        });
      },

      setUser: (user: User) => set({ user, isAuthenticated: true }),

      clearError: () => set({ error: null }),

      restoreSession: () => {
        const token = typeof window !== 'undefined'
          ? localStorage.getItem('sigd_access_token')
          : null;

        if (token) {
          const payload = decodeToken(token);
          if (payload && payload.exp * 1000 > Date.now()) {
            set({
              user: {
                id: payload.sub,
                nombre: payload.nombre,
                apellido: payload.apellido,
                email: payload.email,
                rol: payload.rol as Rol,
              },
              isAuthenticated: true,
            });
          } else {
            apiClient.clearTokens();
            set({ user: null, isAuthenticated: false });
          }
        }
      },
    }),
    {
      name: 'sigd-auth',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
