import { supabase, supabaseUrl } from '@bienenhaus/supabase';
import type { Database } from '../types/database';
import {
    type AgentAvailability,
    DAY_LABELS,
    DEFAULT_REMINDERS,
    MEETING_TYPE_LABEL,
    type QrCheckin,
    type RecurrenceRule,
    type RecurringVisit,
    type ReminderConfig,
    VISIT_STATUS_LABEL,
    VISIT_STATUS_TONE,
    type VisitDbRow,
    type VisitFormValues,
    type VisitRow,
    type VisitStatus,
    type VisitType,
} from '../types/visits';
import { validateVisitForm, validateVisitPatch } from './_shared/visits-validation';
import { createChannelForVisit } from './chat';

// ============================================================
// Re-export types and constants
// ============================================================

export type {
    VisitStatus,
    VisitType,
    VisitRow,
    VisitFormValues,
    AgentAvailability,
    RecurrenceRule,
    RecurringVisit,
    ReminderConfig,
    QrCheckin,
};

export { VISIT_STATUS_LABEL, VISIT_STATUS_TONE, MEETING_TYPE_LABEL, DEFAULT_REMINDERS, DAY_LABELS };

// ============================================================
// DB row types with embedded relations
// ============================================================

export interface VisitApiRow extends VisitDbRow {
    lead:
        | { name: string; email: string; phone: string }
        | { name: string; email: string; phone: string }[]
        | null;
    property: { title: string } | { title: string }[] | null;
    agent: { name: string } | { name: string }[] | null;
}

type RecurringVisitDbRow = Database['public']['Tables']['recurring_visits']['Row'];

export interface RecurringVisitApiRow extends Omit<RecurringVisitDbRow, 'rule'> {
    rule: RecurrenceRule;
}

// base_visit viene de `.select('*, base_visit:visits(*)')` — son las columnas
// crudas de la tabla visits (sin los joins de lead/property/agent), por eso
// usa VisitDbRow y no el VisitRow enriquecido.
interface RecurringVisitWithBase extends Omit<RecurringVisitDbRow, 'rule'> {
    rule: RecurrenceRule;
    base_visit: VisitDbRow;
}

// ============================================================
// Structured Logging
// ============================================================

interface VisitLogEntry {
    timestamp: string;
    level: 'debug' | 'info' | 'warn' | 'error';
    action: string;
    visit_id?: string;
    agent_id?: string;
    lead_id?: string;
    property_id?: string;
    duration_ms?: number;
    error?: string;
    conflicts?: string[];
    // unknown en vez de Record<string, unknown>: este campo es solo para
    // logging, no necesita index signature y así acepta VisitFormValues,
    // Partial<VisitFormValues> o cualquier otra forma sin castear.
    metadata?: unknown;
}

function logVisitAction(entry: Omit<VisitLogEntry, 'timestamp' | 'level'>): void {
    const out: VisitLogEntry = { timestamp: new Date().toISOString(), level: 'info', ...entry };
    console.warn(JSON.stringify(out));
}

function logVisitWarn(entry: Omit<VisitLogEntry, 'timestamp' | 'level'>): void {
    const out: VisitLogEntry = { timestamp: new Date().toISOString(), level: 'warn', ...entry };
    console.warn(JSON.stringify(out));
}

function logVisitError(entry: Omit<VisitLogEntry, 'timestamp' | 'level'>): void {
    const out: VisitLogEntry = { timestamp: new Date().toISOString(), level: 'error', ...entry };
    console.error(JSON.stringify(out));
}

// ============================================================
// Constants
// ============================================================

export const VISITS_SELECT = `
  id, lead_id, property_id, agent_id, title, description, starts_at, ends_at, 
  status, location, meeting_type, meeting_link, notes, reminder_sent, 
  reminder_sent_at, confirmed_at, completed_at, cancelled_at, 
  cancellation_reason, created_by, created_at, updated_at, deleted_at, 
  lead:leads(name, email, phone), property:properties(title), agent:agents(name)
`.trim();

// ============================================================
// Helpers
// ============================================================

export function embedVisitName(v: { name: string } | { name: string }[] | null): string | null {
    if (!v) return null;
    return Array.isArray(v) ? (v[0]?.name ?? null) : v.name;
}

export function embedVisitEmail(v: { email: string } | { email: string }[] | null): string | null {
    if (!v) return null;
    return Array.isArray(v) ? (v[0]?.email ?? null) : v.email;
}

