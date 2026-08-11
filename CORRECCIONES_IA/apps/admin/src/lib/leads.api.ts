import {
    type ExportColumn,
    queryKeys,
    useExport,
    useList as useListHook,
    useMutation,
} from './api';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
// NOTA: los hooks useXxx (useLeads, useLead, useSoftDeleteLead, etc.) y las
// constantes LEAD_STATUS_LABEL/TONE/ORDER NO se importan desde '../types/leads':
// se definen/exportan en este mismo archivo (más abajo) o en './leads'. Importarlos
// también desde '../types/leads' era la causa de los "Duplicate identifier" en
// cascada (~300 errores). '../types/leads' debería exponer únicamente tipos.
//
// El bloque de imports de Mercado Libre (Ml* types desde '../types/leads' y
// funciones desde './ml') se sacó por completo: ninguno se usaba en este archivo
// (build tiraba "All imports in import declaration are unused"), y los tipos Ml*
// ni siquiera existen en '../types/leads' — viven en '../types/ml' (ver ml.api.ts).
// Si leads.api.ts alguna vez necesitó hooks de ML, probablemente se perdieron en
// un merge — revisar si hace falta un ml.api.ts separado en vez de reintroducirlos acá.
import {
    type LeadStatus,
    type LeadIntent,
    type LeadSource,
    type LeadRow,
    type LeadDetail,
    type LeadFormValues,
    type LeadPatch,
    type CsvLeadRow,
    type AgentOption,
    type FetchLeadsFilters,
    LEAD_STATUS_LABEL,
    LEAD_STATUS_TONE,
    LEAD_INTENT_LABEL,
    LEAD_SOURCE_LABEL,
    LEAD_STATUS_ORDER,
    embedName,
    embedTitle,
    toLeadRow,
    fetchLeads,
    fetchLead,
    fetchDeletedLeads,
    fetchLeadsByStatus,
    fetchLeadsByAgent,
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
    fetchAgents,
    fetchAgents as fetchAgentOptions,
    getNextAgentForAssignment,
    calculateLeadScore,
    recalculateLeadScore,
    importLeadsFromCsv,
    parseLeadsCsv,
    bulkImportLeadsParsed,
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

    return useListHook<LeadRow, any>({
        queryKey: queryKeys.leads(filters),
        path: LEADS_PATH,
        select: 'id,name,last_name,email,phone,city,intent,message,source,status,created_at,updated_at,agent:agents(name),tags,score',
        filters: apiFilters,
        page: filters?.page ?? 1,
        pageSize: filters?.pageSize ?? 20,
        orderBy: 'created_at',
        ascending: false,
        transform: (row) => ({
            id: row.id,
            name: row.name,
            last_name: row.last_name,
            email: row.email,
            phone: row.phone,
            city: row.city,
            intent: row.intent,
            message: row.message,
            source: row.source,
            status: row.status,
            agent: row.agent,
            created_at: row.created_at,
            updated_at: row.updated_at,
            tags: (row.tags ?? []) as string[],
            score: (row.score ?? 0) as number,
        }),
    });
}

export function useLeadsInfinite(filters?: FetchLeadsFilters) {
    return useInfiniteQuery({
        queryKey: ['leads-infinite', filters],
        queryFn: ({ pageParam }) =>
            fetchLeads({ ...filters, page: pageParam, pageSize: filters?.pageSize ?? 20 }),
        getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
        initialPageParam: 1,
    });
}

export function useLead(id: string | null) {
    return useQuery({
        queryKey: ['lead', id],
        queryFn: () => id ? fetchLead(id) : Promise.resolve(null),
        enabled: !!id,
    });
}

export function useFetchDeletedLeads() {
    return useQuery({
        queryKey: ['leads', { deleted: true }],
        queryFn: () => fetchDeletedLeads(),
    });
}

// ============================================================
// Query Hooks - Agents (for assignment)
// ============================================================

export function useAgentOptions() {
    return useQuery({
        queryKey: ['agents', { options: true }],
        queryFn: () => fetchAgents(),
    });
}

// ============================================================
// Mutation Hooks - CRUD
// ============================================================

export function useCreateLead() {
    return useMutation({
        mutationFn: async (values: any) => {
            return createLead(values);
        },
    });
}

export function useUpdateLead() {
    return useMutation({
        mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
            return updateLead(id, patch);
        },
    });
}

export function useDeleteLead() {
    return useMutation({
        mutationFn: async (id: string) => {
            return permanentDeleteLead(id);
        },
    });
}

export function useUpdateLeadStatus() {
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: any }) => {
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
        mutationFn: async (leads: any[]) => {
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

export const LEAD_EXPORT_COLUMNS: ExportColumn<any>[] = [
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
    const { exportToCSV } = useExport<any>();
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
    fetchLeadsByStatus,
    fetchLeadsByAgent,
    createLead,
    updateLead,
    updateLeadStatus,
    softDeleteLead,
    restoreLead,
    permanentDeleteLead,
    autoAssignLead,
    bulkAutoAssignLeads,
    bulkRecalculateScores,
    getNextAgentForAssignment,
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
    embedTitle,
    toLeadRow,
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
export { LEAD_STATUS_LABEL, LEAD_STATUS_TONE, LEAD_INTENT_LABEL, LEAD_SOURCE_LABEL, LEAD_STATUS_ORDER };
export { STATUS_ORDER } from '../types/leads';