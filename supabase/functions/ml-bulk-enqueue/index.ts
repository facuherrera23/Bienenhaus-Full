import { createClient } from 'npm:@supabase/supabase-js@2';
import { jsonResponse, optionsResponse } from '../_shared/http.ts';
import { isAdmin } from '../_shared/auth.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
});

type MlOperation = 'publish' | 'update' | 'delete';

const VALID_OPERATIONS: MlOperation[] = ['publish', 'update', 'delete'];

Deno.serve(async (req) => {
    const respond = (status: number, body: Record<string, unknown>): Response =>
        jsonResponse(status, body, req);
    if (req.method === 'OPTIONS') return optionsResponse(req);
    if (req.method !== 'POST') return respond(405, { error: 'Method not allowed' });
    if (!(await isAdmin(req, supabase))) return respond(401, { error: 'No autorizado' });

    let payload: { property_ids?: unknown; operation?: unknown };
    try {
        payload = await req.json();
    } catch {
        return respond(400, { error: 'JSON inválido' });
    }

    const propertyIds = Array.isArray(payload.property_ids)
        ? (payload.property_ids.filter((v): v is string => typeof v === 'string') as string[])
        : [];
    const operation =
        typeof payload.operation === 'string' ? (payload.operation as MlOperation) : null;

    if (propertyIds.length === 0) {
        return respond(400, { error: 'property_ids es requerido' });
    }
    if (!operation || !VALID_OPERATIONS.includes(operation)) {
        return respond(400, { error: 'operation debe ser publish, update o delete' });
    }

    const { data: settings } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'ml_enabled')
        .maybeSingle();
    const mlEnabled = settings?.value
        ? Boolean((settings.value as { value?: unknown }).value)
        : false;
    if (!mlEnabled) {
        return respond(400, { error: 'La integración con Mercado Libre está desactivada.' });
    }

    const { data: conn } = await supabase
        .from('ml_connection')
        .select('id')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1);
    if (!conn || conn.length === 0) {
        return respond(400, { error: 'No hay una cuenta de Mercado Libre conectada.' });
    }

    const { data: existing } = await supabase
        .from('ml_sync_queue')
        .select('property_id, operation')
        .in('property_id', propertyIds)
        .eq('operation', operation)
        .in('status', ['pending', 'processing']);

    const inFlight = new Set((existing ?? []).map((row) => row.property_id));

    const results: Record<string, unknown>[] = [];
    let enqueued = 0;
    let skipped = 0;

    for (const propertyId of propertyIds) {
        if (inFlight.has(propertyId)) {
            skipped++;
            results.push({ property_id: propertyId, status: 'skipped', reason: 'ya en cola' });
            continue;
        }

        const { error } = await supabase.from('ml_sync_queue').insert({
            property_id: propertyId,
            operation,
            status: 'pending',
            payload: { bulk: true, source: 'ml-bulk-enqueue' },
        });

        if (error) {
            console.error('[ml-bulk-enqueue] Error insertando propiedad en cola ML:', error);
            skipped++;
            results.push({ property_id: propertyId, status: 'skipped', reason: error.message });
        } else {
            enqueued++;
            results.push({ property_id: propertyId, status: 'enqueued' });
        }
    }

    return respond(200, { enqueued, skipped, results });
});