export function embedVisitPhone(v: { phone: string } | { phone: string }[] | null): string | null {
    if (!v) return null;
    return Array.isArray(v) ? (v[0]?.phone ?? null) : v.phone;
}

export function embedVisitTitle(v: { title: string } | { title: string }[] | null): string | null {
    if (!v) return null;
    return Array.isArray(v) ? (v[0]?.title ?? null) : v.title;
}

// ============================================================
// Mappers
// ============================================================

export function toVisitRow(v: VisitApiRow): VisitRow {
    return {
        id: v.id,
        lead_id: v.lead_id,
        property_id: v.property_id,
        agent_id: v.agent_id,
        title: v.title,
        description: v.description,
        starts_at: v.starts_at,
        ends_at: v.ends_at,
        status: v.status,
        location: v.location,
        meeting_type: v.meeting_type as VisitType | null,
        meeting_link: v.meeting_link,
        notes: v.notes,
        reminder_sent: v.reminder_sent ?? false,
        reminder_sent_at: v.reminder_sent_at,
        confirmed_at: v.confirmed_at,
        completed_at: v.completed_at,
        cancelled_at: v.cancelled_at,
        cancellation_reason: v.cancellation_reason,
        created_by: v.created_by,
        created_at: v.created_at,
        updated_at: v.updated_at,
        deleted_at: v.deleted_at,
        lead_name: embedVisitName(v.lead),
        lead_email: embedVisitEmail(v.lead),
        lead_phone: embedVisitPhone(v.lead),
        property_title: embedVisitTitle(v.property),
        agent_name: embedVisitName(v.agent),
    };
}

// ============================================================
// Conflict Detection
// ============================================================

export async function checkConflicts(
    values: Partial<VisitFormValues>,
    excludeId?: string,
): Promise<string[]> {
    const errors: string[] = [];

    // Sin agent_id/starts_at/ends_at no hay nada que chequear (ej: un update
    // que solo cambia 'notes'). Evita crashear con undefined más abajo.
    if (!values.agent_id || !values.starts_at || !values.ends_at) {
        return errors;
    }

    // 1. Agent availability
    const { data: avail } = await supabase
        .from('agent_availability')
        .select('*')
        .eq('agent_id', values.agent_id)
        .eq('is_active', true);

    const visitDay = new Date(values.starts_at).getDay();
    const visitStart = values.starts_at.split('T')[1].slice(0, 5);
    const visitEnd = values.ends_at.split('T')[1].slice(0, 5);

    const hasSlot = avail?.some(
        (a) => a.day_of_week === visitDay && a.start_time <= visitStart && a.end_time >= visitEnd,
    );
    if (!hasSlot) errors.push('Agente no disponible en ese horario');

    // 2. Double booking
    const { data: conflicts } = await supabase
        .from('visits')
        .select('id, title, starts_at, ends_at')
        .eq('agent_id', values.agent_id)
        .is('deleted_at', null)
        .neq('id', excludeId ?? '')
        .lt('starts_at', values.ends_at)
        .gt('ends_at', values.starts_at);

    if (conflicts?.length)
        errors.push(`Conflicto con: ${conflicts.map((c) => c.title).join(', ')}`);

    // 3. Lead double booking
    if (values.lead_id) {
        const { data: leadConflicts } = await supabase
            .from('visits')
            .select('id')
            .eq('lead_id', values.lead_id)
            .is('deleted_at', null)
            .neq('id', excludeId ?? '')
            .lt('starts_at', values.ends_at)
            .gt('ends_at', values.starts_at);
        if (leadConflicts?.length) errors.push('Lead ya tiene visita en ese horario');
    }

    // 4. Property double booking
    if (values.property_id) {
        const { data: propConflicts } = await supabase
            .from('visits')
            .select('id')
            .eq('property_id', values.property_id)
            .is('deleted_at', null)
            .neq('id', excludeId ?? '')
            .lt('starts_at', values.ends_at)
            .gt('ends_at', values.starts_at);
        if (propConflicts?.length) errors.push('Propiedad ya tiene visita en ese horario');
    }

    return errors;
}

// ============================================================
// API Functions - Fetch
// ============================================================

