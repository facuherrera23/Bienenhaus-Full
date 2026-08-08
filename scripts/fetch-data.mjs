#!/usr/bin/env node
/**
 * Fetch data from Supabase for static site generation.
 * Generates JSON files in apps/landing/src/data/generated/
 * Run during build before vite builds the landing.
 */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = join(ROOT, 'apps', 'landing', 'src', 'data', 'generated');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rnldqiwwzhjnurkguihu.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_ANON_KEY) {
    console.error('[fetch-data] VITE_SUPABASE_ANON_KEY not set, skipping');
    process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fetchProperties() {
    const { data, error } = await supabase
        .from('properties')
        .select(
            `
      id,
      code,
      title,
      slug,
      description,
      status,
      listing_type,
      price,
      currency,
      expenses,
      address,
      location_id,
      latitude,
      longitude,
      area_total,
      area_covered,
      bedrooms,
      bathrooms,
      garages,
      year_built,
      floors,
      featured,
      published_at,
      video_url,
      images:property_images(url, is_cover, position)
    `,
        )
        .eq('status', 'publicada')
        .is('deleted_at', null)
        .order('published_at', { ascending: false });

    if (error) throw new Error(`Properties fetch error: ${error.message}`);
    return data || [];
}

async function fetchAgents() {
    const { data, error } = await supabase
        .from('agents_public')
        .select('id, name, email, matricula, role, photo_url, bio, sort_order')
        .order('sort_order', { ascending: true });

    if (error) throw new Error(`Agents fetch error: ${error.message}`);
    return data || [];
}

async function fetchLocations() {
    const { data, error } = await supabase
        .from('locations')
        .select('id, name, zone')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    if (error) throw new Error(`Locations fetch error: ${error.message}`);
    return data || [];
}

function mapProperty(p) {
    const location = p.location_id ? null : 'Sin zona';
    const cover = p.images?.find((i) => i.is_cover)?.url ?? p.images?.[0]?.url ?? null;
    const gallery = p.images?.map((i) => i.url) ?? [];

    return {
        id: p.id,
        code: p.code,
        title: p.title,
        price: p.price
            ? `${p.currency} ${Number(p.price).toLocaleString('es-AR')}`
            : 'Consultar precio',
        location: location,
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

function mapListingType(type) {
    const map = {
        casa: 'casa',
        departamento: 'depto',
        depto: 'depto',
        oficina: 'oficina',
        local: 'local',
        terreno: 'terreno',
        country: 'country',
        ph: 'depto',
    };
    return map[type?.toLowerCase()] || 'casa';
}

function mapAgent(a) {
    return {
        name: a.name,
        photo: a.photo_url || '/placeholder-agent.jpg',
        alt: a.name,
        role: a.role?.toUpperCase() || 'ASESOR',
        experience: '',
        bio: a.bio || '',
    };
}

async function main() {
    console.log('[fetch-data] Fetching from Supabase...');

    const [properties, agents, locations] = await Promise.all([
        fetchProperties(),
        fetchAgents(),
        fetchLocations(),
    ]);

    console.log(
        `[fetch-data] Properties: ${properties.length}, Agents: ${agents.length}, Locations: ${locations.length}`,
    );

    if (!existsSync(OUT_DIR)) {
        mkdirSync(OUT_DIR, { recursive: true });
    }

    // Generate properties.json
    const mappedProperties = properties.map(mapProperty);
    writeFileSync(join(OUT_DIR, 'properties.json'), JSON.stringify(mappedProperties, null, 2));

    // Generate agents.json
    const mappedAgents = agents.map(mapAgent);
    writeFileSync(join(OUT_DIR, 'agents.json'), JSON.stringify(mappedAgents, null, 2));

    // Generate locations.json
    writeFileSync(join(OUT_DIR, 'locations.json'), JSON.stringify(locations, null, 2));

    console.log('[fetch-data] Done. Files written to', OUT_DIR);
}

main().catch((err) => {
    console.error('[fetch-data] Error:', err.message);
    process.exit(1);
});
