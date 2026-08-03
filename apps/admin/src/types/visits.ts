import type { Database } from './database';

export type VisitStatus = Database['public']['Enums']['visit_status'];
export type VisitType = 'presencial' | 'virtual' | 'telefono';

// Re-export the DB row type
export type VisitDbRow = Database['public']['Tables']['visits']['Row'];

export interface VisitRow {
  id: string;
  lead_id: string | null;
  property_id: string | null;
  agent_id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  status: VisitStatus;
  location: string | null;
  meeting_type: VisitType | null;
  meeting_link: string | null;
  notes: string | null;
  reminder_sent: boolean;
  reminder_sent_at: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  lead_name: string | null;
  lead_email: string | null;
  lead_phone: string | null;
  property_title: string | null;
  agent_name: string | null;
}

export interface VisitFormValues {
  lead_id: string;
  property_id: string;
  agent_id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  status: VisitStatus;
  location: string;
  meeting_type: VisitType;
  meeting_link: string;
  notes: string;
}

export interface AgentAvailability {
  id: string;
  agent_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  days_of_week?: number[];
  day_of_month?: number;
  end_date?: string;
  count?: number;
  exceptions?: string[];
}

export interface RecurringVisit {
  id: string;
  base_visit_id: string;
  rule: RecurrenceRule;
  next_occurrence: string;
  occurrences_generated: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReminderConfig {
  id: string;
  visit_id: string;
  type: 'email' | 'sms' | 'push';
  trigger_minutes_before: number;
  template?: string;
  is_sent: boolean;
  sent_at: string | null;
  created_at: string;
}

export interface QrCheckin {
  id: string;
  visit_id: string;
  code: string;
  checked_in: boolean;
  checked_in_at: string | null;
  checked_in_by: string | null;
  created_at: string;
}

export const VISIT_STATUS_LABEL: Record<VisitStatus, string> = {
  programada: 'Programada',
  confirmada: 'Confirmada',
  en_curso: 'En curso',
  completada: 'Completada',
  cancelada: 'Cancelada',
  no_show: 'No asistió',
};

export const VISIT_STATUS_TONE: Record<VisitStatus, string> = {
  programada: 'info',
  confirmada: 'success',
  en_curso: 'warning',
  completada: 'neutral',
  cancelada: 'danger',
  no_show: 'danger',
};

export const MEETING_TYPE_LABEL: Record<VisitType, string> = {
  presencial: 'Presencial',
  virtual: 'Virtual',
  telefono: 'Teléfono',
};

export const DEFAULT_REMINDERS: Omit<ReminderConfig, 'id' | 'visit_id' | 'is_sent' | 'sent_at' | 'created_at'>[] = [
  { type: 'email', trigger_minutes_before: 1440 },
  { type: 'email', trigger_minutes_before: 60 },
  { type: 'sms', trigger_minutes_before: 60 },
  { type: 'push', trigger_minutes_before: 30 },
];

export const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];