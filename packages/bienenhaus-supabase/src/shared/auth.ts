/**
 * Auth helpers para Edge Functions y server-side.
 * Node/TypeScript version using Supabase JS client.
 */

import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://rnldqiwwzhjnurkguihu.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

// Cliente service-role para operaciones admin/server-side
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
});

// Helper para validar JWT de usuario (Bearer token)
export async function getUserFromToken(
    accessToken: string,
): Promise<{ user: User | null; error?: string }> {
    const client = createClient(SUPABASE_URL, process.env.SUPABASE_ANON_KEY ?? '', {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
        auth: { persistSession: false },
    });

    const { data, error } = await client.auth.getUser();
    if (error) return { user: null, error: error.message };
    return { user: data.user, error: undefined };
}

// Verificar si un usuario es staff/admin
export async function isStaff(supabase: SupabaseClient, userId: string): Promise<boolean> {
    const { data } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', userId)
        .eq('is_active', true)
        .maybeSingle();

    return data !== null;
}

export async function isAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
    const { data } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', userId)
        .in('role', ['super_admin', 'admin'])
        .eq('is_active', true)
        .maybeSingle();

    return data !== null;
}

// Rate limiting simple por IP/usuario (en memoria)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
    key: string,
    maxRequests: number,
    windowMs: number,
): { allowed: boolean; retryAfterMs?: number } {
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now > record.resetAt) {
        rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true };
    }

    if (record.count >= maxRequests) {
        return { allowed: false, retryAfterMs: record.resetAt - now };
    }

    record.count++;
    return { allowed: true };
}
