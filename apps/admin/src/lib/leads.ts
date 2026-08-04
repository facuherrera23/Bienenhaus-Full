import { supabase } from './supabase';
import type { Database } from '../types/database';

// ============================================================
// Types
// ============================================================

export const LeadStatus = [
  'nuevo',
  'contactado',
  'calificado',
  'en_proceso',
  'cerrado_ganado',
  'cerrado_perdido',
] as const;
export type LeadStatus = (typeof LeadStatus)[number];

export const LeadIntent = [
  'comprar',
  'vender',
  'alquilar',
  'invertir',
  'tasar',
  'desarrollador',
  'otro',
] as const;
export type LeadIntent = (typeof LeadIntent)[number];

export const LeadSource = [
  'landing_form',
  'whatsapp',
  'telefono',
  'email',
  'referido',
  'ml_contacto',
  'manual',
] as const;
export type LeadSource = (typeof LeadSource)[number];

// ============================================================
// Constants
// ============================================================

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  calificado: 'Calificado',
  en_proceso: 'En proceso',
  cerrado_ganado: 'Ganado',
  cerrado_perdido: 'Perdido',
};

export const LEAD_STATUS_TONE: Record<LeadStatus, string> = {
  nuevo: 'info',
  contactado: 'warning',
  calificado: 'warning',
  en_proceso: 'neutral',
  cerrado_ganado: 'success',
  cerrado_perdido: 'danger',
};

export const LEAD_STATUS_ORDER: Record<LeadStatus, number> = {
  nuevo: 0,
  contactado: 1,
  calificado: 2,
  en_proceso: 3,
  cerrado_ganado: 4,
  cerrado_perdido: 5,
};

export const LEAD_INTENT_LABEL: Record<LeadIntent, string> = {
  comprar: 'Comprar',
  vender: 'Vender',
  alquilar: 'Alquilar',
  invertir: 'Invertir',
  tasar: 'Tasar',
  desarrollador: 'Desarrollador',
  otro: 'Otro',
};

export const LEAD_SOURCE_LABEL: Record<LeadSource, string> = {
  landing_form: 'Landing',
  whatsapp: 'WhatsApp',
  telefono: 'Teléfono',
  email: 'Email',
  referido: 'Referido',
  ml_contacto: 'Mercado Libre',
  manual: 'Manual',
};

// ============================================================
// DB row types with embedded relations
// ============================================================

type LeadDbRow = Database['public']['Tables']['leads']['Row'];

export interface LeadApiRow extends LeadDbRow {
   agent: { name: string } | { name: string }[] | null;
   property: { title: string } | { title: string }[] | null;
   tags: string[] | null;
}

// ============================================================
// Interfaces
// ============================================================

export interface LeadRow {
  id: string;
  name: string;
  last_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  intent: LeadIntent;
  message: string | null;
  source: LeadSource;
  status: LeadStatus;
  agent: string | null;
  created_at: string;
  updated_at: string;
  tags?: string[];
  score?: number;
}

export interface LeadDetail {
  id: string;
  name: string;
  last_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  intent: LeadIntent;
  message: string | null;
  source: LeadSource;
  status: LeadStatus;
  notes: string | null;
  assigned_to: string | null;
  agent_name: string | null;
  property_title: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentOption {
  id: string;
  name: string;
}

export interface LeadFormValues {
  name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  intent: LeadIntent;
  source: LeadSource;
  status: LeadStatus;
  assigned_to: string;
  message: string;
}

export interface LeadPatch {
  status?: LeadStatus;
  notes?: string | null;
  assigned_to?: string | null;
  phone?: string | null;
  city?: string | null;
  tags?: string[];
  score?: number;
}

export interface CsvLeadRow {
  name: string;
  last_name: string;
  email: string;
  phone?: string;
  city?: string;
  intent: LeadIntent;
  source: LeadSource;
  status?: LeadStatus;
  message?: string;
}

// ============================================================
// Helpers
// ============================================================

export function embedName(v: { name: string } | { name: string }[] | null): string | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0]?.name ?? null : v.name;
}

export function embedTitle(v: { title: string } | { title: string }[] | null): string | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0]?.title ?? null : v.title;
}

// ============================================================
// Mappers
// ============================================================

export function toLeadRow(l: LeadApiRow): LeadRow {
  return {
    id: l.id,
    name: l.name,
    last_name: l.last_name,
    email: l.email,
    phone: l.phone,
    city: l.city,
    intent: l.intent as LeadIntent,
    message: l.message,
    source: l.source as LeadSource,
    status: l.status as LeadStatus,
    agent: embedName(l.agent),
    created_at: l.created_at,
    updated_at: l.updated_at,
    tags: (l.tags ?? []) as string[],
    score: (l.score ?? 0) as number,
  };
}

