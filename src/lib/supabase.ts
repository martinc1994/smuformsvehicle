import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Parametro, RelevamientoVehiculo, Usuario, FotoComprimida } from '../types';

const STORAGE_KEYS = {
  SUPABASE_URL: 'smu_supabase_url',
  SUPABASE_KEY: 'smu_supabase_anon_key',
  USUARIOS: 'smu_usuarios_v1',
  PARAMETROS: 'smu_parametros_v1',
  RELEVAMIENTOS: 'smu_relevamientos_v1',
};

// Semilla inicial de Usuarios con el administrador obligatorio MCastillo
const INITIAL_USUARIOS: Usuario[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    username: 'MCastillo',
    password_hash: 'Movilidad2026.',
    nombre_completo: 'Martín Castillo',
    legajo: 'ADM-2026',
    rol: 'admin',
    activo: true,
    created_at: '2026-01-01T08:00:00.000Z',
  },
];

// Semilla inicial de Parámetros Oficiales para San Miguel de Tucumán
const INITIAL_PARAMETROS: Parametro[] = [
  // Dependencias que efectúan el secuestro
  { id: 'dep-1', categoria: 'dependencia', valor: 'Dirección de Tránsito SMU', activo: true },
  { id: 'dep-2', categoria: 'dependencia', valor: 'Patrulla de Protección Ciudadana (PPC)', activo: true },
  { id: 'dep-3', categoria: 'dependencia', valor: 'Dirección de Transporte Público SMU', activo: true },
  { id: 'dep-4', categoria: 'dependencia', valor: 'Policía Vial — Operativo Conjunto SMU', activo: true },
  { id: 'dep-5', categoria: 'dependencia', valor: 'Tribunal Municipal de Faltas', activo: true },

  // Sectores del Corralón Municipal
  { id: 'sec-1', categoria: 'sector_corralon', valor: 'Playa A — Sector Motos (Filas 1 a 10)', activo: true },
  { id: 'sec-2', categoria: 'sector_corralon', valor: 'Playa B — Automóviles Livianos', activo: true },
  { id: 'sec-3', categoria: 'sector_corralon', valor: 'Playa C — Camionetas y Utilitarios', activo: true },
  { id: 'sec-4', categoria: 'sector_corralon', valor: 'Galpón Techado N.º 1 (Custodia Judicial)', activo: true },
  { id: 'sec-5', categoria: 'sector_corralon', valor: 'Sector Compactación / Chatarra (Playa Sur)', activo: true },

  // Marcas frecuentes en vía pública
  { id: 'mar-1', categoria: 'marca', valor: 'Honda', activo: true },
  { id: 'mar-2', categoria: 'marca', valor: 'Motomel', activo: true },
  { id: 'mar-3', categoria: 'marca', valor: 'Zanella', activo: true },
  { id: 'mar-4', categoria: 'marca', valor: 'Corven', activo: true },
  { id: 'mar-5', categoria: 'marca', valor: 'Gilera', activo: true },
  { id: 'mar-6', categoria: 'marca', valor: 'Yamaha', activo: true },
  { id: 'mar-7', categoria: 'marca', valor: 'Volkswagen', activo: true },
  { id: 'mar-8', categoria: 'marca', valor: 'Renault', activo: true },
  { id: 'mar-9', categoria: 'marca', valor: 'Fiat', activo: true },
  { id: 'mar-10', categoria: 'marca', valor: 'Chevrolet', activo: true },
  { id: 'mar-11', categoria: 'marca', valor: 'Ford', activo: true },
  { id: 'mar-12', categoria: 'marca', valor: 'Peugeot', activo: true },
  { id: 'mar-13', categoria: 'marca', valor: 'Toyota', activo: true },

  // Colores predominantes
  { id: 'col-1', categoria: 'color', valor: 'Negro', activo: true },
  { id: 'col-2', categoria: 'color', valor: 'Blanco', activo: true },
  { id: 'col-3', categoria: 'color', valor: 'Gris Plata', activo: true },
  { id: 'col-4', categoria: 'color', valor: 'Gris Oscuro', activo: true },
  { id: 'col-5', categoria: 'color', valor: 'Rojo', activo: true },
  { id: 'col-6', categoria: 'color', valor: 'Azul', activo: true },
  { id: 'col-7', categoria: 'color', valor: 'Bordó', activo: true },
  { id: 'col-8', categoria: 'color', valor: 'Verde / Sin pintura', activo: true },

  // Lugares / Avenidas frecuentes de secuestro en SMU
  { id: 'lug-1', categoria: 'lugar_secuestro', valor: 'Av. Mate de Luna y Av. Alem', activo: true },
  { id: 'lug-2', categoria: 'lugar_secuestro', valor: 'Av. 24 de Septiembre al 400 (Microcentro)', activo: true },
  { id: 'lug-3', categoria: 'lugar_secuestro', valor: 'Av. Sarmiento y Av. Avellaneda', activo: true },
  { id: 'lug-4', categoria: 'lugar_secuestro', valor: 'Av. Belgrano y Av. Mitre', activo: true },
  { id: 'lug-5', categoria: 'lugar_secuestro', valor: 'Av. Roca y Av. Sáenz Peña', activo: true },
  { id: 'lug-6', categoria: 'lugar_secuestro', valor: 'Calle San Martín al 700', activo: true },

  // Faltantes comunes (Chips de selección rápida)
  { id: 'fal-1', categoria: 'faltante_comun', valor: 'Sin espejos retrovisores', activo: true },
  { id: 'fal-2', categoria: 'faltante_comun', valor: 'Falta óptica delantera', activo: true },
  { id: 'fal-3', categoria: 'faltante_comun', valor: 'Falta plástico lateral / cachas', activo: true },
  { id: 'fal-4', categoria: 'faltante_comun', valor: 'Sin caño de escape original', activo: true },
  { id: 'fal-5', categoria: 'faltante_comun', valor: 'Sin tablero instrumental', activo: true },
  { id: 'fal-6', categoria: 'faltante_comun', valor: 'Asiento roto / faltante', activo: true },
  { id: 'fal-7', categoria: 'faltante_comun', valor: 'Falta rueda de auxilio / estéreo', activo: true },
  { id: 'fal-8', categoria: 'faltante_comun', valor: 'Parabrisas astillado / cristales rotos', activo: true },
];

