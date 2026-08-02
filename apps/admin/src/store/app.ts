import { signal } from '@preact/signals';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// ---------------------------------------------------------------------------
// Sesión
// ---------------------------------------------------------------------------
export const authSession = signal<Session | null>(null);
export const authLoading = signal(true);

export async function initAuth(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  authSession.value = data.session;
  authLoading.value = false;

  // Si el hash trae un callback de auth (access_token, type=recovery, etc.)
  // y no es una ruta de la app (#/...), lo limpiamos para evitar NotFound.
  const hash = window.location.hash;
  if (hash && !hash.startsWith('#/')) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    authSession.value = session;
  });
}

// ---------------------------------------------------------------------------
// UI state
// ---------------------------------------------------------------------------
export const sidebarCollapsed = signal(false);
export const mobileMenuOpen = signal(false);

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------
export interface ToastItem {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}

export const toasts = signal<ToastItem[]>([]);

let toastSeq = 0;

export function pushToast(item: Omit<ToastItem, 'id'>): void {
  const id = ++toastSeq;
  toasts.value = [...toasts.value, { id, ...item }];
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }, 4500);
}
