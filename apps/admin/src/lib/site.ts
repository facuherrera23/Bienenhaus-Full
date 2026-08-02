import { supabase } from './supabase';

export type ContentSection =
  | 'hero'
  | 'catalogo'
  | 'servicios'
  | 'equipo'
  | 'estadisticas'
  | 'proceso'
  | 'contacto'
  | 'footer'
  | 'meta';

export interface SiteContentRow {
  id: string;
  section: ContentSection;
  key: string;
  value: Record<string, unknown>;
  locale: string;
  is_active: boolean;
  updated_at: string;
}

export interface SiteSettingRow {
  id: string;
  key: string;
  value: Record<string, unknown>;
  value_type: 'string' | 'number' | 'boolean' | 'json';
  is_public: boolean;
  description: string | null;
  updated_at: string;
}

export const SECTION_LABELS: Record<ContentSection, string> = {
  hero: 'Hero',
  catalogo: 'Catálogo',
  servicios: 'Servicios',
  equipo: 'Equipo',
  estadisticas: 'Estadísticas',
  proceso: 'Proceso',
  contacto: 'Contacto',
  footer: 'Footer',
  meta: 'SEO / Meta',
};

export const LOCALES: { code: string; label: string }[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
];

const SECTION_ORDER: ContentSection[] = [
  'hero',
  'catalogo',
  'servicios',
  'equipo',
  'estadisticas',
  'proceso',
  'contacto',
  'footer',
  'meta',
];

export function sortSections(sections: ContentSection[]): ContentSection[] {
  return [...sections].sort((a, b) => SECTION_ORDER.indexOf(a) - SECTION_ORDER.indexOf(b));
}

// ---------------------------------------------------------------------------
// Metadata de campos por (section, key) para el editor
// ---------------------------------------------------------------------------

export type FieldType = 'text' | 'textarea' | 'number' | 'image';

export interface FieldMeta {
  key: string;
  label: string;
  type?: FieldType;
}

export interface ListMeta {
  itemLabel: string;
  fields: FieldMeta[];
}

/** Claves conocidas por sección, en el orden en que se muestran en el editor. */
export const SECTION_KEYS: Record<ContentSection, string[]> = {
  hero: ['eyebrow', 'title', 'description', 'stats', 'features'],
  catalogo: ['label', 'title', 'description'],
  servicios: ['label', 'title', 'description', 'items'],
  equipo: ['label', 'title', 'description'],
  estadisticas: ['label', 'title', 'description'],
  proceso: ['label', 'title', 'description', 'steps'],
  contacto: ['label', 'title', 'description', 'info'],
  footer: ['title', 'newsletter'],
  meta: ['og_title', 'og_description'],
};

export const CONTENT_KEY_LABELS: Record<string, string> = {
  eyebrow: 'Texto destacado',
  title: 'Título',
  label: 'Etiqueta',
  description: 'Descripción',
  og_title: 'Título para redes',
  og_description: 'Descripción para redes',
  newsletter: 'Newsletter',
  stats: 'Estadísticas del hero',
  features: 'Destacados del hero',
  items: 'Servicios',
  steps: 'Pasos del proceso',
  info: 'Datos de contacto',
};