// Generar SVG de muestra liviano como placeholder visual para el registro de demostración
function createDemoPhotoSvg(title: string, subtitle: string, bg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <rect width="800" height="600" fill="${bg}"/>
    <rect x="30" y="30" width="740" height="540" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="3" stroke-dasharray="12 8"/>
    <circle cx="400" cy="240" r="68" fill="#ffffff" fill-opacity="0.15"/>
    <path d="M368 235 L432 235 M400 205 L400 265" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>
    <text x="400" y="365" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="bold" fill="#ffffff" text-anchor="middle">${title}</text>
    <text x="400" y="408" font-family="Inter, Arial, sans-serif" font-size="20" fill="#e2e8f0" text-anchor="middle">${subtitle}</text>
    <text x="400" y="520" font-family="Inter, Arial, sans-serif" font-size="16" fill="#cbd5e1" text-anchor="middle">MUNICIPALIDAD DE SAN MIGUEL DE TUCUMÁN — FORMATO WEBP LIVIANO</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const INITIAL_RELEVAMIENTOS: RelevamientoVehiculo[] = [
  {
    id: 'rel-smu-0001',
    numero_correlativo: 'FSMU-1000',
    dependencia: 'Dirección de Tránsito SMU',
    numero_acta: 'ACTA-84920-T',
    fecha_ingreso: '2026-11-20',
    lugar_secuestro: 'Av. Mate de Luna y Av. Alem',
    sector_corralon: 'Playa A — Sector Motos (Filas 1 a 10)',
    tipo_vehiculo: 'Motocicleta',
    tipo_vehiculo_otro: '',
    marca: 'Honda',
    modelo: 'Wave 110S',
    anio_aproximado: '2022',
    color_predominante: 'Rojo',
    dominio: 'A148KZP',
    cantidad_ruedas: 2,
    numero_motor: 'SDH152FMH-2291841',
    numero_chasis: '8CHSDH110NJ094120',
    estado_general: 'Regular',
    posee_motor: true,
    posee_bateria: false,
    posee_llave: false,
    posee_documentacion: false,
    presenta_faltantes: true,
    detalle_faltantes: 'Sin espejos retrovisores, Falta plástico lateral / cachas',
    se_encuentra_desarmado: false,
    conserva_chapa_patente: true,
    apto_para_circular: false,
    tipos_fotos: ['Frente', 'Lateral', 'Parte posterior'],
    foto_frontal_url: createDemoPhotoSvg('VISTA FRONTAL', 'Dominio A148KZP - Honda Wave 110S', '#1e3a5f'),
    foto_lateral_url: createDemoPhotoSvg('VISTA LATERAL', 'Sector Playa A - Fila 3', '#1f2937'),
    foto_posterior_url: createDemoPhotoSvg('VISTA POSTERIOR', 'Con chapa patente colocada', '#0f3460'),
    fotos_metadata: [
      { slot: 'frontal', originalSizeKB: 3420, compressedSizeKB: 64.2, format: 'image/webp' },
      { slot: 'lateral', originalSizeKB: 3890, compressedSizeKB: 71.8, format: 'image/webp' },
      { slot: 'posterior', originalSizeKB: 3150, compressedSizeKB: 58.4, format: 'image/webp' },
    ],
    observaciones: 'Vehículo retenido en operativo de control vehicular por falta de documentación habilitante y escape libre antirreglamentario. Ingresa mediante grúa municipal N.º 04.',
    agente_id: '00000000-0000-4000-8000-000000000001',
    agente_nombre: 'Martín Castillo',
    agente_legajo: 'ADM-2026',
    fecha_relevamiento: '2026-11-24',
    created_at: '2026-11-24T10:00:00.000Z',
  },
  {
    id: 'rel-smu-0002',
    numero_correlativo: 'FSMU-1001',
    dependencia: 'Patrulla de Protección Ciudadana (PPC)',
    numero_acta: 'ACTA-85104-T',
    fecha_ingreso: '2026-11-22',
    lugar_secuestro: 'Av. 24 de Septiembre al 400 (Microcentro)',
    sector_corralon: 'Playa B — Automóviles Livianos',
    tipo_vehiculo: 'Automóvil',
    tipo_vehiculo_otro: '',
    marca: 'Volkswagen',
    modelo: 'Gol Trend 1.6',
    anio_aproximado: '2018',
    color_predominante: 'Gris Plata',
    dominio: 'AC452MK',
    cantidad_ruedas: 4,
    numero_motor: 'CFZ-884120',
    numero_chasis: '9BWAB45U7JT091234',
    estado_general: 'Bueno',
    posee_motor: true,
    posee_bateria: true,
    posee_llave: false,
    posee_documentacion: false,
    presenta_faltantes: true,
    detalle_faltantes: 'Falta rueda de auxilio / estéreo',
    se_encuentra_desarmado: false,
    conserva_chapa_patente: true,
    apto_para_circular: true,
    tipos_fotos: [],
    foto_frontal_url: '',
    foto_lateral_url: '',
    foto_posterior_url: '',
    fotos_metadata: [],
    observaciones: 'Ficha física cargada por equipo de Data Entry. Pendiente localización física en Playa B por agente relevador para toma de las 3 fotografías reglamentarias.',
    agente_id: '00000000-0000-4000-8000-000000000001',
    agente_nombre: 'Martín Castillo',
    agente_legajo: 'ADM-2026',
    fecha_relevamiento: '2026-11-24',
    created_at: '2026-11-24T10:30:00.000Z',
  },
];

const DEFAULT_SMU_SUPABASE_URL = 'https://uzzbxdjxkesogklzkura.supabase.co';
const DEFAULT_SMU_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6emJ4ZGp4a2Vzb2drbHprdXJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU1MjA1ODMsImV4cCI6MjExMTA5NjU4M30.L0GaahtyV_adRoR87J38Bh1MjXJHtR5GZBrxXlnFMk8';

export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SMU_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SMU_SUPABASE_ANON_KEY;

  const localUrl = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || '';
  const localKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY) || '';

  const url = (localUrl || envUrl).trim();
  const anonKey = (localKey || envKey).trim();

  const isConfigured =
    Boolean(url && anonKey) &&
    url.startsWith('http') &&
    !url.includes('tu-proyecto.supabase.co');

  return { url, anonKey, isConfigured };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (url.trim() && anonKey.trim()) {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url.trim());
    localStorage.setItem(STORAGE_KEYS.SUPABASE_KEY, anonKey.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_KEY);
  }
  cachedClient = null;
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;
  if (!cachedClient) {
    cachedClient = createClient(url, anonKey);
  }
  return cachedClient;
}

