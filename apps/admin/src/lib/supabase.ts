import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// ============================================================
// Environment Variables Validation
// ============================================================

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url) {
  throw new Error(
    'VITE_SUPABASE_URL is not set. Check your environment variables.\n' +
    'Make sure you have a .env file with VITE_SUPABASE_URL=your-url'
  );
}

if (!anonKey) {
  throw new Error(
    'VITE_SUPABASE_ANON_KEY is not set. Check your environment variables.\n' +
    'Make sure you have a .env file with VITE_SUPABASE_ANON_KEY=your-key'
  );
}

// ============================================================
// Client Configuration (typed for admin)
// ============================================================

export const supabaseUrl = url;

export const supabase: SupabaseClient<Database> = createClient<Database>(url, anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce',
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'x-application-name': 'bienenhaus-admin',
    },
  },
});

// ============================================================
// Storage Buckets
// ============================================================

export const STORAGE_BUCKETS = {
  AGENT_PHOTOS: 'agent-photos',
  PROPERTY_IMAGES: 'property-images',
  SITE_IMAGES: 'site-images',
  CHAT_FILES: 'chat-files',
} as const;

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

// ============================================================
// Helper Functions
// ============================================================

/**
 * Obtiene la URL pública de un archivo en Storage
 */
export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Sube un archivo a Storage
 */
export async function uploadFile(
  bucket: StorageBucket,
  path: string,
  file: File,
  options?: { upsert?: boolean; contentType?: string }
): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: options?.upsert ?? false,
      contentType: options?.contentType ?? file.type,
    });

  if (error) throw new Error(error.message);
  return getPublicUrl(bucket, path);
}

/**
 * Elimina un archivo de Storage
 */
export async function deleteFile(bucket: StorageBucket, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(error.message);
}

/**
 * Elimina múltiples archivos de Storage
 */
export async function deleteFiles(bucket: StorageBucket, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) throw new Error(error.message);
}

/**
 * Obtiene la URL firmada de un archivo (para acceso privado)
 */
export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn: number = 60 // segundos
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) throw new Error(error.message);
  return data.signedUrl;
}

// ============================================================
// Auth Helpers
// ============================================================

/**
 * Obtiene el token de acceso actual
 */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * Obtiene el usuario actual
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  return data.user;
}

/**
 * Verifica si hay una sesión activa
 */
export async function hasActiveSession(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

// ============================================================
// RPC Helpers
// ============================================================

/**
 * Ejecuta una función RPC con tipado seguro
 */
export async function callRpc<
  Fn extends keyof Database['public']['Functions'],
>(
  fn: Fn,
  params?: Database['public']['Functions'][Fn]['Args']
): Promise<Database['public']['Functions'][Fn]['Returns']> {
  const { data, error } = await supabase.rpc(fn, params);
  if (error) throw new Error(error.message);
  return data as Database['public']['Functions'][Fn]['Returns'];
}

// ============================================================
// Export Direct Functions
// ============================================================

export {
  createClient,
  type SupabaseClient,
  type Session,
  type Database,
};