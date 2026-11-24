import React from 'react';
import { RelevamientoVehiculo, TipoVehiculo, EstadoGeneral, TipoFotoCheck } from '../types';
import { formatearDominioVisual } from '../lib/supabase';
import { Printer, ArrowLeft } from 'lucide-react';

interface Props {
  registro: RelevamientoVehiculo;
  onClose?: () => void;
  standalone?: boolean;
}

const TIPOS_VEHICULO: TipoVehiculo[] = ['Automóvil', 'Camioneta', 'Motocicleta', 'Utilitario'];
const ESTADOS_GENERALES: EstadoGeneral[] = ['Bueno', 'Regular', 'Malo', 'Chatarra'];
const TIPOS_FOTO_CHECKS: TipoFotoCheck[] = ['Frente', 'Lateral', 'Parte posterior', 'Otras'];

function formatFechaDMY(dateStr: string | null | undefined): string {
  if (!dateStr) return '    /    /    ';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function CheckBox({ label, checked }: { label: string; checked: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 mr-5 font-medium text-[#111827]">
      <span>{label}</span>
      <span
        className={`inline-flex items-center justify-center w-3.5 h-3.5 border border-[#1B365D] text-[10px] font-bold leading-none ${
          checked ? 'bg-[#1B365D] text-white' : 'bg-white text-transparent'
        }`}
      >
        {checked ? '✓' : ''}
      </span>
    </span>
  );
}

function YesNoCell({ value }: { value: boolean }) {
  return (
    <div className="flex items-center gap-4 text-[11.5px]">
      <CheckBox label="Sí" checked={value === true} />
      <CheckBox label="No" checked={value === false} />
    </div>
  );
}

export const PrintableFicha: React.FC<Props> = ({ registro, onClose, standalone = false }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full">
      {/* Barra de Acciones (No sale en la hoja impresa) */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al listado
            </button>
          )}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Vista Previa Oficial de Expediente — {registro.numero_correlativo}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Optimizado para hoja A4 vertical con encabezado institucional y triple registro fotográfico.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#1B365D] hover:bg-[#142847] text-white shadow-sm transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Guardar PDF Oficial
          </button>
        </div>
      </div>

      {/* HOJA OFICIAL A4 - MUNICIPALIDAD DE SAN MIGUEL DE TUCUMÁN */}
      <div
        className={`print-sheet mx-auto bg-white text-black border border-slate-300 shadow-xl ${
          standalone ? '' : 'max-w-[210mm] p-6 sm:p-8'
        }`}
        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
      >
        {/* ENCABEZADO MUNICIPAL */}
        <div className="bg-[#1B365D] text-white text-center py-2.5 px-4 mb-2">
          <h1 className="text-base sm:text-lg font-bold tracking-wide uppercase">
            MUNICIPALIDAD DE SAN MIGUEL DE TUCUMÁN
          </h1>
          <p className="text-xs sm:text-[13px] font-normal text-slate-100">
            Secretaría de Movilidad Urbana — Dirección de Tránsito
          </p>
        </div>

        {/* TÍTULO DE LA FICHA */}
        <div className="text-center border-b-2 border-[#3B669B] pb-1.5 mb-3">
          <h2 className="text-sm sm:text-[15px] font-bold text-[#1B365D] tracking-wide uppercase">
            FICHA TÉCNICA DE RELEVAMIENTO DE VEHÍCULO SECUESTRADO
          </h2>
          <p className="text-[11px] italic text-slate-600">
            Corralón Municipal — Formulario para incorporar a expediente
          </p>
        </div>

        {/* SECCIÓN 1: DATOS DE REGISTRO E INGRESO */}
        <div className="mb-3">
          <div className="bg-[#1B365D] text-white px-2.5 py-1 flex items-center gap-2 text-xs font-bold uppercase">
            <span className="inline-block w-1 h-3.5 bg-white"></span>
            <span>1. DATOS DE REGISTRO E INGRESO</span>
          </div>

          <table className="w-full border-collapse border border-[#8EA9DB] text-[11.5px]">
            <tbody>
              <tr>
                <td className="w-[38%] bg-[#1B365D] text-white font-bold px-2.5 py-1.5 border border-[#8EA9DB] text-center">
                  idForm
                </td>
                <td className="w-[62%] bg-white font-bold text-sm text-[#1B365D] px-3 py-1.5 border border-[#8EA9DB]">
                  {registro.numero_correlativo}
                </td>
              </tr>
              <tr>
                <td className="bg-[#EBF0F7] font-medium text-slate-900 px-2.5 py-1 border border-[#8EA9DB]">
                  Dependencia que efectuó el secuestro
                </td>
                <td className="bg-white px-3 py-1 border border-[#8EA9DB]">
                  {registro.dependencia}
                </td>
              </tr>
              <tr>
                <td className="bg-[#EBF0F7] font-medium text-slate-900 px-2.5 py-1 border border-[#8EA9DB]">
                  Número de acta de infracción o secuestro
                </td>
                <td className="bg-white px-3 py-1 border border-[#8EA9DB] font-semibold">
                  {registro.numero_acta}
                </td>
              </tr>
              <tr>
                <td className="bg-[#EBF0F7] font-medium text-slate-900 px-2.5 py-1 border border-[#8EA9DB]">
                  Fecha de ingreso al corralón
                </td>
                <td className="bg-white px-3 py-1 border border-[#8EA9DB]">
                  {formatFechaDMY(registro.fecha_ingreso)}
                </td>
              </tr>
              <tr>
                <td className="bg-[#EBF0F7] font-medium text-slate-900 px-2.5 py-1 border border-[#8EA9DB]">
                  Lugar del secuestro
                </td>
                <td className="bg-white px-3 py-1 border border-[#8EA9DB]">
                  {registro.lugar_secuestro}
                </td>
              </tr>
              <tr>
                <td className="bg-[#EBF0F7] font-medium text-slate-900 px-2.5 py-1 border border-[#8EA9DB]">
                  Sector y ubicación dentro del corralón
                </td>
                <td className="bg-white px-3 py-1 border border-[#8EA9DB]">
                  {registro.sector_corralon}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECCIÓN 2: IDENTIFICACIÓN DEL VEHÍCULO */}
        <div className="mb-3">
          <div className="bg-[#1B365D] text-white px-2.5 py-1 flex items-center gap-2 text-xs font-bold uppercase">
            <span className="inline-block w-1 h-3.5 bg-white"></span>
            <span>2. IDENTIFICACIÓN DEL VEHÍCULO</span>
          </div>

          <table className="w-full border-collapse border border-[#8EA9DB] text-[11.5px]">
            <tbody>
              <tr>
                <td
                  colSpan={4}
                  className="bg-[#D9E2F3] px-2.5 py-1.5 border border-[#8EA9DB]"
                >
                  <span className="font-bold mr-3">Tipo de vehículo:</span>
                  {TIPOS_VEHICULO.map((t) => (
                    <CheckBox
                      key={t}
                      label={t}
                      checked={registro.tipo_vehiculo === t}
                    />
                  ))}
                  <span className="inline-flex items-center gap-1 font-medium">
                    <span>Otro:</span>
                    <span className="underline font-semibold ml-1">
                      {registro.tipo_vehiculo === 'Otro'
                        ? registro.tipo_vehiculo_otro || 'Sí'
                        : ''}
                    </span>
                  </span>
                </td>
              </tr>
              <tr>
                <td className="w-[22%] bg-[#EBF0F7] px-2.5 py-1 border border-[#8EA9DB] font-medium">
                  Marca
                </td>
                <td className="w-[28%] bg-white px-2.5 py-1 border border-[#8EA9DB] font-semibold">
                  {registro.marca}
                </td>
                <td className="w-[24%] bg-[#EBF0F7] px-2.5 py-1 border border-[#8EA9DB] font-medium">
                  Modelo
                </td>
                <td className="w-[26%] bg-white px-2.5 py-1 border border-[#8EA9DB] font-semibold">
                  {registro.modelo}
                </td>
              </tr>
              <tr>
                <td className="bg-[#EBF0F7] px-2.5 py-1 border border-[#8EA9DB] font-medium">
                  Año aproximado
                </td>
                <td className="bg-white px-2.5 py-1 border border-[#8EA9DB]">
                  {registro.anio_aproximado || 'S/D'}
                </td>
                <td className="bg-[#EBF0F7] px-2.5 py-1 border border-[#8EA9DB] font-medium">
                  Color predominante
                </td>
                <td className="bg-white px-2.5 py-1 border border-[#8EA9DB]">
                  {registro.color_predominante}
                </td>
              </tr>
              <tr>
                <td className="bg-[#EBF0F7] px-2.5 py-1 border border-[#8EA9DB] font-medium">
                  Dominio (patente)
                </td>
                <td className="bg-white px-2.5 py-1 border border-[#8EA9DB] font-bold uppercase tracking-wider">
                  {formatearDominioVisual(registro.dominio)}
                </td>
                <td className="bg-[#EBF0F7] px-2.5 py-1 border border-[#8EA9DB] font-medium">
                  Cantidad de ruedas existentes
                </td>
                <td className="bg-white px-2.5 py-1 border border-[#8EA9DB]">
                  {registro.cantidad_ruedas}
                </td>
              </tr>
              <tr>
                <td className="bg-[#EBF0F7] px-2.5 py-1 border border-[#8EA9DB] font-medium">
                  Número de motor
                </td>
                <td colSpan={3} className="bg-white px-2.5 py-1 border border-[#8EA9DB] font-mono text-[11px]">
                  {registro.numero_motor || 'No visible / Sin datos'}
                </td>
              </tr>
              <tr>
                <td className="bg-[#EBF0F7] px-2.5 py-1 border border-[#8EA9DB] font-medium">
                  Número de chasis
                </td>
                <td colSpan={3} className="bg-white px-2.5 py-1 border border-[#8EA9DB] font-mono text-[11px]">
                  {registro.numero_chasis || 'No visible / Sin datos'}
                </td>
              </tr>
              <tr>
                <td className="bg-[#EBF0F7] px-2.5 py-1 border border-[#8EA9DB] font-medium">
                  Observaciones
                </td>
                <td colSpan={3} className="bg-white px-2.5 py-1 border border-[#8EA9DB] text-[11px]">
                  {registro.observaciones || 'Sin observaciones adicionales.'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECCIÓN 3: ESTADO FÍSICO Y CONDICIÓN DEL VEHÍCULO */}
        <div className="mb-3">
          <div className="bg-[#1B365D] text-white px-2.5 py-1 flex items-center gap-2 text-xs font-bold uppercase">
            <span className="inline-block w-1 h-3.5 bg-white"></span>
            <span>3. ESTADO FÍSICO Y CONDICIÓN DEL VEHÍCULO</span>
          </div>

          <table className="w-full border-collapse border border-[#8EA9DB] text-[11.5px]">
            <tbody>
              <tr>
                <td className="w-[54%] bg-[#EBF0F7] font-bold px-2.5 py-1 border border-[#8EA9DB]">
                  Estado general
                </td>
                <td className="w-[46%] bg-white px-2.5 py-1 border border-[#8EA9DB]">
                  {ESTADOS_GENERALES.map((est) => (
                    <CheckBox
                      key={est}
                      label={est}
                      checked={registro.estado_general === est}
                    />
                  ))}
                </td>
              </tr>
              <tr>
                <td className="bg-[#EBF0F7] px-2.5 py-1 border border-[#8EA9DB]">
                  ¿Posee motor?
                </td>
                <td className="bg-white px-2.5 py-1 border border-[#8EA9DB]">
                  <YesNoCell value={registro.posee_motor} />
                </td>
              </tr>
              <tr>
                <td className="bg-[#EBF0F7] px-2.5 py-1 border border-[#8EA9DB]">
                  ¿Posee batería?
                </td>
                <td className="bg-white px-2.5 py-1 border border-[#8EA9DB]">
                  <YesNoCell value={registro.posee_bateria} />
                </td>
              </tr>
              <tr>
                <td className="bg-[#EBF0F7] px-2.5 py-1 border border-[#8EA9DB]">
                  ¿Posee llave?
                </td>
                <td className="bg-white px-2.5 py-1 border border-[#8EA9DB]">
                  <YesNoCell value={registro.posee_llave} />
                </td>
              </tr>
              <tr>
                <td className="bg-[#EBF0F7] px-2.5 py-1 border border-[#8EA9DB]">
                  ¿Posee documentación asociada?
                </td>
                <td className="bg-white px-2.5 py-1 border border-[#8EA9DB]">
                  <YesNoCell value={registro.posee_documentacion} />
                </td>
              </tr>
              <tr>
                <td className="bg-[#EBF0F7] px-2.5 py-1 border border-[#8EA9DB]">
                  ¿Presenta faltantes relevantes?
                </td>
                <td className="bg-white px-2.5 py-1 border border-[#8EA9DB]">
                  <YesNoCell value={registro.presenta_faltantes} />
                </td>
              </tr>
              <tr>
                <td className="bg-[#EBF0F7] pl-6 pr-2.5 py-1 border border-[#8EA9DB] italic">
                  Detalle de faltantes (si corresponde)
                </td>
                <td className="bg-white px-2.5 py-1 border border-[#8EA9DB] text-[11px]">
                  {registro.presenta_faltantes
                    ? registro.detalle_faltantes || 'Sin especificar'
                    : '—'}
                </td>
              </tr>
              <tr>
                <td className="bg-[#EBF0F7] px-2.5 py-1 border border-[#8EA9DB]">
                  ¿Se encuentra desarmado?
                </td>
                <td className="bg-white px-2.5 py-1 border border-[#8EA9DB]">
                  <YesNoCell value={registro.se_encuentra_desarmado} />
                </td>
              </tr>
              <tr>
                <td className="bg-[#EBF0F7] px-2.5 py-1 border border-[#8EA9DB]">
                  ¿Conserva chapa patente colocada?
                </td>
                <td className="bg-white px-2.5 py-1 border border-[#8EA9DB]">
                  <YesNoCell value={registro.conserva_chapa_patente} />
                </td>
              </tr>
              <tr>
                <td className="bg-[#EBF0F7] px-2.5 py-1 border border-[#8EA9DB]">
                  ¿Resulta presumiblemente apto para circular?
                </td>
                <td className="bg-white px-2.5 py-1 border border-[#8EA9DB]">
                  <YesNoCell value={registro.apto_para_circular} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECCIÓN 4: REGISTRO FOTOGRÁFICO */}
        <div className="mb-3">
          <div className="bg-[#1B365D] text-white px-2.5 py-1 flex items-center gap-2 text-xs font-bold uppercase">
            <span className="inline-block w-1 h-3.5 bg-white"></span>
            <span>4. REGISTRO FOTOGRÁFICO</span>
          </div>

          <table className="w-full border-collapse border border-[#8EA9DB] text-[11.5px]">
            <tbody>
              <tr>
                <td
                  colSpan={3}
                  className="bg-[#D9E2F3] px-2.5 py-1.5 border border-[#8EA9DB]"
                >
                  <span className="font-medium mr-3">Adjuntar fotografías:</span>
                  {TIPOS_FOTO_CHECKS.map((tf) => (
                    <CheckBox
                      key={tf}
                      label={tf}
                      checked={registro.tipos_fotos?.includes(tf)}
                    />
                  ))}
                </td>
              </tr>
              <tr>
                {/* Vista Frontal */}
                <td className="w-1/3 h-40 border border-[#8EA9DB] p-1.5 text-center align-middle bg-white">
                  {registro.foto_frontal_url ? (
                    <div className="flex flex-col items-center justify-between h-full">
                      <img
                        src={registro.foto_frontal_url}
                        alt="Vista frontal"
                        className="max-h-32 w-full object-contain rounded"
                      />
                      <span className="text-[10px] italic text-slate-500 mt-1">
                        [ Vista frontal ]
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] italic text-slate-400">[ Vista frontal ]</span>
                  )}
                </td>

                {/* Vista Lateral */}
                <td className="w-1/3 h-40 border border-[#8EA9DB] p-1.5 text-center align-middle bg-white">
                  {registro.foto_lateral_url ? (
                    <div className="flex flex-col items-center justify-between h-full">
                      <img
                        src={registro.foto_lateral_url}
                        alt="Vista lateral"
                        className="max-h-32 w-full object-contain rounded"
                      />
                      <span className="text-[10px] italic text-slate-500 mt-1">
                        [ Vista lateral ]
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] italic text-slate-400">[ Vista lateral ]</span>
                  )}
                </td>

                {/* Vista Posterior */}
                <td className="w-1/3 h-40 border border-[#8EA9DB] p-1.5 text-center align-middle bg-white">
                  {registro.foto_posterior_url ? (
                    <div className="flex flex-col items-center justify-between h-full">
                      <img
                        src={registro.foto_posterior_url}
                        alt="Vista posterior"
                        className="max-h-32 w-full object-contain rounded"
                      />
                      <span className="text-[10px] italic text-slate-500 mt-1">
                        [ Vista posterior ]
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] italic text-slate-400">[ Vista posterior ]</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
