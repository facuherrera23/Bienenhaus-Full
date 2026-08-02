/**
 * Contenido de la landing.
 *
 * La landing puede recibir contenido en vivo desde el panel admin (módulo
 * Sitio Web) a través de postMessage. Mientras no haya contenido, se usan
 * estos defaults (que reflejan 1:1 la versión original hardcodeada).
 */
import { useEffect, useState } from 'preact/hooks';

export type ContentValue = Record<string, unknown>;
export type SectionContent = Record<string, ContentValue>;

export interface PreviewPayload {
  locale: string;
  content: Record<string, Record<string, ContentValue>>;
  settings: Record<string, ContentValue>;
}

const DEFAULT_CONTENT: Record<string, SectionContent> = {
  hero: {
    eyebrow: { text: 'Encontrá tu lugar' },
    title: { line1: 'Propiedades exclusivas.', line2: 'Experiencias extraordinarias.' },
    description: {
      text: 'Selección premium en las mejores zonas. Asesoramiento personalizado en cada paso.',
    },
    stats: {
      items: [
        { icon: 'fa-home', value: '128', title: 'Propiedades activas', note: 'Actualizadas diariamente' },
        { icon: 'fa-user-tie', value: '24', title: 'Agentes expertos', note: 'A tu servicio' },
        { icon: 'fa-map-marker-alt', value: '12+', title: 'Zonas premium', note: 'Las mejores ubicaciones' },
      ],
    },
    features: {
      items: [
        { icon: 'fa-crown', title: 'Propiedades Premium', text: 'Selección exclusiva de alta categoría' },
        { icon: 'fa-handshake', title: 'Asesoramiento Personalizado', text: 'Acompañamiento profesional en cada etapa' },
        { icon: 'fa-clipboard-list', title: 'Gestión Integral', text: 'Nos encargamos de todo. Vos elegís.' },
        { icon: 'fa-clock', title: 'Experiencia', text: 'Más de 10 años conectando personas con hogares únicos' },
      ],
    },
  },
  catalogo: {
    label: { text: 'Encontrá tu próximo hogar' },
    title: { text: 'Propiedades seleccionadas para vos.' },
    description: {
      text: 'Explorá una selección exclusiva de propiedades cuidadosamente elegidas en las mejores zonas.',
    },
  },
  servicios: {
    label: { text: 'Nuestros servicios' },
    title: { text: 'Mucho más que una inmobiliaria.' },
    description: {
      text: 'Soluciones integrales para comprar, vender o invertir con total confianza y acompañamiento profesional.',
    },
    items: {
      items: [
        {
          icon: 'fa-home',
          title: 'Compra de propiedades',
          description: 'Te ayudamos a encontrar la propiedad ideal que se adapta a tu estilo de vida y necesidades.',
        },
        {
          icon: 'fa-hand-holding-usd',
          title: 'Venta de propiedades',
          description: 'Maximizamos el valor de tu propiedad con estrategias de marketing exclusivas y una amplia red de contactos.',
        },
        {
          icon: 'fa-gavel',
          title: 'Asesoramiento legal',
          description: 'Acompañamiento legal en cada etapa del proceso para garantizar operaciones seguras y transparentes.',
        },
      ],
    },
  },
  equipo: {
    label: { text: 'Conocé al equipo' },
    title: { text: 'Expertos que convierten propiedades en oportunidades.' },
    description: {
      text: 'Un grupo de profesionales con años de experiencia en el mercado inmobiliario de la región.',
    },
  },
  estadisticas: {
    label: { text: 'Nuestra trayectoria' },
    title: { text: 'Los números hablan por nosotros.' },
    description: {
      text: 'Resultados que respaldan nuestro compromiso con cada cliente.',
    },
  },
  proceso: {
    label: { text: 'Cómo trabajamos' },
    title: { text: 'Un proceso simple. Resultados extraordinarios.' },
    description: {
      text: 'Cinco pasos claros que te acompañan desde el primer contacto hasta la entrega de llaves.',
    },
    steps: {
      items: [
        { icon: 'fa-users', title: 'Nos conocemos', description: 'Escuchamos tus objetivos y necesidades para comprender exactamente qué estás buscando.' },
        { icon: 'fa-chart-bar', title: 'Analizamos la propiedad', description: 'Realizamos una tasación profesional y definimos la mejor estrategia para maximizar su valor.' },
        { icon: 'fa-bullhorn', title: 'Diseñamos el plan', description: 'Creamos una estrategia de marketing personalizada con difusión premium y posicionamiento.' },
        { icon: 'fa-handshake', title: 'Negociamos', description: 'Gestionamos cada detalle y representamos tus intereses durante toda la negociación.' },
        { icon: 'fa-key', title: 'Concretamos la operación', description: 'Te acompañamos hasta la firma y el cierre de la operación garantizando una experiencia impecable.' },
      ],
    },
  },
  contacto: {
    label: { text: 'Contacto' },
    title: { text: 'Hablemos sobre tu próxima propiedad.' },
    description: {
      text: 'Escribinos y coordinemos una reunión para entender tus objetivos.',
    },
    info: {
      items: [
        { icon: 'fa-whatsapp', label: 'WhatsApp', value: '+54 9 387 600-0000' },
        { icon: 'fa-envelope', label: 'Correo electrónico', value: 'info@bienenhaus.com' },
        { icon: 'fa-phone', label: 'Teléfono', value: '+54 387 400-0000' },
        { icon: 'fa-map-marker-alt', label: 'Dirección', value: 'Av. Figueroa Alcorta 1234, Córdoba' },
      ],
    },
  },
  footer: {
    title: { text: 'Encontrá el lugar donde comienza tu próxima historia.' },
    newsletter: {
      text: 'Suscribite para recibir las propiedades más exclusivas antes que nadie.',
    },
  },
  meta: {
    og_title: { value: 'BIENENHAUS PROPIEDADES | Propiedades exclusivas' },
    og_description: {
      value: 'Selección premium en las mejores zonas. Asesoramiento personalizado en cada paso.',
    },
  },
};

