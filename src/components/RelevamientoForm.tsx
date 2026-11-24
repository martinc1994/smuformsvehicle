import React, { useState, useEffect } from 'react';
import {
  Parametro,
  RelevamientoVehiculo,
  TipoVehiculo,
  EstadoGeneral,
  TipoFotoCheck,
  Usuario,
  FotoComprimida,
} from '../types';
import {
  generarSiguienteCorrelativo,
  guardarRelevamiento,
} from '../lib/supabase';
import { compressImageToWebP } from '../utils/imageCompressor';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileText,
  Car,
  Wrench,
  Image as ImageIcon,
  Save,
  Trash2,
  Loader2,
  Check,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  usuarioActual: Usuario;
  parametros: Parametro[];
  onSaved: (nuevo: RelevamientoVehiculo) => void;
  onViewFicha?: (reg: RelevamientoVehiculo) => void;
  onGoToFotosPredio?: () => void;
}

const TIPOS_VEHICULO: { label: TipoVehiculo; ruedasDefault: number }[] = [
  { label: 'Automóvil', ruedasDefault: 4 },
  { label: 'Camioneta', ruedasDefault: 4 },
  { label: 'Motocicleta', ruedasDefault: 2 },
  { label: 'Utilitario', ruedasDefault: 4 },
  { label: 'Otro', ruedasDefault: 4 },
];

const ESTADOS_GENERALES: { label: EstadoGeneral; badgeColor: string }[] = [
  {
    label: 'Bueno',
    badgeColor:
      'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  {
    label: 'Regular',
    badgeColor:
      'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  {
    label: 'Malo',
    badgeColor:
      'border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300',
  },
  {
    label: 'Chatarra',
    badgeColor: 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  },
];

