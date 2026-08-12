/**
 * Shared Supabase Client — @bienenhaus/supabase
 *
 * Single source of truth for Supabase client across landing + admin.
 * Eliminates 3 separate client instances + 3 WebSocket connections.
 *
 * Usage:
 *   import { supabase, createServerClient } from '@bienenhaus/supabase';
 *   const { data } = await supabase.from('properties').select('*');
 */

import {
    type AuthChangeEvent,
    createClient,
    type Session,
    type SupabaseClient,
    type User,
} from '@supabase/supabase-js';

const SUPABASE_URL =
    import.meta.env.VITE_SUPABASE_URL || 'https://rnldqiwwzhjnurkguihu.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let _supabase: SupabaseClient | null = null;

function getClient(): SupabaseClient {
    if (!_supabase) {
        _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
            },
            realtime: {
                params: {
                    eventsPerSecond: 10,
                },
            },
        });
    }
    return _supabase;
}

export const supabase = getClient();

export type { SupabaseClient, User, AuthChangeEvent, Session };

export function createServerClient(
    accessToken: string,
    options?: { serviceRole?: boolean },
): SupabaseClient {
    const key = options?.serviceRole
        ? import.meta.env.SUPABASE_SERVICE_ROLE_KEY
        : SUPABASE_ANON_KEY;

    return createClient(SUPABASE_URL, key, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}

export async function getAuthUser(): Promise<User | null> {
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
}

export function getSession() {
    return supabase.auth.getSession();
}

export function signOut() {
    return supabase.auth.signOut();
}

export function onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void,
) {
    return supabase.auth.onAuthStateChange(callback);
}

export { createClient };


