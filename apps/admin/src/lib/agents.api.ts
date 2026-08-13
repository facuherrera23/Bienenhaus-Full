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
    useUpload,
} from './api';
import { supabase } from '@bienenhaus/supabase';
import { useEffect, useState } from 'preact/hooks';
import {
    type AgentAvailability,
    type AgentCommission,
    type AgentFormValues,
    type AgentPermissions,
    type AgentRow,
    type AgentSchedule,
    DAY_LABELS,
    DEFAULT_COMMISSION,
    DEFAULT_PERMISSIONS,
    DEFAULT_SCHEDULE,
} from '../types/agents';
import {
    type AgentApiRow,
    calculateCommission,
    createAgent,
    deleteAgentPhoto,
    fetchAgent,
    fetchAgents,
    fetchDeletedAgents,
    permanentDeleteAgent,
    restoreAgent,
    softDeleteAgent,
    toFormValues,
    toRow,
    updateAgent,
    updateAgentCommission,
    updateAgentPermissions,
    updateAgentSchedule,
    uploadAgentPhoto,
} from './agents';

const AGENTS_PATH = 'agents';

// ============================================================
// Query Hooks
// ============================================================

export function useAgents(filters?: {
    is_active?: boolean;
    search?: string;
    page?: number;
    pageSize?: number;
}) {
    const apiFilters: Record<string, string | number | boolean> = { deleted_at: 'is.null' };

    if (filters?.is_active !== undefined) apiFilters.is_active = `eq.${filters.is_active}`;

    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session: session } }) => {
            setEnabled(!!session);
        });
    }, []);

    return useList<AgentRow, AgentApiRow>({
        queryKey: queryKeys.agents(filters),
        path: AGENTS_PATH,
        select: '*',
        filters: apiFilters,
        page: filters?.page ?? 1,
        pageSize: filters?.pageSize ?? 20,
        orderBy: 'sort_order',
        ascending: true,
        transform: toRow,
        enabled,
    });
}

export function useAgent(id: string | null) {
    return useItem<AgentRow>(queryKeys.agent(id ?? ''), AGENTS_PATH, id, !!id);
}

export function useFetchDeletedAgents() {
    return useList<AgentRow, AgentApiRow>({
        queryKey: queryKeys.agents({ deleted: true }),
        path: AGENTS_PATH,
        select: '*,leads(count)',
        filters: { deleted_at: 'not.is.null' },
        page: 1,
        pageSize: 50,
        orderBy: 'deleted_at',
        ascending: false,
        transform: toRow,
    });
}

// ============================================================
// Mutation Hooks - CRUD
// ============================================================

export function useCreateAgent() {
    return useCreate<AgentRow, AgentFormValues>(queryKeys.agents(), AGENTS_PATH, {
        invalidateKeys: [['agents']],
    });
}

export function useUpdateAgent() {
    return useUpdate<AgentRow, AgentFormValues>(queryKeys.agents(), AGENTS_PATH, {
        invalidateKeys: [['agents']],
    });
}

export function useDeleteAgent() {
    return useDelete(queryKeys.agents(), AGENTS_PATH, {
        invalidateKeys: [['agents']],
    });
}

// ============================================================
// Mutation Hooks - Photo Upload
// ============================================================

export function useAgentPhoto() {
    return useUpload('agent-photos');
}

export function useUploadAgentPhoto() {
    return useMutation({
        mutationFn: async (file: File) => {
            return uploadAgentPhoto(file);
        },
    });
}

export function useDeleteAgentPhoto() {
    return useMutation({
        mutationFn: async (url: string) => {
            return deleteAgentPhoto(url);
        },
    });
}

// ============================================================
// Mutation Hooks - Toggle Active
// ============================================================

export function useToggleAgentActive() {
    return useMutation({
        mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
            const { error } = await supabase.from('agents').update({ is_active }).eq('id', id);
            if (error) throw new Error(error.message);
        },
    });
}

// ============================================================
// Mutation Hooks - Permissions
// ============================================================

export function useUpdateAgentPermissions() {
    return useMutation({
        mutationFn: async ({
            id,
            permissions,
        }: {
            id: string;
            permissions: Partial<AgentPermissions>;
        }) => {
            return updateAgentPermissions(id, permissions);
        },
    });
}

// ============================================================
// Mutation Hooks - Commission
// ============================================================

