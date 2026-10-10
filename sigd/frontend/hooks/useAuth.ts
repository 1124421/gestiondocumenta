'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * Hook de autenticación — interfaz simplificada para los componentes.
 */
export function useAuth() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    requiresMfa,
    login: storeLogin,
    verificarMfa: storeVerificarMfa,
    logout: storeLogout,
    clearError,
  } = useAuthStore();

  const login = useCallback(
    async (email: string, password: string, mfaCode?: string) => {
      const res = await storeLogin(email, password, mfaCode);
      if (res.success) {
        router.push('/dashboard');
      }
      return res;
    },
    [storeLogin, router],
  );

  const verificarMfa = useCallback(
    async (code: string) => {
      const success = await storeVerificarMfa(code);
      if (success) {
        router.push('/dashboard');
      }
      return success;
    },
    [storeVerificarMfa, router],
  );

  const logout = useCallback(async () => {
    await storeLogout();
    router.push('/login');
  }, [storeLogout, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    isMfaRequired: requiresMfa,
    login,
    verificarMfa,
    logout,
    clearError,
  };
}