export async function fetchVisits(): Promise<VisitRow[]> {
    const { data, error } = await supabase
        .from('visits')
        .select(VISITS_SELECT)
        .is('deleted_at', null)
        .order('starts_at', { ascending: true })
        .returns<VisitApiRow[]>();

    if (error) throw new Error(error.message);
    return (data ?? []).map(toVisitRow);
}

export async function fetchVisit(id: string): Promise<VisitRow> {
    const { data, error } = await supabase
        .from('visits')
        .select(VISITS_SELECT)
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle<VisitApiRow>();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Visita no encontrada');
    return toVisitRow(data);
}

export async function fetchDeletedVisits(): Promise<VisitRow[]> {
    const { data, error } = await supabase
        .from('visits')
        .select(VISITS_SELECT)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
        .returns<VisitApiRow[]>();

    if (error) throw new Error(error.message);
    return (data ?? []).map(toVisitRow);
}

export async function fetchVisitsByAgent(agentId: string): Promise<VisitRow[]> {
    const { data, error } = await supabase
        .from('visits')
        .select(VISITS_SELECT)
        .eq('agent_id', agentId)
        .is('deleted_at', null)
        .order('starts_at', { ascending: true })
        .returns<VisitApiRow[]>();

    if (error) throw new Error(error.message);
    return (data ?? []).map(toVisitRow);
}

export async function fetchVisitsByDateRange(
    from: string,
    to: string,
    agentId?: string,
): Promise<VisitRow[]> {
    let query = supabase
        .from('visits')
        .select(VISITS_SELECT)
        .is('deleted_at', null)
        .gte('starts_at', from)
        .lte('starts_at', to)
        .order('starts_at', { ascending: true });

    if (agentId) {
        query = query.eq('agent_id', agentId);
    }

    const { data, error } = await query.returns<VisitApiRow[]>();
    if (error) throw new Error(error.message);
    return (data ?? []).map(toVisitRow);
}

export interface PaginatedVisits {
    data: VisitRow[];
    hasNextPage: boolean;
    page: number;
}

// Variante paginada para scroll infinito. Se agrega aparte de
// fetchVisitsByDateRange (que sigue trayendo todo el rango sin paginar)
// para no romper a los callers existentes de esa firma.
export async function fetchVisitsByDateRangePaginated(
    from: string,
    to: string,
    agentId: string | undefined,
    page: number,
    pageSize: number,
): Promise<PaginatedVisits> {
    const fromIdx = (page - 1) * pageSize;
    const toIdx = fromIdx + pageSize - 1;

    let query = supabase
        .from('visits')
        .select(VISITS_SELECT, { count: 'exact' })
        .is('deleted_at', null)
        .gte('starts_at', from)
        .lte('starts_at', to)
        .order('starts_at', { ascending: true })
        .range(fromIdx, toIdx);

    if (agentId) {
        query = query.eq('agent_id', agentId);
    }

    const { data, error, count } = await query.returns<VisitApiRow[]>();
    if (error) throw new Error(error.message);

    const rows = (data ?? []).map(toVisitRow);
    const hasNextPage = count != null ? toIdx + 1 < count : rows.length === pageSize;

    return { data: rows, hasNextPage, page };
}

export async function fetchVisitsByLead(leadId: string): Promise<VisitRow[]> {
    const { data, error } = await supabase
        .from('visits')
        .select(VISITS_SELECT)
        .eq('lead_id', leadId)
        .is('deleted_at', null)
        .order('starts_at', { ascending: false })
        .returns<VisitApiRow[]>();

    if (error) throw new Error(error.message);
    return (data ?? []).map(toVisitRow);
}

export async function fetchVisitsByProperty(propertyId: string): Promise<VisitRow[]> {
    const { data, error } = await supabase
        .from('visits')
        .select(VISITS_SELECT)
        .eq('property_id', propertyId)
        .is('deleted_at', null)
        .order('starts_at', { ascending: false })
        .returns<VisitApiRow[]>();

    if (error) throw new Error(error.message);
    return (data ?? []).map(toVisitRow);
}

export async function fetchVisitsByStatus(status: VisitStatus): Promise<VisitRow[]> {
    const { data, error } = await supabase
        .from('visits')
        .select(VISITS_SELECT)
        .eq('status', status)
        .is('deleted_at', null)
        .order('starts_at', { ascending: true })
        .returns<VisitApiRow[]>();

    if (error) throw new Error(error.message);
    return (data ?? []).map(toVisitRow);
}

// ============================================================
// API Functions - Create Visit from Lead (G1 integration)
// ============================================================

