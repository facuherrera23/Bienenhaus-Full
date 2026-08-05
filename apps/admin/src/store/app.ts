import { signal } from '@preact/signals';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const authSession = signal<Session | null>(null);
export const authLoading = signal(true);
export const authUserRole = signal<'super_admin' | 'admin' | 'staff' | 'viewer' | null>(null);
export const authMustChangePassword = signal(false);
export const authSigningOut = signal(false);

function cleanAuthHash(): void {
  const hash = window.location.hash;
  if (!hash) return;

  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  const authParams = ['access_token', 'refresh_token', 'type', 'code', 'error', 'error_description'];
  let hasAuthParam = false;
  for (const p of authParams) {
    if (params.has(p)) {
      hasAuthParam = true;
      break;
    }
  }

  if (hasAuthParam) {
    const routeMatch = hash.match(/^(#\/[^?#]*)/);
    const newHash = routeMatch ? routeMatch[1] : '';
    const newUrl = window.location.pathname + window.location.search + newHash;
    window.history.replaceState(null, '', newUrl);
  }
}

async function fetchUserRole(email: string): Promise<{ role: 'super_admin' | 'admin' | 'staff' | 'viewer' | null; mustChangePassword: boolean }> {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('role, must_change_password')
      .eq('email', email)
      .maybeSingle();
    if (error || !data) return { role: null, mustChangePassword: false };
    return { role: data.role as 'super_admin' | 'admin' | 'staff' | 'viewer', mustChangePassword: data.must_change_password ?? false };
  } catch {
    return { role: null, mustChangePassword: false };
  }
}

export async function signOut(): Promise<void> {
  authSigningOut.value = true;
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    pushToast({ type: 'info', title: 'Sesión cerrada', description: 'Hasta pronto' });
  } catch {
    pushToast({ type: 'error', title: 'Error al cerrar sesión', description: 'Intentalo de nuevo' });
  } finally {
    authSigningOut.value = false;
  }
}

export async function initAuth(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  authSession.value = data.session;

  if (data.session?.user?.email) {
    const { role, mustChangePassword } = await fetchUserRole(data.session.user.email);
    authUserRole.value = role;
    authMustChangePassword.value = mustChangePassword;
  }
  authLoading.value = false;

  cleanAuthHash();

  supabase.auth.onAuthStateChange(async (_event, session) => {
    authSession.value = session;
    if (session?.user?.email) {
      const { role, mustChangePassword } = await fetchUserRole(session.user.email);
      authUserRole.value = role;
      authMustChangePassword.value = mustChangePassword;
    } else {
      authUserRole.value = null;
      authMustChangePassword.value = false;
    }
    setTimeout(cleanAuthHash, 0);
  });
}

export const sidebarCollapsed = signal(false);
export const mobileMenuOpen = signal(false);

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