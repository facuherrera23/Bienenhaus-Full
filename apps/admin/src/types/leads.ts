import type { Database } from './database';

export type LeadStatus = Database['public']['Enums']['lead_status'];
export type LeadIntent = Database['public']['Enums']['lead_intent'];
export type LeadSource = Database['public']['Enums']['lead_source'];

// Re-export the DB row type
export type LeadDbRow = Database['public']['Tables']['leads']['Row'];

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

export interface LeadDetail extends LeadRow {
    notes: string | null;
    assigned_to: string | null;
    agent_name: string | null;
    property_title: string | null;
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

export interface AgentOption {
    id: string;
    name: string;
}

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

export const STATUS_ORDER: LeadStatus[] = [
    'nuevo',
    'contactado',
    'calificado',
    'en_proceso',
    'cerrado_ganado',
    'cerrado_perdido',
];