// Helpers de Persistencia Local (Sincronizada o Fallback si aún no conectó las keys de Supabase)
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getLocalUsuarios(): Usuario[] {
  const raw = localStorage.getItem(STORAGE_KEYS.USUARIOS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(INITIAL_USUARIOS));
    return INITIAL_USUARIOS;
  }
  try {
    // Limpiar usuario de prueba JCarol si había quedado guardado en el navegador
    const parsed: Usuario[] = (JSON.parse(raw) as Usuario[]).filter(
      (u) => u.username.toLowerCase() !== 'jcarol'
    );
    // Garantizar que MCastillo siempre exista con las credenciales solicitadas
    const hasAdmin = parsed.some(
      (u) => u.username.toLowerCase() === 'mcastillo'
    );
    if (!hasAdmin) {
      parsed.unshift(INITIAL_USUARIOS[0]);
    }
    localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(parsed));
    return parsed;
  } catch {
    return INITIAL_USUARIOS;
  }
}

function getLocalParametros(): Parametro[] {
  const raw = localStorage.getItem(STORAGE_KEYS.PARAMETROS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.PARAMETROS, JSON.stringify(INITIAL_PARAMETROS));
    return INITIAL_PARAMETROS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_PARAMETROS;
  }
}

function getLocalRelevamientos(): RelevamientoVehiculo[] {
  const raw = localStorage.getItem(STORAGE_KEYS.RELEVAMIENTOS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.RELEVAMIENTOS, JSON.stringify(INITIAL_RELEVAMIENTOS));
    return INITIAL_RELEVAMIENTOS;
  }
  try {
    const parsed: RelevamientoVehiculo[] = JSON.parse(raw);
    let changed = false;
    const migrated = parsed.map((item, idx) => {
      if (item.numero_correlativo === 'INV-2026-0001') {
        changed = true;
        return { ...item, numero_correlativo: 'FSMU-1000' };
      }
      if (item.numero_correlativo === 'INV-2026-0002') {
        changed = true;
        return { ...item, numero_correlativo: 'FSMU-1001' };
      }
      if (item.numero_correlativo?.startsWith('INV-')) {
        changed = true;
        return { ...item, numero_correlativo: `FSMU-${1000 + idx}` };
      }
      return item;
    });
    if (changed) {
      localStorage.setItem(STORAGE_KEYS.RELEVAMIENTOS, JSON.stringify(migrated));
    }
    return migrated;
  } catch {
    return INITIAL_RELEVAMIENTOS;
  }
}

