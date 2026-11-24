import React, { useState } from 'react';
import {
  CategoriaParametro,
  Parametro,
  Usuario,
  UserRole,
} from '../types';
import {
  agregarParametro,
  crearUsuario,
  eliminarParametro,
  eliminarUsuario,
  getSupabaseConfig,
  saveSupabaseConfig,
  toggleEstadoUsuario,
} from '../lib/supabase';
import {
  Users,
  Sliders,
  Database,
  UserPlus,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Shield,
  KeyRound,
  Copy,
  Check,
} from 'lucide-react';

interface Props {
  usuarios: Usuario[];
  parametros: Parametro[];
  onRefreshData: () => void;
}

const CATEGORIAS_LABELS: { key: CategoriaParametro; label: string; desc: string }[] = [
  {
    key: 'dependencia',
    label: 'Dependencias que efectúan secuestros',
    desc: 'Organismos habilitados para labrar actas y remitir vehículos al corralón.',
  },
  {
    key: 'sector_corralon',
    label: 'Sectores y Playas del Corralón Municipal',
    desc: 'Zonas físicas de ubicación e inventario dentro del predio municipal.',
  },
  {
    key: 'marca',
    label: 'Marcas de Vehículos y Motocicletas',
    desc: 'Catálogo desplegable de marcas frecuentes en vía pública.',
  },
  {
    key: 'color',
    label: 'Colores Predominantes',
    desc: 'Opciones estandarizadas de pintura/color para identificación.',
  },
  {
    key: 'lugar_secuestro',
    label: 'Avenidas / Puntos Frecuentes de Control',
    desc: 'Sugerencias rápidas de lugares de secuestro en San Miguel de Tucumán.',
  },
  {
    key: 'faltante_comun',
    label: 'Faltantes Relevantes Frecuentes',
    desc: 'Chips interactivos para completar con un toque el detalle de faltantes.',
  },
];

