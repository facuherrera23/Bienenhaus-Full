import { supabase } from './supabase';

export type ActivityAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'publish'
  | 'unpublish'
  | 'login'
  | 'logout'
  | 'ml_publish'
  | 'ml_update'
  | 'ml_delete'
  | 'ml_sync'
  | 'status_change';

export interface ActivityRow {
  id: number;
  action: ActivityAction;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  actor_name: string | null;
  actor_email: string | null;
  created_at: string;
}

interface ActivityApiRow {
  id: number;
  action: ActivityAction;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  actor_id: string | null;
  created_at: string;
}

export async function fetchRecentActivity(limit = 12): Promise<ActivityRow[]> {
  const [actRes, usersRes] = await Promise.all([
    supabase
      .from('activity_log')
      .select('id, action, entity_type, entity_id, metadata, actor_id, created_at')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase.from('admin_users').select('id, full_name, email'),
  ]);

  if (actRes.error) throw new Error(actRes.error.message);

  const usersById = new Map<string, { full_name: string; email: string }>();
  for (const u of usersRes.data ?? []) usersById.set(u.id, u);

  return (actRes.data ?? []).map((a: ActivityApiRow) => {
    const actor = a.actor_id ? usersById.get(a.actor_id) : undefined;
    return {
      id: a.id,
      action: a.action,
      entity_type: a.entity_type,
      entity_id: a.entity_id,
      metadata: a.metadata,
      actor_name: actor?.full_name ?? null,
      actor_email: actor?.email ?? null,
      created_at: a.created_at,
    };
  });
}

export const PROPERTY_STATUS_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  en_revision: 'En revisión',
  publicada: 'Publicada',
  pausada: 'Pausada',
  vendida: 'Vendida',
  alquilada: 'Alquilada',
  archivada: 'Archivada',
};