// ============================================================================
// API DE AUTENTICACIÓN Y GESTIÓN DE USUARIOS
// ============================================================================

export async function loginUsuario(
  usernameInput: string,
  passwordInput: string
): Promise<{ user: Usuario | null; error?: string }> {
  const cleanUser = usernameInput.trim();
  const cleanPass = passwordInput;

  // Garantizar acceso al superadmin MCastillo / Movilidad2026.
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .ilike('username', cleanUser)
        .eq('activo', true)
        .maybeSingle();

      if (!error && data) {
        if (data.password_hash === cleanPass) {
          return { user: data as Usuario };
        }
        return { user: null, error: 'Contraseña incorrecta.' };
      }
    } catch {
      // Si la tabla aún no fue migrada en Supabase, continuar con validación local
    }
  }

  const localUsers = getLocalUsuarios();
  const found = localUsers.find(
    (u) => u.username.toLowerCase() === cleanUser.toLowerCase() && u.activo
  );

  if (!found) {
    return { user: null, error: 'Usuario no encontrado o inactivo.' };
  }
  if (found.password_hash !== cleanPass) {
    return { user: null, error: 'Contraseña incorrecta.' };
  }

  return { user: found };
}

export async function fetchUsuarios(): Promise<Usuario[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(data));
        return data as Usuario[];
      }
    } catch {
      // Fallback a local
    }
  }
  return getLocalUsuarios();
}

