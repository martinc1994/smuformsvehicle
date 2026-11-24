export type UserRole = 'admin' | 'relevador';

export interface Usuario {
  id: string;
  username: string;
  password_hash: string;
  nombre_completo: string;
  legajo: string;
  rol: UserRole;
  activo: boolean;
  created_at: string;
}

export type CategoriaParametro =
  | 'dependencia'
  | 'sector_corralon'
  | 'marca'
  | 'color'
  | 'faltante_comun'
  | 'lugar_secuestro';

export interface Parametro {
  id: string;
  categoria: CategoriaParametro;
  valor: string;
  activo: boolean;
}

export type TipoVehiculo = 'Automóvil' | 'Camioneta' | 'Motocicleta' | 'Utilitario' | 'Otro';
export type EstadoGeneral = 'Bueno' | 'Regular' | 'Malo' | 'Chatarra';
export type TipoFotoCheck = 'Frente' | 'Lateral' | 'Parte posterior' | 'Otras';

export interface FotoComprimida {
  slot: 'frontal' | 'lateral' | 'posterior';
  label: string;
  dataUrl: string;
  originalSizeKB: number;
  compressedSizeKB: number;
  width: number;
  height: number;
  format: 'image/webp' | 'image/jpeg';
  file?: File;
}

export interface RelevamientoVehiculo {
  id: string;
  numero_correlativo: string;

  // 1. Datos de Registro e Ingreso
  dependencia: string;
  numero_acta: string;
  fecha_ingreso: string;
  lugar_secuestro: string;
  sector_corralon: string;

  // 2. Identificación del Vehículo
  tipo_vehiculo: TipoVehiculo;
  tipo_vehiculo_otro: string;
  marca: string;
  modelo: string;
  anio_aproximado: string;
  color_predominante: string;
  dominio: string;
  cantidad_ruedas: number;
  numero_motor: string;
  numero_chasis: string;

  // 3. Estado Físico y Condición del Vehículo
  estado_general: EstadoGeneral;
  posee_motor: boolean;
  posee_bateria: boolean;
  posee_llave: boolean;
  posee_documentacion: boolean;
  presenta_faltantes: boolean;
  detalle_faltantes: string;
  se_encuentra_desarmado: boolean;
  conserva_chapa_patente: boolean;
  apto_para_circular: boolean;

  // 4. Registro Fotográfico
  tipos_fotos: TipoFotoCheck[];
  foto_frontal_url: string;
  foto_lateral_url: string;
  foto_posterior_url: string;
  fotos_metadata: {
    slot: string;
    originalSizeKB: number;
    compressedSizeKB: number;
    format: string;
  }[];

  // 5. Observaciones y Firma del Agente
  observaciones: string;
  agente_id: string;
  agente_nombre: string;
  agente_legajo: string;
  fecha_relevamiento: string;
  created_at: string;
}
