import React, { useState, useMemo } from 'react';
import {
  RelevamientoVehiculo,
  Usuario,
  FotoComprimida,
} from '../types';
import {
  adjuntarFotosARelevamiento,
  formatearDominioVisual,
  normalizarDominio,
  tieneLas3Fotos,
} from '../lib/supabase';
import { compressImageToWebP } from '../utils/imageCompressor';
import {
  Search,
  Camera,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Car,
  FileText,
  Sparkles,
  Loader2,
  Trash2,
  Image as ImageIcon,
  Save,
  Printer,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface Props {
  registros: RelevamientoVehiculo[];
  usuarioActual: Usuario;
  onUpdated: (actualizado: RelevamientoVehiculo) => void;
  onSelectPrint: (reg: RelevamientoVehiculo) => void;
}

export const RelevadorFotoQuickFlow: React.FC<Props> = ({
  registros,
  usuarioActual,
  onUpdated,
  onSelectPrint,
}) => {
  const [queryPatente, setQueryPatente] = useState('');
  const [filtroPendientes, setFiltroPendientes] = useState<'pendientes' | 'todos'>(
    'pendientes'
  );
  const [vehiculoActivo, setVehiculoActivo] =
    useState<RelevamientoVehiculo | null>(null);

  // Estados de las 3 fotografías a cargar o reemplazar
  const [fotoFrontal, setFotoFrontal] = useState<FotoComprimida | null>(null);
  const [fotoLateral, setFotoLateral] = useState<FotoComprimida | null>(null);
  const [fotoPosterior, setFotoPosterior] = useState<FotoComprimida | null>(
    null
  );
  const [compressingSlot, setCompressingSlot] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Normalizar la búsqueda sin espacios ni guiones
  const cleanSearch = normalizarDominio(queryPatente);

  const resultados = useMemo(() => {
    const rawUpper = queryPatente.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    return registros.filter((r) => {
      const domVisual = formatearDominioVisual(r.dominio);
      const actaNormalizada = (r.numero_acta || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const corrNormalizado = (r.numero_correlativo || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

      const coincideBusqueda =
        !rawUpper ||
        domVisual.includes(rawUpper) ||
        actaNormalizada.includes(rawUpper) ||
        corrNormalizado.includes(rawUpper);

      if (!coincideBusqueda) return false;

      if (filtroPendientes === 'pendientes') {
        return !tieneLas3Fotos(r);
      }
      return true;
    });
  }, [registros, queryPatente, filtroPendientes]);

  const seleccionarVehiculo = (reg: RelevamientoVehiculo) => {
    setVehiculoActivo(reg);
    setFotoFrontal(null);
    setFotoLateral(null);
    setFotoPosterior(null);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    slot: 'frontal' | 'lateral' | 'posterior',
    label: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setCompressingSlot(slot);
    try {
      const compressed = await compressImageToWebP(file, slot, label);
      if (slot === 'frontal') setFotoFrontal(compressed);
      if (slot === 'lateral') setFotoLateral(compressed);
      if (slot === 'posterior') setFotoPosterior(compressed);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al comprimir la fotografía.');
    } finally {
      setCompressingSlot(null);
      e.target.value = '';
    }
  };

  const handleGuardarFotos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehiculoActivo) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const tieneFrontalFinal = Boolean(
      fotoFrontal || vehiculoActivo.foto_frontal_url
    );
    const tieneLateralFinal = Boolean(
      fotoLateral || vehiculoActivo.foto_lateral_url
    );
    const tienePosteriorFinal = Boolean(
      fotoPosterior || vehiculoActivo.foto_posterior_url
    );

    if (!tieneFrontalFinal || !tieneLateralFinal || !tienePosteriorFinal) {
      setErrorMsg(
        'Para culminar el relevamiento fotográfico del vehículo es obligatorio completar las 3 vistas (Frontal, Lateral y Posterior).'
      );
      return;
    }

    setSaving(true);
    try {
      const actualizado = await adjuntarFotosARelevamiento(
        vehiculoActivo,
        {
          frontal: fotoFrontal,
          lateral: fotoLateral,
          posterior: fotoPosterior,
        },
        usuarioActual
      );

      setVehiculoActivo(actualizado);
      setFotoFrontal(null);
      setFotoLateral(null);
      setFotoPosterior(null);
      setSuccessMsg(
        `¡Relevamiento fotográfico culminado con éxito para el dominio ${actualizado.dominio}! Imágenes subidas en formato WebP liviano.`
      );
      onUpdated(actualizado);
    } catch (err: any) {
      setErrorMsg(
        err?.message || 'Ocurrió un error al subir las fotografías a Supabase.'
      );
    } finally {
      setSaving(false);
    }
  };

  const totalPendientesCount = registros.filter((r) => !tieneLas3Fotos(r)).length;
  const totalCompletosCount = registros.filter((r) => tieneLas3Fotos(r)).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Banner Operativo para Relevadores de Campo */}
      <div className="bg-gradient-to-r from-[#1B365D] via-[#1f406e] to-[#0f294a] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-blue-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-extrabold tracking-wide uppercase mb-2">
            <Camera className="w-3.5 h-3.5" />
            Modo Operativo de Campo — Corralón Municipal
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
            Búsqueda Rápida por Patente y Carga Fotográfica en Predio
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
            Localice la ficha precargada por Data Entry ingresando la patente (sin espacios ni guiones), verifique los datos clave del vehículo y adjunte las 3 fotografías.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2.5 text-center">
            <span className="block text-[10px] uppercase tracking-wider text-amber-300 font-bold">
              Pendientes de Fotos
            </span>
            <span className="text-xl font-extrabold text-white">
              {totalPendientesCount}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2.5 text-center">
            <span className="block text-[10px] uppercase tracking-wider text-emerald-300 font-bold">
              Culminados (3 Fotos)
            </span>
            <span className="text-xl font-extrabold text-white">
              {totalCompletosCount}
            </span>
          </div>
        </div>
      </div>

      {/* Buscador Rápido por Patente (Sin espacios ni guiones) */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <label className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#1B365D] dark:text-blue-300">
            1. Ingrese Número de Patente / Dominio (Sin espacios ni guiones)
          </label>

          <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFiltroPendientes('pendientes')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filtroPendientes === 'pendientes'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Pendientes de Fotos ({totalPendientesCount})
            </button>
            <button
              type="button"
              onClick={() => setFiltroPendientes('todos')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filtroPendientes === 'todos'
                  ? 'bg-[#1B365D] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Todos ({registros.length})
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ESCRIBA LA PATENTE AQUÍ (EJ: AC452MK o A148KZP)..."
            value={queryPatente}
            onChange={(e) => {
              // Limpiar espacios y guiones en vivo para comodidad del relevador
              const limpio = e.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '');
              setQueryPatente(limpio);
            }}
            className="w-full pl-12 pr-28 py-4 rounded-2xl border-2 border-blue-500/40 dark:border-blue-500/50 bg-slate-50 dark:bg-slate-800/90 text-base sm:text-lg font-extrabold font-mono uppercase tracking-widest text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {queryPatente && (
            <button
              type="button"
              onClick={() => setQueryPatente('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Lista horizontal/rápida de coincidencias */}
        <div className="space-y-2.5 pt-1">
          {resultados.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No se encontraron vehículos con la patente "{cleanSearch}" en esta vista.
              </p>
              {filtroPendientes === 'pendientes' && (
                <button
                  type="button"
                  onClick={() => setFiltroPendientes('todos')}
                  className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 underline cursor-pointer"
                >
                  Buscar también entre los vehículos que ya tienen fotos cargadas
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {resultados.map((reg) => {
                const completo = tieneLas3Fotos(reg);
                const isSelected = vehiculoActivo?.id === reg.id;
                const fotosCount =
                  (reg.foto_frontal_url ? 1 : 0) +
                  (reg.foto_lateral_url ? 1 : 0) +
                  (reg.foto_posterior_url ? 1 : 0);

                return (
                  <div
                    key={reg.id}
                    onClick={() => seleccionarVehiculo(reg)}
                    className={`text-left p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-black text-white font-mono font-extrabold text-sm tracking-widest border border-slate-700">
                          {formatearDominioVisual(reg.dominio)}
                        </span>
                        <span className="ml-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                          {reg.numero_correlativo}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          completo
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {completo ? '3/3 Fotos OK' : `Faltan Fotos (${fotosCount}/3)`}
                      </span>
                    </div>

                    <div>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {reg.tipo_vehiculo}: {reg.marca} {reg.modelo}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        Color: <strong>{reg.color_predominante}</strong> • Año:{' '}
                        <strong>{reg.anio_aproximado || 'S/D'}</strong> • Estado:{' '}
                        <strong>{reg.estado_general}</strong>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="truncate font-semibold">
                          {reg.sector_corralon}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-200/80 dark:border-slate-700/60">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          seleccionarVehiculo(reg);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold transition cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {completo ? 'Ver / Editar Fotos' : 'Subir Fotos'}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPrint(reg);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1B365D] hover:bg-[#132847] text-white text-xs font-bold transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Ver Ficha A4
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================
          FICHA RESUMIDA DE VERIFICACIÓN EN CAMPO + CARGA DE LAS 3 FOTOS WEBP
      =================================================================== */}
      {vehiculoActivo && (
        <form
          onSubmit={handleGuardarFotos}
          className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-[#1B365D] dark:border-blue-500/60 shadow-lg overflow-hidden space-y-6"
        >
          {/* Cabecera del vehículo localizado */}
          <div className="bg-[#1B365D] text-white px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-mono font-extrabold text-base sm:text-lg tracking-widest shadow">
                {formatearDominioVisual(vehiculoActivo.dominio)}
              </div>
              <div>
                <div className="text-xs text-blue-200 font-bold uppercase tracking-wider">
                  {vehiculoActivo.numero_correlativo} • Acta N.º{' '}
                  {vehiculoActivo.numero_acta}
                </div>
                <h3 className="text-base sm:text-lg font-extrabold">
                  {vehiculoActivo.tipo_vehiculo} — {vehiculoActivo.marca}{' '}
                  {vehiculoActivo.modelo} ({vehiculoActivo.color_predominante})
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectPrint(vehiculoActivo)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Ver Ficha Técnica A4
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            {/* Resumen de Datos Clave para que el Relevador chequee físicamente el vehículo */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                2. Resumen de Verificación Física en el Predio (Datos cargados por Data Entry)
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <span className="block text-[10px] font-bold uppercase text-slate-400">
                    Ubicación Corralón
                  </span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {vehiculoActivo.sector_corralon}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <span className="block text-[10px] font-bold uppercase text-slate-400">
                    Marca / Modelo
                  </span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {vehiculoActivo.marca} {vehiculoActivo.modelo}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <span className="block text-[10px] font-bold uppercase text-slate-400">
                    Color y Año
                  </span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {vehiculoActivo.color_predominante} ({vehiculoActivo.anio_aproximado})
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <span className="block text-[10px] font-bold uppercase text-slate-400">
                    Estado / Ruedas
                  </span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {vehiculoActivo.estado_general} • {vehiculoActivo.cantidad_ruedas} ruedas
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <span className="block text-[10px] font-bold uppercase text-slate-400">
                    N.º Motor
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white break-all">
                    {vehiculoActivo.numero_motor || 'S/D'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <span className="block text-[10px] font-bold uppercase text-slate-400">
                    N.º Chasis / Cuadro
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white break-all">
                    {vehiculoActivo.numero_chasis || 'S/D'}
                  </span>
                </div>
              </div>

              {(vehiculoActivo.detalle_faltantes ||
                vehiculoActivo.observaciones) && (
                <div className="mt-3 p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 text-xs space-y-1">
                  {vehiculoActivo.detalle_faltantes && (
                    <div>
                      <strong className="text-amber-900 dark:text-amber-300">
                        Faltantes declarados en ficha:
                      </strong>{' '}
                      <span className="text-slate-700 dark:text-slate-300">
                        {vehiculoActivo.detalle_faltantes}
                      </span>
                    </div>
                  )}
                  {vehiculoActivo.observaciones && (
                    <div>
                      <strong className="text-amber-900 dark:text-amber-300">
                        Observaciones Data Entry:
                      </strong>{' '}
                      <span className="text-slate-700 dark:text-slate-300">
                        {vehiculoActivo.observaciones}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
                <div className="font-medium">{errorMsg}</div>
              </div>
            )}

            {successMsg && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
                <div className="font-bold">{successMsg}</div>
              </div>
            )}

            {/* Captura de las 3 Fotografías con compresión WebP */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  3. Captura de las 3 Fotografías del Vehículo (Conversión automática a WebP liviano)
                </h4>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  Subida directa a Supabase Storage (Bucket: vehiculos-fotos)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {(
                  [
                    {
                      slot: 'frontal' as const,
                      title: '1. Vista Frontal *',
                      existingUrl: vehiculoActivo.foto_frontal_url,
                      state: fotoFrontal,
                      setter: setFotoFrontal,
                    },
                    {
                      slot: 'lateral' as const,
                      title: '2. Vista Lateral *',
                      existingUrl: vehiculoActivo.foto_lateral_url,
                      state: fotoLateral,
                      setter: setFotoLateral,
                    },
                    {
                      slot: 'posterior' as const,
                      title: '3. Vista Posterior *',
                      existingUrl: vehiculoActivo.foto_posterior_url,
                      state: fotoPosterior,
                      setter: setFotoPosterior,
                    },
                  ]
                ).map((box) => {
                  const isCompressing = compressingSlot === box.slot;
                  const previewUrl = box.state?.dataUrl || box.existingUrl;

                  return (
                    <div
                      key={box.slot}
                      className={`rounded-2xl border-2 transition overflow-hidden flex flex-col justify-between ${
                        previewUrl
                          ? 'border-emerald-500/60 bg-emerald-50/10 dark:bg-emerald-950/10'
                          : 'border-dashed border-amber-400 dark:border-amber-500/60 bg-amber-50/20 dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                          {box.title}
                        </span>
                        {box.state ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Nueva: {box.state.compressedSizeKB} KB WebP
                          </span>
                        ) : box.existingUrl ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Cargada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            <Clock className="w-3.5 h-3.5" />
                            Pendiente
                          </span>
                        )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col items-center justify-center min-h-[210px]">
                        {isCompressing ? (
                          <div className="flex flex-col items-center gap-2 text-blue-600 dark:text-blue-400">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <span className="text-xs font-semibold">
                              Comprimiendo a WebP liviano...
                            </span>
                          </div>
                        ) : previewUrl ? (
                          <div className="w-full space-y-3">
                            <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-[4/3] flex items-center justify-center">
                              <img
                                src={previewUrl}
                                alt={box.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                              <div className="flex items-center gap-1.5">
                                <label className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 font-bold text-white cursor-pointer">
                                  <Camera className="w-3.5 h-3.5" />
                                  Cámara
                                  <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={(e) =>
                                      handleFileUpload(e, box.slot, box.title)
                                    }
                                    className="hidden"
                                  />
                                </label>
                                <label className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                                  <ImageIcon className="w-3.5 h-3.5" />
                                  Galería
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                      handleFileUpload(e, box.slot, box.title)
                                    }
                                    className="hidden"
                                  />
                                </label>
                              </div>

                              {box.state && (
                                <button
                                  type="button"
                                  onClick={() => box.setter(null)}
                                  className="inline-flex items-center gap-1 text-rose-600 font-semibold cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Deshacer
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full min-h-[180px] flex flex-col items-center justify-center text-center p-3">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-3">
                              {box.title}
                            </span>

                            <div className="grid grid-cols-2 gap-2.5 w-full">
                              <label className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer transition">
                                <Camera className="w-6 h-6 mb-1.5" />
                                <span className="text-xs font-extrabold">
                                  Tomar Foto
                                </span>
                                <span className="text-[10px] text-blue-100">
                                  Abrir Cámara
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  onChange={(e) =>
                                    handleFileUpload(e, box.slot, box.title)
                                  }
                                  className="hidden"
                                />
                              </label>

                              <label className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300/70 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 shadow-sm cursor-pointer transition">
                                <ImageIcon className="w-6 h-6 mb-1.5 text-blue-600 dark:text-blue-400" />
                                <span className="text-xs font-extrabold">
                                  Abrir Galería
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                  Elegir Archivo
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleFileUpload(e, box.slot, box.title)
                                  }
                                  className="hidden"
                                />
                              </label>
                            </div>

                            <span className="mt-3 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                              Compresión WebP automática (~60 KB)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Botón de confirmación del Relevador */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-extrabold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Subiendo fotos WebP a Supabase...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar las 3 Fotografías y Culminar Relevamiento
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