export async function crearUsuario(
  nuevo: Omit<Usuario, 'id' | 'created_at'>
): Promise<{ data?: Usuario; error?: string }> {
  const cleanUsername = nuevo.username.trim();
  const usuarios = await fetchUsuarios();
  if (
    usuarios.some(
      (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
    )
  ) {
    return { error: 'Ya existe un usuario con ese nombre de acceso.' };
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .insert([
          {
            username: cleanUsername,
            password_hash: nuevo.password_hash,
            nombre_completo: nuevo.nombre_completo.trim(),
            legajo: nuevo.legajo.trim().toUpperCase(),
            rol: nuevo.rol,
            activo: true,
          },
        ])
        .select()
        .single();

      if (error) {
        return {
          error: `Error al guardar en Supabase: ${error.message}`,
        };
      }

      if (data) {
        const currentLocal = getLocalUsuarios().filter(
          (u) => u.username.toLowerCase() !== cleanUsername.toLowerCase()
        );
        const updated = [...currentLocal, data as Usuario];
        localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(updated));
        return { data: data as Usuario };
      }
    } catch (err: any) {
      return {
        error: err?.message || 'Error de red al intentar crear el usuario en Supabase.',
      };
    }
  }

  const userObj: Usuario = {
    ...nuevo,
    username: cleanUsername,
    id: generateUUID(),
    created_at: new Date().toISOString(),
  };

  const updated = [...getLocalUsuarios(), userObj];
  localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(updated));
  return { data: userObj };
}

export async function eliminarUsuario(id: string, username: string): Promise<{ error?: string }> {
  if (username.toLowerCase() === 'mcastillo') {
    return { error: 'El administrador principal MCastillo no puede eliminarse.' };
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('usuarios').delete().eq('id', id);
      if (error) {
        return { error: error.message };
      }
    } catch (err: any) {
      return { error: err?.message || 'No se pudo eliminar en Supabase.' };
    }
  }

  const updated = getLocalUsuarios().filter((u) => u.id !== id && u.username !== username);
  localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(updated));
  return {};
}

export async function toggleEstadoUsuario(id: string, activo: boolean): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('usuarios').update({ activo }).eq('id', id);
    } catch {
      // Fallback
    }
  }
  const updated = getLocalUsuarios().map((u) => (u.id === id ? { ...u, activo } : u));
  localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(updated));
}

// ============================================================================
// API DE PARÁMETROS DEL FORMULARIO
// ============================================================================

export async function fetchParametros(): Promise<Parametro[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('parametros')
        .select('*')
        .order('valor', { ascending: true });
      if (!error && data && data.length > 0) {
        localStorage.setItem(STORAGE_KEYS.PARAMETROS, JSON.stringify(data));
        return data as Parametro[];
      }
    } catch {
      // Fallback
    }
  }
  return getLocalParametros();
}

export async function agregarParametro(
  categoria: Parametro['categoria'],
  valor: string
): Promise<Parametro> {
  const nuevo: Parametro = {
    id: crypto.randomUUID ? crypto.randomUUID() : `par-${Date.now()}`,
    categoria,
    valor: valor.trim(),
    activo: true,
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('parametros')
        .insert([nuevo])
        .select()
        .single();
      if (!error && data) {
        const list = [...getLocalParametros(), data as Parametro];
        localStorage.setItem(STORAGE_KEYS.PARAMETROS, JSON.stringify(list));
        return data as Parametro;
      }
    } catch {
      // Fallback
    }
  }

  const list = [...getLocalParametros(), nuevo];
  localStorage.setItem(STORAGE_KEYS.PARAMETROS, JSON.stringify(list));
  return nuevo;
}

export async function eliminarParametro(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('parametros').delete().eq('id', id);
    } catch {
      // Fallback
    }
  }
  const list = getLocalParametros().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PARAMETROS, JSON.stringify(list));
}

// ============================================================================
// API DE RELEVAMIENTOS Y SUBIDA DE FOTOS COMPRIMIDAS A SUPABASE STORAGE
// ============================================================================

export async function fetchRelevamientos(): Promise<RelevamientoVehiculo[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('relevamientos')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        localStorage.setItem(STORAGE_KEYS.RELEVAMIENTOS, JSON.stringify(data));
        return data as RelevamientoVehiculo[];
      }
    } catch {
      // Fallback
    }
  }
  return getLocalRelevamientos();
}