const CONTENT_FIELD_META: Record<string, FieldMeta[]> = {
  'hero.eyebrow': [{ key: 'text', label: 'Texto' }],
  'hero.title': [
    { key: 'line1', label: 'Línea 1' },
    { key: 'line2', label: 'Línea 2' },
  ],
  'hero.description': [{ key: 'text', label: 'Descripción', type: 'textarea' }],
  'catalogo.label': [{ key: 'text', label: 'Etiqueta' }],
  'catalogo.title': [{ key: 'text', label: 'Título' }],
  'catalogo.description': [{ key: 'text', label: 'Descripción', type: 'textarea' }],
  'servicios.label': [{ key: 'text', label: 'Etiqueta' }],
  'servicios.title': [{ key: 'text', label: 'Título' }],
  'servicios.description': [{ key: 'text', label: 'Descripción', type: 'textarea' }],
  'equipo.label': [{ key: 'text', label: 'Etiqueta' }],
  'equipo.title': [{ key: 'text', label: 'Título' }],
  'equipo.description': [{ key: 'text', label: 'Descripción', type: 'textarea' }],
  'estadisticas.label': [{ key: 'text', label: 'Etiqueta' }],
  'estadisticas.title': [{ key: 'text', label: 'Título' }],
  'estadisticas.description': [{ key: 'text', label: 'Descripción', type: 'textarea' }],
  'proceso.label': [{ key: 'text', label: 'Etiqueta' }],
  'proceso.title': [{ key: 'text', label: 'Título' }],
  'proceso.description': [{ key: 'text', label: 'Descripción', type: 'textarea' }],
  'contacto.label': [{ key: 'text', label: 'Etiqueta' }],
  'contacto.title': [{ key: 'text', label: 'Título' }],
  'contacto.description': [{ key: 'text', label: 'Descripción', type: 'textarea' }],
  'footer.title': [{ key: 'text', label: 'Título', type: 'textarea' }],
  'footer.newsletter': [{ key: 'text', label: 'Texto', type: 'textarea' }],
  'meta.og_title': [{ key: 'value', label: 'Título' }],
  'meta.og_description': [{ key: 'value', label: 'Descripción', type: 'textarea' }],
};

/** Metadatos de listas (campos repetibles). */
const LIST_FIELD_META: Record<string, ListMeta> = {
  'hero.stats': {
    itemLabel: 'Estadística',
    fields: [
      { key: 'icon', label: 'Icono (FontAwesome)' },
      { key: 'value', label: 'Valor' },
      { key: 'title', label: 'Título' },
      { key: 'note', label: 'Nota' },
    ],
  },
  'hero.features': {
    itemLabel: 'Destacado',
    fields: [
      { key: 'icon', label: 'Icono (FontAwesome)' },
      { key: 'title', label: 'Título' },
      { key: 'text', label: 'Texto' },
    ],
  },
  'servicios.items': {
    itemLabel: 'Servicio',
    fields: [
      { key: 'icon', label: 'Icono (FontAwesome)' },
      { key: 'title', label: 'Título' },
      { key: 'description', label: 'Descripción', type: 'textarea' },
    ],
  },
  'proceso.steps': {
    itemLabel: 'Paso',
    fields: [
      { key: 'icon', label: 'Icono (FontAwesome)' },
      { key: 'title', label: 'Título' },
      { key: 'description', label: 'Descripción', type: 'textarea' },
    ],
  },
  'contacto.info': {
    itemLabel: 'Dato',
    fields: [
      { key: 'icon', label: 'Icono (FontAwesome)' },
      { key: 'label', label: 'Etiqueta' },
      { key: 'value', label: 'Valor' },
    ],
  },
};

const SETTINGS_FIELD_META: Record<string, FieldMeta[]> = {
  site_name: [{ key: 'value', label: 'Nombre del sitio' }],
  cri: [{ key: 'value', label: 'Matrícula C.R.I.' }],
  contact_whatsapp: [{ key: 'value', label: 'WhatsApp' }],
  contact_email: [{ key: 'value', label: 'Email' }],
  contact_phone: [{ key: 'value', label: 'Teléfono' }],
  contact_address: [{ key: 'value', label: 'Dirección' }],
  contact_hours: [
    { key: 'weekdays', label: 'Lunes a viernes' },
    { key: 'saturdays', label: 'Sábados' },
  ],
  social: [
    { key: 'instagram', label: 'Instagram' },
    { key: 'facebook', label: 'Facebook' },
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'whatsapp', label: 'WhatsApp' },
    { key: 'youtube', label: 'YouTube' },
  ],
  stats: [
    { key: 'comercializadas', label: 'Propiedades comercializadas', type: 'number' },
    { key: 'clientes', label: 'Clientes', type: 'number' },
    { key: 'exito', label: '% de éxito', type: 'number' },
    { key: 'anios', label: 'Años de trayectoria', type: 'number' },
  ],
  ml_enabled: [{ key: 'value', label: 'Sincronización con Mercado Libre' }],
};