export type CreateVisitFromLeadParams = {
    lead_id: string;
    property_id?: string | null;
    agent_id: string;
    scheduled_date?: string | null;
    notes?: string | null;
    creatorAgentId?: string;
};

export async function createVisitFromLead(
    params: CreateVisitFromLeadParams,
): Promise<VisitRow> {
    const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('name, last_name')
        .eq('id', params.lead_id)
        .single();

    const leadName = leadError || !lead ? 'Lead' : `${lead.name} ${lead.last_name}`;

    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 1);
    defaultDate.setHours(10, 0, 0, 0);
    const startsAt = params.scheduled_date || defaultDate.toISOString();

    const endsDate = new Date(startsAt);
    endsDate.setHours(endsDate.getHours() + 1);

    const values: VisitFormValues = {
        lead_id: params.lead_id,
        property_id: params.property_id || '',
        agent_id: params.agent_id,
        title: `Visita - ${leadName}`,
        description: '',
        starts_at: startsAt,
        ends_at: endsDate.toISOString(),
        status: 'programada',
        location: '',
        meeting_type: 'presencial',
        meeting_link: '',
        notes: params.notes || '',
    };

    logVisitAction({ action: 'createVisitFromLead', lead_id: params.lead_id, metadata: values });

    try {
        return await createVisit(values, params.creatorAgentId);
    } catch (err) {
        logVisitError({
            action: 'createVisitFromLead',
            lead_id: params.lead_id,
            error: err instanceof Error ? err.message : String(err),
        });
        throw err;
    }
}

export async function syncLeadFromVisit(
    visitId: string,
): Promise<{ lead_id: string; status: string } | null> {
    const { data: visit, error: visitError } = await supabase
        .from('visits')
        .select('lead_id, leads(id, status, tags)')
        .eq('id', visitId)
        .single();

    if (visitError || !visit || !visit.lead_id) return null;

    const leadRaw = visit.leads as
        | { id: string; status: string; tags: string[] | null }[]
        | { id: string; status: string; tags: string[] | null }
        | null;
    const lead = Array.isArray(leadRaw) ? (leadRaw[0] ?? null) : leadRaw;
    if (!lead) return null;

    const currentTags = (lead.tags ?? []) as string[];
    const newTags = currentTags.includes('visitado')
        ? currentTags
        : [...currentTags, 'visitado'];

    const { error: updateError } = await supabase
        .from('leads')
        .update({
            status: 'en_proceso',
            tags: newTags,
            updated_at: new Date().toISOString(),
        })
        .eq('id', visit.lead_id);

    if (updateError) {
        logVisitError({
            action: 'syncLeadFromVisit',
            visit_id: visitId,
            lead_id: visit.lead_id,
            error: updateError.message,
        });
        return null;
    }

    logVisitAction({
        action: 'syncLeadFromVisit',
        visit_id: visitId,
        lead_id: visit.lead_id,
    });

    return { lead_id: visit.lead_id, status: 'en_proceso' };
}

// ============================================================
// API Functions - CRUD with Validation
// ============================================================

export async function createVisit(
    values: VisitFormValues,
    creatorAgentId?: string,
): Promise<VisitRow> {
    const validation = validateVisitForm(values);
    if (!validation.valid) {
        logVisitError({ action: 'createVisit', error: validation.error, metadata: values });
        throw new Error(validation.error ?? 'Datos de visita inválidos');
    }

    // Check conflicts
    const conflicts = await checkConflicts(values);
    if (conflicts.length) {
        logVisitWarn({ action: 'createVisit', conflicts, metadata: values });
        throw new Error(conflicts.join('; '));
    }

    logVisitAction({ action: 'createVisit', metadata: values });
    const { data, error } = await supabase
        .from('visits')
        .insert({
            lead_id: values.lead_id || null,
            property_id: values.property_id || null,
            agent_id: values.agent_id,
            title: values.title,
            description: values.description || null,
            starts_at: values.starts_at,
            ends_at: values.ends_at,
            status: values.status,
            location: values.location || null,
            meeting_type: values.meeting_type || null,
            meeting_link: values.meeting_link || null,
            notes: values.notes || null,
            reminder_sent: false,
        })
        .select(VISITS_SELECT)
        .single<VisitApiRow>();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('No se pudo crear la visita');
    const visit = toVisitRow(data);

    if (creatorAgentId) {
        try {
            await createChannelForVisit({ visitId: visit.id, creatorId: creatorAgentId });
        } catch (err) {
            logVisitWarn({ action: 'createChannelForVisit', visit_id: visit.id, error: String(err) });
        }
    }

    return visit;
}

