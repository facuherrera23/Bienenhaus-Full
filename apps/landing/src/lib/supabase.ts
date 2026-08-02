/**
 * Cliente Supabase de la landing (sin dependencias: fetch directo a REST/RPC).
 *
 * La ANON key es pública por diseño (solo habilita el RPC de suscripción y el
 * RPC de contacto). En producción VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
 * se inyectan en el build (workflow de Pages); si no, se usan los valores del
 * cloud como respaldo. En dev (puerto 5173) las llamadas van al servidor demo.
 */
export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJubGRxaXd3emhqbnVya2d1aWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5NDA4MzMsImV4cCI6MjEwMDUxNjgzM30.tzqe0Z1vS9R5GiCTxIe3m6uY4kkggF3kewPrRUY8BwE';

const DEFAULT_SUPABASE_URL = 'https://rnldqiwwzhjnurkguihu.supabase.co';

function detectSupabaseUrl(): string {
  const configured = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
  if (configured) return configured.replace(/\/+$/, '');
  if (typeof location === 'undefined') return DEFAULT_SUPABASE_URL;
  // Demo server single-port: las llamadas van por el mismo origen.
  if (location.port === '5173') return location.origin;
  return DEFAULT_SUPABASE_URL;
}

export const supabaseBaseUrl = detectSupabaseUrl();