export async function generarSiguienteCorrelativo(): Promise<string> {
  const lista = await fetchRelevamientos();
  let maxNumber = 999; // Para que el primer registro sea FSMU-1000

  for (const item of lista) {
    const corr = (item.numero_correlativo || '').trim().toUpperCase();
    const match = corr.match(/^FSMU-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  }

  // Si hay registros previos con otro formato pero ninguno FSMU-XXXX aún, arrancar en 1000 + cantidad
  if (maxNumber === 999 && lista.length > 0) {
    maxNumber = 999 + lista.length;
  }

  return `FSMU-${maxNumber + 1}`;
}

async function uploadPhotoIfSupabaseAvailable(
  foto: FotoComprimida,
  correlativo: string
): Promise<string> {
  const supabase = getSupabaseClient();
  if (!supabase || !foto.file) {
    return foto.dataUrl;
  }

  try {
    const ext = foto.format === 'image/webp' ? 'webp' : 'jpg';
    const filePath = `${correlativo}/${foto.slot}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('vehiculos-fotos')
      .upload(filePath, foto.file, {
        contentType: foto.format,
        upsert: true,
      });

    if (!error) {
      const { data } = supabase.storage.from('vehiculos-fotos').getPublicUrl(filePath);
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    }
  } catch {
    // Si el bucket no está creado aún, se almacena el WebP comprimido en base64 (solo ~55KB)
  }

  return foto.dataUrl;
}

export function normalizarDominio(dom: string): string {
  return (dom || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function tieneLas3Fotos(reg: RelevamientoVehiculo): boolean {
  return Boolean(
    reg.foto_frontal_url && reg.foto_lateral_url && reg.foto_posterior_url
  );
}

export async function guardarRelevamiento(
  payload: Omit<
    RelevamientoVehiculo,
    'id' | 'created_at' | 'foto_frontal_url' | 'foto_lateral_url' | 'foto_posterior_url' | 'fotos_metadata'
  >,
  fotos: {
    frontal?: FotoComprimida | null;
    lateral?: FotoComprimida | null;
    posterior?: FotoComprimida | null;
  }
): Promise<RelevamientoVehiculo> {
  const [frontalUrl, lateralUrl, posteriorUrl] = await Promise.all([
    fotos.frontal
      ? uploadPhotoIfSupabaseAvailable(fotos.frontal, payload.numero_correlativo)
      : Promise.resolve(''),
    fotos.lateral
      ? uploadPhotoIfSupabaseAvailable(fotos.lateral, payload.numero_correlativo)
      : Promise.resolve(''),
    fotos.posterior
      ? uploadPhotoIfSupabaseAvailable(fotos.posterior, payload.numero_correlativo)
      : Promise.resolve(''),
  ]);

  const metadata: RelevamientoVehiculo['fotos_metadata'] = [];
  if (fotos.frontal) {
    metadata.push({
      slot: 'frontal',
      originalSizeKB: fotos.frontal.originalSizeKB,
      compressedSizeKB: fotos.frontal.compressedSizeKB,
      format: fotos.frontal.format,
    });
  }
  if (fotos.lateral) {
    metadata.push({
      slot: 'lateral',
      originalSizeKB: fotos.lateral.originalSizeKB,
      compressedSizeKB: fotos.lateral.compressedSizeKB,
      format: fotos.lateral.format,
    });
  }
  if (fotos.posterior) {
    metadata.push({
      slot: 'posterior',
      originalSizeKB: fotos.posterior.originalSizeKB,
      compressedSizeKB: fotos.posterior.compressedSizeKB,
      format: fotos.posterior.format,
    });
  }

  const dominioLimpio = normalizarDominio(payload.dominio) || 'S/D';
  const idFormFinal =
    payload.numero_correlativo?.trim() || (await generarSiguienteCorrelativo());

  const nuevoRegistro: RelevamientoVehiculo = {
    ...payload,
    numero_correlativo: idFormFinal,
    dominio: dominioLimpio,
    id: generateUUID(),
    foto_frontal_url: frontalUrl,
    foto_lateral_url: lateralUrl,
    foto_posterior_url: posteriorUrl,
    fotos_metadata: metadata,
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { id: _omitId, created_at: _omitCreated, ...insertPayload } =
        nuevoRegistro;
      const { data, error } = await supabase
        .from('relevamientos')
        .insert([insertPayload])
        .select()
        .single();
      if (!error && data) {
        const list = [data as RelevamientoVehiculo, ...getLocalRelevamientos()];
        localStorage.setItem(STORAGE_KEYS.RELEVAMIENTOS, JSON.stringify(list));
        return data as RelevamientoVehiculo;
      }
    } catch {
      // Fallback local
    }
  }

  const list = [nuevoRegistro, ...getLocalRelevamientos()];
  localStorage.setItem(STORAGE_KEYS.RELEVAMIENTOS, JSON.stringify(list));
  return nuevoRegistro;
}

export async function adjuntarFotosARelevamiento(
  registroActual: RelevamientoVehiculo,
  fotos: {
    frontal?: FotoComprimida | null;
    lateral?: FotoComprimida | null;
    posterior?: FotoComprimida | null;
  },
  agenteRelevador?: Usuario
): Promise<RelevamientoVehiculo> {
  const [frontalUrl, lateralUrl, posteriorUrl] = await Promise.all([
    fotos.frontal
      ? uploadPhotoIfSupabaseAvailable(fotos.frontal, registroActual.numero_correlativo)
      : Promise.resolve(registroActual.foto_frontal_url || ''),
    fotos.lateral
      ? uploadPhotoIfSupabaseAvailable(fotos.lateral, registroActual.numero_correlativo)
      : Promise.resolve(registroActual.foto_lateral_url || ''),
    fotos.posterior
      ? uploadPhotoIfSupabaseAvailable(fotos.posterior, registroActual.numero_correlativo)
      : Promise.resolve(registroActual.foto_posterior_url || ''),
  ]);

  const prevMeta = (registroActual.fotos_metadata || []).filter(
    (m) =>
      !(fotos.frontal && m.slot === 'frontal') &&
      !(fotos.lateral && m.slot === 'lateral') &&
      !(fotos.posterior && m.slot === 'posterior')
  );

  if (fotos.frontal) {
    prevMeta.push({
      slot: 'frontal',
      originalSizeKB: fotos.frontal.originalSizeKB,
      compressedSizeKB: fotos.frontal.compressedSizeKB,
      format: fotos.frontal.format,
    });
  }
  if (fotos.lateral) {
    prevMeta.push({
      slot: 'lateral',
      originalSizeKB: fotos.lateral.originalSizeKB,
      compressedSizeKB: fotos.lateral.compressedSizeKB,
      format: fotos.lateral.format,
    });
  }
  if (fotos.posterior) {
    prevMeta.push({
      slot: 'posterior',
      originalSizeKB: fotos.posterior.originalSizeKB,
      compressedSizeKB: fotos.posterior.compressedSizeKB,
      format: fotos.posterior.format,
    });
  }

  const tiposFotosSet = new Set<RelevamientoVehiculo['tipos_fotos'][number]>(
    registroActual.tipos_fotos || []
  );
  if (frontalUrl) tiposFotosSet.add('Frente');
  if (lateralUrl) tiposFotosSet.add('Lateral');
  if (posteriorUrl) tiposFotosSet.add('Parte posterior');

  const actualizado: RelevamientoVehiculo = {
    ...registroActual,
    foto_frontal_url: frontalUrl,
    foto_lateral_url: lateralUrl,
    foto_posterior_url: posteriorUrl,
    fotos_metadata: prevMeta,
    tipos_fotos: Array.from(tiposFotosSet),
    ...(agenteRelevador
      ? {
          agente_id: agenteRelevador.id,
          agente_nombre: agenteRelevador.nombre_completo,
          agente_legajo: agenteRelevador.legajo,
        }
      : {}),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('relevamientos')
        .update({
          foto_frontal_url: actualizado.foto_frontal_url,
          foto_lateral_url: actualizado.foto_lateral_url,
          foto_posterior_url: actualizado.foto_posterior_url,
          fotos_metadata: actualizado.fotos_metadata,
          tipos_fotos: actualizado.tipos_fotos,
          agente_id: actualizado.agente_id,
          agente_nombre: actualizado.agente_nombre,
          agente_legajo: actualizado.agente_legajo,
        })
        .eq('id', actualizado.id)
        .select()
        .single();

      if (!error && data) {
        const list = getLocalRelevamientos().map((r) =>
          r.id === actualizado.id ? (data as RelevamientoVehiculo) : r
        );
        localStorage.setItem(STORAGE_KEYS.RELEVAMIENTOS, JSON.stringify(list));
        return data as RelevamientoVehiculo;
      }
    } catch {
      // Fallback local
    }
  }

  const list = getLocalRelevamientos().map((r) =>
    r.id === actualizado.id ? actualizado : r
  );
  localStorage.setItem(STORAGE_KEYS.RELEVAMIENTOS, JSON.stringify(list));
  return actualizado;
}

export async function eliminarRelevamiento(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('relevamientos').delete().eq('id', id);
    } catch {
      // Fallback
    }
  }
  const list = getLocalRelevamientos().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEYS.RELEVAMIENTOS, JSON.stringify(list));
}
