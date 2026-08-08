import type { Database } from './database';

// ============================================================
// Enums (from DB)
// ============================================================

export type OwnerType = Database['public']['Enums']['owner_type'];
export type OwnerPreferredContact = Database['public']['Enums']['owner_preferred_contact'];
export type PriceStatus = Database['public']['Enums']['price_status'];
export type MarketTrend = Database['public']['Enums']['market_trend'];
export type ActionPlanCategory = Database['public']['Enums']['action_plan_category'];
export type ActionPlanPriority = Database['public']['Enums']['action_plan_priority'];
export type ActionPlanStatus = Database['public']['Enums']['action_plan_status'];
export type CommunicationType = Database['public']['Enums']['communication_type'];
export type CommunicationStatus = Database['public']['Enums']['communication_status'];
export type ReportType = Database['public']['Enums']['report_type'];

// ============================================================
// DB Row Types
// ============================================================

export type OwnerDbRow = Database['public']['Tables']['owners']['Row'];
export type PropertyOwnerDbRow = Database['public']['Tables']['property_owners']['Row'];
export type PriceAnalysisDbRow = Database['public']['Tables']['property_price_analyses']['Row'];
export type ActionPlanDbRow = Database['public']['Tables']['property_action_plans']['Row'];
export type ActionPlanTaskDbRow = Database['public']['Tables']['action_plan_tasks']['Row'];
export type CommunicationDbRow = Database['public']['Tables']['owner_communications']['Row'];
export type ReportDbRow = Database['public']['Tables']['owner_reports']['Row'];

// ============================================================
// Consumer-facing Interfaces
// ============================================================

export interface OwnerRow {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    dni_cuit: string | null;
    address: string | null;
    owner_type: OwnerType;
    company_name: string | null;
    notes: string | null;
    preferred_contact: OwnerPreferredContact;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    property_count: number;
}

export interface OwnerDetail extends OwnerRow {
    properties: Array<{
        id: string;
        title: string;
        address: string | null;
        price: number | null;
        status: string;
        ownership_percentage: number;
        is_primary_contact: boolean;
        role: string;
    }>;
}

export interface OwnerFormValues {
    full_name: string;
    email?: string;
    phone?: string;
    dni_cuit?: string;
    address?: string;
    owner_type: OwnerType;
    company_name?: string;
    notes?: string;
    preferred_contact: OwnerPreferredContact;
}

export interface PropertyOwnerLink {
    property_id: string;
    owner_id: string;
    ownership_percentage: number;
    is_primary_contact: boolean;
    role: string;
}

export interface PropertyOwnerLinkRow extends PropertyOwnerLink {
    id: string;
    created_at: string;
    property_title: string | null;
    owner_name: string | null;
}

export interface PriceAnalysisRow {
    id: string;
    property_id: string;
    estimated_market_price: number;
    price_per_sqm_market: number | null;
    our_listing_price: number;
    price_difference_pct: number;
    price_status: PriceStatus;
    market_trend: MarketTrend;
    comparable_properties: ComparableProperty[];
    recommendation: string | null;
    notes: string | null;
    analyzed_by: string | null;
    analyzed_by_name: string | null;
    analysis_date: string;
    valid_until: string | null;
    created_at: string;
}

export interface ComparableProperty {
    address: string;
    price: number;
    sqm: number | null;
    date: string;
    source: string | null;
    [key: string]: unknown;
}

export interface PriceAnalysisFormValues {
    property_id: string;
    estimated_market_price: number;
    price_per_sqm_market: number | null;
    our_listing_price: number;
    market_trend: MarketTrend;
    comparable_properties: ComparableProperty[];
    recommendation: string;
    notes: string;
    valid_until: string | null;
}

export interface ActionPlanRow {
    id: string;
    property_id: string;
    owner_id: string | null;
    title: string;
    description: string | null;
    category: ActionPlanCategory;
    priority: ActionPlanPriority;
    status: ActionPlanStatus;
    due_date: string | null;
    completed_at: string | null;
    assigned_to: string | null;
    assigned_to_name: string | null;
    created_by: string | null;
    created_by_name: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    property_title: string | null;
    owner_name: string | null;
    tasks_count: number;
    completed_tasks_count: number;
    action_plan_tasks?: Array<{
        id: string;
        status: ActionPlanStatus;
        due_date: string | null;
    }> | null;
}

