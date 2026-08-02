/**
 * Site settings hook - fetches public site_settings with realtime updates.
 * Editable in Admin → Configuración.
 */
import { useEffect, useState, useCallback, useRef } from 'preact/hooks';
import { supabase } from './supabase-data';

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
  whatsapp?: string;
  linkedin?: string;
}

export interface ContactInfo {
  email?: string;
  whatsapp?: string;
  whatsappAlt?: string;
  address?: string;
  hours?: { weekdays: string; saturdays: string };
}

export interface CompanyInfo {
  name?: string;
  matricula?: string;
  ubicacion?: string;
}

export interface SiteSettings {
  social: SocialLinks;
  contact: ContactInfo;
  company: CompanyInfo;
  stats: { comercializadas: number; clientes: number; exito: number; anios: number };
}

const DEFAULT_SETTINGS: SiteSettings = {
  social: {},
  contact: { hours: { weekdays: '09:00 - 18:00', saturdays: '09:00 - 13:00' } },
  company: {},
  stats: { comercializadas: 0, clientes: 0, exito: 0, anios: 0 },
};

function mapSettings(rows: any[]): SiteSettings {
  const settings = { ...DEFAULT_SETTINGS };
  
  for (const row of rows) {
    const v = row.value?.value ?? row.value;
    switch (row.key) {
      case 'social':
        settings.social = v as SocialLinks;
        break;
      case 'contact_email':
        settings.contact.email = v?.value ?? v;
        break;
      case 'contact_whatsapp':
        settings.contact.whatsapp = v?.value ?? v;
        break;
      case 'contact_whatsapp_alt':
        settings.contact.whatsappAlt = v?.value ?? v;
        break;
      case 'contact_address':
        settings.contact.address = v?.value ?? v;
        break;
      case 'contact_hours':
        settings.contact.hours = v as ContactInfo['hours'];
        break;
      case 'site_name':
      case 'empresa':
        settings.company.name = v?.value ?? v;
        break;
      case 'cri':
      case 'matricula':
        settings.company.matricula = v?.value ?? v;
        break;
      case 'ubicacion':
        settings.company.ubicacion = v?.value ?? v;
        break;
      case 'stats':
        settings.stats = v as SiteSettings['stats'];
        break;
    }
  }
  return settings;
}

// --- Singleton realtime manager ---
let realtimeChannel: any = null;
let realtimeSubscribers = new Set<() => void>();

function ensureRealtimeChannel() {
  if (typeof window === 'undefined') return;
  if (realtimeChannel) return realtimeChannel;

  realtimeChannel = supabase
    .channel('site_settings_changes_global')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'site_settings', filter: 'is_public=eq.true' },
      () => {
        realtimeSubscribers.forEach(cb => cb());
      }
    )
    .subscribe((status) => {
      if (status !== 'SUBSCRIBED') {
        console.warn('Realtime subscription status:', status);
      }
    });

  return realtimeChannel;
}

function subscribeToRealtime(cb: () => void) {
  if (typeof window === 'undefined') return () => {};
  ensureRealtimeChannel();
  realtimeSubscribers.add(cb);
  return () => {
    realtimeSubscribers.delete(cb);
    if (realtimeSubscribers.size === 0 && realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  };
}

// --- Hook ---
export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const keys = [
        'social', 'contact_email', 'contact_whatsapp',
        'contact_whatsapp_alt', 'contact_address', 'contact_hours', 'site_name', 'empresa',
        'cri', 'matricula', 'ubicacion', 'stats'
      ];
      
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value, value_type')
        .in('key', keys)
        .eq('is_public', true);

      if (error) throw error;
      if (mounted.current) {
        setSettings(mapSettings(data || []));
        setError(null);
      }
    } catch (err: any) {
      if (mounted.current) setError(err.message);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    fetchData();

    const unsubscribe = subscribeToRealtime(fetchData);

    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, [fetchData]);

  return { settings, loading, error, refetch: fetchData };
}

// Alternancia aleatoria persistida entre dos números de WhatsApp
const WHATSAPP_ALT_KEY = 'bh:whatsapp:altIndex';

function getNextWhatsAppIndex(): 0 | 1 {
  if (typeof window === 'undefined') return 0;
  try {
    const stored = localStorage.getItem(WHATSAPP_ALT_KEY);
    const idx = stored ? parseInt(stored, 10) : 0;
    const next = idx === 0 ? 1 : 0;
    localStorage.setItem(WHATSAPP_ALT_KEY, String(next));
    return next;
  } catch {
    return Math.random() < 0.5 ? 0 : 1;
  }
}

function toWhatsAppUrl(raw: string): string {
  if (!raw) return 'https://wa.me/';
  // Si ya es URL completa, devolverla
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('wa.me')) {
    return raw.startsWith('wa.me') ? `https://${raw}` : raw;
  }
  // Limpiar: solo dígitos
  const digits = raw.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}

export function getNextWhatsAppUrl(settings: SiteSettings): string {
  const primary = settings.contact.whatsapp;
  const alt = settings.contact.whatsappAlt;
  if (!primary && !alt) return 'https://wa.me/';
  if (!alt) return toWhatsAppUrl(primary || '');
  if (!primary) return toWhatsAppUrl(alt);
  const idx = getNextWhatsAppIndex();
  return idx === 0 ? toWhatsAppUrl(primary) : toWhatsAppUrl(alt);
}