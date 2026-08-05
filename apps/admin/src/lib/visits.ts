import { supabase, supabaseUrl } from './supabase';
import type { Database, Json } from '../types/database';
import type {
  VisitStatus,
  VisitType,
  VisitRow,
  VisitFormValues,
  VisitDbRow,
  AgentAvailability,
  RecurrenceRule,
  RecurringVisit,
  ReminderConfig,
  QrCheckin,
} from '../types/visits';
import {
  VISIT_STATUS_LABEL,
  VISIT_STATUS_TONE,
  MEETING_TYPE_LABEL,
  DEFAULT_REMINDERS,
  DAY_LABELS,
} from '../types/visits';

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
  lead: { name: string; email: string; phone: string } | { name: string; email: string; phone: string }[] | null;
  property: { title: string } | { title: string }[] | null;
  agent: { name: string } | { name: string }[] | null;
}

// ============================================================
// Constants
// ============================================================

const VISITS_SELECT = `
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
  return Array.isArray(v) ? v[0]?.name ?? null : v.name;
}

export function embedVisitEmail(v: { email: string } | { email: string }[] | null): string | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0]?.email ?? null : v.email;
}

export function embedVisitPhone(v: { phone: string } | { phone: string }[] | null): string | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0]?.phone ?? null : v.phone;
}

export function embedVisitTitle(v: { title: string } | { title: string }[] | null): string | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0]?.title ?? null : v.title;
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
// API Functions - Fetch
// ============================================================

export async function fetchVisits(): Promise<VisitRow[]> {
  const { data, error } = await supabase
    .from('visits')
    .select(VISITS_SELECT)
    .is('deleted_at', null)
    .order('starts_at', { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as VisitApiRow[]).map(toVisitRow);
}

export async function fetchVisit(id: string): Promise<VisitRow> {
  const { data, error } = await supabase
    .from('visits')
    .select(VISITS_SELECT)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Visita no encontrada');
  return toVisitRow(data as unknown as VisitApiRow);
}

export async function fetchDeletedVisits(): Promise<VisitRow[]> {
  const { data, error } = await supabase
    .from('visits')
    .select(VISITS_SELECT)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as VisitApiRow[]).map(toVisitRow);
}

export async function fetchVisitsByAgent(agentId: string): Promise<VisitRow[]> {
  const { data, error } = await supabase
    .from('visits')
    .select(VISITS_SELECT)
    .eq('agent_id', agentId)
    .is('deleted_at', null)
    .order('starts_at', { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as VisitApiRow[]).map(toVisitRow);
}

export async function fetchVisitsByDateRange(from: string, to: string, agentId?: string): Promise<VisitRow[]> {
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

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as VisitApiRow[]).map(toVisitRow);
}

export async function fetchVisitsByLead(leadId: string): Promise<VisitRow[]> {
  const { data, error } = await supabase
    .from('visits')
    .select(VISITS_SELECT)
    .eq('lead_id', leadId)
    .is('deleted_at', null)
    .order('starts_at', { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as VisitApiRow[]).map(toVisitRow);
}

export async function fetchVisitsByProperty(propertyId: string): Promise<VisitRow[]> {
  const { data, error } = await supabase
    .from('visits')
    .select(VISITS_SELECT)
    .eq('property_id', propertyId)
    .is('deleted_at', null)
    .order('starts_at', { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as VisitApiRow[]).map(toVisitRow);
}

export async function fetchVisitsByStatus(status: VisitStatus): Promise<VisitRow[]> {
  const { data, error } = await supabase
    .from('visits')
    .select(VISITS_SELECT)
    .eq('status', status)
    .is('deleted_at', null)
    .order('starts_at', { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as VisitApiRow[]).map(toVisitRow);
}

// ============================================================
// API Functions - CRUD
// ============================================================

export async function createVisit(values: VisitFormValues): Promise<VisitRow> {
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
    .single();

  if (error) throw new Error(error.message);
  return toVisitRow(data as unknown as VisitApiRow);
}

export async function updateVisit(id: string, values: Partial<VisitFormValues>): Promise<void> {
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

  const { error } = await supabase
    .from('visits')
    .update(patch)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function updateVisitStatus(id: string, status: VisitStatus): Promise<void> {
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

  const { error } = await supabase
    .from('visits')
    .update(patch)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ============================================================
// API Functions - Soft Delete & Restore
// ============================================================

export async function softDeleteVisit(id: string): Promise<void> {
  const { error } = await supabase
    .from('visits')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function restoreVisit(id: string): Promise<void> {
  const { error } = await supabase
    .from('visits')
    .update({ deleted_at: null })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function permanentDeleteVisit(id: string): Promise<void> {
  const { error } = await supabase
    .from('visits')
    .delete()
    .eq('id', id);

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
  values: Omit<AgentAvailability, 'id' | 'created_at' | 'updated_at'>
): Promise<AgentAvailability> {
  const { data, error } = await supabase
    .from('agent_availability')
    .insert(values)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as AgentAvailability;
}

export async function updateAgentAvailability(
  id: string,
  values: Partial<AgentAvailability>
): Promise<void> {
  const { error } = await supabase
    .from('agent_availability')
    .update(values)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function deleteAgentAvailability(id: string): Promise<void> {
  const { error } = await supabase
    .from('agent_availability')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ============================================================
// API Functions - Recurring Visits
// ============================================================

export async function createRecurringVisit(
  baseVisitId: string,
  rule: RecurrenceRule
): Promise<RecurringVisit> {
  const nextOccurrence = calculateNextOccurrence(rule, new Date());

const { data, error } = await supabase
     .from('recurring_visits')
     .insert({
       base_visit_id: baseVisitId,
       rule: rule as unknown as Json,
       next_occurrence: nextOccurrence.toISOString(),
       occurrences_generated: 0,
       is_active: true,
     })
    .select()
    .single();

if (error) throw new Error(error.message);
   return { ...data, rule: data.rule as unknown as RecurrenceRule };
}

export async function generateOccurrences(recurringId: number): Promise<{ created: number; skipped: number }> {
  const { data: recurring, error } = await supabase
    .from('recurring_visits')
    .select('*, base_visit:visits(*)')
    .eq('id', recurringId)
    .single();

  if (error || !recurring) throw new Error('Recurring visit not found');
  if (!recurring.is_active) return { created: 0, skipped: 0 };

const baseVisit = recurring.base_visit as VisitRow;
   const rule = recurring.rule as unknown as RecurrenceRule;
  let nextOccurrence = new Date(recurring.next_occurrence);
  const now = new Date();
  let created = 0;
  let skipped = 0;

  // Generate up to 10 future occurrences or until end_date/count
  for (let i = 0; i < 10; i++) {
    if (nextOccurrence <= now) {
      nextOccurrence = calculateNextOccurrence(rule, nextOccurrence);
      continue;
    }

    if (rule.end_date && nextOccurrence > new Date(rule.end_date)) break;
    if (rule.count && recurring.occurrences_generated + created >= rule.count) break;

    // Check exceptions
    const dateStr = nextOccurrence.toISOString().split('T')[0];
    if (rule.exceptions?.includes(dateStr)) {
      nextOccurrence = calculateNextOccurrence(rule, nextOccurrence);
      skipped++;
      continue;
    }

// Check if already exists
   let query = supabase.from('visits').select('id').eq('starts_at', nextOccurrence.toISOString());
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

  // Update next_occurrence and count
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

function getDurationMinutes(visit: VisitRow): number {
  const start = new Date(visit.starts_at);
  const end = new Date(visit.ends_at);
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

function calculateNextOccurrence(rule: RecurrenceRule, from: Date): Date {
  const next = new Date(from);

  switch (rule.frequency) {
    case 'daily':
      next.setDate(next.getDate() + rule.interval);
      break;
    case 'weekly':
      if (rule.days_of_week && rule.days_of_week.length > 0) {
        // Find next matching day of week
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

  // Preserve time
  next.setHours(from.getHours(), from.getMinutes(), from.getSeconds(), from.getMilliseconds());
  return next;
}

// ============================================================
// API Functions - Reminders
// ============================================================

export async function createReminders(
   visitId: string,
   reminders: Omit<ReminderConfig, 'id' | 'visit_id' | 'is_sent' | 'sent_at' | 'created_at'>[] = DEFAULT_REMINDERS
): Promise<ReminderConfig[]> {
   const { data, error } = await supabase
     .from('visit_reminders')
     .insert(reminders.map((r) => ({ ...r, visit_id: visitId })))
     .select();

   if (error) throw new Error(error.message);
   return data as unknown as ReminderConfig[];
}

export async function processReminders(): Promise<{ sent: number; failed: number }> {
  const res = await fetch(`${supabaseUrl}/functions/v1/visits-process-reminders`, {
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
    .single();

  if (error) throw new Error(error.message);
  return data as QrCheckin;
}

export async function checkInWithQr(
  code: string,
  agentId: string
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

  // Also update visit status to 'en_curso'
  await supabase
    .from('visits')
    .update({ status: 'en_curso' })
    .eq('id', checkin.visit_id);

  return { success: true, visit, message: 'Check-in registrado correctamente' };
}

export async function getQrCode(visitId: string): Promise<QrCheckin | null> {
  const { data } = await supabase
    .from('qr_checkins')
    .select('*')
    .eq('visit_id', visitId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data as QrCheckin | null;
}