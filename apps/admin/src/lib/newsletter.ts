import { supabase } from '@bienenhaus/supabase';
import {
    NEWSLETTER_SOURCE_LABEL,
    NEWSLETTER_STATUS_LABEL,
    type NewsletterSource,
    type NewsletterStatus,
    type NewsletterSubscriber,
} from '../types/newsletter';
import type { Database } from '../types/database';

// ============================================================
// Re-export types and constants
// ============================================================

export type { NewsletterSource, NewsletterStatus, NewsletterSubscriber };

export { NEWSLETTER_SOURCE_LABEL, NEWSLETTER_STATUS_LABEL };

// ============================================================
// DB row types with embedded relations
// ============================================================

type SubscriberApiRow = Database['public']['Tables']['newsletter_subscribers']['Row'];

// ============================================================
// SELECT strings
// ============================================================

const SUBSCRIBER_SELECT = `
  id, email, source, status, created_at, deleted_at
`.trim();

// ============================================================
// Mappers
// ============================================================

function toSubscriberRow(s: SubscriberApiRow): NewsletterSubscriber {
    return {
        id: s.id,
        email: s.email,
        source: s.source as NewsletterSource,
        status: s.status as NewsletterStatus,
        created_at: s.created_at,
        deleted_at: s.deleted_at ?? undefined,
    };
}

// ============================================================
// API Functions - Fetch
// ============================================================

export async function fetchSubscribers(options?: {
    status?: NewsletterStatus;
    source?: NewsletterSource;
    search?: string;
    page?: number;
    pageSize?: number;
}): Promise<NewsletterSubscriber[]> {
    let query = supabase
        .from('newsletter_subscribers')
        .select(SUBSCRIBER_SELECT)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (options?.status) {
        query = query.eq('status', options.status);
    }

    if (options?.source) {
        query = query.eq('source', options.source);
    }

    if (options?.search) {
        const escaped = options.search.replace(/[%_]/g, '\\$&');
        query = query.ilike('email', `%${escaped}%`);
    }

    const limit = options?.pageSize ?? 50;
    const offset = ((options?.page ?? 1) - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query.returns<SubscriberApiRow[]>();

    if (error) throw new Error(error.message);
    return (data ?? []).map(toSubscriberRow);
}

export async function fetchSubscriber(id: string): Promise<NewsletterSubscriber> {
    const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select(SUBSCRIBER_SELECT)
        .eq('id', id)
        .maybeSingle<SubscriberApiRow>();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Suscriptor no encontrado');
    return toSubscriberRow(data);
}

export async function fetchDeletedSubscribers(options?: {
    page?: number;
    pageSize?: number;
}): Promise<NewsletterSubscriber[]> {
    let query = supabase
        .from('newsletter_subscribers')
        .select(SUBSCRIBER_SELECT)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

    const limit = options?.pageSize ?? 50;
    const offset = ((options?.page ?? 1) - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query.returns<SubscriberApiRow[]>();

    if (error) throw new Error(error.message);
    return (data ?? []).map(toSubscriberRow);
}

// ============================================================
// API Functions - Count
// ============================================================

export async function countSubscribers(options?: {
    status?: NewsletterStatus;
    source?: NewsletterSource;
    includeDeleted?: boolean;
}): Promise<number> {
    let query = supabase
        .from('newsletter_subscribers')
        .select('id', { count: 'exact', head: true });

    if (!options?.includeDeleted) {
        query = query.is('deleted_at', null);
    }

    if (options?.status) {
        query = query.eq('status', options.status);
    }

    if (options?.source) {
        query = query.eq('source', options.source);
    }

    const { count, error } = await query;

    if (error) throw new Error(error.message);
    return count ?? 0;
}

// ============================================================
// API Functions - CRUD
// ============================================================

export async function createSubscriber(params: {
    email: string;
    source?: NewsletterSource;
    status?: NewsletterStatus;
}): Promise<NewsletterSubscriber> {
    // Verificar si ya existe
    const { data: existing, error: checkError } = await supabase
        .from('newsletter_subscribers')
        .select('id, deleted_at')
        .eq('email', params.email)
        .maybeSingle();

    if (checkError && checkError.message !== 'No rows found') {
        throw new Error(checkError.message);
    }

    if (existing) {
        // Si existe pero está eliminado (soft delete), restaurarlo
        if (existing.deleted_at) {
            const { error: restoreError } = await supabase
                .from('newsletter_subscribers')
                .update({
                    deleted_at: null,
                    status: params.status ?? 'active',
                    source: params.source ?? 'manual',
                })
                .eq('id', existing.id);

            if (restoreError) throw new Error(restoreError.message);
            return fetchSubscriber(existing.id);
        }

        // Si ya existe activo, actualizar
        const { error: updateError } = await supabase
            .from('newsletter_subscribers')
            .update({
                status: params.status ?? 'active',
                source: params.source ?? 'manual',
            })
            .eq('id', existing.id);

        if (updateError) throw new Error(updateError.message);
        return fetchSubscriber(existing.id);
    }

    // Crear nuevo
    const { data, error } = await supabase
        .from('newsletter_subscribers')
        .insert({
            email: params.email,
            source: params.source ?? 'manual',
            status: params.status ?? 'active',
        })
        .select('id')
        .single();

    if (error) throw new Error(error.message);
    return fetchSubscriber(data.id);
}

export async function updateSubscriber(
    id: string,
    params: {
        status?: NewsletterStatus;
        source?: NewsletterSource;
    },
): Promise<NewsletterSubscriber> {
    const { error } = await supabase
        .from('newsletter_subscribers')
        .update({
            status: params.status,
            source: params.source,
        })
        .eq('id', id)
        .is('deleted_at', null);

    if (error) throw new Error(error.message);
    return fetchSubscriber(id);
}

export async function deleteSubscriber(id: string, permanent = false): Promise<void> {
    if (permanent) {
        const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', id);

        if (error) throw new Error(error.message);
    } else {
        const { error } = await supabase
            .from('newsletter_subscribers')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw new Error(error.message);
    }
}

export async function softDeleteSubscriber(id: string): Promise<void> {
    return deleteSubscriber(id, false);
}

export async function permanentDeleteSubscriber(id: string): Promise<void> {
    return deleteSubscriber(id, true);
}

export async function restoreSubscriber(id: string): Promise<NewsletterSubscriber> {
    const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ deleted_at: null })
        .eq('id', id);

    if (error) throw new Error(error.message);
    return fetchSubscriber(id);
}

