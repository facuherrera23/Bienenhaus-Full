import { supabase } from './supabase';
import {
    type AgentAvailability,
    type AgentCommission,
    type AgentFormValues,
    type AgentPermissions,
    type AgentRow,
    type AgentSchedule,

    DAY_LABELS,
    DEFAULT_COMMISSION,
    DEFAULT_PERMISSIONS,
    DEFAULT_SCHEDULE} from '../types/agents';
import type { Database } from '../types/database';

// ============================================================
// Re-export types and constants
// ============================================================

export type {
    AgentRow,
    AgentPermissions,
    AgentCommission,
    AgentSchedule,
    AgentAvailability,
    AgentFormValues,
};

export { DEFAULT_PERMISSIONS, DEFAULT_COMMISSION, DEFAULT_SCHEDULE, DAY_LABELS };

// ============================================================
// DB row types with embedded relations
// ============================================================

export type AgentApiRow = Omit<
    Database['public']['Tables']['agents']['Row'],
    'permissions' | 'commission' | 'schedule'
> & {
    leads: { count: number }[];
    specialties: unknown;
    social: unknown;
    permissions?: AgentPermissions;
    commission?: AgentCommission;
    schedule?: AgentSchedule[];
};

// ============================================================
// SELECT strings
// ============================================================

const AGENTS_SELECT = `
  *, leads(count)
`.trim();

// ============================================================
// Mappers
// ============================================================

export function toRow(a: AgentApiRow): AgentRow {
    const specs = Array.isArray(a.specialties)
        ? a.specialties.filter((s): s is string => typeof s === 'string')
        : [];
    const socialRaw =
        a.social && typeof a.social === 'object' ? (a.social as Record<string, unknown>) : {};

    const permissions =
        a.permissions && typeof a.permissions === 'object'
            ? a.permissions
            : DEFAULT_PERMISSIONS;
    const commission =
        a.commission && typeof a.commission === 'object'
            ? a.commission
            : DEFAULT_COMMISSION;
    const schedule = Array.isArray(a.schedule) ? a.schedule : DEFAULT_SCHEDULE;

    return {
        id: a.id,
        name: a.name,
        email: a.email,
        phone: a.phone,
        photo_url: a.photo_url,
        matricula: a.matricula,
        role: a.role,
        bio: a.bio,
        specialties: specs,
        social: {
            linkedin: typeof socialRaw.linkedin === 'string' ? socialRaw.linkedin : undefined,
            instagram: typeof socialRaw.instagram === 'string' ? socialRaw.instagram : undefined,
            whatsapp: typeof socialRaw.whatsapp === 'string' ? socialRaw.whatsapp : undefined,
        },
        is_active: a.is_active,
        sort_order: a.sort_order,
        lead_count: a.leads?.[0]?.count ?? 0,
        created_at: a.created_at,
        updated_at: a.updated_at,
        permissions,
        commission,
        schedule,
    };
}

// ============================================================
// API Functions - Fetch
// ============================================================

export async function fetchAgents(): Promise<AgentRow[]> {
    const { data, error } = await supabase
        .from('agents')
        .select(AGENTS_SELECT)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })
        .returns<AgentApiRow[]>();

    if (error) throw new Error(error.message);
    return (data ?? []).map(toRow);
}

export async function fetchAgent(id: string): Promise<AgentRow> {
    const { data, error } = await supabase
        .from('agents')
        .select(AGENTS_SELECT)
        .eq('id', id)
        .maybeSingle<AgentApiRow>();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Agente no encontrado');
    return toRow(data);
}

export async function fetchDeletedAgents(): Promise<AgentRow[]> {
    const { data, error } = await supabase
        .from('agents')
        .select(AGENTS_SELECT)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
        .returns<AgentApiRow[]>();

    if (error) throw new Error(error.message);
    return (data ?? []).map(toRow);
}

// ============================================================
// API Functions - CRUD
// ============================================================

