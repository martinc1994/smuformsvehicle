import React, { useState } from 'react';
import { RelevamientoVehiculo, Usuario } from '../types';
import { eliminarRelevamiento, normalizarDominio, tieneLas3Fotos } from '../lib/supabase';
import {
  Search,
  Printer,
  Trash2,
  Eye,
  Car,
  Calendar,
  MapPin,
  FileCheck2,
  Filter,
  Camera,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface Props {
  registros: RelevamientoVehiculo[];
  usuarioActual: Usuario;
  onSelectPrint: (reg: RelevamientoVehiculo) => void;
  onGoToFotosPredio?: () => void;
  onRefresh: () => void;
}

export const RelevamientosList: React.FC<Props> = ({
  registros,
  usuarioActual,
  onSelectPrint,
  onGoToFotosPredio,
  onRefresh,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [filtroFotos, setFiltroFotos] = useState<string>('TODOS');

  const filtrados = registros.filter((r) => {
    const cleanQ = normalizarDominio(busqueda);
    const matchTexto =
      !busqueda.trim() ||
      r.numero_correlativo.toLowerCase().includes(busqueda.toLowerCase()) ||
      normalizarDominio(r.dominio).includes(cleanQ) ||
      r.numero_acta.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.modelo.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.agente_nombre.toLowerCase().includes(busqueda.toLowerCase());

    const matchTipo = filtroTipo === 'TODOS' || r.tipo_vehiculo === filtroTipo;
    const matchEstado =
      filtroEstado === 'TODOS' || r.estado_general === filtroEstado;
    const completoFotos = tieneLas3Fotos(r);
    const matchFotos =
      filtroFotos === 'TODOS' ||
      (filtroFotos === 'COMPLETOS' && completoFotos) ||
      (filtroFotos === 'PENDIENTES' && !completoFotos);

    return matchTexto && matchTipo && matchEstado && matchFotos;
  });

  const handleDelete = async (id: string, correlativo: string) => {
    if (
      !window.confirm(
        `¿Confirma eliminar el expediente ${correlativo}? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    await eliminarRelevamiento(id);
    onRefresh();
  };

  const getBadgeEstado = (estado: string) => {
    switch (estado) {
      case 'Bueno':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      case 'Regular':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
      case 'Malo':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30';
      default:
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y Buscador */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por idForm (FSMU-1000), Patente (Dominio), Acta, Marca, Modelo o Agente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          <select
            value={filtroFotos}
            onChange={(e) => setFiltroFotos(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
          >
            <option value="TODOS">Fotos: Todos</option>
            <option value="PENDIENTES">Pendientes de Fotos en Predio</option>
            <option value="COMPLETOS">Completos (3 Fotos)</option>
          </select>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
          >
            <option value="TODOS">Todos los vehículos</option>
            <option value="Motocicleta">Motocicletas</option>
            <option value="Automóvil">Automóviles</option>
            <option value="Camioneta">Camionetas</option>
            <option value="Utilitario">Utilitarios</option>
            <option value="Otro">Otros</option>
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="Bueno">Estado: Bueno</option>
            <option value="Regular">Estado: Regular</option>
            <option value="Malo">Estado: Malo</option>
            <option value="Chatarra">Estado: Chatarra</option>
          </select>
        </div>
      </div>

      {/* Grilla de Tarjetas de Vehículos Relevados */}
      {filtrados.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Car className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No se encontraron relevamientos con ese criterio
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Intente limpiar los filtros o cargue una nueva Ficha Técnica desde la pestaña "Nuevo Relevamiento".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtrados.map((reg) => (
            <div
              key={reg.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Cabecera de la tarjeta */}
                <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-[#1B365D] text-white text-xs font-extrabold tracking-wider">
                      {reg.numero_correlativo}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Acta: {reg.numero_acta}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getBadgeEstado(
                      reg.estado_general
                    )}`}
                  >
                    {reg.estado_general}
                  </span>
                </div>

                {/* Cuerpo con miniaturas de las 3 fotos obligatorias */}
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        {reg.tipo_vehiculo}
                      </div>
                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {reg.marca} {reg.modelo}{' '}
                        <span className="font-normal text-slate-500 text-sm">
                          ({reg.color_predominante})
                        </span>
                      </h4>
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-slate-900 dark:bg-slate-800 text-white font-mono font-extrabold text-xs tracking-widest border border-slate-700">
                      {reg.dominio || 'S/DOM'}
                    </div>
                  </div>

                  {/* Miniaturas de las 3 fotografías WebP o alerta de Pendiente en Predio */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { url: reg.foto_frontal_url, label: 'Frontal' },
                      { url: reg.foto_lateral_url, label: 'Lateral' },
                      { url: reg.foto_posterior_url, label: 'Posterior' },
                    ].map((f, idx) =>
                      f.url ? (
                        <div
                          key={idx}
                          onClick={() => onSelectPrint(reg)}
                          className="relative rounded-xl overflow-hidden bg-slate-950 aspect-[4/3] border border-slate-200 dark:border-slate-800 cursor-pointer group"
                        >
                          <img
                            src={f.url}
                            alt={f.label}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                          <span className="absolute bottom-1 left-1 right-1 bg-black/65 text-white text-[10px] font-semibold text-center py-0.5 rounded">
                            {f.label}
                          </span>
                        </div>
                      ) : (
                        <div
                          key={idx}
                          onClick={() => onGoToFotosPredio && onGoToFotosPredio()}
                          className="rounded-xl bg-amber-50/70 dark:bg-amber-950/20 aspect-[4/3] border border-dashed border-amber-400 dark:border-amber-600/50 flex flex-col items-center justify-center p-2 text-center cursor-pointer hover:bg-amber-100/60 transition"
                        >
                          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 mb-1" />
                          <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300">
                            Sin {f.label}
                          </span>
                        </div>
                      )
                    )}
                  </div>

                  {/* Metadatos del secuestro */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{reg.sector_corralon}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Ingreso: {reg.fecha_ingreso || 'S/D'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:col-span-2">
                      <FileCheck2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Relevó: <strong>{reg.agente_nombre}</strong> (Leg.{' '}
                        {reg.agente_legajo})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pie de tarjeta con acciones */}
              <div className="px-5 py-3 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectPrint(reg)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#1B365D] hover:bg-[#14294a] text-white shadow-sm transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Ver Ficha Oficial / Imprimir A4
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectPrint(reg)}
                    className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Vista previa de Ficha Técnica"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {usuarioActual.rol === 'admin' && (
                    <button
                      onClick={() =>
                        handleDelete(reg.id, reg.numero_correlativo)
                      }
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Eliminar registro (Solo Administrador)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