export async function updateVisit(id: string, values: Partial<VisitFormValues>): Promise<void> {
    const validation = validateVisitPatch(values);
    if (!validation.valid) {
        logVisitError({ action: 'updateVisit', visit_id: id, error: validation.error });
        throw new Error(validation.error ?? 'Datos de visita inválidos');
    }

    const conflicts = await checkConflicts(values, id);
    if (conflicts.length) {
        logVisitWarn({ action: 'updateVisit', visit_id: id, conflicts, metadata: values });
        throw new Error(conflicts.join('; '));
    }

    logVisitAction({ action: 'updateVisit', visit_id: id, metadata: values });
    const patch: Database['public']['Tables']['visits']['Update'] = {};

    if (values.title !== undefined) patch.title = values.title;
    if (values.description !== undefined) patch.description = values.description || null;
    if (values.starts_at !== undefined) patch.starts_at = values.starts_at;
    if (values.ends_at !== undefined) patch.ends_at = values.ends_at;
    if (values.status !== undefined) patch.status = values.status;
    if (values.location !== undefined) patch.location = values.location || null;
    if (values.meeting_type !== undefined) patch.meeting_type = values.meeting_type || null;
    if (values.meeting_link !== undefined) patch.meeting_link = values.meeting_link || null;
    if (values.notes !== undefined) patch.notes = values.notes || null;
    if (values.lead_id !== undefined) patch.lead_id = values.lead_id || null;
    if (values.property_id !== undefined) patch.property_id = values.property_id || null;
    if (values.agent_id !== undefined) patch.agent_id = values.agent_id;

    // Auto-set timestamps based on status changes
    if (values.status === 'confirmada') {
        patch.confirmed_at = new Date().toISOString();
    }
    if (values.status === 'completada') {
        patch.completed_at = new Date().toISOString();
    }
    if (values.status === 'cancelada') {
        patch.cancelled_at = new Date().toISOString();
    }

    const { error } = await supabase.from('visits').update(patch).eq('id', id);

    if (error) throw new Error(error.message);
}

export async function updateVisitStatus(id: string, status: VisitStatus): Promise<void> {
    logVisitAction({ action: 'updateVisitStatus', visit_id: id, metadata: { status } });
    const patch: Database['public']['Tables']['visits']['Update'] = { status };

    if (status === 'confirmada') {
        patch.confirmed_at = new Date().toISOString();
    }
    if (status === 'completada') {
        patch.completed_at = new Date().toISOString();
    }
    if (status === 'cancelada') {
        patch.cancelled_at = new Date().toISOString();
    }

    const { error } = await supabase.from('visits').update(patch).eq('id', id);
    if (error) throw new Error(error.message);

    if (status === 'completada') {
        try {
            await syncLeadFromVisit(id);
        } catch {
            logVisitWarn({
                action: 'updateVisitStatus',
                visit_id: id,
                error: 'No se pudo sincronizar el lead al completar la visita',
            });
        }
    }
}

// ============================================================
// API Functions - Soft Delete & Restore
// ============================================================

export async function softDeleteVisit(id: string): Promise<void> {
    logVisitAction({ action: 'softDeleteVisit', visit_id: id });
    const { error } = await supabase
        .from('visits')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw new Error(error.message);
}

export async function restoreVisit(id: string): Promise<void> {
    logVisitAction({ action: 'restoreVisit', visit_id: id });
    const { error } = await supabase.from('visits').update({ deleted_at: null }).eq('id', id);

    if (error) throw new Error(error.message);
}

export async function permanentDeleteVisit(id: string): Promise<void> {
    logVisitAction({ action: 'permanentDeleteVisit', visit_id: id });
    const { error } = await supabase.from('visits').delete().eq('id', id);

    if (error) throw new Error(error.message);
}

// ============================================================
// API Functions - Agent Availability
// ============================================================

