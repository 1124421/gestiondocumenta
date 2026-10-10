// ============================================================
// ARCHIVO: frontend/app/page.tsx
// PROPÓSITO: Página raíz "/" de la aplicación.
//
// QUÉ VA AQUÍ:
//  - Redirección automática al dashboard si el usuario está
//    autenticado, o a /login si no tiene sesión activa.
//
// LÓGICA:
//  1. Verificar si existe token JWT válido en cookies/localStorage
//  2. Si está autenticado → redirect("/dashboard")
//  3. Si NO está autenticado → redirect("/login")
//
// SE CONECTA CON:
//  - (auth)/login/page.tsx → página de inicio de sesión
//  - (dashboard)/dashboard/page.tsx → dashboard principal
//  - lib/auth.ts → función para verificar sesión
// ============================================================

import { redirect } from 'next/navigation'

export default function HomePage() {
  // TODO: Verificar sesión y redirigir
  redirect('/login')
}