/** Settings cuyo valor es una URL de imagen subida a storage. */
export const IMAGE_SETTINGS: Record<string, string> = {
  logo_url: 'Logo del sitio',
  hero_background: 'Imagen de fondo del hero',
  favicon_url: 'Favicon',
  og_image: 'Imagen para compartir en redes',
};

export function contentFieldsFor(section: string, key: string): FieldMeta[] | null {
  return CONTENT_FIELD_META[`${section}.${key}`] ?? null;
}

export function listMetaFor(section: string, key: string): ListMeta | null {
  return LIST_FIELD_META[`${section}.${key}`] ?? null;
}

export function isListField(section: string, key: string): boolean {
  return LIST_FIELD_META[`${section}.${key}`] !== undefined;
}

export function settingFieldsFor(key: string): FieldMeta[] | null {
  if (key in IMAGE_SETTINGS) return [{ key: 'value', label: IMAGE_SETTINGS[key], type: 'image' }];
  return SETTINGS_FIELD_META[key] ?? null;
}

// Fallback: genera un campo por cada clave del valor jsonb
export function genericFields(value: Record<string, unknown>): FieldMeta[] {
  return Object.keys(value).map((k) => ({
    key: k,
    label: k,
    type: typeof value[k] === 'number' ? 'number' : 'text',
  }));
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

export async function fetchSiteContent(): Promise<SiteContentRow[]> {
  const { data, error } = await supabase
    .from('site_content')
    .select('id, section, key, value, locale, is_active, updated_at')
    .order('section', { ascending: true })
    .order('key', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as SiteContentRow[];
}

export async function updateSiteContent(id: string, value: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('site_content').update({ value }).eq('id', id);
  if (error) throw new Error(error.message);
}

export interface UpsertContentInput {
  id?: string | null;
  section: ContentSection;
  key: string;
  locale: string;
  value: Record<string, unknown>;
  is_active: boolean;
}

/** Actualiza el row si existe (por id o por section+key+locale) o lo crea. */
export async function upsertSiteContent(input: UpsertContentInput): Promise<void> {
  if (input.id) {
    const { error } = await supabase
      .from('site_content')
      .update({ value: input.value, is_active: input.is_active })
      .eq('id', input.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { data: existing, error: findError } = await supabase
    .from('site_content')
    .select('id')
    .eq('section', input.section)
    .eq('key', input.key)
    .eq('locale', input.locale)
    .maybeSingle();
  if (findError) throw new Error(findError.message);

  if (existing) {
    const { error } = await supabase
      .from('site_content')
      .update({ value: input.value, is_active: input.is_active })
      .eq('id', existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from('site_content').insert({
    section: input.section,
    key: input.key,
    locale: input.locale,
    value: input.value,
    is_active: input.is_active,
  });
  if (error) throw new Error(error.message);
}

export async function fetchSiteSettings(): Promise<SiteSettingRow[]> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('id, key, value, value_type, is_public, description, updated_at')
    .order('key', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as SiteSettingRow[];
}

export async function updateSiteSetting(id: string, value: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('site_settings').update({ value }).eq('id', id);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Storage de imágenes del sitio
// ---------------------------------------------------------------------------

export async function uploadSiteImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('site-images').upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('site-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteSiteImage(url: string): Promise<void> {
  try {
    const path = url.split('/').pop();
    if (path) await supabase.storage.from('site-images').remove([path]);
  } catch {
    // no op: si el archivo no existe en storage, seguimos
  }
}
