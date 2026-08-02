import { supabase } from './supabase';

export interface AgentRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  photo_url: string | null;
  matricula: string | null;
  role: string | null;
  bio: string | null;
  specialties: string[];
  social: { linkedin?: string; instagram?: string; whatsapp?: string };
  is_active: boolean;
  sort_order: number;
  lead_count: number;
  created_at: string;
  updated_at: string;

  // Nuevos campos para 10/10
  permissions?: AgentPermissions;
  commission?: AgentCommission;
  schedule?: AgentSchedule[];
}

export interface AgentPermissions {
  can_view_leads: boolean;
  can_edit_leads: boolean;
  can_view_properties: boolean;
  can_edit_properties: boolean;
  can_view_visits: boolean;
  can_manage_visits: boolean;
  can_view_ml: boolean;
  can_manage_ml: boolean;
  can_view_reports: boolean;
  can_manage_agents: boolean;
  can_manage_settings: boolean;
}

export interface AgentCommission {
  sale_percentage: number;      // % sobre venta
  rental_percentage: number;    // % sobre alquiler
  fixed_per_sale?: number;      // Monto fijo por venta
  fixed_per_rental?: number;    // Monto fijo por alquiler
  min_commission?: number;      // Comisión mínima garantizada
  max_commission?: number;      // Tope máximo por operación
}

export interface AgentSchedule {
  day_of_week: number;      // 0=Dom, 1=Lun... 6=Sáb
  start_time: string;       // HH:MM
  end_time: string;         // HH:MM
  is_available: boolean;
  break_start?: string;     // HH:MM
  break_end?: string;       // HH:MM
}

interface AgentApiRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  photo_url: string | null;
  matricula: string | null;
  role: string | null;
  bio: string | null;
  specialties: unknown;
  social: unknown;
  permissions?: unknown;
  commission?: unknown;
  schedule?: unknown;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  leads: { count: number }[];
}

