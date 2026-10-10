'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  FolderArchive,
  BookOpenCheck,
  History as HistoryIcon,
  ScanLine,
  Search,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  FileText,
  ShieldCheck,
  Boxes
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Clientes & Sedes', href: '/clientes', icon: Building2 },
  { label: 'Expedientes & Docs', href: '/expedientes', icon: FolderArchive },
  { label: 'Préstamos', href: '/prestamos', icon: BookOpenCheck, badge: '3' },
  { label: 'Trazabilidad & Audit', href: '/trazabilidad', icon: HistoryIcon },
  { label: 'Digitalización & OCR', href: '/digitalizacion', icon: ScanLine, badge: 'IA' },
  { label: 'Búsqueda Global', href: '/busqueda', icon: Search },
  { label: 'Archivo Físico', href: '/archivo-fisico', icon: Boxes },
  { label: 'Usuarios & Roles', href: '/usuarios', icon: Users },
  { label: 'Configuración', href: '/configuracion', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-30 shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
        <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-500/20">
          <FileText className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <span className="font-display font-bold text-slate-900 text-lg leading-none block">
            SIGD
          </span>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-indigo-600 leading-tight">
            Gestión Documental
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Menú Principal
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    item.badge === 'IA'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* User Profile Card & Logout */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70">
        <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-soft-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
              {user?.nombre?.[0] || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {user ? `${user.nombre} ${user.apellido}` : 'Admin Principal'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600 inline shrink-0" />
                <span>{user?.rol || 'ADMINISTRADOR'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            title="Cerrar sesión"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
