import { supabase } from './supabase';

export type AdminRole = 'super_admin' | 'admin' | 'staff' | 'viewer';

export interface AdminUserRow {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  is_active: boolean;
  must_change_password: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export const ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  staff: 'Staff',
  viewer: 'Viewer',
};

export const ROLE_TONE: Record<AdminRole, string> = {
  super_admin: 'danger',
  admin: 'warning',
  staff: 'info',
  viewer: 'neutral',
};

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .order('role', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as AdminUserRow[];
}

export async function updateAdminUserRole(id: string, role: AdminRole): Promise<void> {
  const { error } = await supabase.from('admin_users').update({ role }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function toggleAdminUserActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('admin_users').update({ is_active: isActive }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function inviteAdminUser(email: string, fullName: string, role: AdminRole): Promise<{ user_id: string; link: string | null }> {
  const { data, error } = await supabase.functions.invoke('admin-user-invite', {
    body: { action: 'invite', email, full_name: fullName, role },
  });
  if (error) throw new Error(error.message);
  if (!data.ok) throw new Error(data.error ?? 'Error desconocido');
  return { user_id: data.user_id, link: data.link };
}

export async function resetAdminUserPassword(email: string): Promise<{ link: string | null }> {
  const { data, error } = await supabase.functions.invoke('admin-user-invite', {
    body: { action: 'reset', email },
  });
  if (error) throw new Error(error.message);
  if (!data.ok) throw new Error(data.error ?? 'Error desconocido');
  return { link: data.link };
}

export async function removeAdminUser(email: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('admin-user-invite', {
    body: { action: 'remove', email },
  });
  if (error) throw new Error(error.message);
  if (!data.ok) throw new Error(data.error ?? 'Error desconocido');
}