import React, { useState } from 'react';
import { Usuario } from '../types';
import { loginUsuario } from '../lib/supabase';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  Sun,
  Moon,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

interface Props {
  onLoginSuccess: (u: Usuario) => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

export const LoginScreen: React.FC<Props> = ({
  onLoginSuccess,
  darkMode,
  onToggleTheme,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await loginUsuario(username, password);
      if (res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Credenciales inválidas.');
      }
    } catch {
      setError('No se pudo validar el acceso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Barra superior con selector de tema Dark / Light */}
      <header className="w-full px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1B365D] text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
            SMT
          </div>
          <div>
            <span className="block text-xs font-extrabold uppercase tracking-wider text-[#1B365D] dark:text-blue-400">
              Municipalidad de San Miguel de Tucumán
            </span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400">
              Secretaría de Movilidad Urbana — Dirección de Tránsito
            </span>
          </div>
        </div>

        <button
          onClick={onToggleTheme}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold shadow-sm hover:border-blue-400 transition cursor-pointer"
        >
          {darkMode ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              Modo Claro
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-700" />
              Modo Oscuro
            </>
          )}
        </button>
      </header>

      {/* Contenedor central de autenticación */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          {/* Cabecera Institucional */}
          <div className="bg-gradient-to-br from-[#1B365D] via-[#20406E] to-[#132847] text-white p-7 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 mx-auto flex items-center justify-center mb-3 shadow-inner">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-lg font-extrabold tracking-tight uppercase">
              Sistema de Relevamiento Vehicular
            </h1>
            <p className="text-xs text-blue-100 mt-1">
              Corralón Municipal — Acceso para Administradores y Agentes Relevadores
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-7 space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Usuario
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="Ingrese su usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-5 rounded-xl bg-[#1B365D] hover:bg-[#14294a] text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Verificando acceso...' : 'Ingresar a la Plataforma'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Acceso exclusivo para personal autorizado. Para solicitar alta de usuario o restablecimiento de clave, contacte al Administrador del Sistema.
              </p>
            </div>
          </form>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        Municipalidad de San Miguel de Tucumán • Plataforma Digital de Relevamiento de Vehículos Secuestrados
      </footer>
    </div>
  );
};
