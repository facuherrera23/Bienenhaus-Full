import {
    type ExportColumn,
    queryKeys,
    useCreate,
    useDelete,
    useExport,
    useItem,
    useList,
    useMutation,
    useUpdate,
} from './api';
import type {
    AgentAvailability,
    QrCheckin,
    RecurrenceRule,
    RecurringVisit,
    ReminderConfig,
    VisitFormValues,
    VisitRow,
    VisitStatus,
    VisitType,
} from '../types/visits';
import {
    DAY_LABELS,
    DEFAULT_REMINDERS,
    MEETING_TYPE_LABEL,
    VISIT_STATUS_LABEL,
    VISIT_STATUS_TONE,
} from '../types/visits';
import {
    checkInWithQr,
    createAgentAvailability,
    createRecurringVisit,
    createReminders,
    createVisit,
    deleteAgentAvailability,
    fetchAgentAvailability,
    fetchDeletedVisits,
    fetchVisit,
    fetchVisits,
    fetchVisitsByAgent,
    fetchVisitsByDateRange,
    fetchVisitsByLead,
    generateOccurrences,
    generateQrCode,
    getQrCode,
    permanentDeleteVisit,
    processReminders,
    restoreVisit,
    softDeleteVisit,
    toVisitRow,
    updateAgentAvailability,
    updateVisit,
    type VisitApiRow,
} from './visits';

const VISITS_PATH = 'visits';

// ============================================================
// Query Hooks
// ============================================================

export function useVisits(filters?: {
    agent_id?: string;
    lead_id?: string;
    property_id?: string;
    status?: VisitStatus;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
}) {
    const apiFilters: Record<string, unknown> = { deleted_at: 'is.null' };

    if (filters?.agent_id) apiFilters.agent_id = `eq.${filters.agent_id}`;
    if (filters?.lead_id) apiFilters.lead_id = `eq.${filters.lead_id}`;
    if (filters?.property_id) apiFilters.property_id = `eq.${filters.property_id}`;
    if (filters?.status) apiFilters.status = `eq.${filters.status}`;
    if (filters?.from && filters?.to) {
        apiFilters.starts_at = `gte.${filters.from},lte.${filters.to}`;
    } else if (filters?.from) {
        apiFilters.starts_at = `gte.${filters.from}`;
    } else if (filters?.to) {
        apiFilters.starts_at = `lte.${filters.to}`;
    }

    return useList<VisitRow, VisitApiRow>({
        queryKey: queryKeys.visits(filters),
        path: VISITS_PATH,
        select: 'id,lead_id,property_id,agent_id,title,description,starts_at,ends_at,status,location,meeting_type,meeting_link,notes,reminder_sent,reminder_sent_at,confirmed_at,completed_at,cancelled_at,cancellation_reason,created_by,created_at,updated_at,deleted_at,lead:leads(name,email,phone),property:properties(title),agent:agents(name)',
        filters: apiFilters,
        page: filters?.page ?? 1,
        pageSize: filters?.pageSize ?? 50,
        orderBy: 'starts_at',
        ascending: true,
        transform: toVisitRow,
    });
}

export function useVisit(id: string | null) {
    return useItem<VisitRow>(queryKeys.visits([id]), VISITS_PATH, id, !!id);
}

export function useFetchDeletedVisits() {
    return useList<VisitRow, VisitApiRow>({
        queryKey: queryKeys.visits({ deleted: true }),
        path: VISITS_PATH,
        select: 'id,lead_id,property_id,agent_id,title,description,starts_at,ends_at,status,location,meeting_type,meeting_link,notes,reminder_sent,reminder_sent_at,confirmed_at,completed_at,cancelled_at,cancellation_reason,created_by,created_at,updated_at,deleted_at,lead:leads(name,email,phone),property:properties(title),agent:agents(name)',
        filters: { deleted_at: 'not.is.null' },
        page: 1,
        pageSize: 50,
        orderBy: 'deleted_at',
        ascending: false,
        transform: toVisitRow,
    });
}

// ============================================================
// Query Hooks - Filtered
// ============================================================

export function useVisitsByAgent(agentId: string | null) {
    return useList<VisitRow, VisitApiRow>({
        queryKey: queryKeys.visits({ agent_id: agentId }),
        path: VISITS_PATH,
        select: 'id,lead_id,property_id,agent_id,title,description,starts_at,ends_at,status,location,meeting_type,meeting_link,notes,reminder_sent,reminder_sent_at,confirmed_at,completed_at,cancelled_at,cancellation_reason,created_by,created_at,updated_at,deleted_at,lead:leads(name,email,phone),property:properties(title),agent:agents(name)',
        filters: { deleted_at: 'is.null', agent_id: `eq.${agentId}` },
        page: 1,
        pageSize: 100,
        orderBy: 'starts_at',
        ascending: true,
        enabled: !!agentId,
        transform: toVisitRow,
    });
}