export async function fetchAgentAvailability(agentId: string): Promise<AgentAvailability[]> {
    const { data, error } = await supabase
        .from('agent_availability')
        .select('*')
        .eq('agent_id', agentId)
        .eq('is_active', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as AgentAvailability[];
}

export async function createAgentAvailability(
    values: Omit<
        Database['public']['Tables']['agent_availability']['Insert'],
        'id' | 'created_at' | 'updated_at'
    >,
): Promise<AgentAvailability> {
    const { data, error } = await supabase
        .from('agent_availability')
        .insert(values)
        .select('*')
        .returns<AgentAvailability>()
        .single();

    if (error) throw new Error(error.message);
    return data;
}

export async function updateAgentAvailability(
    id: string,
    values: Database['public']['Tables']['agent_availability']['Update'],
): Promise<void> {
    const { error } = await supabase.from('agent_availability').update(values).eq('id', id);

    if (error) throw new Error(error.message);
}

export async function deleteAgentAvailability(id: string): Promise<void> {
    const { error } = await supabase.from('agent_availability').delete().eq('id', id);

    if (error) throw new Error(error.message);
}

// ============================================================
// API Functions - Recurring Visits
// ============================================================

export async function createRecurringVisit(
    baseVisitId: string,
    rule: RecurrenceRule,
): Promise<RecurringVisitDbRow> {
    const nextOccurrence = calculateNextOccurrence(rule, new Date());

    const { data, error } = await supabase
        .from('recurring_visits')
        .insert({
            base_visit_id: baseVisitId,
            rule: { ...rule },
            next_occurrence: nextOccurrence.toISOString(),
            occurrences_generated: 0,
            is_active: true,
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('No se pudo crear la visita recurrente');
    return data;
}

export async function generateOccurrences(
    recurringId: number,
): Promise<{ created: number; skipped: number }> {
    const { data: recurring, error } = await supabase
        .from('recurring_visits')
        .select('*, base_visit:visits(*)')
        .eq('id', recurringId)
        .single<RecurringVisitWithBase>();

    if (error || !recurring) throw new Error('Recurring visit not found');
    if (!recurring.is_active) return { created: 0, skipped: 0 };
    if (!recurring.rule) throw new Error('Recurring visit sin regla de recurrencia (rule)');

    const baseVisit = recurring.base_visit;
    const rule = recurring.rule;
    let nextOccurrence = new Date(recurring.next_occurrence);
    const now = new Date();
    let created = 0;
    let skipped = 0;

    for (let i = 0; i < 10; i++) {
        if (nextOccurrence <= now) {
            nextOccurrence = calculateNextOccurrence(rule, nextOccurrence);
            continue;
        }

        if (rule.end_date && nextOccurrence > new Date(rule.end_date)) break;
        if (rule.count && recurring.occurrences_generated + created >= rule.count) break;

        const dateStr = nextOccurrence.toISOString().split('T')[0];
        if (rule.exceptions?.includes(dateStr)) {
            nextOccurrence = calculateNextOccurrence(rule, nextOccurrence);
            skipped++;
            continue;
        }

        let query = supabase
            .from('visits')
            .select('id')
            .eq('starts_at', nextOccurrence.toISOString());
        if (baseVisit.lead_id) query = query.eq('lead_id', baseVisit.lead_id);
        if (baseVisit.property_id) query = query.eq('property_id', baseVisit.property_id);
        if (baseVisit.agent_id) query = query.eq('agent_id', baseVisit.agent_id);
        const { data: existing } = await query.maybeSingle();

        if (!existing) {
            await supabase.from('visits').insert({
                lead_id: baseVisit.lead_id,
                property_id: baseVisit.property_id,
                agent_id: baseVisit.agent_id,
                title: baseVisit.title,
                description: baseVisit.description,
                starts_at: nextOccurrence.toISOString(),
                ends_at: addMinutes(nextOccurrence, getDurationMinutes(baseVisit)).toISOString(),
                status: 'programada',
                location: baseVisit.location,
                meeting_type: baseVisit.meeting_type,
                meeting_link: baseVisit.meeting_link,
                notes: baseVisit.notes,
                reminder_sent: false,
                created_by: baseVisit.created_by,
            });
            created++;
        } else {
            skipped++;
        }

        nextOccurrence = calculateNextOccurrence(rule, nextOccurrence);
    }

    const { error: updError } = await supabase
        .from('recurring_visits')
        .update({
            next_occurrence: nextOccurrence.toISOString(),
            occurrences_generated: recurring.occurrences_generated + created,
        })
        .eq('id', recurringId);

    if (updError) throw new Error(updError.message);

    return { created, skipped };
}

function getDurationMinutes(visit: VisitDbRow): number {
    const start = new Date(visit.starts_at);
    const end = new Date(visit.ends_at);
    return Math.round((end.getTime() - start.getTime()) / 60000);
}

function addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60000);
}

export function calculateNextOccurrence(rule: RecurrenceRule, from: Date): Date {
    const next = new Date(from);

    switch (rule.frequency) {
        case 'daily':
            next.setDate(next.getDate() + rule.interval);
            break;
        case 'weekly':
            if (rule.days_of_week && rule.days_of_week.length > 0) {
                let daysAdded = 0;
                for (let i = 1; i <= 7; i++) {
                    const candidate = new Date(next);
                    candidate.setDate(candidate.getDate() + i);
                    if (rule.days_of_week.includes(candidate.getDay())) {
                        daysAdded = i;
                        break;
                    }
                }
                next.setDate(next.getDate() + daysAdded);
                if (daysAdded === 0) {
                    next.setDate(next.getDate() + 7 * rule.interval);
                }
            } else {
                next.setDate(next.getDate() + 7 * rule.interval);
            }
            break;
        case 'monthly':
            if (rule.day_of_month) {
                next.setMonth(next.getMonth() + rule.interval);
                next.setDate(rule.day_of_month);
            } else {
                next.setMonth(next.getMonth() + rule.interval);
            }
            break;
        case 'yearly':
            next.setFullYear(next.getFullYear() + rule.interval);
            break;
    }

    next.setHours(from.getHours(), from.getMinutes(), from.getSeconds(), from.getMilliseconds());
    return next;
}

// ============================================================
// API Functions - Reminders
// ============================================================

export type ReminderInput = Omit<
    ReminderConfig,
    'id' | 'visit_id' | 'is_sent' | 'sent_at' | 'created_at'
>;

export async function createReminders(
    visitId: string,
    reminders: ReminderInput[] = DEFAULT_REMINDERS,
): Promise<Database['public']['Tables']['visit_reminders']['Row'][]> {
    const { data, error } = await supabase
        .from('visit_reminders')
        .insert(reminders.map((r) => ({ ...r, visit_id: visitId })))
        .select();

    if (error) throw new Error(error.message);
    return data ?? [];
}

export async function processReminders(): Promise<{ sent: number; failed: number }> {
    const url = `${supabaseUrl}/functions/v1/visits-process-reminders`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) throw new Error('Error procesando recordatorios');
    const data = await res.json();
    return { sent: data.sent ?? 0, failed: data.failed ?? 0 };
}