export const AdminPanel: React.FC<Props> = ({
  usuarios,
  parametros,
  onRefreshData,
}) => {
  const [subTab, setSubTab] = useState<'usuarios' | 'parametros' | 'supabase'>(
    'usuarios'
  );

  // Estado Alta de Usuario
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [legajo, setLegajo] = useState('');
  const [rol, setRol] = useState<UserRole>('relevador');
  const [userFeedback, setUserFeedback] = useState<{
    type: 'ok' | 'err';
    msg: string;
  } | null>(null);

  // Estado Alta de Parámetros
  const [catActiva, setCatActiva] = useState<CategoriaParametro>('dependencia');
  const [nuevoValorParam, setNuevoValorParam] = useState('');

  // Estado Configuración Supabase
  const supaConf = getSupabaseConfig();
  const [supaUrl, setSupaUrl] = useState(supaConf.url);
  const [supaKey, setSupaKey] = useState(supaConf.anonKey);
  const [supaSavedMsg, setSupaSavedMsg] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFeedback(null);

    if (!username.trim() || !password.trim() || !nombreCompleto.trim() || !legajo.trim()) {
      setUserFeedback({
        type: 'err',
        msg: 'Complete todos los campos del usuario.',
      });
      return;
    }

    const res = await crearUsuario({
      username: username.trim(),
      password_hash: password,
      nombre_completo: nombreCompleto.trim(),
      legajo: legajo.trim().toUpperCase(),
      rol,
      activo: true,
    });

    if (res.error) {
      setUserFeedback({ type: 'err', msg: res.error });
    } else {
      setUserFeedback({
        type: 'ok',
        msg: `Usuario "${res.data?.username}" (${res.data?.rol.toUpperCase()}) dado de alta correctamente.`,
      });
      setUsername('');
      setPassword('');
      setNombreCompleto('');
      setLegajo('');
      setRol('relevador');
      onRefreshData();
    }
  };

  const handleToggleUser = async (u: Usuario) => {
    if (u.username.toLowerCase() === 'mcastillo') {
      alert('El usuario administrador principal MCastillo no puede desactivarse.');
      return;
    }
    await toggleEstadoUsuario(u.id, !u.activo);
    onRefreshData();
  };

  const handleDeleteUser = async (u: Usuario) => {
    if (u.username.toLowerCase() === 'mcastillo') {
      alert('El usuario administrador principal MCastillo no puede eliminarse.');
      return;
    }
    if (
      !window.confirm(
        `¿Confirma eliminar definitivamente al usuario "${u.username}" (${u.nombre_completo})?`
      )
    ) {
      return;
    }
    const res = await eliminarUsuario(u.id, u.username);
    if (res.error) {
      setUserFeedback({ type: 'err', msg: res.error });
    } else {
      setUserFeedback({
        type: 'ok',
        msg: `Usuario "${u.username}" eliminado correctamente.`,
      });
      onRefreshData();
    }
  };

  const handleAddParametro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoValorParam.trim()) return;
    await agregarParametro(catActiva, nuevoValorParam.trim());
    setNuevoValorParam('');
    onRefreshData();
  };

  const handleDeleteParametro = async (id: string) => {
    await eliminarParametro(id);
    onRefreshData();
  };

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supaUrl, supaKey);
    setSupaSavedMsg(true);
    setTimeout(() => setSupaSavedMsg(false), 3500);
    onRefreshData();
  };

  const parametrosFiltrados = parametros.filter(
    (p) => p.categoria === catActiva
  );

  return (
    <div className="space-y-6">
      {/* Navegación interna del Panel Administrador */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-2">
        <button
          onClick={() => setSubTab('usuarios')}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            subTab === 'usuarios'
              ? 'bg-[#1B365D] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Gestión de Usuarios (Admins y Relevadores)
        </button>

        <button
          onClick={() => setSubTab('parametros')}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            subTab === 'parametros'
              ? 'bg-[#1B365D] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Parametrización de Campos de Vía Pública
        </button>

        <button
          onClick={() => setSubTab('supabase')}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            subTab === 'supabase'
              ? 'bg-[#1B365D] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          Conexión Persistencia Supabase
        </button>
      </div>

      {/* ===================================================================
          SUB-PESTAÑA 1: ALTA Y GESTIÓN DE USUARIOS
      =================================================================== */}
      {subTab === 'usuarios' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario de Alta de Nuevo Usuario */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="bg-[#1B365D] text-white px-5 py-3.5 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-200" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide">
                Dar de Alta Nuevo Usuario
              </h3>
            </div>

            <form onSubmit={handleCrearUsuario} className="p-5 space-y-4">
              {userFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold border ${
                    userFeedback.type === 'ok'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  }`}
                >
                  {userFeedback.msg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Rol del Usuario *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRol('relevador')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      rol === 'relevador'
                        ? 'bg-[#1B365D] text-white border-[#1B365D]'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    Agente Relevador
                  </button>
                  <button
                    type="button"
                    onClick={() => setRol('admin')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      rol === 'admin'
                        ? 'bg-[#1B365D] text-white border-[#1B365D]'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    Administrador
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Nombre y Apellido (Aclaración de Firma) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Laura Gómez"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Legajo Municipal N.º *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: LEG-5210"
                  value={legajo}
                  onChange={(e) => setLegajo(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Usuario de Acceso (Login) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: LGomez"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Contraseña *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Transito2026."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-[#1B365D] hover:bg-[#132746] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition cursor-pointer"
              >
                Crear Usuario Habilitado
              </button>
            </form>
          </div>

          {/* Tabla de Usuarios Registrados */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Nómina de Usuarios Habilitados ({usuarios.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Los relevadores firman automáticamente cada ficha técnica con su nombre y legajo.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Nombre y Legajo</th>
                    <th className="py-3 px-4">Rol</th>
                    <th className="py-3 px-4">Clave</th>
                    <th className="py-3 px-4 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {usuarios.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {u.username}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {u.nombre_completo}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          Legajo: {u.legajo}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            u.rol === 'admin'
                              ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                              : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {u.rol === 'admin' ? 'Administrador' : 'Relevador'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                        {u.password_hash}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleUser(u)}
                            disabled={u.username.toLowerCase() === 'mcastillo'}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50 ${
                              u.activo
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {u.activo ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" /> Inactivo
                              </>
                            )}
                          </button>

                          {u.username.toLowerCase() !== 'mcastillo' && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10 transition cursor-pointer"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          SUB-PESTAÑA 2: PARAMETRIZACIÓN DE CAMPOS DEL FORMULARIO
      =================================================================== */}
      {subTab === 'parametros' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Selector de categoría a parametrizar */}
          <div className="space-y-2.5">
            {CATEGORIAS_LABELS.map((cat) => {
              const active = catActiva === cat.key;
              const count = parametros.filter((p) => p.categoria === cat.key).length;
              return (
                <button
                  key={cat.key}
                  onClick={() => setCatActiva(cat.key)}
                  className={`w-full text-left p-4 rounded-2xl border transition cursor-pointer ${
                    active
                      ? 'bg-[#1B365D] text-white border-[#1B365D] shadow-md'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold">{cat.label}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-1 ${
                      active ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {cat.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Lista editable de opciones de la categoría activa */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {CATEGORIAS_LABELS.find((c) => c.key === catActiva)?.label}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Agregue o elimine opciones desplegables disponibles para los relevadores durante la carga en el corralón.
              </p>
            </div>

            <form onSubmit={handleAddParametro} className="flex gap-2.5">
              <input
                type="text"
                required
                placeholder="Escribir nuevo valor para este catálogo..."
                value={nuevoValorParam}
                onChange={(e) => setNuevoValorParam(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1B365D] hover:bg-[#132746] text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Agregar Opción
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {parametrosFiltrados.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/70 text-sm"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {item.valor}
                  </span>
                  <button
                    onClick={() => handleDeleteParametro(item.id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                    title="Eliminar parámetro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          SUB-PESTAÑA 3: CONEXIÓN SUPABASE Y SCRIPT SQL
      =================================================================== */}
      {subTab === 'supabase' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Credenciales de Proyecto Supabase
                </h3>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  supaConf.isConfigured
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                }`}
              >
                {supaConf.isConfigured
                  ? 'Conectado a Supabase Cloud'
                  : 'Persistencia Local Activa (Listo para vincular)'}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Puede configurar las variables de entorno <code className="font-mono font-bold">VITE_SUPABASE_URL</code> y{' '}
              <code className="font-mono font-bold">VITE_SUPABASE_ANON_KEY</code> directamente en su panel de{' '}
              <strong>Netlify</strong>, o pegarlas aquí para conectar en vivo sin necesidad de recompilar.
            </p>

            <form onSubmit={handleSaveSupabase} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supaUrl}
                  onChange={(e) => setSupaUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Supabase Anon / Public Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supaKey}
                  onChange={(e) => setSupaKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono"
                />
              </div>

              {supaSavedMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  ✓ Configuración de Supabase guardada y actualizada.
                </div>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#1B365D] hover:bg-[#132746] text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Guardar Conexión Supabase
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Estructura SQL para Supabase
              </h3>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `-- Ejecute el contenido del archivo supabase_schema.sql incluido en la raíz del proyecto`
                  );
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2000);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Archivo supabase_schema.sql
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              En la raíz del proyecto encontrará el archivo{' '}
              <code className="font-mono font-bold text-blue-600 dark:text-blue-400">
                supabase_schema.sql
              </code>{' '}
              con las tablas <code className="font-mono">usuarios</code>,{' '}
              <code className="font-mono">parametros</code>,{' '}
              <code className="font-mono">relevamientos</code>, el usuario administrador inicial{' '}
              <code className="font-mono font-bold">MCastillo</code> y el bucket público{' '}
              <code className="font-mono">vehiculos-fotos</code> para las imágenes WebP livianas.
            </p>
            <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed">
{`-- Resumen de tablas creadas en supabase_schema.sql:
1. public.usuarios (admin 'MCastillo' con pass 'Movilidad2026.')
2. public.parametros (dependencias, sectores, marcas, colores, faltantes)
3. public.relevamientos (todos los campos de la Ficha Técnica Municipal)
4. storage.buckets ('vehiculos-fotos' para las 3 vistas WebP)`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
