/**
 * Global setup de Playwright para el admin (se ejecuta UNA vez por suite).
 *
 * Garantiza que la base local tenga el estado determinista que los specs asumen:
 *   - Usuario E2E: e2e-test@bienenhaus.local (auth.users + admin_users, role=admin)
 *   - 2 agentes (María Fernández, Jorge Álvarez)            → 2 cards en Agentes
 *   - 3 propiedades publicadas con imagen de tapa            → KPI "Propiedades Publicadas" = 3
 *   - 5 leads asignados a María Fernández                    → tabla de leads = 5 filas
 *   - 1 visita E2E (lead + propiedad + agente)               → search "visita" en Visitas
 *
 * Idempotente: borra los fixtures de una corrida previa antes de reinsertar.
 *
 * Credenciales:
 *   - CI:    SUPABASE_LOCAL_API_URL + SUPABASE_LOCAL_SECRET_KEY (exportadas en ci.yml)
 *   - Local: `npx supabase status -o json` (requiere CLI + `supabase start`)
 *
 * Nota: el stack local moderno (GoTrue v2.194+, PostgREST v14) rechaza las legacy
 * JWT keys (service_role/anon) con 403/401/PGRST301; exige la nueva SECRET_KEY
 * (`sb_secret_...`) tanto para la Admin API como para el cliente de PostgREST.
 */
import { execSync } from 'node:child_process';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? 'e2e-test@bienenhaus.local';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? 'E2eTestPass2026x';
const TEST_FULL_NAME = 'E2E Test User';

/** Replica exacta de los fixtures del antiguo supabase/seed.sql. */
const AGENT_FIXTURES = [
  {
    name: 'María Fernández',
    email: 'maria@bienenhaus.com',
    phone: '+54 351 555-0101',
    matricula: 'C-04512',
    role: 'Asesora senior',
    is_active: true,
    sort_order: 0,
  },
  {
    name: 'Jorge Álvarez',
    email: 'jorge@bienenhaus.com',
    phone: '+54 351 555-0102',
    matricula: 'C-07893',
    role: 'Asesor',
    is_active: true,
    sort_order: 1,
  },
];

const PROPERTY_FIXTURES = [
  {
    title: 'Casa Moderna en Country',
    slug: 'casa-moderna-en-country',
    listing_type: 'venta',
    price: 285000,
    currency: 'USD',
    description: 'Casa de 4 dormitorios con pileta en Villa Belgrano.',
    address: 'Manzana 12, Lote 8',
    locationName: 'Villa Belgrano',
    area_total: 280,
    bedrooms: 4,
    bathrooms: 3,
    garages: 2,
    featured: true,
  },
  {
    title: 'Penthouse con Terraza',
    slug: 'penthouse-con-terraza',
    listing_type: 'venta',
    price: 420000,
    currency: 'USD',
    description: 'Penthouse de 3 dormitorios con terraza y vista a la ciudad.',
    address: 'Av. Vélez Sarsfield 900',
    locationName: 'Nueva Córdoba',
    area_total: 195,
    bedrooms: 3,
    bathrooms: 2,
    garages: 1,
    featured: false,
  },
  {
    title: 'Villa de Lujo en Country',
    slug: 'villa-de-lujo-en-country',
    listing_type: 'venta',
    price: 680000,
    currency: 'USD',
    description: 'Villa de 5 dormitorios en country con seguridad 24h.',
    address: 'Calle Los Cedros 320',
    locationName: 'Country Los Pinos',
    area_total: 450,
    bedrooms: 5,
    bathrooms: 4,
    garages: 3,
    featured: true,
  },
];

const PROPERTY_IMAGE_URLS: Record<string, { url: string; alt: string }> = {
  'casa-moderna-en-country': {
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&fit=crop',
    alt: 'Casa moderna en country',
  },
  'penthouse-con-terraza': {
    url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&fit=crop',
    alt: 'Penthouse con terraza',
  },
  'villa-de-lujo-en-country': {
    url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&fit=crop',
    alt: 'Villa de lujo',
  },
};