// ============================================================
// API Functions - QR Check-in
// ============================================================

export async function generateQrCode(visitId: string): Promise<QrCheckin> {
    const code = `VIS-${visitId.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await supabase
        .from('qr_checkins')
        .insert({ visit_id: visitId, code })
        .select()
        .returns<QrCheckin>()
        .single();

    if (error) throw new Error(error.message);
    return data;
}

export async function checkInWithQr(
    code: string,
    agentId: string,
): Promise<{ success: boolean; visit?: { agent_id: string }; message: string }> {
    const { data: checkin, error } = await supabase
        .from('qr_checkins')
        .select('*, visit:visits(*)')
        .eq('code', code)
        .single();

    if (error || !checkin) {
        return { success: false, message: 'Código QR inválido' };
    }

    if (checkin.checked_in) {
        return { success: false, message: 'Esta visita ya fue registrada' };
    }

    const visit = checkin.visit as { agent_id: string } | undefined;
    if (!visit || visit.agent_id !== agentId) {
        return { success: false, message: 'No sos el agente asignado a esta visita' };
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
        .from('qr_checkins')
        .update({ checked_in: true, checked_in_at: now, checked_in_by: agentId })
        .eq('id', checkin.id);

    if (updateError) {
        return { success: false, message: 'Error al registrar' };
    }

    await supabase.from('visits').update({ status: 'en_curso' }).eq('id', checkin.visit_id);

    return { success: true, visit, message: 'Check-in registrado correctamente' };
}

export async function getQrCode(visitId: string): Promise<QrCheckin | null> {
    const { data } = await supabase
        .from('qr_checkins')
        .select('*')
        .eq('visit_id', visitId)
        .order('created_at', { ascending: false })
        .limit(1)
        .returns<QrCheckin>()
        .maybeSingle();

    return data;
}