export function useUpdateAgentCommission() {
    return useMutation({
        mutationFn: async ({
            id,
            commission,
        }: {
            id: string;
            commission: Partial<AgentCommission>;
        }) => {
            return updateAgentCommission(id, commission);
        },
    });
}

export function useCalculateCommission() {
    return useMutation({
        mutationFn: async ({
            agentId,
            operationType,
            amount,
        }: {
            agentId: string;
            operationType: 'sale' | 'rental';
            amount: number;
        }) => {
            return calculateCommission(agentId, operationType, amount);
        },
    });
}

// ============================================================
// Mutation Hooks - Schedule
// ============================================================

export function useUpdateAgentSchedule() {
    return useMutation({
        mutationFn: async ({ id, schedule }: { id: string; schedule: AgentSchedule[] }) => {
            return updateAgentSchedule(id, schedule);
        },
    });
}

// ============================================================
// Mutation Hooks - Availability
// ============================================================

export function useAgentAvailability(agentId: string | null) {
    return useList<AgentAvailability>({
        queryKey: queryKeys.agents([{ availability: agentId }]),
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
    >(queryKeys.agents([{ availability: '' }]), 'agent_availability', {
        invalidateKeys: [['agents']],
    });
}

export function useUpdateAgentAvailability() {
    return useUpdate<AgentAvailability, Partial<AgentAvailability>>(
        queryKeys.agents([{ availability: '' }]),
        'agent_availability',
        {
            invalidateKeys: [['agents']],
        },
    );
}

export function useDeleteAgentAvailability() {
    return useDelete(queryKeys.agents([{ availability: '' }]), 'agent_availability', {
        invalidateKeys: [['agents']],
    });
}

// ============================================================
// Mutation Hooks - Soft Delete & Restore
// ============================================================

export function useSoftDeleteAgent() {
    return useMutation({
        mutationFn: async (id: string) => {
            return softDeleteAgent(id);
        },
    });
}

export function useRestoreAgent() {
    return useMutation({
        mutationFn: async (id: string) => {
            return restoreAgent(id);
        },
    });
}

export function usePermanentDeleteAgent() {
    return useMutation({
        mutationFn: async (id: string) => {
            return permanentDeleteAgent(id);
        },
    });
}

// ============================================================
// Export
// ============================================================

export const AGENT_EXPORT_COLUMNS: ExportColumn<AgentRow>[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Teléfono', format: (v) => String(v ?? '—') },
    { key: 'matricula', label: 'Matrícula', format: (v) => String(v ?? '—') },
    { key: 'role', label: 'Rol', format: (v) => String(v ?? '—') },
    { key: 'is_active', label: 'Activo', format: (v) => (v ? 'Sí' : 'No') },
    { key: 'lead_count', label: 'Leads asignados' },
    { key: 'sort_order', label: 'Orden' },
    {
        key: 'created_at',
        label: 'Creado',
        format: (v) => (v ? new Date(v as string).toLocaleDateString('es-AR') : '—'),
    },
];

export function useExportAgents() {
    const { exportToCSV } = useExport<AgentRow>();
    const agents = useAgents({ pageSize: 1000 });

    return {
        exportToCSV: async (filename = 'agentes') => {
            if (agents.data?.data) {
                await exportToCSV({
                    data: agents.data.data,
                    columns: AGENT_EXPORT_COLUMNS,
                    filename,
                });
            }
        },
        isLoading: agents.isPending,
    };
}

// ============================================================
// Export Direct Functions (for components that don't use hooks)
// ============================================================

export {
    fetchAgents,
    fetchAgent,
    fetchDeletedAgents,
    createAgent,
    updateAgent,
    softDeleteAgent,
    restoreAgent,
    permanentDeleteAgent,
    updateAgentPermissions,
    updateAgentCommission,
    updateAgentSchedule,
    calculateCommission,
    uploadAgentPhoto,
    deleteAgentPhoto,
    toRow,
    toFormValues,
};

// ============================================================
// Re-export
// ============================================================

export { queryKeys };
export type {
    AgentRow,
    AgentFormValues,
    AgentPermissions,
    AgentCommission,
    AgentSchedule,
    AgentAvailability,
};
export { DEFAULT_PERMISSIONS, DEFAULT_COMMISSION, DEFAULT_SCHEDULE, DAY_LABELS };
