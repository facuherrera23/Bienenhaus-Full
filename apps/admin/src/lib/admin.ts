import { supabase, supabaseUrl } from './supabase';

export type AdminRole = 'super_admin' | 'admin' | 'staff' | 'viewer';

export const ADMIN_ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  staff: 'Staff',
  viewer: 'Solo lectura',
};

export interface AdminUserRow {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  is_active: boolean;
  must_change_password: boolean;
  last_login_at: string | null;
  created_at: string;
}

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, email, full_name, role, is_active, must_change_password, last_login_at, created_at')
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminUserRow[];
}

export async function fetchMyUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

export async function updateAdminUser(
  id: string,
  patch: { role?: AdminRole; is_active?: boolean },
): Promise<void> {
  const { error } = await supabase.from('admin_users').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

interface EdgeResult {
  ok?: boolean;
  error?: string;
  link?: string | null;
}

async function callAdminEdge(payload: Record<string, unknown>): Promise<EdgeResult> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Sin sesión activa');

  const res = await fetch(`${supabaseUrl}/functions/v1/admin-user-invite`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const body = (await res.json().catch(() => ({}))) as EdgeResult;
  if (!res.ok) throw new Error(body.error ?? `Error (${res.status})`);
  return body;
}

export async function inviteAdminUser(input: {
  email: string;
  full_name: string;
  role: AdminRole;
}): Promise<{ link: string | null }> {
  const res = await callAdminEdge({ action: 'invite', ...input });
  return { link: res.link ?? null };
}

export async function resetAdminUserPassword(email: string): Promise<{ link: string | null }> {
  const res = await callAdminEdge({ action: 'reset', email });
  return { link: res.link ?? null };
}

export async function removeAdminUser(email: string): Promise<void> {
  await callAdminEdge({ action: 'remove', email });
}
