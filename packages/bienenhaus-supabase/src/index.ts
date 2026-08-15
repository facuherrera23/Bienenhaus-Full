/**
 * Shared Supabase Client — @bienenhaus/supabase
 *
 * Single source of truth for Supabase client across landing + admin.
 * Eliminates 3 separate client instances + 3 WebSocket connections.
 *
 * Usage:
 *   import { supabase, createServerClient, onAuthStateChange, createTypedClient } from '@bienenhaus/supabase';
 *   // For type-safe admin queries:
 *   import type { Database } from '../types/database';
 *   const adminSupabase = createTypedClient<Database>();
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

export const supabaseUrl = SUPABASE_URL;

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

/**
 * Creates a new Supabase client typed with the provided Database schema.
 * Use this for type-safe queries in admin/edge functions.
 * Each caller gets its own client instance (no singleton).
 */
export function createTypedClient<Database = unknown>(
    options?: {
        url?: string;
        anonKey?: string;
        schema?: string;
    },
): SupabaseClient<Database> {
    const url = options?.url || SUPABASE_URL;
    const key = options?.anonKey || SUPABASE_ANON_KEY;

    return createClient(url, key, {
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
        db: {
            schema: options?.schema || 'public',
        },
        global: {
            headers: {
                'x-application-name': 'bienenhaus-shared',
            },
        },
    }) as unknown as SupabaseClient<Database>;
}

/**
 * Crea un cliente Supabase configurado para el panel de admin con
 * opciones adicionales (db schema, headers personalizados).
 * @param options Configuración opcional
 */
export function createAdminClient(
    options?: {
        url?: string;
        anonKey?: string;
        serviceRoleKey?: string;
    },
): SupabaseClient {
    const url = options?.url || SUPABASE_URL;
    const key = options?.anonKey || SUPABASE_ANON_KEY;

    return createClient(url, key, {
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
        db: {
            schema: 'public',
        },
        global: {
            headers: {
                'x-application-name': 'bienenhaus-admin',
            },
        },
    });
}

/**
 * Crea un cliente Supabase para server-side rendering o edge functions
 * con token de acceso y opcionalmente modo service_role.
 */
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

export async function getCurrentUser(): Promise<User | null> {
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
}