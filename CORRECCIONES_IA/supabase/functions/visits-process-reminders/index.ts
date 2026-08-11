import { createClient } from 'npm:@supabase/supabase-js@2';
import { processReminders } from '../_shared/visits.ts';
import { jsonResponse, optionsResponse } from '../_shared/http.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
});

Deno.serve(async (req) => {
    const respond = (status: number, body: Record<string, unknown>): Response =>
        jsonResponse(status, body, req);
    if (req.method === 'OPTIONS') return optionsResponse(req);
    if (req.method !== 'POST') return respond(405, { error: 'Method not allowed' });

    try {
        const result = await processReminders();
        return respond(200, result);
    } catch (err) {
        console.error('[visits-process-reminders] Error procesando recordatorios:', err);
        return respond(500, { error: (err as Error).message });
    }
});