export interface ActionPlanDetail extends ActionPlanRow {
    tasks: ActionPlanTaskRow[];
}

export interface ActionPlanFormValues {
    property_id: string;
    owner_id: string | null;
    title: string;
    description: string;
    category: ActionPlanCategory;
    priority: ActionPlanPriority;
    due_date: string | null;
    assigned_to: string | null;
}

export interface ActionPlanTaskRow {
    id: string;
    plan_id: string;
    title: string;
    description: string | null;
    status: ActionPlanStatus;
    due_date: string | null;
    completed_at: string | null;
    assigned_to: string | null;
    assigned_to_name: string | null;
    created_at: string;
    updated_at: string;
}

export interface ActionPlanTaskFormValues {
    plan_id: string;
    title: string;
    description: string;
    due_date: string | null;
    assigned_to: string | null;
    status: ActionPlanStatus;
    completed_at: string | null;
}

export interface CommunicationRow {
    id: string;
    owner_id: string;
    property_id: string | null;
    type: CommunicationType;
    subject: string | null;
    content: string | null;
    status: CommunicationStatus;
    sent_at: string | null;
    sent_by: string | null;
    sent_by_name: string | null;
    created_at: string;
    property_title: string | null;
}

export interface CommunicationFormValues {
    owner_id: string;
    property_id: string | null;
    type: CommunicationType;
    subject: string;
    content: string;
}

export interface ReportRow {
    id: string;
    property_id: string;
    owner_id: string;
    report_type: ReportType;
    title: string | null;
    content_json: Record<string, unknown>;
    pdf_url: string | null;
    generated_at: string;
    sent_at: string | null;
    status: CommunicationStatus;
    created_by: string | null;
    created_by_name: string | null;
    property_title: string | null;
    owner_name: string | null;
}

export interface ReportFormValues {
    property_id: string;
    owner_id: string;
    report_type: ReportType;
    title: string;
    content_json: Record<string, unknown>;
}

export interface DashboardKPI {
    label: string;
    value: string | number;
    delta: string;
    tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
}

// ============================================================
// Labels & Tones
// ============================================================

export const OWNER_TYPE_LABEL: Record<OwnerType, string> = {
    persona_fisica: 'Persona Física',
    persona_juridica: 'Persona Jurídica',
};

export const OWNER_PREFERRED_CONTACT_LABEL: Record<OwnerPreferredContact, string> = {
    email: 'Email',
    whatsapp: 'WhatsApp',
    call: 'Llamada',
};

export const PRICE_STATUS_LABEL: Record<PriceStatus, string> = {
    way_below: 'Muy por debajo',
    below: 'Por debajo',
    fair: 'Justo',
    above: 'Por encima',
    way_above: 'Muy por encima',
    premium: 'Premium',
};

export const PRICE_STATUS_TONE: Record<PriceStatus, string> = {
    way_below: 'success',
    below: 'success',
    fair: 'success',
    premium: 'warning',
    above: 'danger',
    way_above: 'danger',
};

export const PRICE_STATUS_GAUGE_COLOR: Record<PriceStatus, string> = {
    way_below: '#22c55e', // green
    below: '#22c55e',
    fair: '#22c55e',
    premium: '#eab308', // yellow
    above: '#ef4444', // red
    way_above: '#ef4444',
};

export const MARKET_TREND_LABEL: Record<MarketTrend, string> = {
    rising: 'En alza',
    stable: 'Estable',
    falling: 'En baja',
};

export const MARKET_TREND_ICON: Record<MarketTrend, string> = {
    rising: 'TrendingUp',
    stable: 'Minus',
    falling: 'TrendingDown',
};

export const ACTION_PLAN_CATEGORY_LABEL: Record<ActionPlanCategory, string> = {
    pricing: 'Precio',
    marketing: 'Marketing',
    condition: 'Estado del inmueble',
    legal: 'Legal',
    other: 'Otro',
};