export function useVisitsByDateRange(from: string, to: string, agentId?: string) {
    return useList<VisitRow, VisitApiRow>({
        queryKey: queryKeys.visits({ from, to, agent_id: agentId }),
        path: VISITS_PATH,
        select: 'id,lead_id,property_id,agent_id,title,description,starts_at,ends_at,status,location,meeting_type,meeting_link,notes,reminder_sent,reminder_sent_at,confirmed_at,completed_at,cancelled_at,cancellation_reason,created_by,created_at,updated_at,deleted_at,lead:leads(name,email,phone),property:properties(title),agent:agents(name)',
        filters: {
            deleted_at: 'is.null',
            starts_at: `gte.${from},lte.${to}`,
            ...(agentId ? { agent_id: `eq.${agentId}` } : {}),
        },
        page: 1,
        pageSize: 200,
        orderBy: 'starts_at',
        ascending: true,
        transform: toVisitRow,
    });
}

export function useVisitsByLead(leadId: string | null) {
    return useList<VisitRow, VisitApiRow>({
        queryKey: queryKeys.visits({ lead_id: leadId }),
        path: VISITS_PATH,
        select: 'id,lead_id,property_id,agent_id,title,description,starts_at,ends_at,status,location,meeting_type,meeting_link,notes,reminder_sent,reminder_sent_at,confirmed_at,completed_at,cancelled_at,cancellation_reason,created_by,created_at,updated_at,deleted_at,lead:leads(name,email,phone),property:properties(title),agent:agents(name)',
        filters: { deleted_at: 'is.null', lead_id: `eq.${leadId}` },
        page: 1,
        pageSize: 50,
        orderBy: 'starts_at',
        ascending: false,
        enabled: !!leadId,
        transform: toVisitRow,
    });
}

// ============================================================
// Mutation Hooks - CRUD
// ============================================================

export function useCreateVisit() {
    return useCreate<VisitRow, VisitFormValues>(queryKeys.visits(), VISITS_PATH, {
        invalidateKeys: [queryKeys.visits()],
    });
}

export function useUpdateVisit() {
    return useUpdate<VisitRow, Partial<VisitFormValues>>(queryKeys.visits(), VISITS_PATH, {
        invalidateKeys: [queryKeys.visits()],
    });
}

export function useDeleteVisit() {
    return useDelete(queryKeys.visits(), VISITS_PATH, {
        invalidateKeys: [queryKeys.visits()],
    });
}

// ============================================================
// Mutation Hooks - Soft Delete & Restore
// ============================================================

export function useSoftDeleteVisit() {
    return useMutation({
        mutationFn: async (id: string) => {
            return softDeleteVisit(id);
        },
    });
}

export function useRestoreVisit() {
    return useMutation({
        mutationFn: async (id: string) => {
            return restoreVisit(id);
        },
    });
}

export function usePermanentDeleteVisit() {
    return useMutation({
        mutationFn: async (id: string) => {
            return permanentDeleteVisit(id);
        },
    });
}

// ============================================================
// Mutation Hooks - Status
// ============================================================

export function useUpdateVisitStatus() {
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: VisitStatus }) => {
            return updateVisit(id, { status });
        },
    });
}

// ============================================================
// Mutation Hooks - Agent Availability
// ============================================================

export function useAgentAvailability(agentId: string | null) {
    return useList<AgentAvailability>({
        queryKey: queryKeys.visits([{ availability: agentId }]),
        path: 'agent_availability',
        select: '*',
        filters: { agent_id: `eq.${agentId}`, is_active: 'eq.true' },
        page: 1,
        pageSize: 7,
        orderBy: 'day_of_week',
        ascending: true,
        enabled: !!agentId,
    });
}

export function useCreateAgentAvailability() {
    return useCreate<
        AgentAvailability,
        Omit<AgentAvailability, 'id' | 'created_at' | 'updated_at'>
    >(queryKeys.visits([{ availability: '' }]), 'agent_availability', {
        invalidateKeys: [queryKeys.visits([{ availability: '' }])],
    });
}