const LEAD_FIXTURES = [
  {
    name: 'Lucía',
    last_name: 'Pérez',
    email: 'lucia.perez@gmail.com',
    phone: '+54 351 555-0201',
    city: 'Córdoba',
    intent: 'comprar',
    message: 'Busco un penthouse de 3 dorm con vista a la ciudad.',
    source: 'landing_form',
    status: 'contactado',
  },
  {
    name: 'Martín',
    last_name: 'Sosa',
    email: 'martin.sosa@hotmail.com',
    phone: '+54 351 555-0202',
    city: 'Villa Allende',
    intent: 'vender',
    message: 'Quiero tasar y vender mi casa en Villa Belgrano.',
    source: 'whatsapp',
    status: 'nuevo',
  },
  {
    name: 'Camila',
    last_name: 'Ríos',
    email: 'camila.rios@gmail.com',
    phone: '+54 351 555-0203',
    city: 'Córdoba',
    intent: 'alquilar',
    message: 'Departamento de 2 dorm en Nueva Córdoba.',
    source: 'landing_form',
    status: 'calificado',
  },
  {
    name: 'Diego',
    last_name: 'Luna',
    email: 'diego.luna@outlook.com',
    phone: '+54 351 555-0204',
    city: 'Río Ceballos',
    intent: 'invertir',
    message: 'Interesado en un emprendimiento en la zona norte.',
    source: 'referido',
    status: 'en_proceso',
  },
  {
    name: 'Sofía',
    last_name: 'Medina',
    email: 'sofia.medina@gmail.com',
    phone: '+54 351 555-0205',
    city: 'Córdoba',
    intent: 'comprar',
    message: 'Consulta por la villa en country.',
    source: 'ml_contacto',
    status: 'nuevo',
  },
];

interface SupabaseConfig {
  url: string;
  /** API key `sb_secret_...` — el stack moderno rechaza las legacy JWT keys (PGRST301/401/403). */
  secretKey: string;
}

function resolveSupabaseConfig(): SupabaseConfig {
  let url = process.env.SUPABASE_LOCAL_API_URL ?? 'http://127.0.0.1:54321';
  let secretKey = process.env.SUPABASE_LOCAL_SECRET_KEY ?? '';

  if (!secretKey || !process.env.SUPABASE_LOCAL_API_URL) {
    try {
      const output = execSync('npx supabase status -o json', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 30_000,
        windowsHide: true,
      });
      const parsed = JSON.parse(output) as {
        API_URL?: string;
        SECRET_KEY?: string;
      };
      url = process.env.SUPABASE_LOCAL_API_URL ?? parsed.API_URL ?? url;
      secretKey = process.env.SUPABASE_LOCAL_SECRET_KEY ?? parsed.SECRET_KEY ?? '';
    } catch (err) {
      throw new Error(
        'global-setup: no se pudo resolver la config de Supabase. ' +
          'En CI exportá SUPABASE_LOCAL_API_URL + SUPABASE_LOCAL_SECRET_KEY; ' +
          `en local corré \`supabase start\` (error: ${err instanceof Error ? err.message : String(err)})`,
        { cause: err },
      );
    }
  }

  if (!secretKey) {
    throw new Error(
      'global-setup: SECRET_KEY vacía. Iniciá Supabase local (`supabase start`) o exportá SUPABASE_LOCAL_SECRET_KEY (formato sb_secret_...).',
    );
  }

  return { url, secretKey };
}

/**
 * Asegura que el usuario E2E exista (auth.users + admin_users con role=admin).
 * Misma lógica que ci.yml: crea vía Admin API si falta; upsert de admin_users idempotente.
 */