export const RelevamientoForm: React.FC<Props> = ({
  usuarioActual,
  parametros,
  onSaved,
  onViewFicha,
  onGoToFotosPredio,
}) => {
  const todayISO = new Date().toISOString().split('T')[0];

  // 1. Datos de Registro e Ingreso
  const [numeroCorrelativo, setNumeroCorrelativo] = useState('FSMU-1000');
  const [dependencia, setDependencia] = useState('Dirección Operativa de Tránsito');
  const [numeroActa, setNumeroActa] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [lugarSecuestro, setLugarSecuestro] = useState('');
  const [sectorCorralon, setSectorCorralon] = useState('No especificado');

  // 2. Identificación del Vehículo
  const [tipoVehiculo, setTipoVehiculo] = useState<TipoVehiculo>('Motocicleta');
  const [tipoVehiculoOtro, setTipoVehiculoOtro] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [anioAproximado, setAnioAproximado] = useState('');
  const [colorPredominante, setColorPredominante] = useState('');
  const [dominio, setDominio] = useState('');
  const [cantidadRuedas, setCantidadRuedas] = useState<number>(2);
  const [numeroMotor, setNumeroMotor] = useState('');
  const [numeroChasis, setNumeroChasis] = useState('');

  // 3. Estado Físico y Condición del Vehículo
  const [estadoGeneral, setEstadoGeneral] = useState<EstadoGeneral>('Regular');
  const [poseeMotor, setPoseeMotor] = useState(true);
  const [poseeBateria, setPoseeBateria] = useState(false);
  const [poseeLlave, setPoseeLlave] = useState(false);
  const [poseeDocumentacion, setPoseeDocumentacion] = useState(false);
  const [presentaFaltantes, setPresentaFaltantes] = useState(false);
  const [detalleFaltantes, setDetalleFaltantes] = useState('');
  const [seEncuentraDesarmado, setSeEncuentraDesarmado] = useState(false);
  const [conservaChapaPatente, setConservaChapaPatente] = useState(true);
  const [aptoParaCircular, setAptoParaCircular] = useState(false);

  // 4. Registro Fotográfico (Obligatorias las 3 vistas: Frontal, Lateral, Posterior)
  const [tiposFotos, setTiposFotos] = useState<TipoFotoCheck[]>([
    'Frente',
    'Lateral',
    'Parte posterior',
  ]);
  const [fotoFrontal, setFotoFrontal] = useState<FotoComprimida | null>(null);
  const [fotoLateral, setFotoLateral] = useState<FotoComprimida | null>(null);
  const [fotoPosterior, setFotoPosterior] = useState<FotoComprimida | null>(null);
  const [compressingSlot, setCompressingSlot] = useState<string | null>(null);

  // 5. Observaciones y Firma
  const [observaciones, setObservaciones] = useState('');
  const [fechaRelevamiento, setFechaRelevamiento] = useState(todayISO);

  // Estado UI
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ultimoGuardado, setUltimoGuardado] =
    useState<RelevamientoVehiculo | null>(null);

  // Filtrar catálogos parametrizados y garantizar que las opciones predeterminadas estén siempre presentes
  const dependenciasRaw = parametros.filter(
    (p) => p.categoria === 'dependencia' && p.activo
  );
  const dependenciasList: Parametro[] = [
    {
      id: 'dep-default-operativa',
      categoria: 'dependencia',
      valor: 'Dirección Operativa de Tránsito',
      activo: true,
    },
    ...dependenciasRaw.filter(
      (d) => d.valor !== 'Dirección Operativa de Tránsito'
    ),
  ];

  const sectoresRaw = parametros.filter(
    (p) => p.categoria === 'sector_corralon' && p.activo
  );
  const sectoresList: Parametro[] = [
    {
      id: 'sec-default-no-especificado',
      categoria: 'sector_corralon',
      valor: 'No especificado',
      activo: true,
    },
    ...sectoresRaw.filter((s) => s.valor !== 'No especificado'),
  ];

  const marcasList = parametros.filter((p) => p.categoria === 'marca' && p.activo);
  const coloresList = parametros.filter((p) => p.categoria === 'color' && p.activo);
  const lugaresList = parametros.filter(
    (p) => p.categoria === 'lugar_secuestro' && p.activo
  );
  const faltantesComunes = parametros.filter(
    (p) => p.categoria === 'faltante_comun' && p.activo
  );

  useEffect(() => {
    generarSiguienteCorrelativo().then((corr) => setNumeroCorrelativo(corr));
    if (!dependencia) {
      setDependencia('Dirección Operativa de Tránsito');
    }
    if (!sectorCorralon) {
      setSectorCorralon('No especificado');
    }
  }, [parametros]);

  const handleTipoVehiculoChange = (nuevoTipo: TipoVehiculo, ruedas: number) => {
    setTipoVehiculo(nuevoTipo);
    setCantidadRuedas(ruedas);
  };

  const toggleTipoFotoCheck = (item: TipoFotoCheck) => {
    setTiposFotos((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const toggleFaltanteChip = (textoChip: string) => {
    setPresentaFaltantes(true);
    const actual = detalleFaltantes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (actual.includes(textoChip)) {
      const nuevo = actual.filter((s) => s !== textoChip).join(', ');
      setDetalleFaltantes(nuevo);
    } else {
      const nuevo = [...actual, textoChip].join(', ');
      setDetalleFaltantes(nuevo);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    slot: 'frontal' | 'lateral' | 'posterior',
    label: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
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

  const totalFotosCargadas =
    (fotoFrontal ? 1 : 0) + (fotoLateral ? 1 : 0) + (fotoPosterior ? 1 : 0);

  const totalOriginalKB =
    (fotoFrontal?.originalSizeKB || 0) +
    (fotoLateral?.originalSizeKB || 0) +
    (fotoPosterior?.originalSizeKB || 0);

  const totalCompressedKB =
    (fotoFrontal?.compressedSizeKB || 0) +
    (fotoLateral?.compressedSizeKB || 0) +
    (fotoPosterior?.compressedSizeKB || 0);

  const ahorroPorcentaje =
    totalOriginalKB > 0
      ? Math.max(1, Math.round((1 - totalCompressedKB / totalOriginalKB) * 100))
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setUltimoGuardado(null);

    if (!dependencia.trim()) {
      setErrorMsg(
        'Por favor seleccione la Dependencia que efectuó el secuestro en la Sección 1.'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!marca.trim() || !anioAproximado.trim() || !colorPredominante.trim()) {
      setErrorMsg(
        'Por favor complete Marca, Año aproximado y Color predominante en la Sección 2 (Identificación del Vehículo).'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    try {
      const nuevo = await guardarRelevamiento(
        {
          numero_correlativo: numeroCorrelativo.trim(),
          dependencia: dependencia.trim() || 'Dirección Operativa de Tránsito',
          numero_acta: numeroActa.trim().toUpperCase() || 'S/D',
          fecha_ingreso: fechaIngreso || null,
          lugar_secuestro: lugarSecuestro.trim() || 'No especificado',
          sector_corralon: sectorCorralon.trim() || 'No especificado',
          tipo_vehiculo: tipoVehiculo,
          tipo_vehiculo_otro: tipoVehiculo === 'Otro' ? tipoVehiculoOtro.trim() : '',
          marca: marca.trim(),
          modelo: modelo.trim() || 'S/D',
          anio_aproximado: anioAproximado.trim(),
          color_predominante: colorPredominante.trim(),
          dominio: dominio.trim().toUpperCase() || 'SIN DOMINIO',
          cantidad_ruedas: Number(cantidadRuedas) || 0,
          numero_motor: numeroMotor.trim().toUpperCase(),
          numero_chasis: numeroChasis.trim().toUpperCase(),
          estado_general: estadoGeneral,
          posee_motor: poseeMotor,
          posee_bateria: poseeBateria,
          posee_llave: poseeLlave,
          posee_documentacion: poseeDocumentacion,
          presenta_faltantes: presentaFaltantes,
          detalle_faltantes: presentaFaltantes ? detalleFaltantes.trim() : '',
          se_encuentra_desarmado: seEncuentraDesarmado,
          conserva_chapa_patente: conservaChapaPatente,
          apto_para_circular: aptoParaCircular,
          tipos_fotos: tiposFotos,
          observaciones: observaciones.trim(),
          agente_id: usuarioActual.id,
          agente_nombre: usuarioActual.nombre_completo,
          agente_legajo: usuarioActual.legajo,
          fecha_relevamiento: fechaRelevamiento,
        },
        {
          frontal: fotoFrontal,
          lateral: fotoLateral,
          posterior: fotoPosterior,
        }
      );

      setUltimoGuardado(nuevo);
      onSaved(nuevo);

      // Limpiar todos los campos para poder cargar la siguiente planilla de inmediato
      setDependencia('Dirección Operativa de Tránsito');
      setNumeroActa('');
      setFechaIngreso('');
      setLugarSecuestro('');
      setSectorCorralon('No especificado');
      setTipoVehiculo('Motocicleta');
      setTipoVehiculoOtro('');
      setMarca('');
      setModelo('');
      setAnioAproximado('');
      setColorPredominante('');
      setDominio('');
      setCantidadRuedas(2);
      setNumeroMotor('');
      setNumeroChasis('');
      setObservaciones('');
      setEstadoGeneral('Regular');
      setPoseeMotor(true);
      setPoseeBateria(false);
      setPoseeLlave(false);
      setPoseeDocumentacion(false);
      setPresentaFaltantes(false);
      setDetalleFaltantes('');
      setSeEncuentraDesarmado(false);
      setConservaChapaPatente(true);
      setAptoParaCircular(false);
      setFotoFrontal(null);
      setFotoLateral(null);
      setFotoPosterior(null);

      // Calcular el próximo idForm disponible
      const nextCorr = await generarSiguienteCorrelativo();
      setNumeroCorrelativo(nextCorr);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          'RECHAZADO: Ocurrió un error al intentar guardar el formulario en Supabase.'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      {/* Banner Institucional Superior */}
      <div className="bg-gradient-to-r from-[#1B365D] to-[#254b80] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-blue-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 text-xs font-semibold tracking-wide uppercase mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Secretaría de Movilidad Urbana — Dirección de Tránsito
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            Ficha Técnica de Relevamiento de Vehículo Secuestrado
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
            Corralón Municipal — Registro digital de vehículos en Corralón
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2.5 text-right shrink-0">
          <span className="block text-[11px] uppercase tracking-wider text-blue-200 font-medium">
            idForm (Autoincremental)
          </span>
          <span className="text-lg font-extrabold tracking-wider text-white">
            {numeroCorrelativo}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <div>
            <div className="font-extrabold uppercase text-xs tracking-wider text-rose-700 dark:text-rose-300">
              Formulario Rechazado / Error al Guardar
            </div>
            <div className="font-medium mt-0.5">{errorMsg}</div>
          </div>
        </div>
      )}

      {ultimoGuardado && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 shadow-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div>
              <div className="text-sm font-extrabold">
                ¡Planilla guardada con éxito! — Código asignado:{' '}
                <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono">
                  {ultimoGuardado.numero_correlativo}
                </span>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-200 mt-1">
                Vehículo:{' '}
                <strong>
                  {ultimoGuardado.tipo_vehiculo} {ultimoGuardado.marca}{' '}
                  {ultimoGuardado.modelo}
                </strong>{' '}
                • Dominio:{' '}
                <strong className="font-mono">{ultimoGuardado.dominio}</strong>. Ya se encuentra disponible en la sección{' '}
                <em>"2. Relevamiento Fotográfico en Predio"</em>. El formulario quedó limpio para cargar el siguiente vehículo.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onGoToFotosPredio && (
              <button
                type="button"
                onClick={onGoToFotosPredio}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold transition cursor-pointer"
              >
                Ir a Relevamiento Fotográfico
              </button>
            )}
            {onViewFicha && (
              <button
                type="button"
                onClick={() => onViewFicha(ultimoGuardado)}
                className="px-3.5 py-2 rounded-xl bg-[#1B365D] hover:bg-[#132847] text-white text-xs font-bold transition cursor-pointer"
              >
                Ver Ficha A4 ({ultimoGuardado.numero_correlativo})
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================
          SECCIÓN 1: DATOS DE REGISTRO E INGRESO
      =================================================================== */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="bg-[#1B365D] text-white px-5 py-3 flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-blue-200" />
          <h3 className="text-xs sm:text-sm font-bold tracking-wide uppercase">
            1. Datos de Registro e Ingreso
          </h3>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* idForm Autoincremental */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              idForm (Autoincremental) *
            </label>
            <input
              type="text"
              required
              readOnly
              value={numeroCorrelativo}
              title="Generado automáticamente por el sistema en formato FSMU-1000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/90 font-extrabold font-mono text-[#1B365D] dark:text-blue-300 text-sm cursor-not-allowed focus:outline-none"
            />
          </div>

          {/* Dependencia */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Dependencia que efectuó el secuestro *
            </label>
            <select
              required
              value={dependencia}
              onChange={(e) => setDependencia(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione dependencia...</option>
              {dependenciasList.map((d) => (
                <option key={d.id} value={d.valor}>
                  {d.valor}
                </option>
              ))}
            </select>
          </div>

          {/* Número de acta (No obligatorio) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Número de Acta de Infracción o Secuestro
            </label>
            <input
              type="text"
              placeholder="Ej: ACTA-84920-T (Opcional)"
              value={numeroActa}
              onChange={(e) => setNumeroActa(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fecha de ingreso al corralón (No obligatorio) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Fecha de Ingreso al Corralón
            </label>
            <input
              type="date"
              value={fechaIngreso}
              onChange={(e) => setFechaIngreso(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Lugar del secuestro (No obligatorio) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Lugar del Secuestro (Vía Pública)
            </label>
            <input
              type="text"
              list="lugares-smu-list"
              placeholder="Ej: Av. Mate de Luna y Av. Alem (Opcional)"
              value={lugarSecuestro}
              onChange={(e) => setLugarSecuestro(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <datalist id="lugares-smu-list">
              {lugaresList.map((l) => (
                <option key={l.id} value={l.valor} />
              ))}
            </datalist>
          </div>

          {/* Sector y ubicación dentro del corralón (No obligatorio, default "No especificado") */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Sector y Ubicación dentro del Corralón
            </label>
            <select
              value={sectorCorralon}
              onChange={(e) => setSectorCorralon(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sectoresList.map((s) => (
                <option key={s.id} value={s.valor}>
                  {s.valor}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECCIÓN 2: IDENTIFICACIÓN DEL VEHÍCULO
      =================================================================== */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="bg-[#1B365D] text-white px-5 py-3 flex items-center gap-2.5">
          <Car className="w-4 h-4 text-blue-200" />
          <h3 className="text-xs sm:text-sm font-bold tracking-wide uppercase">
            2. Identificación del Vehículo
          </h3>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Selector de Tipo de Vehículo */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/70">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2.5">
              Tipo de Vehículo *
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              {TIPOS_VEHICULO.map((item) => {
                const active = tipoVehiculo === item.label;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() =>
                      handleTipoVehiculoChange(item.label, item.ruedasDefault)
                    }
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition cursor-pointer ${
                      active
                        ? 'bg-[#1B365D] text-white border-[#1B365D] shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-blue-400'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}

              {tipoVehiculo === 'Otro' && (
                <input
                  type="text"
                  required
                  placeholder="Especifique otro tipo..."
                  value={tipoVehiculoOtro}
                  onChange={(e) => setTipoVehiculoOtro(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-blue-400 dark:border-blue-500 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Marca (Obligatorio) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Marca *
              </label>
              <input
                type="text"
                required
                list="marcas-list"
                placeholder="Seleccione o escriba marca..."
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <datalist id="marcas-list">
                {marcasList.map((m) => (
                  <option key={m.id} value={m.valor} />
                ))}
              </datalist>
            </div>

            {/* Modelo (No obligatorio) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Modelo
              </label>
              <input
                type="text"
                placeholder="Ej: Wave 110S / Gol Trend (Opcional)"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Año aproximado (Obligatorio) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Año Aproximado *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: 2021 o S/D"
                value={anioAproximado}
                onChange={(e) => setAnioAproximado(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Color predominante (Obligatorio) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Color Predominante *
              </label>
              <input
                type="text"
                required
                list="colores-list"
                placeholder="Seleccione o escriba color..."
                value={colorPredominante}
                onChange={(e) => setColorPredominante(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <datalist id="colores-list">
                {coloresList.map((c) => (
                  <option key={c.id} value={c.valor} />
                ))}
              </datalist>
            </div>

            {/* Dominio (Patente - No obligatorio) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Dominio (Patente sin espacios ni guiones)
              </label>
              <input
                type="text"
                placeholder="Ej: A148KZP (Dejar vacío si no tiene chapa)"
                value={dominio}
                onChange={(e) =>
                  setDominio(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Cantidad de ruedas existentes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Cantidad de Ruedas Existentes *
              </label>
              <input
                type="number"
                min={0}
                max={18}
                required
                value={cantidadRuedas}
                onChange={(e) => setCantidadRuedas(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Número de motor (No obligatorio) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Número de Motor
              </label>
              <input
                type="text"
                placeholder="N.º de serie de motor (Opcional)"
                value={numeroMotor}
                onChange={(e) => setNumeroMotor(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Número de chasis (No obligatorio) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Número de Chasis / Cuadro
              </label>
              <input
                type="text"
                placeholder="Código VIN / N.º de cuadro o chasis (Opcional)"
                value={numeroChasis}
                onChange={(e) => setNumeroChasis(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Observaciones (Agregado inmediatamente después de Número de Chasis) */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Observaciones
              </label>
              <textarea
                rows={2}
                placeholder="Observaciones adicionales registradas en la ficha física (Opcional)..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECCIÓN 3: ESTADO FÍSICO Y CONDICIÓN DEL VEHÍCULO
      =================================================================== */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="bg-[#1B365D] text-white px-5 py-3 flex items-center gap-2.5">
          <Wrench className="w-4 h-4 text-blue-200" />
          <h3 className="text-xs sm:text-sm font-bold tracking-wide uppercase">
            3. Estado Físico y Condición del Vehículo
          </h3>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* Estado General */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2.5">
              Estado General del Vehículo *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ESTADOS_GENERALES.map((est) => {
                const active = estadoGeneral === est.label;
                return (
                  <button
                    key={est.label}
                    type="button"
                    onClick={() => setEstadoGeneral(est.label)}
                    className={`py-2.5 px-4 rounded-xl font-bold text-sm border-2 transition cursor-pointer flex items-center justify-center gap-2 ${
                      active
                        ? `${est.badgeColor} border-current shadow-sm`
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {active && <Check className="w-4 h-4" />}
                    {est.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grilla de Preguntas Sí / No idéntica al formulario oficial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {[
              {
                label: '¿Posee motor?',
                value: poseeMotor,
                setter: setPoseeMotor,
              },
              {
                label: '¿Posee batería?',
                value: poseeBateria,
                setter: setPoseeBateria,
              },
              {
                label: '¿Posee llave?',
                value: poseeLlave,
                setter: setPoseeLlave,
              },
              {
                label: '¿Posee documentación asociada?',
                value: poseeDocumentacion,
                setter: setPoseeDocumentacion,
              },
              {
                label: '¿Presenta faltantes relevantes?',
                value: presentaFaltantes,
                setter: setPresentaFaltantes,
              },
              {
                label: '¿Se encuentra desarmado?',
                value: seEncuentraDesarmado,
                setter: setSeEncuentraDesarmado,
              },
              {
                label: '¿Conserva chapa patente colocada?',
                value: conservaChapaPatente,
                setter: setConservaChapaPatente,
              },
              {
                label: '¿Resulta presumiblemente apto para circular?',
                value: aptoParaCircular,
                setter: setAptoParaCircular,
              },
            ].map((q) => (
              <div
                key={q.label}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70"
              >
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {q.label}
                </span>
                <div className="inline-flex rounded-lg p-1 bg-slate-200/80 dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => q.setter(true)}
                    className={`px-3.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                      q.value
                        ? 'bg-[#1B365D] text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => q.setter(false)}
                    className={`px-3.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                      !q.value
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Detalle de faltantes parametrizado */}
          <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                Detalle de faltantes (si corresponde) — Selección rápida parametrizada:
              </label>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {faltantesComunes.map((f) => {
                const selected = detalleFaltantes.includes(f.valor);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFaltanteChip(f.valor)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                      selected
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-amber-300 dark:border-slate-700 hover:bg-amber-100/50'
                    }`}
                  >
                    + {f.valor}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              placeholder="Escriba o complemente el detalle de piezas o accesorios faltantes..."
              value={detalleFaltantes}
              onChange={(e) => {
                setDetalleFaltantes(e.target.value);
                if (e.target.value.trim()) setPresentaFaltantes(true);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECCIÓN 4: REGISTRO FOTOGRÁFICO (OPCIONAL EN DATA ENTRY / OBLIGATORIO AL CULMINAR EN PREDIO)
      =================================================================== */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="bg-[#1B365D] text-white px-5 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Camera className="w-4 h-4 text-blue-200" />
            <h3 className="text-xs sm:text-sm font-bold tracking-wide uppercase">
              4. Registro Fotográfico (Opcional en Data Entry / Se puede adjuntar luego en Predio)
            </h3>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              totalFotosCargadas === 3
                ? 'bg-emerald-500 text-white'
                : 'bg-amber-400 text-slate-950'
            }`}
          >
            {totalFotosCargadas === 3
              ? '3 / 3 Fotos Listas (Registro Completo)'
              : `${totalFotosCargadas} / 3 Fotos (Quedará Pendiente de Fotos en Predio)`}
          </span>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Barra informativa de flujo dual Data Entry + Relevador en Predio */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-xs">
            <div className="flex items-center gap-2.5 text-blue-900 dark:text-blue-200">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                <strong>Flujo Data Entry + Corralón:</strong> Puede guardar la ficha ahora <strong>sin fotografías</strong> y el relevador del predio podrá buscarla por <strong>Patente</strong> desde la pestaña <em>"Relevamiento Fotográfico en Predio"</em> para tomar las 3 fotos (convertidas automáticamente a <code className="font-bold">WebP ~60 KB</code>).
              </span>
            </div>

            {totalFotosCargadas > 0 && (
              <div className="shrink-0 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                Peso original: {Math.round(totalOriginalKB)} KB → WebP: {Math.round(totalCompressedKB)} KB (-{ahorroPorcentaje}%)
              </div>
            )}
          </div>

          {/* Checks de vistas adjuntadas igual a la planilla */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Adjuntar fotografías:
            </span>
            {(['Frente', 'Lateral', 'Parte posterior', 'Otras'] as TipoFotoCheck[]).map(
              (item) => {
                const checked = tiposFotos.includes(item);
                return (
                  <label
                    key={item}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 cursor-pointer select-none text-xs font-semibold"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTipoFotoCheck(item)}
                      className="rounded text-[#1B365D] focus:ring-blue-500"
                    />
                    <span>{item}</span>
                  </label>
                );
              }
            )}
          </div>

          {/* 3 Recuadros Fotográficos: Vista Frontal, Vista Lateral, Vista Posterior */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(
              [
                {
                  slot: 'frontal' as const,
                  title: '1. Vista Frontal *',
                  placeholder: '[ Vista frontal ]',
                  state: fotoFrontal,
                  setter: setFotoFrontal,
                },
                {
                  slot: 'lateral' as const,
                  title: '2. Vista Lateral *',
                  placeholder: '[ Vista lateral ]',
                  state: fotoLateral,
                  setter: setFotoLateral,
                },
                {
                  slot: 'posterior' as const,
                  title: '3. Vista Posterior *',
                  placeholder: '[ Vista posterior ]',
                  state: fotoPosterior,
                  setter: setFotoPosterior,
                },
              ]
            ).map((box) => {
              const isCompressing = compressingSlot === box.slot;
              return (
                <div
                  key={box.slot}
                  className={`rounded-2xl border-2 transition overflow-hidden flex flex-col justify-between ${
                    box.state
                      ? 'border-emerald-500/60 bg-emerald-50/10 dark:bg-emerald-950/10'
                      : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40'
                  }`}
                >
                  {/* Cabecera del slot */}
                  <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      {box.title}
                    </span>
                    {box.state ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {box.state.compressedSizeKB} KB WebP
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                        Obligatoria
                      </span>
                    )}
                  </div>

                  {/* Cuerpo de vista previa o botón de carga */}
                  <div className="p-4 flex-1 flex flex-col items-center justify-center min-h-[210px]">
                    {isCompressing ? (
                      <div className="flex flex-col items-center gap-2 text-blue-600 dark:text-blue-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-xs font-semibold">
                          Convirtiendo a WebP liviano...
                        </span>
                      </div>
                    ) : box.state ? (
                      <div className="w-full space-y-3">
                        <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-[4/3] flex items-center justify-center">
                          <img
                            src={box.state.dataUrl}
                            alt={box.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>
                            {box.state.width}x{box.state.height}px ({box.state.originalSizeKB} KB →{' '}
                            <strong className="text-emerald-600 dark:text-emerald-400">
                              {box.state.compressedSizeKB} KB
                            </strong>
                            )
                          </span>
                          <button
                            type="button"
                            onClick={() => box.setter(null)}
                            className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Quitar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full min-h-[180px] flex flex-col items-center justify-center text-center p-3">
                        <span className="text-xs italic text-slate-400 mb-3">
                          {box.placeholder}
                        </span>

                        <div className="grid grid-cols-2 gap-2.5 w-full">
                          <label className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer transition">
                            <Camera className="w-5 h-5 mb-1" />
                            <span className="text-xs font-extrabold">
                              Tomar Foto
                            </span>
                            <span className="text-[10px] text-blue-100">
                              Cámara
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={(e) => handleFileUpload(e, box.slot, box.title)}
                              className="hidden"
                            />
                          </label>

                          <label className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300/70 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 shadow-sm cursor-pointer transition">
                            <ImageIcon className="w-5 h-5 mb-1 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-extrabold">
                              Abrir Galería
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              Archivos
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, box.slot, box.title)}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <span className="mt-3 px-3 py-1 rounded-full bg-slate-200/70 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                          Conversión automática a WebP
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Botón Final de Guardado y Generación de Ficha Impresa */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {totalFotosCargadas < 3 ? (
            <span className="text-blue-600 dark:text-blue-400 font-semibold">
              ℹ️ Modo Data Entry: Se guardará la ficha técnica como <strong>"Pendiente de Fotos"</strong> para que el relevador del corralón busque por patente y adjunte las 3 fotografías en el predio.
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              ✓ Las 3 fotografías reglamentarias están comprimidas en formato WebP liviano. El registro quedará 100% culminado.
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm bg-[#1B365D] hover:bg-[#132847] text-white shadow-md hover:shadow-lg transition disabled:opacity-50 cursor-pointer"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando en Base de Datos...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {totalFotosCargadas < 3
                ? 'Guardar Ficha'
                : 'Guardar Relevamiento Completo y Ver Ficha A4'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};
