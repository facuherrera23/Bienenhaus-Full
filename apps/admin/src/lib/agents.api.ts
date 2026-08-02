import { useList, useItem, useCreate, useUpdate, useDelete, useMutation, useUpload, useExport, queryKeys, type ExportColumn } from './api';
import type {
  AgentRow,
  AgentFormValues,
  AgentPermissions,
  AgentCommission,
  AgentSchedule,
  AgentAvailability,
} from '../types/agents';
import {
  DEFAULT_PERMISSIONS,
  DEFAULT_COMMISSION,
  DEFAULT_SCHEDULE,
  DAY_LABELS,
} from '../types/agents';
import {
  updateAgentPermissions,
  updateAgentCommission,
  updateAgentSchedule,
  calculateCommission,
  softDeleteAgent,
  restoreAgent,
} from './agents';
import { supabase } from '../lib/supabase';

const AGENTS_PATH = 'agents';

export function useAgents(filters?: {
  is_active?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const apiFilters: Record<string, any> = { deleted_at: 'is.null' };

  if (filters?.is_active !== undefined) apiFilters.is_active = `eq.${filters.is_active}`;

  return useList<AgentRow>({
    queryKey: queryKeys.agents(filters),
    path: AGENTS_PATH,
    select: '*,leads(count)',
    filters: apiFilters,
    page: filters?.page ?? 1,
    pageSize: filters?.pageSize ?? 20,
    orderBy: 'sort_order',
    ascending: true,
  });
}

export function useAgent(id: string | null) {
  return useItem<AgentRow>(
    queryKeys.agent(id ?? ''),
    AGENTS_PATH,
    id,
    !!id
  );
}

export function useCreateAgent() {
  return useCreate<AgentRow, AgentFormValues>(
    queryKeys.agents(),
    AGENTS_PATH,
    {
      invalidateKeys: [queryKeys.agents()],
    }
  );
}

export function useUpdateAgent() {
  return useUpdate<AgentRow, AgentFormValues>(
    queryKeys.agents(),
    AGENTS_PATH,
    {
      invalidateKeys: [queryKeys.agents()],
    }
  );
}

export function useDeleteAgent() {
  return useDelete(
    queryKeys.agents(),
    AGENTS_PATH,
    {
      invalidateKeys: [queryKeys.agents()],
    }
  );
}

export function useAgentPhoto() {
  return useUpload('agent-photos');
}

// ==================== CUSTOM MUTATIONS ====================

export function useToggleAgentActive() {
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('agents').update({ is_active }).eq('id', id);
      if (error) throw new Error(error.message);
    },
  });
}

export function useUpdateAgentPermissions() {
  return useMutation({
    mutationFn: async ({ id, permissions }: { id: string; permissions: Partial<AgentPermissions> }) => {
      return updateAgentPermissions(id, permissions);
    },
  });
}

export function useUpdateAgentCommission() {
  return useMutation({
    mutationFn: async ({ id, commission }: { id: string; commission: Partial<AgentCommission> }) => {
      return updateAgentCommission(id, commission);
    },
  });
}

export function useUpdateAgentSchedule() {
  return useMutation({
    mutationFn: async ({ id, schedule }: { id: string; schedule: AgentSchedule[] }) => {
      return updateAgentSchedule(id, schedule);
    },
  });
}

export function useCalculateCommission() {
  return useMutation({
    mutationFn: async ({ agentId, operationType, amount }: { agentId: string; operationType: 'sale' | 'rental'; amount: number }) => {
      return calculateCommission(agentId, operationType, amount);
    },
  });
}

// ==================== AVAILABILITY ====================

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
  return useCreate<AgentAvailability, Omit<AgentAvailability, 'id' | 'created_at' | 'updated_at'>>(
    queryKeys.agents([{ availability: '' }]),
    'agent_availability',
    {
      invalidateKeys: [queryKeys.agents([{ availability: '' }])],
    }
  );
}

export function useUpdateAgentAvailability() {
  return useUpdate<AgentAvailability, Partial<AgentAvailability>>(
    queryKeys.agents([{ availability: '' }]),
    'agent_availability',
    {
      invalidateKeys: [queryKeys.agents([{ availability: '' }])],
    }
  );
}

export function useDeleteAgentAvailability() {
  return useDelete(
    queryKeys.agents([{ availability: '' }]),
    'agent_availability',
    {
      invalidateKeys: [queryKeys.agents([{ availability: '' }])],
    }
  );
}

// ==================== SOFT DELETE ====================

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

export function useFetchDeletedAgents() {
  return useList<AgentRow>({
    queryKey: queryKeys.agents({ deleted: true }),
    path: AGENTS_PATH,
    select: '*,leads(count)',
    filters: { deleted_at: 'not.is.null' },
    page: 1,
    pageSize: 50,
    orderBy: 'deleted_at',
    ascending: false,
  });
}

// ==================== EXPORT ====================

export const AGENT_EXPORT_COLUMNS: ExportColumn<AgentRow>[] = [
  { key: 'name', label: 'Nombre' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Teléfono', format: (v) => v ?? '—' },
  { key: 'matricula', label: 'Matrícula', format: (v) => v ?? '—' },
  { key: 'role', label: 'Rol', format: (v) => v ?? '—' },
  { key: 'is_active', label: 'Activo', format: (v) => v ? 'Sí' : 'No' },
  { key: 'lead_count', label: 'Leads asignados' },
  { key: 'sort_order', label: 'Orden' },
  { key: 'created_at', label: 'Creado', format: (v) => v ? new Date(v).toLocaleDateString('es-AR') : '—' },
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

export { queryKeys };
export type { AgentRow, AgentFormValues, AgentPermissions, AgentCommission, AgentSchedule, AgentAvailability };
export { DEFAULT_PERMISSIONS, DEFAULT_COMMISSION, DEFAULT_SCHEDULE, DAY_LABELS };