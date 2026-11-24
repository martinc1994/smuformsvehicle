-- =============================================================================
-- ESQUEMA SQL COMPLETO + DATOS INICIALES PARA PROYECTO SUPABASE: "smuvehicles"
-- Municipalidad de San Miguel de Tucumán - Secretaría de Movilidad Urbana
-- =============================================================================

-- 1. Tabla de Usuarios (Administradores y Relevadores)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nombre_completo TEXT NOT NULL,
  legajo TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'relevador')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Usuario Inicial: Administrador "MCastillo" (pass: "Movilidad2026.")
INSERT INTO public.usuarios (id, username, password_hash, nombre_completo, legajo, rol, activo)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'MCastillo', 'Movilidad2026.', 'Martín Castillo', 'ADM-2026', 'admin', true)
ON CONFLICT (username) DO NOTHING;

-- 2. Tabla de Catálogos Parametrizables (Dependencias, Sectores, Marcas, Colores, Faltantes)
CREATE TABLE IF NOT EXISTS public.parametros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL, -- 'dependencia', 'sector_corralon', 'marca', 'color', 'faltante_comun', 'lugar_secuestro'
  valor TEXT NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(categoria, valor)
);

-- Semilla de Parámetros Oficiales para San Miguel de Tucumán
INSERT INTO public.parametros (categoria, valor, activo)
VALUES
  -- Dependencias
  ('dependencia', 'Dirección Operativa de Tránsito', true),
  ('dependencia', 'Dirección de Tránsito SMU', true),
  ('dependencia', 'Patrulla de Protección Ciudadana (PPC)', true),
  ('dependencia', 'Dirección de Transporte Público SMU', true),
  ('dependencia', 'Policía Vial — Operativo Conjunto SMU', true),
  ('dependencia', 'Tribunal Municipal de Faltas', true),
  -- Sectores del Corralón Municipal
  ('sector_corralon', 'No especificado', true),
  ('sector_corralon', 'Playa A — Sector Motos (Filas 1 a 10)', true),
  ('sector_corralon', 'Playa B — Automóviles Livianos', true),
  ('sector_corralon', 'Playa C — Camionetas y Utilitarios', true),
  ('sector_corralon', 'Galpón Techado N.º 1 (Custodia Judicial)', true),
  ('sector_corralon', 'Sector Compactación / Chatarra (Playa Sur)', true),
  -- Marcas frecuentes
  ('marca', 'Honda', true),
  ('marca', 'Motomel', true),
  ('marca', 'Zanella', true),
  ('marca', 'Corven', true),
  ('marca', 'Gilera', true),
  ('marca', 'Yamaha', true),
  ('marca', 'Volkswagen', true),
  ('marca', 'Renault', true),
  ('marca', 'Fiat', true),
  ('marca', 'Chevrolet', true),
  ('marca', 'Ford', true),
  ('marca', 'Peugeot', true),
  ('marca', 'Toyota', true),
  -- Colores predominantes
  ('color', 'Negro', true),
  ('color', 'Blanco', true),
  ('color', 'Gris Plata', true),
  ('color', 'Gris Oscuro', true),
  ('color', 'Rojo', true),
  ('color', 'Azul', true),
  ('color', 'Bordó', true),
  ('color', 'Verde / Sin pintura', true),
  -- Lugares frecuentes de secuestro en vía pública SMU
  ('lugar_secuestro', 'Av. Mate de Luna y Av. Alem', true),
  ('lugar_secuestro', 'Av. 24 de Septiembre al 400 (Microcentro)', true),
  ('lugar_secuestro', 'Av. Sarmiento y Av. Avellaneda', true),
  ('lugar_secuestro', 'Av. Belgrano y Av. Mitre', true),
  ('lugar_secuestro', 'Av. Roca y Av. Sáenz Peña', true),
  ('lugar_secuestro', 'Calle San Martín al 700', true),
  -- Faltantes relevantes frecuentes
  ('faltante_comun', 'Sin espejos retrovisores', true),
  ('faltante_comun', 'Falta óptica delantera', true),
  ('faltante_comun', 'Falta plástico lateral / cachas', true),
  ('faltante_comun', 'Sin caño de escape original', true),
  ('faltante_comun', 'Sin tablero instrumental', true),
  ('faltante_comun', 'Asiento roto / faltante', true),
  ('faltante_comun', 'Falta rueda de auxilio / estéreo', true),
  ('faltante_comun', 'Parabrisas astillado / cristales rotos', true)
ON CONFLICT (categoria, valor) DO NOTHING;

-- 3. Secuencia Autoincremental para idForm (Inicia en FSMU-1000)
CREATE SEQUENCE IF NOT EXISTS public.relevamientos_idform_seq
  START WITH 1000
  INCREMENT BY 1
  MINVALUE 1000;

