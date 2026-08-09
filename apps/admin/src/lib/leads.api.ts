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
import {
    type AgentOption,
    type CsvLeadRow,
    LEAD_INTENT_LABEL,
    LEAD_SOURCE_LABEL,
    LEAD_STATUS_LABEL,
    LEAD_STATUS_TONE,
    type LeadDetail,
    type LeadFormValues,
    type LeadIntent,
    type LeadPatch,
    type LeadRow,
    type LeadSource,
    type LeadStatus,
    STATUS_ORDER,
} from '../types/leads';
import {
    addLeadTag,
    autoAssignLead,
    bulkAutoAssignLeads,
    bulkImportLeadsParsed,
    bulkRecalculateScores,
    calculateLeadScore,
    createLead,
    embedName,
    fetchAgents as fetchAgentOptions,
    fetchDeletedLeads,
    fetchLead,
    fetchLeads,
    importLeadsFromCsv,
    type LeadApiRow,
    parseLeadsCsv,
    permanentDeleteLead,
    recalculateLeadScore,
    removeLeadTag,
    restoreLead,
    setLeadTags,
    softDeleteLead,
    toLeadRow,
    updateLead,
    updateLeadStatus,
} from './leads';

const LEADS_PATH = 'leads';

// ============================================================
// Mappers
// ============================================================

// toLeadRow ya está exportado desde leads.ts

// ============================================================
// Query Hooks
// ============================================================

export function useLeads(filters?: {
    status?: LeadStatus;
    intent?: LeadIntent;
    source?: LeadSource;
    search?: string;
    page?: number;
    pageSize?: number;
}) {
    const apiFilters: Record<string, string | number | boolean> = { deleted_at: 'is.null' };

    if (filters?.status) apiFilters.status = `eq.${filters.status}`;
    if (filters?.intent) apiFilters.intent = `eq.${filters.intent}`;
    if (filters?.source) apiFilters.source = `eq.${filters.source}`;
    if (filters?.search) {
        const escaped = filters.search.replace(/[*%]/g, '');
        apiFilters.or = `(name.ilike.*${escaped}*,last_name.ilike.*${escaped}*,email.ilike.*${escaped}*,phone.ilike.*${escaped}*)`;
    }

    return useList<LeadRow, LeadApiRow>({
        queryKey: queryKeys.leads(filters),
        path: LEADS_PATH,
        select: 'id,name,last_name,email,phone,city,intent,message,source,status,created_at,updated_at,agent:agents(name),tags,score',
        filters: apiFilters,
        page: filters?.page ?? 1,
        pageSize: filters?.pageSize ?? 20,
        orderBy: 'created_at',
        ascending: false,
        transform: toLeadRow,
    });
}

export function useLead(id: string | null) {
    return useItem<LeadDetail>(queryKeys.lead(id ?? ''), LEADS_PATH, id, !!id);
}

export function useFetchDeletedLeads() {
    return useList<LeadRow, LeadApiRow>({
        queryKey: queryKeys.leads({ deleted: true }),
        path: LEADS_PATH,
        select: 'id,name,last_name,email,phone,city,intent,message,source,status,created_at,updated_at,agent:agents(name),tags,score',
        filters: { deleted_at: 'not.is.null' },
        page: 1,
        pageSize: 50,
        orderBy: 'deleted_at',
        ascending: false,
        transform: toLeadRow,
    });
}

// ============================================================
// Query Hooks - Agents (for assignment)
// ============================================================

export function useAgentOptions() {
    return useList<AgentOption>({
        queryKey: queryKeys.agents({ options: true }),
        path: 'agents',
        select: 'id,name',
        filters: { is_active: 'eq.true' },
        page: 1,
        pageSize: 100,
        orderBy: 'sort_order',
        ascending: true,
    });
}

// ============================================================
// Mutation Hooks - CRUD
// ============================================================

export function useCreateLead() {
    return useCreate<LeadRow, LeadFormValues>(queryKeys.leads(), LEADS_PATH, {
        invalidateKeys: [queryKeys.leads()],
    });
}

export function useUpdateLead() {
    return useUpdate<LeadRow, LeadPatch>(queryKeys.leads(), LEADS_PATH, {
        invalidateKeys: [queryKeys.leads()],
    });
}

export function useDeleteLead() {
    return useDelete(queryKeys.leads(), LEADS_PATH, {
        invalidateKeys: [queryKeys.leads()],
    });
}

export function useUpdateLeadStatus() {
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: LeadStatus }) => {
            return updateLeadStatus(id, status);
        },
    });
}

// ============================================================
// Mutation Hooks - Soft Delete & Restore
// ============================================================

export function useSoftDeleteLead() {
    return useMutation({
        mutationFn: async (id: string) => {
            return softDeleteLead(id);
        },
    });
}

export function useRestoreLead() {
    return useMutation({
        mutationFn: async (id: string) => {
            return restoreLead(id);
        },
    });
}

export function usePermanentDeleteLead() {
    return useMutation({
        mutationFn: async (id: string) => {
            return permanentDeleteLead(id);
        },
    });
}

// ============================================================
// Mutation Hooks - Assignment
// ============================================================