// ============================================================
// API Functions - Bulk Operations (Batch Optimized)
// ============================================================

export async function bulkCreateSubscribers(
    emails: string[],
    source: NewsletterSource = 'manual',
): Promise<{ created: number; skipped: number }> {
    if (emails.length === 0) return { created: 0, skipped: 0 };

    // Deduplicar emails de entrada
    const uniqueEmails = [...new Set(emails.map((e) => e.trim().toLowerCase()))];

    // Usar upsert con onConflict para insertar en batch
    const rows = uniqueEmails.map((email) => ({
        email,
        source,
        status: 'active' as const,
    }));

    const { data, error } = await supabase
        .from('newsletter_subscribers')
        .upsert(rows, { onConflict: 'email', ignoreDuplicates: false })
        .select('id');

    if (error) throw new Error(error.message);

    const created = data?.length ?? 0;
    const skipped = uniqueEmails.length - created;
    return { created, skipped };
}

export async function bulkUpdateSubscribers(
    ids: string[],
    params: { status?: NewsletterStatus; source?: NewsletterSource },
): Promise<number> {
    if (ids.length === 0) return 0;

    // Filtrar params vacíos
    const updateData: Record<string, unknown> = {};
    if (params.status) updateData.status = params.status;
    if (params.source) updateData.source = params.source;

    if (Object.keys(updateData).length === 0) return 0;

    const { error } = await supabase
        .from('newsletter_subscribers')
        .update(updateData)
        .in('id', ids);

    if (error) throw new Error(error.message);

    return ids.length;
}

export async function bulkDeleteSubscribers(ids: string[], permanent = false): Promise<number> {
    if (ids.length === 0) return 0;

    if (permanent) {
        const { error } = await supabase
            .from('newsletter_subscribers')
            .delete()
            .in('id', ids);

        if (error) throw new Error(error.message);
        return ids.length;
    }

    const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', ids);

    if (error) throw new Error(error.message);
    return ids.length;
}

// ============================================================
// API Functions - Export
// ============================================================

function csvEscape(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

export async function exportSubscribersToCSV(options?: {
    status?: NewsletterStatus;
    source?: NewsletterSource;
}): Promise<string> {
    const subscribers = await fetchSubscribers({
        status: options?.status,
        source: options?.source,
        pageSize: 10000, // Máximo para exportación
    });

    if (subscribers.length === 0) {
        return 'No hay suscriptores para exportar';
    }

    const headers = ['Email', 'Estado', 'Fuente', 'Fecha de suscripción'];
    const rows = subscribers.map((s) => [
        csvEscape(s.email),
        csvEscape(NEWSLETTER_STATUS_LABEL[s.status] ?? s.status),
        csvEscape(NEWSLETTER_SOURCE_LABEL[s.source] ?? s.source),
        csvEscape(new Date(s.created_at).toLocaleDateString('es-AR')),
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    return csv;
}

// ============================================================
// API Functions - Webhook / Landing
// ============================================================

export async function subscribeFromLanding(params: {
    email: string;
    source?: NewsletterSource;
}): Promise<{ success: boolean; message: string }> {
    try {
        await createSubscriber({
            email: params.email,
            source: params.source ?? 'landing_footer',
        });
        return { success: true, message: 'Suscriptor registrado correctamente' };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Error al registrar suscriptor',
        };
    }
}

export async function unsubscribeSubscriber(
    email: string,
): Promise<{ success: boolean; message: string }> {
    try {
        // Buscar por email
        const { data, error } = await supabase
            .from('newsletter_subscribers')
            .select('id')
            .eq('email', email)
            .is('deleted_at', null)
            .maybeSingle();

        if (error) throw new Error(error.message);
        if (!data) {
            return { success: false, message: 'Suscriptor no encontrado' };
        }

        await deleteSubscriber(data.id, false);
        return { success: true, message: 'Suscriptor dado de baja correctamente' };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Error al dar de baja',
        };
    }
}