export async function uploadAgentPhoto(file: File): Promise<string> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
        .from('agent-photos')
        .upload(path, file, { upsert: false });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from('agent-photos').getPublicUrl(path);
    return data.publicUrl;
}

export async function deleteAgentPhoto(url: string): Promise<void> {
    try {
        const path = url.split('/agent-photos/')[1]?.split('?')[0];
        if (path) await supabase.storage.from('agent-photos').remove([path]);
    } catch {
        // no op
    }
}

export async function createAgent(v: AgentFormValues): Promise<string> {
    const { data, error } = await supabase
        .from('agents')
        .insert({
            name: v.name.trim(),
            email: v.email.trim(),
            phone: v.phone.trim() || null,
            matricula: v.matricula.trim() || null,
            role: v.role.trim() || null,
            bio: v.bio.trim() || null,
            specialties: splitSpecialties(v.specialties),
            social: socialPayload(v),
            is_active: v.is_active,
            sort_order: Number(v.sort_order) || 0,
            photo_url: v.photo_url.trim() || null,
        })
        .select('id')
        .single();

    if (error) throw new Error(error.message);
    return data.id;
}

export async function updateAgent(id: string, v: AgentFormValues): Promise<void> {
    const { error } = await supabase
        .from('agents')
        .update({
            name: v.name.trim(),
            email: v.email.trim(),
            phone: v.phone.trim() || null,
            matricula: v.matricula.trim() || null,
            role: v.role.trim() || null,
            bio: v.bio.trim() || null,
            specialties: splitSpecialties(v.specialties),
            social: socialPayload(v),
            is_active: v.is_active,
            sort_order: Number(v.sort_order) || 0,
            photo_url: v.photo_url.trim() || null,
        })
        .eq('id', id);

    if (error) throw new Error(error.message);
}

export function toFormValues(a: AgentRow): AgentFormValues {
    return {
        name: a.name,
        email: a.email,
        phone: a.phone ?? '',
        matricula: a.matricula ?? '',
        role: a.role ?? '',
        bio: a.bio ?? '',
        specialties: (a.specialties ?? []).join(', '),
        linkedin: a.social?.linkedin ?? '',
        instagram: a.social?.instagram ?? '',
        whatsapp: a.social?.whatsapp ?? '',
        is_active: a.is_active,
        sort_order: String(a.sort_order),
        photo_url: a.photo_url ?? '',
    };
}

