import { useList, useItem, useCreate, useUpdate, useDelete, useMutation, useExport, queryKeys, type ExportColumn } from './api';
import type {
  LeadStatus,
  LeadIntent,
  LeadSource,
  LeadRow,
  LeadDetail,
  LeadFormValues,
  LeadPatch,
  CsvLeadRow,
  AgentOption,
} from '../types/leads';
import {
  LEAD_STATUS_LABEL,
  LEAD_STATUS_TONE,
  LEAD_INTENT_LABEL,
  LEAD_SOURCE_LABEL,
  STATUS_ORDER,
} from '../types/leads';
import {
  bulkAutoAssignLeads,
  bulkRecalculateScores,
  addLeadTag,
  removeLeadTag,
  setLeadTags,
  bulkImportLeads,
  parseLeadsCsv,
  softDeleteLead,
  restoreLead,
} from './leads';

const LEADS_PATH = 'leads';

export function useLeads(filters?: {
  status?: LeadStatus;
  intent?: LeadIntent;
  source?: LeadSource;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const apiFilters: Record<string, any> = { deleted_at: 'is.null' };

  if (filters?.status) apiFilters.status = `eq.${filters.status}`;
  if (filters?.intent) apiFilters.intent = `eq.${filters.intent}`;
  if (filters?.source) apiFilters.source = `eq.${filters.source}`;
  if (filters?.search) apiFilters.or = `(name.ilike.*${filters.search}*,last_name.ilike.*${filters.search}*,email.ilike.*${filters.search}*,phone.ilike.*${filters.search}*)`;

  return useList<LeadRow>({
    queryKey: queryKeys.leads(filters),
    path: LEADS_PATH,
    select: 'id,name,last_name,email,phone,city,intent,message,source,status,created_at,updated_at,agent:agents(name),tags,score',
    filters: apiFilters,
    page: filters?.page ?? 1,
    pageSize: filters?.pageSize ?? 20,
    orderBy: 'created_at',
    ascending: false,
  });
}

export function useLead(id: string | null) {
  return useItem<LeadDetail>(
    queryKeys.lead(id ?? ''),
    LEADS_PATH,
    id,
    !!id
  );
}

export function useCreateLead() {
  return useCreate<LeadRow, LeadFormValues>(
    queryKeys.leads(),
    LEADS_PATH,
    {
      invalidateKeys: [queryKeys.leads()],
    }
  );
}

export function useUpdateLead() {
  return useUpdate<LeadRow, LeadPatch>(
    queryKeys.leads(),
    LEADS_PATH,
    {
      invalidateKeys: [queryKeys.leads()],
    }
  );
}

export function useDeleteLead() {
  return useDelete(
    queryKeys.leads(),
    LEADS_PATH,
    {
      invalidateKeys: [queryKeys.leads()],
    }
  );
}

// ==================== CUSTOM MUTATIONS ====================

export function useBulkAutoAssignLeads() {
  return useMutation({
    mutationFn: async (leadIds: string[]) => {
      return bulkAutoAssignLeads(leadIds);
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

export function useImportLeads() {
  return useMutation({
    mutationFn: async (leads: CsvLeadRow[]) => {
      return bulkImportLeads(leads);
    },
  });
}

export function useParseLeadsCsv() {
  return useMutation({
    mutationFn: async (csvText: string) => {
      return parseLeadsCsv(csvText);
    },
  });
}

// ==================== SOFT DELETE ====================

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

export function useFetchDeletedLeads() {
  return useList<LeadRow>({
    queryKey: queryKeys.leads({ deleted: true }),
    path: LEADS_PATH,
    select: '*',
    filters: { deleted_at: 'not.is.null' },
    page: 1,
    pageSize: 50,
    orderBy: 'deleted_at',
    ascending: false,
  });
}

// ==================== EXPORT ====================

export const LEAD_EXPORT_COLUMNS: ExportColumn<LeadRow>[] = [
  { key: 'name', label: 'Nombre' },
  { key: 'last_name', label: 'Apellido' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Teléfono', format: (v) => v ?? '—' },
  { key: 'city', label: 'Ciudad', format: (v) => v ?? '—' },
  { key: 'intent', label: 'Intención', format: (v) => LEAD_INTENT_LABEL[v as LeadIntent] ?? v },
  { key: 'source', label: 'Origen', format: (v) => LEAD_SOURCE_LABEL[v as LeadSource] ?? v },
  { key: 'status', label: 'Estado', format: (v) => LEAD_STATUS_LABEL[v as LeadStatus] ?? v },
  { key: 'score', label: 'Score', format: (v) => v ?? 0 },
  { key: 'tags', label: 'Tags', format: (v) => (v as string[])?.join('; ') ?? '' },
  { key: 'agent', label: 'Asignado', format: (v) => v ?? '—' },
  { key: 'created_at', label: 'Recibido', format: (v) => v ? new Date(v).toLocaleDateString('es-AR') : '—' },
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

export { queryKeys };
export type { LeadStatus, LeadIntent, LeadSource, LeadRow, LeadDetail, LeadFormValues, LeadPatch, CsvLeadRow, AgentOption };
export { LEAD_STATUS_LABEL, LEAD_STATUS_TONE, LEAD_INTENT_LABEL, LEAD_SOURCE_LABEL, STATUS_ORDER };