import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? '';

const RETENTION_ENTITIES = new Set([
    'properties',
    'leads',
    'owners',
    'agents',
    'visits',
    'property_valuations',
]);

const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://bienenhaus.com.ar',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(
    status: number,
    body: Record<string, unknown>,
): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
        },
    });
}

/**
 * Supabase Edge Runtime verifies the JWT before the handler runs by default.
 * We still require the service_role claim because this endpoint performs
 * destructive operations with a service-role client.
 */
function hasServiceRoleClaim(token: string): boolean {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;

        const payload = JSON.parse(
            atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
        ) as { role?: unknown };

        return payload.role === 'service_role';
    } catch {
        return false;
    }
}

function getBearerToken(req: Request): string | null {
    const header = req.headers.get('Authorization');
    if (!header?.startsWith('Bearer ')) return null;

    const token = header.slice('Bearer '.length).trim();
    return token || null;
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return jsonResponse(405, { error: 'Method not allowed' });
    }

    const token = getBearerToken(req);
    if (!token || !hasServiceRoleClaim(token)) {
        return jsonResponse(403, {
            error: 'This endpoint is restricted to service_role callers',
        });
    }

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
        console.error('[process-retention-policies] Missing Supabase configuration');
        return jsonResponse(500, { error: 'Server configuration error' });
    }

    try {
        const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
            auth: { persistSession: false, autoRefreshToken: false },
        });

        const now = new Date();

        const { data: policies, error: policiesError } = await supabase
            .from('trash_retention_policies')
            .select('entity, retention_days, notify_before_days, auto_delete_enabled')
            .eq('auto_delete_enabled', true);

        if (policiesError) throw policiesError;

        let processed = 0;
        let deleted = 0;
        let warnings = 0;

        for (const policy of policies ?? []) {
            const entity = String(policy.entity ?? '');

            // Never execute dynamic table operations for arbitrary values stored
            // in the database. Only known soft-delete tables are accepted.
            if (!RETENTION_ENTITIES.has(entity)) {
                console.warn(
                    `[process-retention-policies] Ignoring unsupported entity: ${entity}`,
                );
                continue;
            }

            const retentionDays = Number(policy.retention_days);
            const notifyBeforeDays = Math.max(
                0,
                Number(policy.notify_before_days ?? 7),
            );

            if (
                !Number.isFinite(retentionDays) ||
                retentionDays <= 0 ||
                !Number.isFinite(notifyBeforeDays) ||
                notifyBeforeDays > retentionDays
            ) {
                console.warn(
                    `[process-retention-policies] Invalid policy for ${entity}`,
                );
                continue;
            }

            processed += 1;

            const cutoff = new Date(
                now.getTime() - retentionDays * 24 * 60 * 60 * 1000,
            );

            const notifyCutoff = new Date(
                now.getTime() -
                    (retentionDays - notifyBeforeDays) * 24 * 60 * 60 * 1000,
            );

            // Notification infrastructure is not present in this schema yet.
            // Count the records and log the warning instead of attempting to
            // insert into a nonexistent `notifications` table.
            const { count: warningCount, error: warningError } = await supabase
                .from(entity)
                .select('id', { count: 'exact', head: true })
                .not('deleted_at', 'is', null)
                .lte('deleted_at', notifyCutoff.toISOString())
                .gt('deleted_at', cutoff.toISOString());

            if (warningError) {
                throw new Error(
                    `Unable to inspect ${entity} for retention warnings: ${warningError.message}`,
                );
            }

            warnings += warningCount ?? 0;

            const { data: expired, error: expiredError } = await supabase
                .from(entity)
                .select('id')
                .not('deleted_at', 'is', null)
                .lte('deleted_at', cutoff.toISOString())
                .limit(5000);

            if (expiredError) {
                throw new Error(
                    `Unable to inspect expired ${entity}: ${expiredError.message}`,
                );
            }

            if (!expired?.length) continue;

            // Delete in bounded batches to avoid oversized PostgREST requests.
            const batchSize = 100;
            for (let i = 0; i < expired.length; i += batchSize) {
                const ids = expired.slice(i, i + batchSize).map((row) => row.id);

                const { error: deleteError } = await supabase
                    .from(entity)
                    .delete()
                    .in('id', ids);

                if (deleteError) {
                    throw new Error(
                        `Unable to delete expired ${entity}: ${deleteError.message}`,
                    );
                }

                deleted += ids.length;
            }
        }

        return jsonResponse(200, {
            ok: true,
            processed,
            warnings,
            deleted,
            executed_at: now.toISOString(),
        });
    } catch (err) {
        console.error('[process-retention-policies] Error:', err);

        return jsonResponse(500, {
            error:
                err instanceof Error
                    ? err.message
                    : 'Unexpected server error',
        });
    }
});