function splitSpecialties(value: string): string[] {
    return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

function socialPayload(v: AgentFormValues): {
    linkedin?: string;
    instagram?: string;
    whatsapp?: string;
} {
    const social: { linkedin?: string; instagram?: string; whatsapp?: string } = {};
    if (v.linkedin.trim()) social.linkedin = v.linkedin.trim();
    if (v.instagram.trim()) social.instagram = v.instagram.trim();
    if (v.whatsapp.trim()) social.whatsapp = v.whatsapp.trim();
    return social;
}

// ============================================================
// API Functions - Soft Delete & Restore
// ============================================================

export async function softDeleteAgent(id: string): Promise<void> {
    const { error } = await supabase
        .from('agents')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw new Error(error.message);
}

export async function restoreAgent(id: string): Promise<void> {
    const { error } = await supabase.from('agents').update({ deleted_at: null }).eq('id', id);

    if (error) throw new Error(error.message);
}

export async function permanentDeleteAgent(id: string): Promise<void> {
    // Borrar foto del storage si existe
    const { data: agent } = await supabase
        .from('agents')
        .select('photo_url')
        .eq('id', id)
        .maybeSingle();

    if (agent?.photo_url && agent.photo_url.includes('/agent-photos/')) {
        try {
            const path = agent.photo_url.split('/agent-photos/')[1];
            if (path) await supabase.storage.from('agent-photos').remove([path]);
        } catch {
            // ignore
        }
    }

    const { error } = await supabase.from('agents').delete().eq('id', id);

    if (error) throw new Error(error.message);
}

// ============================================================
// Agent Permissions, Commission & Schedule
// ============================================================

export async function updateAgentPermissions(
    id: string,
    permissions: Partial<AgentPermissions>,
): Promise<void> {
    const agent = await fetchAgent(id);
    const updated = { ...(agent.permissions as AgentPermissions), ...permissions };
    const { error } = await supabase.from('agents').update({ permissions: updated }).eq('id', id);
    if (error) throw new Error(error.message);
}

export async function getAgentPermissions(id: string): Promise<AgentPermissions> {
    const { data, error } = await supabase
        .from('agents')
        .select('permissions')
        .eq('id', id)
        .single<Pick<AgentApiRow, 'permissions'>>();
    if (error) throw new Error(error.message);
    return data?.permissions ?? DEFAULT_PERMISSIONS;
}

export async function updateAgentCommission(
    id: string,
    commission: Partial<AgentCommission>,
): Promise<void> {
    const agent = await fetchAgent(id);
    const updated = { ...agent.commission, ...commission };
    const { error } = await supabase.from('agents').update({ commission: updated }).eq('id', id);
    if (error) throw new Error(error.message);
}

export async function calculateCommission(
    agentId: string,
    operationType: 'sale' | 'rental',
    amount: number,
): Promise<number> {
    const agent = await fetchAgent(agentId);
    const commission = agent.commission ?? DEFAULT_COMMISSION;
    const percentage =
        operationType === 'sale' ? commission.sale_percentage : commission.rental_percentage;
    const fixed =
        operationType === 'sale' ? commission.fixed_per_sale : commission.fixed_per_rental;

    let commissionAmount = (amount * percentage) / 100;
    if (fixed) commissionAmount += fixed;

    if (commission.min_commission && commissionAmount < commission.min_commission) {
        commissionAmount = commission.min_commission;
    }
    if (commission.max_commission && commissionAmount > commission.max_commission) {
        commissionAmount = commission.max_commission;
    }

    return Math.round(commissionAmount * 100) / 100;
}

export async function updateAgentSchedule(id: string, schedule: AgentSchedule[]): Promise<void> {
    const { error } = await supabase
        .from('agents')
        .update({ schedule: schedule.map((s) => ({ ...s })) })
        .eq('id', id);
    if (error) throw new Error(error.message);
}

export async function isAgentAvailable(agentId: string, date: Date): Promise<boolean> {
    const agent = await fetchAgent(agentId);
    const dayOfWeek = date.getDay();
    const daySchedule = agent.schedule?.find((s) => s.day_of_week === dayOfWeek);

    if (!daySchedule || !daySchedule.is_available) return false;

    const currentTime = date.toTimeString().slice(0, 5);
    if (currentTime < daySchedule.start_time || currentTime > daySchedule.end_time) return false;

    if (daySchedule.break_start && daySchedule.break_end) {
        if (currentTime >= daySchedule.break_start && currentTime <= daySchedule.break_end)
            return false;
    }

    return true;
}

export function getAgentWorkingHours(schedule: AgentSchedule[]): string {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return schedule
        .filter((s) => s.is_available)
        .map((s) => `${days[s.day_of_week]} ${s.start_time}-${s.end_time}`)
        .join(', ');
}

export function getAgentAvailabilityStatus(agent: AgentRow): 'available' | 'break' | 'unavailable' {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);

    const daySchedule = agent.schedule?.find((s) => s.day_of_week === dayOfWeek);
    if (!daySchedule || !daySchedule.is_available) return 'unavailable';

    if (currentTime < daySchedule.start_time || currentTime > daySchedule.end_time)
        return 'unavailable';
    if (
        daySchedule.break_start &&
        daySchedule.break_end &&
        currentTime >= daySchedule.break_start &&
        currentTime <= daySchedule.break_end
    ) {
        return 'break';
    }
    return 'available';
}
