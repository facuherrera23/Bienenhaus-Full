// Admin Supabase Client — re-export from shared @bienenhaus/supabase
// This eliminates the duplicate client instance and uses the shared singleton.

// Type re-exports for convenience
export type { SupabaseClient, User, AuthChangeEvent, Session } from '@bienenhaus/supabase';

// Client — the shared singleton (already typed via Database)
export { supabase } from '@bienenhaus/supabase';

// URL pública de la base de datos (usada para llamadas a edge functions)
export { supabaseUrl } from '@bienenhaus/supabase';

// Helper: crear cliente admin con opciones adicionales
export { createAdminClient } from '@bienenhaus/supabase';

// Helper: crear cliente server-side
export { createServerClient } from '@bienenhaus/supabase';

// Auth helpers (re-exported for convenience)
export { getAuthUser, getSession, signOut, onAuthStateChange } from '@bienenhaus/supabase';