export const ACTION_PLAN_PRIORITY_LABEL: Record<ActionPlanPriority, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    urgent: 'Urgente',
};

export const ACTION_PLAN_PRIORITY_TONE: Record<ActionPlanPriority, string> = {
    low: 'info',
    medium: 'warning',
    high: 'danger',
    urgent: 'danger',
};

export const ACTION_PLAN_STATUS_LABEL: Record<ActionPlanStatus, string> = {
    pending: 'Pendiente',
    in_progress: 'En progreso',
    completed: 'Completado',
    cancelled: 'Cancelado',
};

export const ACTION_PLAN_STATUS_TONE: Record<ActionPlanStatus, string> = {
    pending: 'warning',
    in_progress: 'info',
    completed: 'success',
    cancelled: 'neutral',
};

export const COMMUNICATION_TYPE_LABEL: Record<CommunicationType, string> = {
    email: 'Email',
    whatsapp: 'WhatsApp',
    call: 'Llamada',
    meeting: 'Reunión',
    report: 'Reporte',
    note: 'Nota interna',
};

export const COMMUNICATION_STATUS_LABEL: Record<CommunicationStatus, string> = {
    draft: 'Borrador',
    sent: 'Enviado',
    delivered: 'Entregado',
    read: 'Leído',
    failed: 'Falló',
};

export const COMMUNICATION_STATUS_TONE: Record<CommunicationStatus, string> = {
    draft: 'neutral',
    sent: 'info',
    delivered: 'info',
    read: 'success',
    failed: 'danger',
};

export const REPORT_TYPE_LABEL: Record<ReportType, string> = {
    price_analysis: 'Análisis de precio',
    visit_summary: 'Resumen de visitas',
    market_update: 'Actualización de mercado',
    weekly: 'Semanal',
    monthly: 'Mensual',
    custom: 'Personalizado',
};

// ============================================================
// Filter Types
// ============================================================

export interface OwnersFilters {
    search?: string;
    owner_type?: OwnerType;
    preferred_contact?: OwnerPreferredContact;
    has_properties?: boolean;
    page?: number;
    pageSize?: number;
    sortBy?: 'full_name' | 'created_at' | 'updated_at';
    sortOrder?: 'asc' | 'desc';
}

export interface ActionPlansFilters {
    property_id?: string;
    owner_id?: string;
    assigned_to?: string;
    status?: ActionPlanStatus;
    category?: ActionPlanCategory;
    priority?: ActionPlanPriority;
    overdue?: boolean;
    page?: number;
    pageSize?: number;
    sortBy?: 'due_date' | 'created_at' | 'priority' | 'title';
    sortOrder?: 'asc' | 'desc';
}

export interface CommunicationsFilters {
    owner_id?: string;
    property_id?: string;
    type?: CommunicationType;
    status?: CommunicationStatus;
    from_date?: string;
    to_date?: string;
    page?: number;
    pageSize?: number;
    sortBy?: 'created_at' | 'sent_at';
    sortOrder?: 'asc' | 'desc';
}

export interface ReportsFilters {
    property_id?: string;
    owner_id?: string;
    report_type?: ReportType;
    status?: CommunicationStatus;
    page?: number;
    pageSize?: number;
    sortBy?: 'generated_at' | 'sent_at';
    sortOrder?: 'asc' | 'desc';
}

// ============================================================
// Helpers
// ============================================================

export function getPriceStatusFromPct(pct: number): PriceStatus {
    if (pct < -20) return 'way_below';
    if (pct < -10) return 'below';
    if (pct <= 5) return 'fair';
    if (pct <= 10) return 'premium';
    if (pct <= 20) return 'above';
    return 'way_above';
}

export function getPriceStatusLabel(status: PriceStatus): string {
    const labels: Record<PriceStatus, string> = {
        way_below: 'MUY POR DEBAJO',
        below: 'POR DEBAJO',
        fair: 'PRECIO JUSTO',
        premium: 'PREMIUM',
        above: 'POR ENCIMA',
        way_above: 'MUY POR ENCIMA',
    };
    return labels[status];
}

export function formatPriceStatus(pct: number): string {
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(2)}%`;
}

export function generateWhatsAppLink(phone: string, message: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
