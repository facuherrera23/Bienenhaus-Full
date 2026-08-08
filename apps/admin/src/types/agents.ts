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
    sale_percentage: number;
    rental_percentage: number;
    fixed_per_sale?: number;
    fixed_per_rental?: number;
    min_commission?: number;
    max_commission?: number;
}

export interface AgentSchedule {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
    break_start?: string;
    break_end?: string;
}

export interface AgentFormValues {
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

export const DEFAULT_PERMISSIONS: AgentPermissions = {
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
};

export const DEFAULT_COMMISSION: AgentCommission = {
    sale_percentage: 50,
    rental_percentage: 100,
};

export const DEFAULT_SCHEDULE: AgentSchedule[] = [
    { day_of_week: 1, start_time: '09:00', end_time: '18:00', is_available: true },
    { day_of_week: 2, start_time: '09:00', end_time: '18:00', is_available: true },
    { day_of_week: 3, start_time: '09:00', end_time: '18:00', is_available: true },
    { day_of_week: 4, start_time: '09:00', end_time: '18:00', is_available: true },
    { day_of_week: 5, start_time: '09:00', end_time: '18:00', is_available: true },
    { day_of_week: 6, start_time: '10:00', end_time: '14:00', is_available: true },
    { day_of_week: 0, start_time: '09:00', end_time: '13:00', is_available: false },
];

export const DAY_LABELS = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
];