async function ensureE2EUser(url: string, secretKey: string): Promise<void> {
  const adminClient = createClient(url, secretKey, { auth: { persistSession: false } });

  const { data: existing } = await adminClient
    .from('admin_users')
    .select('id')
    .eq('email', TEST_EMAIL)
    .maybeSingle();
  if (existing?.id) return;

  const headers: Record<string, string> = {
    apikey: secretKey,
    Authorization: `Bearer ${secretKey}`,
    'Content-Type': 'application/json',
  };

  let userId: string | null = null;
  const createRes = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: TEST_FULL_NAME },
    }),
  });

  if (createRes.ok) {
    const created = (await createRes.json()) as { id?: string };
    userId = created.id ?? null;
  } else if (createRes.status === 422 || createRes.status === 409) {
    // Ya existe en auth.users → buscar su id para el upsert de admin_users.
    const listRes = await fetch(`${url}/auth/v1/admin/users`, { headers });
    if (listRes.ok) {
      const listed = (await listRes.json()) as { users?: Array<{ id: string; email: string }> };
      userId = listed.users?.find((u) => u.email === TEST_EMAIL)?.id ?? null;
    }
  }

  if (!userId) {
    throw new Error(
      `global-setup: no se pudo crear/obtener el usuario E2E (HTTP ${createRes.status}).`,
    );
  }

  const { error } = await adminClient.from('admin_users').upsert(
    {
      id: userId,
      email: TEST_EMAIL,
      full_name: TEST_FULL_NAME,
      role: 'admin',
      is_active: true,
      must_change_password: false,
    },
    { onConflict: 'id' },
  );
  if (error) {
    throw new Error(`global-setup: falló el upsert de admin_users: ${error.message}`);
  }
}

/** Borra fixtures de corridas previas (idempotencia) + propiedades E2E huérfanas de corridas fallidas. */
async function clearFixtures(client: SupabaseClient): Promise<void> {
  const agentEmails = AGENT_FIXTURES.map((a) => a.email);
  const propertySlugs = PROPERTY_FIXTURES.map((p) => p.slug);
  const leadEmails = LEAD_FIXTURES.map((l) => l.email);

  const [{ data: agents }, { data: props }, { data: leads }, { data: orphanProps }] =
    await Promise.all([
      client.from('agents').select('id').in('email', agentEmails),
      client.from('properties').select('id').in('slug', propertySlugs),
      client.from('leads').select('id').in('email', leadEmails),
      client.from('properties').select('id').ilike('title', 'E2E%'),
    ]);

  const agentIds = (agents ?? []).map((a) => a.id);
  const propIds = (props ?? []).map((p) => p.id);
  const leadIds = (leads ?? []).map((l) => l.id);
  const orphanPropIds = (orphanProps ?? []).map((p) => p.id);
  const allPropIds = [...new Set([...propIds, ...orphanPropIds])];

  // Orden: visits primero (agents es RESTRICT), luego leads → properties (cascade imágenes) → agents.
  const visitFilters: string[] = [];
  if (agentIds.length) visitFilters.push(`agent_id.in.(${agentIds.join(',')})`);
  if (allPropIds.length) visitFilters.push(`property_id.in.(${allPropIds.join(',')})`);
  if (leadIds.length) visitFilters.push(`lead_id.in.(${leadIds.join(',')})`);
  if (visitFilters.length) {
    await client.from('visits').delete().or(visitFilters.join(','));
  }
  await client.from('visits').delete().like('title', 'Visita E2E%');

  if (leadIds.length) await client.from('leads').delete().in('id', leadIds);
  if (allPropIds.length) await client.from('properties').delete().in('id', allPropIds);
  if (agentIds.length) await client.from('agents').delete().in('id', agentIds);
}

