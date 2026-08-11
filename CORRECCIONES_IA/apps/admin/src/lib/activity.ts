import { supabase } from './supabase';
import type { Json } from '../types/database';

// ============================================================
// Types
// ============================================================

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

export interface ActivityFilters {
    action?: ActivityAction | ActivityAction[];
    entity_type?: string;
    entity_id?: string;
    actor_id?: string;
    from?: string;
    to?: string;
    limit?: number;
    page?: number;
    pageSize?: number;
}

// ============================================================
// DB row types
// ============================================================

interface ActivityApiRow {
    id: number;
    action: ActivityAction;
    entity_type: string;
    entity_id: string | null;
    metadata: Json;
    actor_id: string | null;
    created_at: string;
}

// ============================================================
// Constants
// ============================================================

export const ACTIVITY_ACTION_LABEL: Record<ActivityAction, string> = {
    create: 'Creación',
    update: 'Actualización',
    delete: 'Eliminación',
    publish: 'Publicación',
    unpublish: 'Despublicación',
    login: 'Inicio de sesión',
    logout: 'Cierre de sesión',
    ml_publish: 'Publicación en ML',
    ml_update: 'Actualización en ML',
    ml_delete: 'Eliminación en ML',
    ml_sync: 'Sincronización ML',
    status_change: 'Cambio de estado',
};

export const ACTIVITY_ACTION_TONE: Record<ActivityAction, string> = {
    create: 'success',
    update: 'info',
    delete: 'danger',
    publish: 'success',
    unpublish: 'warning',
    login: 'info',
    logout: 'neutral',
    ml_publish: 'success',
    ml_update: 'info',
    ml_delete: 'danger',
    ml_sync: 'neutral',
    status_change: 'warning',
};

export const ACTIVITY_ENTITY_LABEL: Record<string, string> = {
    property: 'Propiedad',
    lead: 'Lead',
    agent: 'Agente',
    visit: 'Visita',
    admin_user: 'Usuario Administrador',
    site_content: 'Contenido del Sitio',
    site_setting: 'Configuración',
    ml_connection: 'Conexión ML',
    ml_sync_queue: 'Cola ML',
    property_ml_meta: 'Meta ML',
    newsletter_subscriber: 'Suscriptor Newsletter',
    chat_channel: 'Canal de Chat',
    chat_message: 'Mensaje de Chat',
    owner: 'Propietario',
    property_owner: 'Propiedad-Propietario',
    price_analysis: 'Análisis de Precio',
    action_plan: 'Plan de Acción',
    action_plan_task: 'Tarea de Plan',
    owner_communication: 'Comunicación con Propietario',
    owner_report: 'Reporte de Propietario',
};

// ============================================================
// Helpers
// ============================================================

export function getActivityActionLabel(action: ActivityAction): string {
    return ACTIVITY_ACTION_LABEL[action] ?? action;
}

export function getActivityActionTone(action: ActivityAction): string {
    return ACTIVITY_ACTION_TONE[action] ?? 'neutral';
}

export function getActivityEntityLabel(entityType: string): string {
    return ACTIVITY_ENTITY_LABEL[entityType] ?? entityType;
}

// ============================================================
// Helper to convert Json to Record<string, unknown>
// ============================================================

function jsonToRecord(json: Json): Record<string, unknown> {
    if (json === null || json === undefined) {
        return {};
    }
    if (typeof json === 'object' && !Array.isArray(json)) {
        return json as Record<string, unknown>;
    }
    return { value: json };
}

// ============================================================
// API Functions - Fetch
// ============================================================

