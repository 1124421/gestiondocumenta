'use client';

import React from 'react';
import { ShieldCheck, FileText, Sparkles } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Background Decorative Ambient Gradients (Light mode) */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-200/40 blur-[100px]" />
        <div className="absolute top-1/2 -right-40 h-[450px] w-[450px] rounded-full bg-blue-200/40 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-purple-200/30 blur-[100px]" />
        
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-70" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 mb-3.5 transition-transform hover:scale-105 duration-200">
            <FileText className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight font-display text-slate-900">
            SIGD Enterprise
          </h1>
          <p className="mt-1 text-sm text-slate-600 font-medium flex items-center gap-1.5">
            <span>Sistema Inteligente de Gestión Documental</span>
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 inline" />
          </p>
        </div>

        {/* Content Box (Login Card) */}
        {children}

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Acceso seguro con cifrado AES-256 & MFA TOTP</span>
        </div>
      </div>
    </div>
  );
}
