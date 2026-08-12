import { createClient } from 'npm:@supabase/supabase-js@2';
import { checkInWithQr, generateQrCode } from '../_shared/visits.ts';
import { jsonResponse, optionsResponse } from '../_shared/http.ts';
import { requireAdmin } from '../_shared/auth.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
});

Deno.serve(async (req) => {
    const respond = (status: number, body: Record<string, unknown>): Response =>
        jsonResponse(status, body, req);
    if (req.method === 'OPTIONS') return optionsResponse(req);

    const token = await requireAdmin(req, supabase);
    if (!token) return respond(401, { error: 'No autorizado' });

    if (req.method === 'POST') {
        // Generate QR code
        const { visitId } = await req.json().catch(() => ({}));
        if (!visitId) return respond(400, { error: 'visitId requerido' });

        try {
            const qr = await generateQrCode(visitId);
            // Return QR code data URL (using a simple QR generator)
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr.code)}`;
            return respond(200, { code: qr.code, qrUrl, checkinId: qr.id });
        } catch (err) {
            console.error('[qr-checkin] Error generando QR:', err);
            return respond(500, { error: (err as Error).message });
        }
    }

    if (req.method === 'GET') {
        // Check-in with QR code
        const url = new URL(req.url);
        const code = url.searchParams.get('code');
        if (!code) return respond(400, { error: 'code requerido' });

        try {
            // Get current user (agent)
            const {
                data: { user },
            } = await supabase.auth.getUser(token);
            if (!user) return respond(401, { error: 'Usuario no autenticado' });

            const result = await checkInWithQr(code, user.id);
            return respond(result.success ? 200 : 400, result);
        } catch (err) {
            console.error('[qr-checkin] Error procesando check-in:', err);
            return respond(500, { error: (err as Error).message });
        }
    }

    return respond(405, { error: 'Method not allowed' });
});