-- 4. Tabla Principal de Relevamientos de Vehículos Secuestrados
CREATE TABLE IF NOT EXISTS public.relevamientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_correlativo TEXT UNIQUE NOT NULL DEFAULT ('FSMU-' || nextval('public.relevamientos_idform_seq')::text),
  
  -- 1. Datos de Registro e Ingreso
  dependencia TEXT NOT NULL DEFAULT 'Dirección Operativa de Tránsito',
  numero_acta TEXT DEFAULT 'S/D',
  fecha_ingreso DATE,
  lugar_secuestro TEXT DEFAULT 'No especificado',
  sector_corralon TEXT NOT NULL DEFAULT 'No especificado',

  -- 2. Identificación del Vehículo
  tipo_vehiculo TEXT NOT NULL CHECK (tipo_vehiculo IN ('Automóvil', 'Camioneta', 'Motocicleta', 'Utilitario', 'Otro')),
  tipo_vehiculo_otro TEXT DEFAULT '',
  marca TEXT NOT NULL,
  modelo TEXT DEFAULT 'S/D',
  anio_aproximado TEXT NOT NULL DEFAULT 'S/D',
  color_predominante TEXT NOT NULL,
  dominio TEXT DEFAULT 'SINDOMINIO',
  cantidad_ruedas INTEGER NOT NULL DEFAULT 4,
  numero_motor TEXT DEFAULT '',
  numero_chasis TEXT DEFAULT '',

  -- 3. Estado Físico y Condición del Vehículo
  estado_general TEXT NOT NULL CHECK (estado_general IN ('Bueno', 'Regular', 'Malo', 'Chatarra')),
  posee_motor BOOLEAN NOT NULL DEFAULT true,
  posee_bateria BOOLEAN NOT NULL DEFAULT false,
  posee_llave BOOLEAN NOT NULL DEFAULT false,
  posee_documentacion BOOLEAN NOT NULL DEFAULT false,
  presenta_faltantes BOOLEAN NOT NULL DEFAULT false,
  detalle_faltantes TEXT DEFAULT '',
  se_encuentra_desarmado BOOLEAN NOT NULL DEFAULT false,
  conserva_chapa_patente BOOLEAN NOT NULL DEFAULT true,
  apto_para_circular BOOLEAN NOT NULL DEFAULT false,

  -- 4. Registro Fotográfico (Hasta 3 fotos obligatorias comprimidas en WebP)
  tipos_fotos TEXT[] DEFAULT '{}',
  foto_frontal_url TEXT,
  foto_lateral_url TEXT,
  foto_posterior_url TEXT,
  fotos_metadata JSONB DEFAULT '[]',

  -- 5. Observaciones y Firma del Agente
  observaciones TEXT DEFAULT '',
  agente_id TEXT,
  agente_nombre TEXT NOT NULL,
  agente_legajo TEXT NOT NULL,
  fecha_relevamiento DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Configuración de Políticas RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relevamientos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura y escritura de usuarios" ON public.usuarios;
CREATE POLICY "Permitir lectura y escritura de usuarios" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura y escritura de parametros" ON public.parametros;
CREATE POLICY "Permitir lectura y escritura de parametros" ON public.parametros FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura y escritura de relevamientos" ON public.relevamientos;
CREATE POLICY "Permitir lectura y escritura de relevamientos" ON public.relevamientos FOR ALL USING (true) WITH CHECK (true);

-- 5. Bucket de Storage para fotografías comprimidas WebP (Máx 1.5 MB por foto, formatos livianos WebP/JPEG)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehiculos-fotos',
  'vehiculos-fotos',
  true,
  1572864,
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 1572864,
  allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png'];

-- Índice rápido para búsqueda instantánea por patente normalizada (sin espacios ni guiones) en el predio
CREATE INDEX IF NOT EXISTS idx_relevamientos_dominio ON public.relevamientos (dominio);

-- Índice único parcial: impide repetir patentes reales, pero permite múltiples vehículos con 'SINDOMINIO'
CREATE UNIQUE INDEX IF NOT EXISTS idx_relevamientos_dominio_unico
  ON public.relevamientos (dominio)
  WHERE dominio IS NOT NULL AND dominio <> '' AND dominio <> 'SINDOMINIO';

DROP POLICY IF EXISTS "Acceso publico a fotos de vehiculos" ON storage.objects;
DROP POLICY IF EXISTS "Subida y reemplazo de fotos de vehiculos" ON storage.objects;
DROP POLICY IF EXISTS "Actualizacion de fotos de vehiculos" ON storage.objects;
DROP POLICY IF EXISTS "Eliminacion de fotos de vehiculos" ON storage.objects;

-- Políticas de Storage sin SELECT masivo (Elimina la alerta "Clients can list all files in this bucket" en Supabase Dashboard)
-- Como el bucket es public = true, las URLs públicas de cada foto siguen funcionando directamente sin permitir listado global.
CREATE POLICY "Subida y reemplazo de fotos de vehiculos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vehiculos-fotos');

CREATE POLICY "Actualizacion de fotos de vehiculos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'vehiculos-fotos')
WITH CHECK (bucket_id = 'vehiculos-fotos');

CREATE POLICY "Eliminacion de fotos de vehiculos"
ON storage.objects FOR DELETE
USING (bucket_id = 'vehiculos-fotos');
