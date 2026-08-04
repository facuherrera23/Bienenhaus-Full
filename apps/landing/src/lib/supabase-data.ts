/**
 * Client-side Supabase data fetching with realtime subscriptions.
 * Replaces build-time fetch for live updates without redeploy.
 */
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState, useCallback, useRef } from 'preact/hooks';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://rnldqiwwzhjnurkguihu.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface Property {
  id: string;
  code: number;
  title: string;
  slug: string;
  description: string | null;
  status: string;
  listing_type: string;
  price: number | null;
  currency: string;
  expenses: number | null;
  address: string | null;
  location_id: string | null;
  latitude: number | null;
  longitude: number | null;
  area_total: number | null;
  area_covered: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  garages: number | null;
  year_built: number | null;
  floors: number | null;
  featured: boolean;
  published_at: string | null;
  video_url: string | null;
  images: Array<{ url: string; is_cover: boolean; position: number }>;
}

export interface PropertyCardData {
  id: string;
  code: number;
  title: string;
  price: string;
  location: string;
  image: string;
  alt: string;
  beds: number;
  baths: number;
  area: number;
  garage: number;
  desc: string;
  featured: boolean;
  type: 'casa' | 'depto' | 'oficina' | 'local' | 'terreno' | 'country';
  operation: 'venta' | 'alquiler';
  video_url?: string | null;
  gallery?: string[];
  slug: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  matricula: string | null;
  role: string | null;
  photo_url: string | null;
  bio: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface AgentCardData {
  name: string;
  photo: string;
  alt: string;
  role: string;
  experience: string;
  bio: string;
}

export interface Location {
  id: string;
  name: string;
  zone: string;
  sort_order: number;
  is_active: boolean;
}

function mapProperty(p: Property): PropertyCardData {
  const cover = p.images?.find((i) => i.is_cover)?.url ?? p.images?.[0]?.url ?? null;
  const gallery = p.images?.map((i) => i.url) ?? [];
  
  return {
    id: p.id,
    code: p.code,
    title: p.title,
    price: p.price ? `${p.currency} ${Number(p.price).toLocaleString('es-AR')}` : 'Consultar precio',
    location: p.location_id ? 'Sin zona' : 'Sin zona', // will be enriched with locations
    image: cover || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop&crop=center',
    alt: p.title,
    beds: p.bedrooms ?? 0,
    baths: p.bathrooms ?? 0,
    area: p.area_total ?? 0,
    garage: p.garages ?? 0,
    desc: p.description || '',
    featured: p.featured ?? false,
    type: mapListingType(p.listing_type),
    operation: p.listing_type === 'venta' ? 'venta' : 'alquiler',
    video_url: p.video_url,
    gallery,
    slug: p.slug,
  };
}

function mapListingType(type: string): 'casa' | 'depto' | 'oficina' | 'local' | 'terreno' | 'country' {
  const map: Record<string, any> = {
    'casa': 'casa',
    'departamento': 'depto',
    'depto': 'depto',
    'oficina': 'oficina',
    'local': 'local',
    'terreno': 'terreno',
    'country': 'country',
    'ph': 'depto',
  };
  return map[type?.toLowerCase()] || 'casa';
}

function mapAgent(a: Agent): AgentCardData {
  return {
    name: a.name,
    photo: a.photo_url || '/placeholder-agent.jpg',
    alt: a.name,
    role: a.role?.toUpperCase() || 'ASESOR',
    experience: '',
    bio: a.bio || '',
  };
}

// Hooks para usar en componentes
export function useProperties() {
  const [data, setData] = useState<PropertyCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [propsRes, locRes] = await Promise.all([
        supabase
          .from('properties')
          .select(`
            id, code, title, slug, description, status, listing_type, price, currency,
            expenses, address, location_id, latitude, longitude, area_total, area_covered,
            bedrooms, bathrooms, garages, year_built, floors, featured, published_at, video_url,
            images:property_images(url, is_cover, position)
          `)
          .eq('status', 'publicada')
          .is('deleted_at', null)
          .order('published_at', { ascending: false }),
        supabase
          .from('locations')
          .select('id, name')
          .eq('is_active', true),
      ]);

      if (propsRes.error) throw propsRes.error;
      if (locRes.error) throw locRes.error;

      const locationsMap = new Map(locRes.data?.map(l => [l.id, l.name]) || []);
      
      const mapped = (propsRes.data || []).map(p => {
        const mapped = mapProperty(p);
        if (p.location_id && locationsMap.has(p.location_id)) {
          mapped.location = locationsMap.get(p.location_id)!;
        }
        return mapped;
      });

      if (mounted.current) {
        setData(mapped);
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

    // Realtime subscription
    const channel = supabase
      .channel('properties_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'properties' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'property_images' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'locations' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      mounted.current = false;
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useAgents() {
  const [data, setData] = useState<AgentCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  // agents_public (vista 0031) filtra is_active/deleted_at y anon no tiene
  // SELECT sobre la tabla: sin realtime, los cambios llegan con refetch().
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: agents, error } = await supabase
        .from('agents_public')
        .select('id, name, email, matricula, role, photo_url, bio, sort_order, is_active')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      if (mounted.current) {
        setData((agents || []).map(mapAgent));
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

    return () => {
      mounted.current = false;
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useLocations() {
  const [data, setData] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: locations, error } = await supabase
        .from('locations')
        .select('id, name, zone, sort_order, is_active')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      if (mounted.current) setData(locations || []);
    } catch (err: any) {
      console.error('Locations fetch error:', err);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    fetchData();
    const channel = supabase
      .channel('locations_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'locations' },
        () => fetchData()
      )
      .subscribe();
    return () => {
      mounted.current = false;
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  return { data, loading };
}