const DEFAULT_SETTINGS: Record<string, ContentValue> = {
  site_name: { value: 'BIENENHAUS PROPIEDADES' },
  cri: { value: 'C.R.I. 183944' },
  contact_whatsapp: { value: '+54 9 387 600-0000' },
  contact_email: { value: 'info@bienenhaus.com' },
  contact_phone: { value: '+54 387 400-0000' },
  contact_address: { value: 'Av. Figueroa Alcorta 1234, Córdoba' },
  contact_hours: { weekdays: '09:00 - 18:00', saturdays: '09:00 - 13:00' },
  social: { instagram: '#', facebook: '#', linkedin: '#', whatsapp: '#', youtube: '#' },
  stats: { comercializadas: 320, clientes: 1850, exito: 98, anios: 15 },
  ml_enabled: { value: false },
  logo_url: { value: '' },
  hero_background: { value: '' },
  favicon_url: { value: '' },
  og_image: { value: '' },
};

// ---------------------------------------------------------------------------
// Store (override en vivo desde el panel admin)
// ---------------------------------------------------------------------------

let override: PreviewPayload | null = null;
const listeners = new Set<() => void>();

export function setPreviewPayload(payload: PreviewPayload | null): void {
  override = payload;
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function useContentVersion(): void {
  const [, setVersion] = useState(0);
  useEffect(() => subscribe(() => setVersion((v) => v + 1)), []);
}

function mergeValue(defaults: ContentValue, overrides: ContentValue | undefined): ContentValue {
  if (!overrides) return defaults;
  const out: ContentValue = { ...defaults };
  for (const [k, v] of Object.entries(overrides)) out[k] = v;
  return out;
}

export interface SiteData {
  content: Record<string, SectionContent>;
  settings: Record<string, ContentValue>;
}

export function useSiteContent(): SiteData {
  useContentVersion();

  const content: Record<string, SectionContent> = {};
  for (const [section, keys] of Object.entries(DEFAULT_CONTENT)) {
    const merged: SectionContent = {};
    const overrides = override?.content[section];
    for (const [key, value] of Object.entries(keys)) {
      merged[key] = mergeValue(value, overrides?.[key]);
    }
    content[section] = merged;
  }

  const settings: Record<string, ContentValue> = {};
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    settings[key] = mergeValue(value, override?.settings?.[key]);
  }

  return { content, settings };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function textOf(v: ContentValue | undefined, key = 'text', fallback = ''): string {
  const x = v?.[key];
  return typeof x === 'string' ? x : fallback;
}

export function numberOf(v: ContentValue | undefined, key: string, fallback = 0): number {
  const x = v?.[key];
  return typeof x === 'number' ? x : fallback;
}

/** Devuelve los items de una lista. Acepta tanto `{items: [...]}` como un array plano. */
export function listOf(v: ContentValue | undefined, key = 'items', fallback: unknown[] = []): ContentValue[] {
  if (!v) return fallback as ContentValue[];
  const arr = Array.isArray(v) ? v : v[key];
  if (!Array.isArray(arr)) return fallback as ContentValue[];
  return arr.filter((x): x is ContentValue => !!x && typeof x === 'object');
}

/** Normaliza un nombre de icono FontAwesome (agrega el prefijo `fas` si falta). */
export function faIcon(icon: string): string {
  const c = icon.trim();
  if (/^(fas|far|fab)\s/.test(c)) return c;
  return `fas ${c}`;
}