function toLeadDetail(l: LeadApiRow): LeadDetail {
  return {
    id: l.id,
    name: l.name,
    last_name: l.last_name,
    email: l.email,
    phone: l.phone,
    city: l.city,
    intent: l.intent as LeadIntent,
    message: l.message,
    source: l.source as LeadSource,
    status: l.status as LeadStatus,
    notes: l.notes ?? null,
    assigned_to: l.assigned_to ?? null,
    agent_name: embedName(l.agent),
    property_title: embedTitle(l.property),
    created_at: l.created_at,
    updated_at: l.updated_at,
  };
}

// ============================================================
// SELECT strings
// ============================================================

const LEADS_SELECT = `
  id, name, last_name, email, phone, city, intent, message, source, status, 
  notes, assigned_to, created_at, updated_at, deleted_at,
  agent:agents(name), property:properties(title), tags, score
`.trim();

// ============================================================
// API Functions - Fetch
// ============================================================

export async function fetchLeads(): Promise<LeadRow[]> {
  const { data, error } = await supabase
    .from('leads')
    .select(LEADS_SELECT)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as LeadApiRow[]).map(toLeadRow);
}

export async function fetchLead(id: string): Promise<LeadDetail> {
  const { data, error } = await supabase
    .from('leads')
    .select(LEADS_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Lead no encontrado');
  return toLeadDetail(data as unknown as LeadApiRow);
}

export async function fetchDeletedLeads(): Promise<LeadRow[]> {
  const { data, error } = await supabase
    .from('leads')
    .select(LEADS_SELECT)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as LeadApiRow[]).map(toLeadRow);
}

export async function fetchLeadsByStatus(status: LeadStatus): Promise<LeadRow[]> {
  const { data, error } = await supabase
    .from('leads')
    .select(LEADS_SELECT)
    .eq('status', status)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as LeadApiRow[]).map(toLeadRow);
}

export async function fetchLeadsByAgent(agentId: string): Promise<LeadRow[]> {
  const { data, error } = await supabase
    .from('leads')
    .select(LEADS_SELECT)
    .eq('assigned_to', agentId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as LeadApiRow[]).map(toLeadRow);
}

// ============================================================
// API Functions - CRUD
// ============================================================