export function useUpdateAgentAvailability() {
    return useUpdate<AgentAvailability, Partial<AgentAvailability>>(
        queryKeys.visits([{ availability: '' }]),
        'agent_availability',
        {
            invalidateKeys: [queryKeys.visits([{ availability: '' }])],
        },
    );
}

export function useDeleteAgentAvailability() {
    return useDelete(queryKeys.visits([{ availability: '' }]), 'agent_availability', {
        invalidateKeys: [queryKeys.visits([{ availability: '' }])],
    });
}

// ============================================================
// Mutation Hooks - Recurring Visits
// ============================================================

export function useCreateRecurringVisit() {
    return useMutation({
        mutationFn: async ({
            baseVisitId,
            rule,
        }: {
            baseVisitId: string;
            rule: RecurrenceRule;
        }) => {
            return createRecurringVisit(baseVisitId, rule);
        },
    });
}

export function useGenerateOccurrences() {
    return useMutation({
        mutationFn: async (recurringId: number) => {
            return generateOccurrences(recurringId);
        },
    });
}

// ============================================================
// Mutation Hooks - Reminders
// ============================================================

export function useCreateReminders() {
    return useMutation({
        mutationFn: async ({
            visitId,
            reminders,
        }: {
            visitId: string;
            reminders?: Omit<
                ReminderConfig,
                'id' | 'visit_id' | 'is_sent' | 'sent_at' | 'created_at'
            >[];
        }) => {
            return createReminders(visitId, reminders);
        },
    });
}

export function useProcessReminders() {
    return useMutation({
        mutationFn: async () => {
            return processReminders();
        },
    });
}

// ============================================================
// Mutation Hooks - QR Check-in
// ============================================================

export function useGenerateQrCode() {
    return useMutation({
        mutationFn: async (visitId: string) => {
            return generateQrCode(visitId);
        },
    });
}

export function useCheckInWithQr() {
    return useMutation({
        mutationFn: async ({ code, agentId }: { code: string; agentId: string }) => {
            return checkInWithQr(code, agentId);
        },
    });
}

export function useGetQrCode(visitId: string | null) {
    return useMutation({
        mutationFn: async () => {
            if (!visitId) return null;
            return getQrCode(visitId);
        },
    });
}

// ============================================================
// Export
// ============================================================

export const VISIT_EXPORT_COLUMNS: ExportColumn<VisitRow>[] = [
    { key: 'title', label: 'Título' },
    { key: 'lead_name', label: 'Lead', format: (v) => v ?? '—' },
    { key: 'property_title', label: 'Propiedad', format: (v) => v ?? '—' },
    { key: 'agent_name', label: 'Agente' },
    {
        key: 'starts_at',
        label: 'Inicio',
        format: (v) => (v ? new Date(v).toLocaleString('es-AR') : '—'),
    },
    {
        key: 'ends_at',
        label: 'Fin',
        format: (v) => (v ? new Date(v).toLocaleString('es-AR') : '—'),
    },
    { key: 'status', label: 'Estado', format: (v) => VISIT_STATUS_LABEL[v as VisitStatus] ?? v },
    { key: 'location', label: 'Ubicación', format: (v) => v ?? '—' },
    { key: 'meeting_type', label: 'Tipo', format: (v) => MEETING_TYPE_LABEL[v as VisitType] ?? v },
    { key: 'meeting_link', label: 'Link', format: (v) => v ?? '—' },
];

export function useExportVisits() {
    const { exportToCSV } = useExport<VisitRow>();
    const visits = useVisits({ pageSize: 1000 });

    return {
        exportToCSV: async (filename = 'visitas') => {
            if (visits.data?.data) {
                await exportToCSV({
                    data: visits.data.data,
                    columns: VISIT_EXPORT_COLUMNS,
                    filename,
                });
            }
        },
        isLoading: visits.isPending,
    };
}

// ============================================================
// Export Direct Functions (for components that don't use hooks)
// ============================================================

export {
    fetchVisits,
    fetchVisit,
    fetchVisitsByAgent,
    fetchVisitsByDateRange,
    fetchVisitsByLead,
    fetchDeletedVisits,
    createVisit,
    updateVisit,
    softDeleteVisit,
    restoreVisit,
    permanentDeleteVisit,
    fetchAgentAvailability,
    createAgentAvailability,
    updateAgentAvailability,
    deleteAgentAvailability,
    createRecurringVisit,
    generateOccurrences,
    createReminders,
    processReminders,
    generateQrCode,
    checkInWithQr,
    getQrCode,
    toVisitRow,
};

// ============================================================
// Re-export
// ============================================================

export { queryKeys };
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