export function useAutoAssignLead() {
    return useMutation({
        mutationFn: async (leadId: string) => {
            return autoAssignLead(leadId);
        },
    });
}

export function useBulkAutoAssignLeads() {
    return useMutation({
        mutationFn: async (leadIds: string[]) => {
            return bulkAutoAssignLeads(leadIds);
        },
    });
}

// ============================================================
// Mutation Hooks - Score
// ============================================================

export function useCalculateLeadScore() {
    return useMutation({
        mutationFn: async (lead: {
            intent: LeadIntent;
            source: LeadSource;
            message?: string | null;
            phone?: string | null;
            city?: string | null;
        }) => {
            return calculateLeadScore(lead);
        },
    });
}

export function useRecalculateLeadScore() {
    return useMutation({
        mutationFn: async (id: string) => {
            return recalculateLeadScore(id);
        },
    });
}

export function useBulkRecalculateScores() {
    return useMutation({
        mutationFn: async (leadIds: string[]) => {
            return bulkRecalculateScores(leadIds);
        },
    });
}

// ============================================================
// Mutation Hooks - Tags
// ============================================================

export function useAddLeadTag() {
    return useMutation({
        mutationFn: async ({ leadId, tag }: { leadId: string; tag: string }) => {
            return addLeadTag(leadId, tag);
        },
    });
}

export function useRemoveLeadTag() {
    return useMutation({
        mutationFn: async ({ leadId, tag }: { leadId: string; tag: string }) => {
            return removeLeadTag(leadId, tag);
        },
    });
}

export function useSetLeadTags() {
    return useMutation({
        mutationFn: async ({ leadId, tags }: { leadId: string; tags: string[] }) => {
            return setLeadTags(leadId, tags);
        },
    });
}

// ============================================================
// Mutation Hooks - Import
// ============================================================

export function useParseLeadsCsv() {
    return useMutation({
        mutationFn: async (csvText: string) => {
            return parseLeadsCsv(csvText);
        },
    });
}

export function useImportLeads() {
    return useMutation({
        mutationFn: async (leads: CsvLeadRow[]) => {
            return bulkImportLeadsParsed(leads);
        },
    });
}

export function useImportLeadsFromCsv() {
    return useMutation({
        mutationFn: async (csvText: string) => {
            return importLeadsFromCsv(csvText);
        },
    });
}

// ============================================================
// Export
// ============================================================

export const LEAD_EXPORT_COLUMNS: ExportColumn<LeadRow>[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'last_name', label: 'Apellido' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Teléfono', format: (v) => String(v ?? '—') },
    { key: 'city', label: 'Ciudad', format: (v) => String(v ?? '—') },
    { key: 'intent', label: 'Intención', format: (v) => LEAD_INTENT_LABEL[v as LeadIntent] ?? v },
    { key: 'source', label: 'Origen', format: (v) => LEAD_SOURCE_LABEL[v as LeadSource] ?? v },
    { key: 'status', label: 'Estado', format: (v) => LEAD_STATUS_LABEL[v as LeadStatus] ?? v },
    { key: 'score', label: 'Score', format: (v) => String(v ?? 0) },
    { key: 'tags', label: 'Tags', format: (v) => (v as string[])?.join('; ') ?? '' },
    { key: 'agent', label: 'Asignado', format: (v) => String(v ?? '—') },
    {
        key: 'created_at',
        label: 'Recibido',
        format: (v) => (v ? new Date(v as string).toLocaleDateString('es-AR') : '—'),
    },
];

export function useExportLeads() {
    const { exportToCSV } = useExport<LeadRow>();
    const leads = useLeads({ pageSize: 1000 });

    return {
        exportToCSV: async (filename = 'leads') => {
            if (leads.data?.data) {
                await exportToCSV({
                    data: leads.data.data,
                    columns: LEAD_EXPORT_COLUMNS,
                    filename,
                });
            }
        },
        isLoading: leads.isPending,
    };
}

// ============================================================
// Export Direct Functions (for components that don't use hooks)
// ============================================================

export {
    fetchLeads,
    fetchLead,
    fetchDeletedLeads,
    createLead,
    updateLead,
    updateLeadStatus,
    softDeleteLead,
    restoreLead,
    permanentDeleteLead,
    autoAssignLead,
    bulkAutoAssignLeads,
    bulkRecalculateScores,
    addLeadTag,
    removeLeadTag,
    setLeadTags,
    fetchAgentOptions as fetchAgents,
    calculateLeadScore,
    recalculateLeadScore,
    parseLeadsCsv,
    importLeadsFromCsv,
    bulkImportLeadsParsed,
    embedName,
};

// ============================================================
// Re-export
// ============================================================

export { queryKeys };
export type {
    LeadStatus,
    LeadIntent,
    LeadSource,
    LeadRow,
    LeadDetail,
    LeadFormValues,
    LeadPatch,
    CsvLeadRow,
    AgentOption,
};
export { LEAD_STATUS_LABEL, LEAD_STATUS_TONE, LEAD_INTENT_LABEL, LEAD_SOURCE_LABEL, STATUS_ORDER };