/** Inserta fixtures en orden de dependencias y devuelve un resumen para el log. */
async function seedFixtures(client: SupabaseClient): Promise<string[]> {
  const summary: string[] = [];

  // 1. Agents
  const { data: agents, error: agentsError } = await client
    .from('agents')
    .insert(AGENT_FIXTURES)
    .select('id, email');
  if (agentsError) throw new Error(`global-setup: falló insert de agents: ${agentsError.message}`);
  const agentIdByEmail = new Map((agents ?? []).map((a) => [a.email, a.id]));
  const mariaId = agentIdByEmail.get('maria@bienenhaus.com') ?? null;
  if (!mariaId) throw new Error('global-setup: no se pudo insertar a María Fernández.');
  summary.push(`agentes: ${agents?.length ?? 0}`);

  // 2. Locations (ya seedeadas por supabase/seed.sql)
  const locationNames = [...new Set(PROPERTY_FIXTURES.map((p) => p.locationName))];
  const { data: locations } = await client
    .from('locations')
    .select('id, name')
    .in('name', locationNames);
  const locationIdByName = new Map((locations ?? []).map((l) => [l.name, l.id]));

  // 3. Properties (publicadas → KPI de Dashboard)
  const propertyRows = PROPERTY_FIXTURES.map((p) => ({
    title: p.title,
    slug: p.slug,
    status: 'publicada',
    listing_type: p.listing_type,
    price: p.price,
    currency: p.currency,
    description: p.description,
    address: p.address,
    location_id: locationIdByName.get(p.locationName) ?? null,
    area_total: p.area_total,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    garages: p.garages,
    featured: p.featured,
    published_at: new Date().toISOString(),
  }));
  const { data: props, error: propsError } = await client
    .from('properties')
    .insert(propertyRows)
    .select('id, slug');
  if (propsError) throw new Error(`global-setup: falló insert de properties: ${propsError.message}`);
  const propIdBySlug = new Map((props ?? []).map((p) => [p.slug, p.id]));
  summary.push(`propiedades: ${props?.length ?? 0}`);

  // 4. Imágenes de tapa
  const imageRows = PROPERTY_FIXTURES.flatMap((p) => {
    const propertyId = propIdBySlug.get(p.slug);
    const img = PROPERTY_IMAGE_URLS[p.slug];
    if (!propertyId || !img) return [];
    return [{ property_id: propertyId, url: img.url, alt: img.alt, position: 0, is_cover: true }];
  });
  const { error: imagesError } = await client.from('property_images').insert(imageRows);
  if (imagesError) throw new Error(`global-setup: falló insert de property_images: ${imagesError.message}`);
  summary.push(`imágenes: ${imageRows.length}`);

  // 5. Leads asignados a María Fernández
  const leadRows = LEAD_FIXTURES.map((l) => ({ ...l, assigned_to: mariaId }));
  const { data: leads, error: leadsError } = await client
    .from('leads')
    .insert(leadRows)
    .select('id, email');
  if (leadsError) throw new Error(`global-setup: falló insert de leads: ${leadsError.message}`);
  const leadIdByEmail = new Map((leads ?? []).map((l) => [l.email, l.id]));
  summary.push(`leads: ${leads?.length ?? 0}`);

  // 6. Visita E2E → hace que el search "visita" de VisitasPage tenga datos
  const startsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  startsAt.setHours(10, 0, 0, 0);
  const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
  const { error: visitError } = await client.from('visits').insert({
    lead_id: leadIdByEmail.get('lucia.perez@gmail.com') ?? null,
    property_id: propIdBySlug.get('casa-moderna-en-country') ?? null,
    agent_id: mariaId,
    title: 'Visita a Casa Moderna en Country',
    description: 'Primera visita de seguimiento',
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    status: 'programada',
    meeting_type: 'presencial',
    location: 'Villa Belgrano',
  });
  if (visitError) throw new Error(`global-setup: falló insert de visit: ${visitError.message}`);
  summary.push('visitas: 1');

  return summary;
}

export default async function globalSetup(): Promise<void> {
  const { url, secretKey } = resolveSupabaseConfig();
  const client = createClient(url, secretKey, { auth: { persistSession: false } });

  await ensureE2EUser(url, secretKey);
  await clearFixtures(client);
  const summary = await seedFixtures(client);

  // eslint-disable-next-line no-console
  console.log(`[global-setup] fixtures listos (${summary.join(', ')}) en ${url}`);
}
