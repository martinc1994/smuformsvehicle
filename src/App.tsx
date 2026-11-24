import React, { useState, useEffect, useCallback } from 'react';
import { Parametro, RelevamientoVehiculo, Usuario } from './types';
import {
  fetchParametros,
  fetchRelevamientos,
  fetchUsuarios,
  getSupabaseConfig,
  tieneLas3Fotos,
} from './lib/supabase';
import { LoginScreen } from './components/LoginScreen';
import { RelevamientoForm } from './components/RelevamientoForm';
import { RelevamientosList } from './components/RelevamientosList';
import { PrintableFicha } from './components/PrintableFicha';
import { AdminPanel } from './components/AdminPanel';
import { RelevadorFotoQuickFlow } from './components/RelevadorFotoQuickFlow';
import {
  FilePlus2,
  FolderKanban,
  Settings,
  LogOut,
  Sun,
  Moon,
  Shield,
  Printer,
  Database,
  Camera,
} from 'lucide-react';

const SESSION_KEY = 'smt_current_user_session';
const THEME_KEY = 'smt_theme_dark';

export function App() {
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved ? saved === 'true' : false;
  });

  const [activeTab, setActiveTab] = useState<
    'nuevo' | 'fotos_predio' | 'listado' | 'ficha' | 'admin'
  >('nuevo');

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [relevamientos, setRelevamientos] = useState<RelevamientoVehiculo[]>(
    []
  );
  const [registroSeleccionado, setRegistroSeleccionado] =
    useState<RelevamientoVehiculo | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, String(darkMode));
  }, [darkMode]);

  const cargarTodo = useCallback(async () => {
    const [uList, pList, rList] = await Promise.all([
      fetchUsuarios(),
      fetchParametros(),
      fetchRelevamientos(),
    ]);
    setUsuarios(uList);
    setParametros(pList);
    setRelevamientos(rList);
    if (rList.length > 0 && !registroSeleccionado) {
      setRegistroSeleccionado(rList[0]);
    }
  }, [registroSeleccionado]);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  const handleLogin = (u: Usuario) => {
    setUsuarioActual(u);
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    // Si ingresa un relevador del corralón, abrir directamente la búsqueda rápida por patente para tomar fotos
    setActiveTab(u.rol === 'relevador' ? 'fotos_predio' : 'nuevo');
    cargarTodo();
  };

  const handleLogout = () => {
    setUsuarioActual(null);
    localStorage.removeItem(SESSION_KEY);
    setActiveTab('nuevo');
  };

  const handleRelevamientoGuardado = async (nuevo: RelevamientoVehiculo) => {
    await cargarTodo();
    setRegistroSeleccionado(nuevo);
    setActiveTab('ficha');
  };

  const handleOpenFicha = (reg: RelevamientoVehiculo) => {
    setRegistroSeleccionado(reg);
    setActiveTab('ficha');
  };

  if (!usuarioActual) {
    return (
      <LoginScreen
        onLoginSuccess={handleLogin}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(!darkMode)}
      />
    );
  }

  const supaConf = getSupabaseConfig();

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* BARRA DE NAVEGACIÓN PRINCIPAL (Oculta al imprimir en A4) */}
      <header className="no-print sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Identidad Institucional */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1B365D] text-white flex items-center justify-center font-extrabold text-sm shadow">
              SMT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold uppercase tracking-tight text-[#1B365D] dark:text-blue-400">
                  Municipalidad de San Miguel de Tucumán
                </span>
                <span
                  className={`hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    supaConf.isConfigured
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  <Database className="w-3 h-3" />
                  {supaConf.isConfigured ? 'Supabase Cloud' : 'Supabase Ready'}
                </span>
              </div>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                Secretaría de Movilidad Urbana — Corralón Municipal
              </span>
            </div>
          </div>

          {/* Info de Usuario, Tema Dark/Light y Salir */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Shield
                className={`w-4 h-4 ${
                  usuarioActual.rol === 'admin'
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-blue-600 dark:text-blue-400'
                }`}
              />
              <div className="text-left">
                <div className="text-xs font-bold leading-none">
                  {usuarioActual.nombre_completo}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  {usuarioActual.rol === 'admin' ? 'ADMINISTRADOR' : 'RELEVADOR'} •{' '}
                  {usuarioActual.legajo}
                </div>
              </div>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1.5 overflow-x-auto pb-2.5">
          <button
            onClick={() => setActiveTab('nuevo')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'nuevo'
                ? 'bg-[#1B365D] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FilePlus2 className="w-4 h-4" />
            1. Carga Ficha (Data Entry)
          </button>

          <button
            onClick={() => setActiveTab('fotos_predio')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'fotos_predio'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20'
            }`}
          >
            <Camera className="w-4 h-4" />
            2. Relevamiento Fotográfico en Predio (
            {relevamientos.filter((r) => !tieneLas3Fotos(r)).length} pendientes)
          </button>

          <button
            onClick={() => setActiveTab('listado')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'listado'
                ? 'bg-[#1B365D] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            Expedientes ({relevamientos.length})
          </button>

          {registroSeleccionado && (
            <button
              onClick={() => setActiveTab('ficha')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'ficha'
                  ? 'bg-[#1B365D] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Printer className="w-4 h-4" />
              Salida Impresa A4 ({registroSeleccionado.numero_correlativo})
            </button>
          )}

          {usuarioActual.rol === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-purple-700 dark:text-purple-300 hover:bg-purple-500/10'
              }`}
            >
              <Settings className="w-4 h-4" />
              Administración y Parámetros
            </button>
          )}
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'nuevo' && (
          <RelevamientoForm
            usuarioActual={usuarioActual}
            parametros={parametros}
            onSaved={handleRelevamientoGuardado}
          />
        )}

        {activeTab === 'fotos_predio' && (
          <RelevadorFotoQuickFlow
            registros={relevamientos}
            usuarioActual={usuarioActual}
            onUpdated={async (actualizado) => {
              await cargarTodo();
              setRegistroSeleccionado(actualizado);
            }}
            onSelectPrint={handleOpenFicha}
          />
        )}

        {activeTab === 'listado' && (
          <RelevamientosList
            registros={relevamientos}
            usuarioActual={usuarioActual}
            onSelectPrint={handleOpenFicha}
            onGoToFotosPredio={() => setActiveTab('fotos_predio')}
            onRefresh={cargarTodo}
          />
        )}

        {activeTab === 'ficha' && registroSeleccionado && (
          <PrintableFicha
            registro={registroSeleccionado}
            onClose={() => setActiveTab('listado')}
          />
        )}

        {activeTab === 'admin' && usuarioActual.rol === 'admin' && (
          <AdminPanel
            usuarios={usuarios}
            parametros={parametros}
            onRefreshData={cargarTodo}
          />
        )}
      </main>
    </div>
  );
}

export default App;
