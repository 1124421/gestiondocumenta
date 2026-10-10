// ============================================================
// ARCHIVO: frontend/store/uiStore.ts
// PROPÓSITO: Estado global de la interfaz de usuario (Zustand).
//
// QUÉ VA AQUÍ:
//  - sidebarOpen: boolean → sidebar expandido o colapsado
//  - sidebarMini: boolean → modo mini (solo íconos)
//  - theme: 'dark' | 'light' → tema actual de la interfaz
//  - activeModal: string | null → modal actualmente abierto
//  - notifications: Notification[] → lista de notificaciones
//  - unreadCount: number → notificaciones sin leer
//
//  Acciones:
//    toggleSidebar() → abrir/cerrar sidebar
//    setTheme(theme) → cambiar tema
//    openModal(id) → abrir un modal específico
//    closeModal() → cerrar modal
//    addNotification(n) → agregar notificación
//    markAllRead() → marcar todas como leídas
//
// SE CONECTA CON:
//  - components/layout/Sidebar.tsx
//  - components/layout/Header.tsx
// ============================================================

// TODO: Implementar con zustand
interface UiState {
  sidebarOpen: boolean
  theme: 'dark' | 'light'
  activeModal: string | null
  // TODO: Agregar más estados y acciones
}
