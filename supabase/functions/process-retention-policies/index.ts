import { createClient } from 'npm:@supabase/supabase-js@2';
import { jsonResponse, optionsResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return optionsResponse(req);

    if (req.method !== 'POST') {
        return jsonResponse(405, { error: 'Method not allowed' }, req);
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SERVICE_ROLE_KEY') ?? '',
            { auth: { persistSession: false } },
        );

        const now = new Date();

        // Obtener políticas de retención activas
        const { data: policies, error: policiesError } = await supabase
            .from('trash_retention_policies')
            .select('*')
            .eq('auto_delete_enabled', true);

        if (policiesError) throw policiesError;

        for (const policy of policies ?? []) {
            if (!policy.auto_delete_enabled) continue;

            const cutoff = new Date(now.getTime() - policy.retention_days * 24 * 60 * 60 * 1000);
            const notifyCutoff = new Date(
                now.getTime() -
                    (policy.retention_days - policy.notify_before_days) * 24 * 60 * 60 * 1000,
            );

            const tableName = policy.entity;

            // 1. Notificar items próximos a auto-eliminarse
            const { data: toNotify } = await supabase
                .from(policy.entity)
                .select('id, deleted_at')
                .not('deleted_at', 'is', null)
                .lte('deleted_at', notifyCutoff.toISOString())
                .gt('deleted_at', cutoff.toISOString());

            if (toNotify?.length) {
                // Enviar notificación a admins (implementar según sistema de notificaciones)
                console.log(
                    `[retention] Notificar ${toNotify.length} items en ${policy.entity} próximos a auto-eliminación`,
                );

                // Ejemplo: crear notificación en BD
                for (const item of toNotify) {
                    await supabase.from('notifications').insert({
                        type: 'trash_retention_warning',
                        title: `Elemento próximo a eliminación automática`,
                        content: `El elemento será eliminado permanentemente en ${policy.notify_before_days} días`,
                        reference_id: item.id,
                        reference_type: policy.entity,
                        metadata: {
                            entity: policy.entity,
                            days_remaining: policy.notify_before_days,
                        },
                    });
                }
            }

            // 2. Auto-eliminar items vencidos
            const { data: toDelete } = await supabase
                .from(policy.entity)
                .select('id')
                .not('deleted_at', 'is', null)
                .lte('deleted_at', cutoff.toISOString());

            if (toDelete?.length) {
                console.log(
                    `[retention] Auto-eliminando ${toDelete.length} items de ${policy.entity}`,
                );

                // Eliminar en batches para evitar timeouts
                const batchSize = 100;
                for (let i = 0; i < toDelete.length; i += batchSize) {
                    const batch = toDelete.slice(i, i + batchSize);
                    const ids = batch.map((d) => d.id);

                    // Llamar a la función de bulk permanent delete
                    // Nota: Esto requeriría una RPC o llamada a la API
                    // Por simplicidad, hacemos delete directo aquí
                    const { error } = await supabase.from(policy.entity).delete().in('id', ids);

                    if (error) {
                        console.error(`[retention] Error eliminando batch:`, error);
                    }
                }
            }
        }

        return jsonResponse(200, { ok: true, processed: policies?.length ?? 0 }, req);
    } catch (err) {
        console.error('[process-retention-policies] Error:', err);
        return jsonResponse(500, { error: (err as Error).message }, req);
    }
});
