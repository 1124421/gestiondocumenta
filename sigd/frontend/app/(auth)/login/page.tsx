'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  KeyRound, 
  AlertCircle,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, verificarMfa, isLoading, error, clearError, isMfaRequired } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (isMfaRequired) {
      if (!mfaCode || mfaCode.length < 6) {
        toast.error('Ingresa el código de 6 dígitos de tu aplicación autenticadora.');
        return;
      }
      const success = await verificarMfa(mfaCode);
      if (success) {
        toast.success('¡Autenticación completada con éxito!');
      }
      return;
    }

    if (!email || !password) {
      toast.error('Por favor completa todos los campos.');
      return;
    }

    const res = await login(email, password);
    if (res?.requiereMfa) {
      toast('Se requiere autenticación de dos factores (MFA).', {
        icon: '🔐',
      });
    } else if (res?.success) {
      toast.success('¡Bienvenido al sistema SIGD!');
    }
  };

  // Demo accounts helper
  const handleSelectDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    clearError();
    toast.success(`Credenciales de prueba cargadas`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xl shadow-slate-200/60"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          {isMfaRequired ? (
            <>
              <KeyRound className="w-5 h-5 text-indigo-600" />
              <span>Verificación en Dos Pasos</span>
            </>
          ) : (
            <>
              <span>Iniciar Sesión</span>
            </>
          )}
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          {isMfaRequired
            ? 'Ingresa el código de 6 dígitos generado por tu aplicación Authenticator.'
            : 'Ingresa tus credenciales corporativas para acceder al sistema.'}
        </p>
      </div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 overflow-hidden"
          >
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Error de autenticación</p>
                <p className="mt-0.5 text-red-700">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isMfaRequired ? (
          <>
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@sigd.com"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Contraseña
                </label>
                <a
                  href="#forgot-password"
                  onClick={(e) => {
                    e.preventDefault();
                    toast('Contacta al administrador para restablecer tu contraseña.', {
                      icon: 'ℹ️',
                    });
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 transition-colors font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50/70 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Recordar sesión en este equipo</span>
              </label>
            </div>
          </>
        ) : (
          /* MFA OTP Input */
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Código de 6 dígitos
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-center text-lg font-mono tracking-widest text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-indigo-500/20 transition-all duration-150"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verificando...</span>
            </>
          ) : isMfaRequired ? (
            <>
              <span>Confirmar Código</span>
              <CheckCircle2 className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Ingresar al Sistema</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Quick Demo Acccess Area */}
      <div className="mt-6 pt-5 border-t border-slate-100">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span>Accesos Rápidos (Semilla Demo):</span>
        </p>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => handleSelectDemo('admin@sigd.com', 'Admin123*')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 text-left transition-all group"
          >
            <div className="font-semibold text-indigo-900 group-hover:text-indigo-700">Administrador</div>
            <div className="text-slate-500 text-[10px] truncate">admin@sigd.com</div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectDemo('auxiliar@sigd.com', 'Auxiliar123*')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 text-left transition-all group"
          >
            <div className="font-semibold text-emerald-900 group-hover:text-emerald-700">Auxiliar Archivo</div>
            <div className="text-slate-500 text-[10px] truncate">auxiliar@sigd.com</div>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
