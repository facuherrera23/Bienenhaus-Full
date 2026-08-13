/**
 * Client-side Supabase data fetching with realtime subscriptions.
 * Replaces build-time fetch for live updates without redeploy.
 * Uses incremental realtime parsing for performance.
 */
import { supabase } from '@bienenhaus/supabase';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

export { supabase };

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
    location_id: string | null;
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
        price: p.price
            ? `${p.currency} ${Number(p.price).toLocaleString('es-AR')}`
            : 'Consultar precio',
        location: 'Sin zona', // will be enriched with locations
        location_id: p.location_id,
        image:
            cover ||
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop&crop=center',
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

function mapListingType(
    type: string,
): 'casa' | 'depto' | 'oficina' | 'local' | 'terreno' | 'country' {
    const map: Record<string, 'casa' | 'depto' | 'oficina' | 'local' | 'terreno' | 'country'> = {
        casa: 'casa',
        departamento: 'depto',
        depto: 'depto',
        oficina: 'oficina',
        local: 'local',
        terreno: 'terreno',
        country: 'country',
        ph: 'depto',
    };
    return (
        (map[type?.toLowerCase()] as
            'casa' | 'depto' | 'oficina' | 'local' | 'terreno' | 'country') || 'casa'
    );
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
    const locationsMapRef = useRef<Map<string, string>>(new Map());

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [propsRes, locRes] = await Promise.all([
                supabase
                    .from('properties')
                    .select(
                        `
            id, code, title, slug, description, status, listing_type, price, currency,
            expenses, address, location_id, latitude, longitude, area_total, area_covered,
            bedrooms, bathrooms, garages, year_built, floors, featured, published_at, video_url,
            images:property_images(url, is_cover, position)
          `,
                    )
                    .eq('status', 'publicada')
                    .is('deleted_at', null)
                    .order('published_at', { ascending: false }),
                supabase.from('locations').select('id, name').eq('is_active', true),
            ]);

            if (propsRes.error) throw propsRes.error;
            if (locRes.error) throw locRes.error;

            // Update locations map
            const newLocationsMap = new Map(locRes.data?.map((l) => [l.id, l.name]) || []);
            locationsMapRef.current = newLocationsMap;

            const mapped = (propsRes.data || []).map((p: Property) => {
                const mappedProperty = mapProperty(p as Property);
                if (p.location_id && newLocationsMap.has(p.location_id)) {
                    mappedProperty.location = newLocationsMap.get(p.location_id)!;
                }
                return mappedProperty;
            });

            if (mounted.current) {
                setData(mapped);
                setError(null);
            }
        } catch (err) {
            if (mounted.current) setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            if (mounted.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        mounted.current = true;
        fetchData();

        // Incremental realtime subscription - parse payload instead of full refetch
        const channel = supabase
            .channel('properties_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'properties' },
                (payload: Record<string, unknown>) => {
                    if (!mounted.current) return;

                    setData((prev) => {
                        if (payload.eventType === 'INSERT') {
                            const newProp = mapProperty(payload.new as Property);
                            if (
                                (payload.new as Record<string, unknown>).location_id &&
                                locationsMapRef.current.has(
                                    (payload.new as Record<string, unknown>).location_id as string,
                                )
                            ) {
                                newProp.location = locationsMapRef.current.get(
                                    (payload.new as Record<string, unknown>).location_id as string,
                                )!;
                            }
                            return [newProp, ...prev];
                        } else if (payload.eventType === 'UPDATE') {
                            return prev.map((p) =>
                                p.id === (payload.new as Record<string, unknown>).id
                                    ? (() => {
                                          const updated = mapProperty(payload.new as Property);
                                          if (
                                              (payload.new as Record<string, unknown>)
                                                  .location_id &&
                                              locationsMapRef.current.has(
                                                  (payload.new as Record<string, unknown>)
                                                      .location_id as string,
                                              )
                                          ) {
                                              updated.location = locationsMapRef.current.get(
                                                  (payload.new as Record<string, unknown>)
                                                      .location_id as string,
                                              )!;
                                          }
                                          return updated;
                                      })()
                                    : p,
                            );
                        } else if (payload.eventType === 'DELETE') {
                            return prev.filter(
                                (p) => p.id !== (payload.old as Record<string, unknown>).id,
                            );
                        }
                        return prev;
                    });
                },
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'property_images' },
                (payload: Record<string, unknown>) => {
                    if (!mounted.current) return;
                    // Update cover_url for affected property
                    const propertyId = ((payload.new as Record<string, unknown>)?.property_id ??
                        (payload.old as Record<string, unknown>)?.property_id) as
                        string | undefined;
                    if (!propertyId) return;

                    setData((prev) =>
                        prev.map((p) => {
                            if (p.id !== propertyId) return p;
                            // Recalculate cover_url from images (would need fresh fetch for full accuracy)
                            // For now, trigger refetch for this property
                            return p;
                        }),
                    );
                },
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'locations' },
                (payload: Record<string, unknown>) => {
                    if (!mounted.current) return;
                    // Update locations map incrementally
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        locationsMapRef.current.set(
                            (payload.new as Record<string, unknown>).id as string,
                            (payload.new as Record<string, unknown>).name as string,
                        );
                    } else if (payload.eventType === 'DELETE') {
                        locationsMapRef.current.delete(
                            (payload.old as Record<string, unknown>).id as string,
                        );
                    }
                    // Update location names in existing properties
                    setData((prev) =>
                        prev.map((p) => {
                            if (p.location_id && locationsMapRef.current.has(p.location_id)) {
                                return {
                                    ...p,
                                    location: locationsMapRef.current.get(p.location_id)!,
                                };
                            }
                            return p;
                        }),
                    );
                },
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

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const { data: agents, error } = await supabase
                .from('agents_realtime')
                .select('id, name, matricula, role, photo_url, bio, sort_order, is_active')
                .eq('is_active', true)
                .order('sort_order', { ascending: true });

            if (error) throw error;
            if (mounted.current) {
                setData((agents || []).map(mapAgent));
                setError(null);
            }
        } catch (err) {
            if (mounted.current) setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            if (mounted.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        mounted.current = true;
        fetchData();

        // Realtime subscription
        const channel = supabase
            .channel('agents_realtime_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'agents_realtime' },
                () => fetchData(),
            )
            .subscribe();

        return () => {
            mounted.current = false;
            supabase.removeChannel(channel);
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
        } catch (err) {
            console.error(
                'Locations fetch error:',
                err instanceof Error ? err.message : 'Error desconocido',
            );
        } finally {
            if (mounted.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        mounted.current = true;
        fetchData();
        const channel = supabase
            .channel('locations_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, () =>
                fetchData(),
            )
            .subscribe();
        return () => {
            mounted.current = false;
            supabase.removeChannel(channel);
        };
    }, [fetchData]);

    return { data, loading };
}
