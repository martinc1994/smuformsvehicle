import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Parametro, RelevamientoVehiculo, Usuario, FotoComprimida } from '../types';

const STORAGE_KEYS = {
  SUPABASE_URL: 'smt_supabase_url',
  SUPABASE_KEY: 'smt_supabase_anon_key',
  USUARIOS: 'smt_usuarios_v1',
  PARAMETROS: 'smt_parametros_v1',
  RELEVAMIENTOS: 'smt_relevamientos_v1',
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
  {
    id: '00000000-0000-4000-8000-000000000002',
    username: 'JCarol',
    password_hash: 'Relevador2026.',
    nombre_completo: 'Juan Carlos Carol',
    legajo: 'LEG-4812',
    rol: 'relevador',
    activo: true,
    created_at: '2026-01-02T09:30:00.000Z',
  },
];

// Semilla inicial de Parámetros Oficiales para San Miguel de Tucumán
const INITIAL_PARAMETROS: Parametro[] = [
  // Dependencias que efectúan el secuestro
  { id: 'dep-1', categoria: 'dependencia', valor: 'Dirección de Tránsito SMT', activo: true },
  { id: 'dep-2', categoria: 'dependencia', valor: 'Patrulla de Protección Ciudadana (PPC)', activo: true },
  { id: 'dep-3', categoria: 'dependencia', valor: 'Dirección de Transporte Público SMT', activo: true },
  { id: 'dep-4', categoria: 'dependencia', valor: 'Policía Vial — Operativo Conjunto SMT', activo: true },
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

  // Lugares / Avenidas frecuentes de secuestro en SMT
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
    id: 'rel-smt-0001',
    numero_correlativo: 'INV-2026-0001',
    dependencia: 'Dirección de Tránsito SMT',
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
];

export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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
function getLocalUsuarios(): Usuario[] {
  const raw = localStorage.getItem(STORAGE_KEYS.USUARIOS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(INITIAL_USUARIOS));
    return INITIAL_USUARIOS;
  }
  try {
    const parsed: Usuario[] = JSON.parse(raw);
    // Garantizar que MCastillo siempre exista con las credenciales solicitadas
    const hasAdmin = parsed.some(
      (u) => u.username.toLowerCase() === 'mcastillo'
    );
    if (!hasAdmin) {
      parsed.unshift(INITIAL_USUARIOS[0]);
      localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(parsed));
    }
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
    return JSON.parse(raw);
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
  const usuarios = await fetchUsuarios();
  if (usuarios.some((u) => u.username.toLowerCase() === nuevo.username.trim().toLowerCase())) {
    return { error: 'Ya existe un usuario con ese nombre de acceso.' };
  }

  const userObj: Usuario = {
    ...nuevo,
    username: nuevo.username.trim(),
    id: crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .insert([userObj])
        .select()
        .single();
      if (!error && data) {
        const updated = [...getLocalUsuarios(), data as Usuario];
        localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(updated));
        return { data: data as Usuario };
      }
    } catch {
      // Fallback a local
    }
  }

  const updated = [...getLocalUsuarios(), userObj];
  localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(updated));
  return { data: userObj };
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
  const year = new Date().getFullYear();
  const nextNumber = lista.length + 1;
  return `INV-${year}-${String(nextNumber).padStart(4, '0')}`;
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

export async function guardarRelevamiento(
  payload: Omit<
    RelevamientoVehiculo,
    'id' | 'created_at' | 'foto_frontal_url' | 'foto_lateral_url' | 'foto_posterior_url' | 'fotos_metadata'
  >,
  fotos: {
    frontal: FotoComprimida;
    lateral: FotoComprimida;
    posterior: FotoComprimida;
  }
): Promise<RelevamientoVehiculo> {
  const [frontalUrl, lateralUrl, posteriorUrl] = await Promise.all([
    uploadPhotoIfSupabaseAvailable(fotos.frontal, payload.numero_correlativo),
    uploadPhotoIfSupabaseAvailable(fotos.lateral, payload.numero_correlativo),
    uploadPhotoIfSupabaseAvailable(fotos.posterior, payload.numero_correlativo),
  ]);

  const nuevoRegistro: RelevamientoVehiculo = {
    ...payload,
    id: crypto.randomUUID ? crypto.randomUUID() : `rel-${Date.now()}`,
    foto_frontal_url: frontalUrl,
    foto_lateral_url: lateralUrl,
    foto_posterior_url: posteriorUrl,
    fotos_metadata: [
      {
        slot: 'frontal',
        originalSizeKB: fotos.frontal.originalSizeKB,
        compressedSizeKB: fotos.frontal.compressedSizeKB,
        format: fotos.frontal.format,
      },
      {
        slot: 'lateral',
        originalSizeKB: fotos.lateral.originalSizeKB,
        compressedSizeKB: fotos.lateral.compressedSizeKB,
        format: fotos.lateral.format,
      },
      {
        slot: 'posterior',
        originalSizeKB: fotos.posterior.originalSizeKB,
        compressedSizeKB: fotos.posterior.compressedSizeKB,
        format: fotos.posterior.format,
      },
    ],
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('relevamientos')
        .insert([nuevoRegistro])
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
