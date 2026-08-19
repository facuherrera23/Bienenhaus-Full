import type { Database } from '../types/database';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createTypedClient } from '@bienenhaus/supabase';

export type { SupabaseClient, User, AuthChangeEvent, Session } from '@bienenhaus/supabase';
export type { Database } from '../types/database';

export { supabase } from '@bienenhaus/supabase';
export { supabaseUrl } from '@bienenhaus/supabase';
export { createTypedClient } from '@bienenhaus/supabase';
export { getAuthUser, getSession, signOut, onAuthStateChange } from '@bienenhaus/supabase';

type AdminSupabaseClient = SupabaseClient<Database>;

let _adminSupabase: AdminSupabaseClient | null = null;

export async function getAdminSupabase(): Promise<AdminSupabaseClient> {
    if (!_adminSupabase) {
        _adminSupabase = createTypedClient<Database>({ schema: 'public' });
    }
    return _adminSupabase!;
}