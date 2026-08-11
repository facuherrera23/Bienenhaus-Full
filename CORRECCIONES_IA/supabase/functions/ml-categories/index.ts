import { createClient } from 'npm:@supabase/supabase-js@2';
import { fetchMlCategories, runMlApiCallWithRetry } from '../_shared/ml.ts';
import { jsonResponse, optionsResponse } from '../_shared/http.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
});

async function isAuthorized(req: Request): Promise<string | null> {
    const auth = req.headers.get('authorization') ?? '';
    if (!auth.startsWith('Bearer ')) return null;
    const token = auth.slice(7);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    const { data: admins } = await supabase
        .from('admin_users')
        .select('role, is_active')
        .eq('id', data.user.id)
        .limit(1);
    const admin = admins?.[0];
    if (!admin || !admin.is_active || !['super_admin', 'admin', 'staff'].includes(admin.role))
        return null;
    return token;
}

Deno.serve(async (req) => {
    const respond = (status: number, body: unknown): Response =>
        jsonResponse(status, body, req);
    if (req.method === 'OPTIONS') return optionsResponse(req);
    if (req.method !== 'GET') return respond(405, { error: 'Method not allowed' });

    const token = await isAuthorized(req);
    if (!token) return respond(401, { error: 'No autorizado' });

    try {
        const result = await runMlApiCallWithRetry(
            token,
            () => fetchMlCategories(token),
            'fetchMlCategories',
        );
        if (!result.ok) {
            return respond(429, { error: result.error, retry_after: 60 });
        }
        return respond(200, result.data);
    } catch (err) {
        console.error('[ml-categories] Error sincronizando categorías:', err);
        return respond(500, { error: (err as Error).message });
    }
});