export async function fetchRecentActivity(limit = 12): Promise<ActivityRow[]> {
    const { data: activities, error: actError } = await supabase
        .from('activity_log')
        .select('id, action, entity_type, entity_id, metadata, actor_id, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (actError) throw new Error(actError.message);

    const actorIds = [
        ...new Set(
            (activities ?? [])
                .map((a: ActivityApiRow) => a.actor_id)
                .filter((id): id is string => id !== null),
        ),
    ];

    const usersById = new Map<string, { full_name: string; email: string }>();

    if (actorIds.length > 0) {
        const { data: users, error: usersError } = await supabase
            .from('admin_users')
            .select('id, full_name, email')
            .in('id', actorIds);

        if (!usersError) {
            for (const u of users ?? []) {
                usersById.set(u.id, u);
            }
        }
    }

    return (activities ?? []).map((a: ActivityApiRow) => {
        const actor = a.actor_id ? usersById.get(a.actor_id) : undefined;
        return {
            id: a.id,
            action: a.action,
            entity_type: a.entity_type,
            entity_id: a.entity_id,
            metadata: jsonToRecord(a.metadata),
            actor_name: actor?.full_name ?? null,
            actor_email: actor?.email ?? null,
            created_at: a.created_at,
        };
    });
}

export async function fetchActivity(filters?: ActivityFilters): Promise<{
    data: ActivityRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}> {
    let query = supabase
        .from('activity_log')
        .select('id, action, entity_type, entity_id, metadata, actor_id, created_at', {
            count: 'exact',
        });

    // Aplicar filtros
    if (filters?.action) {
        if (Array.isArray(filters.action)) {
            query = query.in('action', filters.action);
        } else {
            query = query.eq('action', filters.action);
        }
    }

    if (filters?.entity_type) {
        query = query.eq('entity_type', filters.entity_type);
    }

    if (filters?.entity_id) {
        query = query.eq('entity_id', filters.entity_id);
    }

    if (filters?.actor_id) {
        query = query.eq('actor_id', filters.actor_id);
    }

    if (filters?.from) {
        query = query.gte('created_at', filters.from);
    }

    if (filters?.to) {
        query = query.lte('created_at', filters.to);
    }

    // Paginación
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) throw new Error(error.message);

    // Obtener nombres de actores
    const actorIds = [
        ...new Set(
            (data ?? [])
                .map((a: ActivityApiRow) => a.actor_id)
                .filter((id): id is string => id !== null),
        ),
    ];
    const usersById = new Map<string, { full_name: string; email: string }>();

    if (actorIds.length > 0) {
        const { data: users, error: usersError } = await supabase
            .from('admin_users')
            .select('id, full_name, email')
            .in('id', actorIds);

        if (!usersError) {
            for (const u of users ?? []) {
                usersById.set(u.id, u);
            }
        }
    }

    const rows = (data ?? []).map((a: ActivityApiRow) => {
        const actor = a.actor_id ? usersById.get(a.actor_id) : undefined;
        return {
            id: a.id,
            action: a.action,
            entity_type: a.entity_type,
            entity_id: a.entity_id,
            metadata: jsonToRecord(a.metadata),
            actor_name: actor?.full_name ?? null,
            actor_email: actor?.email ?? null,
            created_at: a.created_at,
        };
    });

    return {
        data: rows,
        total: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
    };
}

export async function fetchActivityByEntity(
    entityType: string,
    entityId: string,
    limit = 20,
): Promise<ActivityRow[]> {
    const { data, error } = await supabase
        .from('activity_log')
        .select('id, action, entity_type, entity_id, metadata, actor_id, created_at')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw new Error(error.message);

    // Obtener nombres de actores
    const actorIds = [
        ...new Set(
            (data ?? [])
                .map((a: ActivityApiRow) => a.actor_id)
                .filter((id): id is string => id !== null),
        ),
    ];
    const usersById = new Map<string, { full_name: string; email: string }>();

    if (actorIds.length > 0) {
        const { data: users, error: usersError } = await supabase
            .from('admin_users')
            .select('id, full_name, email')
            .in('id', actorIds);

        if (!usersError) {
            for (const u of users ?? []) {
                usersById.set(u.id, u);
            }
        }
    }

    return (data ?? []).map((a: ActivityApiRow) => {
        const actor = a.actor_id ? usersById.get(a.actor_id) : undefined;
        return {
            id: a.id,
            action: a.action,
            entity_type: a.entity_type,
            entity_id: a.entity_id,
            metadata: jsonToRecord(a.metadata),
            actor_name: actor?.full_name ?? null,
            actor_email: actor?.email ?? null,
            created_at: a.created_at,
        };
    });
}

// ============================================================
// API Functions - Log
// ============================================================

export async function logActivity(params: {
    action: ActivityAction;
    entity_type: string;
    entity_id?: string | null;
    metadata?: Record<string, unknown>;
    actor_id?: string | null;
}): Promise<void> {
    const { error } = await supabase.from('activity_log').insert({
        action: params.action,
        entity_type: params.entity_type,
        entity_id: params.entity_id ?? null,
        metadata: (params.metadata ?? {}) as Json,
        actor_id: params.actor_id ?? null,
    });

    if (error) throw new Error(error.message);
}

// ============================================================
// API Functions - Stats
// ============================================================

export async function getActivityStats(days = 7): Promise<{
    total: number;
    byAction: Record<ActivityAction, number>;
    byEntity: Record<string, number>;
    daily: { date: string; count: number }[];
}> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const fromStr = fromDate.toISOString();

    const { data, error } = await supabase
        .from('activity_log')
        .select('id, action, entity_type, created_at')
        .gte('created_at', fromStr)
        .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    const total = data?.length ?? 0;

    // Agrupar por acción
    const byAction: Record<ActivityAction, number> = {} as Record<ActivityAction, number>;
    for (const item of data ?? []) {
        const action = item.action as ActivityAction;
        byAction[action] = (byAction[action] ?? 0) + 1;
    }

    // Agrupar por entidad
    const byEntity: Record<string, number> = {};
    for (const item of data ?? []) {
        byEntity[item.entity_type] = (byEntity[item.entity_type] ?? 0) + 1;
    }

    // Agrupar por día
    const dailyMap: Record<string, number> = {};
    for (const item of data ?? []) {
        const date = item.created_at.split('T')[0];
        dailyMap[date] = (dailyMap[date] ?? 0) + 1;
    }

    const daily = Object.entries(dailyMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return {
        total,
        byAction,
        byEntity,
        daily,
    };
}

// ============================================================
// Export Direct Functions (para compatibilidad)
// ============================================================

// Mantener compatibilidad con código existente
export { STATUS_LABEL as PROPERTY_STATUS_LABEL } from '../types/properties';
