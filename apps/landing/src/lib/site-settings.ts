/**
 * Site settings hook - fetches public site_settings with realtime updates.
 * Editable in Admin → Configuración.
 */
import { useEffect, useState, useCallback } from 'preact/hooks';
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
  phone?: string;
  whatsapp?: string;
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
      case 'contact_phone':
        settings.contact.phone = v?.value ?? v;
        break;
      case 'contact_whatsapp':
        settings.contact.whatsapp = v?.value ?? v;
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
      case 'contact_address':
        settings.company.ubicacion = v?.value ?? v;
        break;
      case 'stats':
        settings.stats = v as SiteSettings['stats'];
        break;
    }
  }
  return settings;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = { current: true };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const keys = [
        'social', 'contact_email', 'contact_phone', 'contact_whatsapp',
        'contact_address', 'contact_hours', 'site_name', 'empresa',
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

    const channel = supabase
      .channel('site_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings', filter: 'is_public=eq.true' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      mounted.current = false;
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  return { settings, loading, error, refetch: fetchData };
}