export async function createLead(values: LeadFormValues): Promise<string> {
  const { data, error } = await supabase
    .from('leads')
    .insert({
      name: values.name.trim(),
      last_name: values.last_name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim() || null,
      city: values.city.trim() || null,
      intent: values.intent,
      source: values.source,
      status: values.status,
      assigned_to: values.assigned_to || null,
      message: values.message.trim() || null,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data.id;
}

export async function updateLead(id: string, patch: LeadPatch): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update(patch)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ============================================================
// API Functions - Soft Delete & Restore
// ============================================================

export async function softDeleteLead(id: string): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function restoreLead(id: string): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update({ deleted_at: null })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function permanentDeleteLead(id: string): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ============================================================
// API Functions - Assignment
// ============================================================

export async function fetchAgents(): Promise<AgentOption[]> {
  const { data, error } = await supabase
    .from('agents')
    .select('id, name')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as AgentOption[];
}

export async function getNextAgentForAssignment(): Promise<AgentOption | null> {
  const { data, error } = await supabase
    .from('agents')
    .select('id, name, leads:leads(count)')
    .eq('is_active', true)
    .order('leads.count', { ascending: true, referencedTable: 'leads' })
    .order('sort_order', { ascending: true })
    .limit(1);

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return null;
  return { id: data[0].id, name: data[0].name };
}

export async function autoAssignLead(leadId: string): Promise<{ agentId: string; agentName: string } | null> {
  const agent = await getNextAgentForAssignment();
  if (!agent) return null;

  await updateLead(leadId, { assigned_to: agent.id });
  return { agentId: agent.id, agentName: agent.name };
}

export async function bulkAutoAssignLeads(leadIds: string[]): Promise<{ assigned: number; skipped: number }> {
  let assigned = 0;
  let skipped = 0;

  for (const leadId of leadIds) {
    const res = await autoAssignLead(leadId);
    if (res) {
      assigned++;
    } else {
      skipped++;
    }
  }

  return { assigned, skipped };
}

// ============================================================
// API Functions - Score
// ============================================================

export function calculateLeadScore(lead: {
  intent: LeadIntent;
  source: LeadSource;
  message?: string | null;
  phone?: string | null;
  city?: string | null;
}): number {
  let score = 0;

  // Intent scoring
  const intentScores: Record<LeadIntent, number> = {
    comprar: 30,
    vender: 25,
    alquilar: 20,
    invertir: 25,
    tasar: 10,
    desarrollador: 15,
    otro: 5,
  };
  score += intentScores[lead.intent] ?? 5;

  // Source scoring
  const sourceScores: Record<LeadSource, number> = {
    landing_form: 10,
    whatsapp: 20,
    telefono: 25,
    email: 15,
    referido: 30,
    ml_contacto: 15,
    manual: 10,
  };
  score += sourceScores[lead.source] ?? 5;

  // Message length
  if (lead.message && lead.message.length > 50) score += 10;
  else if (lead.message && lead.message.length > 20) score += 5;

  // Phone presence
  if (lead.phone && lead.phone.length >= 10) score += 10;

  // City presence
  if (lead.city) score += 5;

  return Math.min(score, 100);
}

export async function recalculateLeadScore(id: string): Promise<number> {
  const { data: lead, error } = await supabase
    .from('leads')
    .select('intent, source, message, phone, city')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  if (!lead) return 0;

  const score = calculateLeadScore(lead as {
    intent: LeadIntent;
    source: LeadSource;
    message: string | null;
    phone: string | null;
    city: string | null;
  });

  await supabase.from('leads').update({ score }).eq('id', id);
  return score;
}

export async function bulkRecalculateScores(ids: string[]): Promise<number> {
  let updated = 0;

  for (const id of ids) {
    const score = await recalculateLeadScore(id);
    if (score > 0) updated++;
  }

  return updated;
}

// ============================================================
// API Functions - Tags
// ============================================================

export async function addLeadTag(id: string, tag: string): Promise<void> {
  const { data: lead } = await supabase
    .from('leads')
    .select('tags')
    .eq('id', id)
    .single();

  const currentTags = (lead?.tags ?? []) as string[];
  if (!currentTags.includes(tag)) {
    const { error } = await supabase
      .from('leads')
      .update({ tags: [...currentTags, tag] })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}

export async function removeLeadTag(id: string, tag: string): Promise<void> {
  const { data: lead } = await supabase
    .from('leads')
    .select('tags')
    .eq('id', id)
    .single();

  const currentTags = (lead?.tags ?? []) as string[];
  const { error } = await supabase
    .from('leads')
    .update({ tags: currentTags.filter((t) => t !== tag) })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function setLeadTags(id: string, tags: string[]): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update({ tags })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ============================================================
// API Functions - Import
// ============================================================

export async function parseLeadsCsv(csvText: string): Promise<{
  valid: CsvLeadRow[];
  errors: { row: number; message: string }[];
}> {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    return { valid: [], errors: [{ row: 0, message: 'CSV vacío o sin encabezados' }] };
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const requiredHeaders = ['name', 'last_name', 'email', 'intent', 'source'];

  for (const req of requiredHeaders) {
    if (!headers.includes(req)) {
      return { valid: [], errors: [{ row: 0, message: `Falta columna requerida: ${req}` }] };
    }
  }

  const valid: CsvLeadRow[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    if (values.length < headers.length) {
      errors.push({ row: i, message: 'Número de columnas incorrecto' });
      continue;
    }

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx];
    });

    const intent = row.intent as LeadIntent;
    const source = row.source as LeadSource;
    const status = (row.status as LeadStatus) || 'nuevo';

    if (!LeadIntent.includes(intent)) {
      errors.push({ row: i, message: `Intent inválido: ${intent}` });
      continue;
    }
    if (!LeadSource.includes(source)) {
      errors.push({ row: i, message: `Source inválido: ${source}` });
      continue;
    }

    valid.push({
      name: row.name,
      last_name: row.last_name,
      email: row.email,
      phone: row.phone ?? undefined,
      city: row.city ?? undefined,
      intent,
      source,
      status,
      message: row.message ?? undefined,
    });
  }

  return { valid, errors };
}

export async function importLeadsFromCsv(csvText: string): Promise<{
  created: number;
  errors: { row: number; message: string }[];
}> {
  const { valid, errors } = await parseLeadsCsv(csvText);
  let imported = 0;

  for (const lead of valid) {
    try {
      await createLead({
        name: lead.name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone ?? '',
        city: lead.city ?? '',
        intent: lead.intent,
        source: lead.source,
        status: lead.status ?? 'nuevo',
        assigned_to: '',
        message: lead.message ?? '',
      });
      imported++;
    } catch (e) {
      errors.push({ row: -1, message: (e as Error).message });
    }
  }

  return { created: imported, errors };
}

export async function bulkImportLeadsParsed(leads: CsvLeadRow[]): Promise<{
  created: number;
  errors: { row: number; message: string }[];
}> {
  let imported = 0;
  const errors: { row: number; message: string }[] = [];

  for (const lead of leads) {
    try {
      await createLead({
        name: lead.name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone ?? '',
        city: lead.city ?? '',
        intent: lead.intent,
        source: lead.source,
        status: lead.status ?? 'nuevo',
        assigned_to: '',
        message: lead.message ?? '',
      });
      imported++;
    } catch (e) {
      errors.push({ row: -1, message: (e as Error).message });
    }
  }

  return { created: imported, errors };
}

// ============================================================
// Export Direct Functions (para compatibilidad)
// ============================================================

export { toLeadDetail };
export const bulkImportLeads = importLeadsFromCsv;
export const purgeLead = permanentDeleteLead;