function toRow(a: AgentApiRow): AgentRow {
  const specs = Array.isArray(a.specialties)
    ? a.specialties.filter((s): s is string => typeof s === 'string')
    : [];
  const socialRaw = a.social && typeof a.social === 'object' ? (a.social as Record<string, unknown>) : {};
  
  // Parse new fields
  const permissions = a.permissions && typeof a.permissions === 'object' 
    ? a.permissions as AgentPermissions 
    : defaultPermissions();
  const commission = a.commission && typeof a.commission === 'object'
    ? a.commission as AgentCommission
    : defaultCommission();
  const schedule = Array.isArray(a.schedule)
    ? (a.schedule as AgentSchedule[])
    : defaultSchedule();

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

const defaultPermissions = (): AgentPermissions => ({
  can_view_leads: true,
  can_edit_leads: true,
  can_view_properties: true,
  can_edit_properties: false,
  can_view_visits: true,
  can_manage_visits: true,
  can_view_ml: true,
  can_manage_ml: false,
  can_view_reports: false,
  can_manage_agents: false,
  can_manage_settings: false,
});

const defaultCommission = (): AgentCommission => ({
  sale_percentage: 50,
  rental_percentage: 100,
});

const defaultSchedule = (): AgentSchedule[] => [
  { day_of_week: 1, start_time: '09:00', end_time: '18:00', is_available: true },
  { day_of_week: 2, start_time: '09:00', end_time: '18:00', is_available: true },
  { day_of_week: 3, start_time: '09:00', end_time: '18:00', is_available: true },
  { day_of_week: 4, start_time: '09:00', end_time: '18:00', is_available: true },
  { day_of_week: 5, start_time: '09:00', end_time: '18:00', is_available: true },
  { day_of_week: 6, start_time: '10:00', end_time: '14:00', is_available: true },
  { day_of_week: 0, start_time: '09:00', end_time: '13:00', is_available: false },
];

export async function fetchAgents(): Promise<AgentRow[]> {
  const { data, error } = await supabase
    .from('agents')
    .select('*, leads(count)')
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((a) => toRow(a as AgentApiRow));
}

export async function fetchAgent(id: string): Promise<AgentRow> {
  const { data, error } = await supabase
    .from('agents')
    .select('*, leads(count)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Agente no encontrado');
  return toRow(data as AgentApiRow);
}

export type AgentFormValues = {
  name: string;
  email: string;
  phone: string;
  matricula: string;
  role: string;
  bio: string;
  specialties: string;
  linkedin: string;
  instagram: string;
  whatsapp: string;
  is_active: boolean;
  sort_order: string;
  photo_url: string;
};

export async function uploadAgentPhoto(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('agent-photos').upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('agent-photos').getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteAgentPhoto(url: string): Promise<void> {
  try {
    const path = url.split('/').pop();
    if (path) await supabase.storage.from('agent-photos').remove([path]);
  } catch {
    // no op: si el archivo no existe en storage, seguimos
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

function socialPayload(v: AgentFormValues): { linkedin?: string; instagram?: string; whatsapp?: string } {
  const social: { linkedin?: string; instagram?: string; whatsapp?: string } = {};
  if (v.linkedin.trim()) social.linkedin = v.linkedin.trim();
  if (v.instagram.trim()) social.instagram = v.instagram.trim();
  if (v.whatsapp.trim()) social.whatsapp = v.whatsapp.trim();
  return social;
}

export async function fetchDeletedAgents(): Promise<AgentRow[]> {
  const { data, error } = await supabase
    .from('agents')
    .select('*, leads(count)')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((a) => {
    const specs = Array.isArray(a.specialties)
      ? a.specialties.filter((s: unknown): s is string => typeof s === 'string')
      : [];
    const socialRaw = a.social && typeof a.social === 'object' ? (a.social as Record<string, unknown>) : {};
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
      permissions: defaultPermissions(),
      commission: defaultCommission(),
      schedule: defaultSchedule(),
    };
  });
}

// ---------------------------------------------------------------------------
// Permissions Management
// ---------------------------------------------------------------------------

export async function updateAgentPermissions(id: string, permissions: Partial<AgentPermissions>): Promise<void> {
  const agent = await fetchAgent(id);
  const updated = { ...agent.permissions, ...permissions };
  const { error } = await supabase.from('agents').update({ permissions: updated }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getAgentPermissions(id: string): Promise<AgentPermissions> {
  const { data, error } = await supabase.from('agents').select('permissions').eq('id', id).single();
  if (error) throw new Error(error.message);
  return (data?.permissions as AgentPermissions) ?? defaultPermissions();
}

// ---------------------------------------------------------------------------
// Commission Management
// ---------------------------------------------------------------------------

export async function updateAgentCommission(id: string, commission: Partial<AgentCommission>): Promise<void> {
  const agent = await fetchAgent(id);
  const updated = { ...agent.commission, ...commission };
  const { error } = await supabase.from('agents').update({ commission: updated }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function calculateCommission(agentId: string, operationType: 'sale' | 'rental', amount: number): Promise<number> {
  const agent = await fetchAgent(agentId);
  const commission = agent.commission ?? defaultCommission();
  const percentage = operationType === 'sale' ? commission.sale_percentage : commission.rental_percentage;
  const fixed = operationType === 'sale' ? commission.fixed_per_sale : commission.fixed_per_rental;
  
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

// ---------------------------------------------------------------------------
// Schedule Management
// ---------------------------------------------------------------------------

export async function updateAgentSchedule(id: string, schedule: AgentSchedule[]): Promise<void> {
  const { error } = await supabase.from('agents').update({ schedule }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function isAgentAvailable(agentId: string, date: Date): Promise<boolean> {
  const agent = await fetchAgent(agentId);
  const dayOfWeek = date.getDay(); // 0=Dom, 1=Lun...
  const daySchedule = agent.schedule?.find(s => s.day_of_week === dayOfWeek);
  
  if (!daySchedule || !daySchedule.is_available) return false;
  
  const currentTime = date.toTimeString().slice(0, 5); // HH:MM
  if (currentTime < daySchedule.start_time || currentTime > daySchedule.end_time) return false;
  
  if (daySchedule.break_start && daySchedule.break_end) {
    if (currentTime >= daySchedule.break_start && currentTime <= daySchedule.break_end) return false;
  }
  
  return true;
}

export function getAgentWorkingHours(schedule: AgentSchedule[]): string {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return schedule
    .filter(s => s.is_available)
    .map(s => `${days[s.day_of_week]} ${s.start_time}-${s.end_time}`)
    .join(', ');
}

export function getAgentAvailabilityStatus(agent: AgentRow): 'available' | 'break' | 'unavailable' {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5);
  
  const daySchedule = agent.schedule?.find(s => s.day_of_week === dayOfWeek);
  if (!daySchedule || !daySchedule.is_available) return 'unavailable';
  
  if (currentTime < daySchedule.start_time || currentTime > daySchedule.end_time) return 'unavailable';
  if (daySchedule.break_start && daySchedule.break_end && 
      currentTime >= daySchedule.break_start && currentTime <= daySchedule.break_end) {
    return 'break';
  }
  return 'available';
}

// ---------------------------------------------------------------------------
// Soft Delete (Papelera)
// ---------------------------------------------------------------------------

export async function softDeleteAgent(id: string): Promise<void> {
  const { error } = await supabase
    .from('agents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function restoreAgent(id: string): Promise<void> {
  const { error } = await supabase
    .from('agents')
    .update({ deleted_at: null })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function permanentDeleteAgent(id: string): Promise<void> {
  // Borrar foto del storage si existe
  const { data: agent } = await supabase.from('agents').select('photo_url').eq('id', id).maybeSingle();
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
