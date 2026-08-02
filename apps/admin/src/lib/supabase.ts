import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseUrl = url ?? 'http://127.0.0.1:54321';

export const supabase = createClient(
  supabaseUrl,
  anonKey ?? 'placeholder-anon-key',
);
