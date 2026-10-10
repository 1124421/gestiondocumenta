/**
 * Utilidades de autenticación — lectura y decodificación de JWT del lado cliente.
 */

interface JwtPayload {
  sub: string;        // userId
  email: string;
  rol: string;
  nombre: string;
  apellido: string;
  iat: number;        // issued at
  exp: number;        // expires at
}

/**
 * Decodifica un JWT (solo la parte del payload, sin verificar firma).
 * Esto es seguro porque la verificación real la hace el backend.
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    const base64Payload = token.split('.')[1];
    const payload = JSON.parse(
      typeof window !== 'undefined'
        ? atob(base64Payload)
        : Buffer.from(base64Payload, 'base64').toString()
    );
    return payload;
  } catch {
    return null;
  }
}

/**
 * Verifica si un token JWT ha expirado.
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload?.exp) return true;
  // Considerar expirado 60 segundos antes para evitar race conditions
  return Date.now() >= (payload.exp * 1000) - 60000;
}

/**
 * Verifica si el usuario actual tiene un rol específico.
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('sigd_access_token');
  if (!token) return false;
  return !isTokenExpired(token);
}

/**
 * Obtiene los datos del usuario del token JWT actual.
 */
export function getCurrentUser(): JwtPayload | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('sigd_access_token');
  if (!token) return null;
  return decodeToken(token);
}

/**
 * Verifica si el usuario actual tiene el rol requerido.
 */
export function hasRole(rol: string): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return user.rol === rol || user.rol === 'ADMINISTRADOR';
}
