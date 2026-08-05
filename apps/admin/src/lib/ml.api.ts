import { useList as useListHook, useMutation, useRpc, useExport, queryKeys, type ExportColumn, type ListOptions } from './api';
import { useQuery } from '@tanstack/react-query';
import type {
  MlOperation,
  MlSyncStatus,
  MlConnectionInfo,
  MlOverview,
  MlSettings,
  MlQueueRow,
  MlMetaRow,
  MlCategory,
  MlListingType,
  MlQuestion,
  MlOrder,
  MlMetrics,
  MlItemMetrics,
  MlAutoReplyTemplate,
} from '../types/ml';
import {
  ML_OPERATION_LABEL,
  ML_SYNC_STATUS_LABEL,
  ML_SYNC_STATUS_TONE,
} from '../types/ml';
import {
  fetchMlOverview,
  fetchMlSettings,
  fetchMlQueue,
  fetchMlMeta,
  fetchMlCategories,
  fetchMlListingTypes,
  fetchMlQuestions,
  fetchMlOrders,
  fetchMlMetrics,
  fetchMlAutoReplyTemplates,
  createMlAutoReplyTemplate,
  updateMlAutoReplyTemplate,
  deleteMlAutoReplyTemplate,
  answerMlQuestion,
  setMlEnabled,
  setMlAppId,
  setMlDefaults,
  buildAuthorizeUrl,
  disconnectMl,
  embedProperty,
  type QueueApiRow,
  type MetaApiRow,
} from './ml';

// ============================================================
// Wrapper para useList (bypassa problemas de resolución de tipos)
// ============================================================

function useListMl<T>(options: ListOptions<T>) {
  return useListHook<T>(options);
}

// ============================================================
// Mappers (inline para evitar dependencias circulares)
// ============================================================

function toMlQueueRow(q: QueueApiRow): MlQueueRow {
  const prop = embedProperty(q.property);
  return {
    id: q.id,
    property_id: q.property_id,
    operation: q.operation,
    status: q.status,
    attempts: q.attempts,
    max_attempts: q.max_attempts,
    next_attempt_at: q.next_attempt_at,
    ml_item_id: q.ml_item_id,
    last_error: q.last_error,
    created_at: q.created_at,
    property_title: prop.title,
    property_code: prop.code,
  };
}

function toMlMetaRow(m: MetaApiRow): MlMetaRow {
  const prop = embedProperty(m.property);
  return {
    property_id: m.property_id,
    ml_item_id: m.ml_item_id,
    status: m.status,
    permalink: m.permalink,
    price: m.price === null ? null : Number(m.price),
    last_sync_at: m.last_sync_at,
    last_sync_status: m.last_sync_status,
    property_title: prop.title,
    property_code: prop.code,
  };
}

// ============================================================
// Query Hooks
// ============================================================

export function useMlOverview() {
  return useRpc<MlOverview, Record<string, never>>('ml_get_connection');
}

export function useMlSettings() {
  return useQuery({
    queryKey: ['ml-settings'],
    queryFn: () => fetchMlSettings(),
  });
}

export function useMlQueue(filters?: {
  status?: MlSyncStatus;
  operation?: MlOperation;
  page?: number;
  pageSize?: number;
}) {
  const apiFilters: Record<string, unknown> = {};

  if (filters?.status) apiFilters.status = `eq.${filters.status}`;
  if (filters?.operation) apiFilters.operation = `eq.${filters.operation}`;

  return useListHook<MlQueueRow, QueueApiRow>({
    queryKey: queryKeys.mlQueue(filters),
    path: 'ml_sync_queue',
    select: 'id,property_id,operation,status,attempts,max_attempts,next_attempt_at,ml_item_id,last_error,created_at,property:properties(title,code)',
    filters: apiFilters,
    page: filters?.page ?? 1,
    pageSize: filters?.pageSize ?? 50,
    orderBy: 'created_at',
    ascending: false,
    transform: toMlQueueRow,
  });
}

export function useMlMeta(filters?: {
  property_id?: string;
  page?: number;
  pageSize?: number;
}) {
  const apiFilters: Record<string, unknown> = {};

  if (filters?.property_id) apiFilters.property_id = `eq.${filters.property_id}`;

  return useListHook<MlMetaRow, MetaApiRow>({
    queryKey: queryKeys.mlMeta(filters),
    path: 'property_ml_meta',
    select: 'property_id,ml_item_id,status,permalink,price,last_sync_at,last_sync_status,property:properties(title,code)',
    filters: apiFilters,
    page: filters?.page ?? 1,
    pageSize: filters?.pageSize ?? 100,
    orderBy: 'last_sync_at',
    ascending: false,
    transform: toMlMetaRow,
  });
}

// ============================================================
// Query Hooks - Questions & Orders
// ============================================================

export function useMlQuestions(filters?: {
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const apiFilters: Record<string, unknown> = {};

  if (filters?.status) apiFilters.status = `eq.${filters.status}`;

  return useListMl<MlQuestion>({
    queryKey: queryKeys.mlQuestions(filters),
    path: 'ml_questions',
    select: '*',
    filters: apiFilters,
    page: filters?.page ?? 1,
    pageSize: filters?.pageSize ?? 50,
    orderBy: 'received_at',
    ascending: false,
  });
}

export function useMlOrders(filters?: {
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const apiFilters: Record<string, unknown> = {};

  if (filters?.status) apiFilters.status = `eq.${filters.status}`;

  return useListMl<MlOrder>({
    queryKey: queryKeys.mlOrders(filters),
    path: 'ml_orders',
    select: '*',
    filters: apiFilters,
    page: filters?.page ?? 1,
    pageSize: filters?.pageSize ?? 50,
    orderBy: 'received_at',
    ascending: false,
  });
}

// ============================================================
// Query Hooks - Categories & Listing Types
// ============================================================

export function useMlCategories() {
  return useQuery({
    queryKey: ['ml-categories'],
    queryFn: () => fetchMlCategories(),
  });
}

export function useMlListingTypes() {
  return useQuery({
    queryKey: ['ml-listing-types'],
    queryFn: () => fetchMlListingTypes(),
  });
}

// ============================================================
// Query Hooks - Metrics
// ============================================================

export function useMlMetrics() {
  return useQuery({
    queryKey: ['ml-metrics'],
    queryFn: () => fetchMlMetrics(),
  });
}

// ============================================================
// Query Hooks - Auto Reply Templates
// ============================================================

export function useMlAutoReplyTemplates() {
  return useListMl<MlAutoReplyTemplate>({
    queryKey: queryKeys.mlTemplates(),
    path: 'ml_auto_reply_templates',
    select: '*',
    filters: {},
    page: 1,
    pageSize: 50,
    orderBy: 'created_at',
    ascending: false,
  });
}

export function useCreateMlAutoReplyTemplate() {
  return useMutation({
    mutationFn: async (template: Omit<MlAutoReplyTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      return createMlAutoReplyTemplate(template);
    },
  });
}

export function useUpdateMlAutoReplyTemplate() {
  return useMutation({
    mutationFn: async ({ id, template }: { id: number; template: Partial<MlAutoReplyTemplate> }) => {
      return updateMlAutoReplyTemplate(id, template);
    },
  });
}

export function useDeleteMlAutoReplyTemplate() {
  return useMutation({
    mutationFn: async (id: number) => {
      return deleteMlAutoReplyTemplate(id);
    },
  });
}

// ============================================================
// Mutation Hooks - Actions
// ============================================================

export function useAnswerMlQuestion() {
  return useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string; answer: string }) => {
      return answerMlQuestion(questionId, answer);
    },
  });
}

// ============================================================
// Mutation Hooks - Settings
// ============================================================

export function useSetMlEnabled() {
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      return setMlEnabled(enabled);
    },
  });
}

export function useSetMlAppId() {
  return useMutation({
    mutationFn: async (appId: string) => {
      return setMlAppId(appId);
    },
  });
}

export function useSetMlDefaults() {
  return useMutation({
    mutationFn: async (defaults: { category_id: string; listing_type_id: string; condition: string }) => {
      return setMlDefaults(defaults);
    },
  });
}

export function useBuildAuthorizeUrl() {
  return useMutation({
    mutationFn: async (appId: string) => {
      return buildAuthorizeUrl(appId);
    },
  });
}

export function useDisconnectMl() {
  return useMutation({
    mutationFn: async () => {
      return disconnectMl();
    },
  });
}

// ============================================================
// Export
// ============================================================

export const ML_QUEUE_EXPORT_COLUMNS: ExportColumn<MlQueueRow>[] = [
  { key: 'id', label: 'ID' },
  { key: 'property_title', label: 'Propiedad', format: (v) => v ?? '—' },
  { key: 'property_code', label: 'Código', format: (v) => v ?? '—' },
  { key: 'operation', label: 'Operación', format: (v) => ML_OPERATION_LABEL[v as MlOperation] ?? v },
  { key: 'status', label: 'Estado', format: (v) => ML_SYNC_STATUS_LABEL[v as MlSyncStatus] ?? v },
  { key: 'attempts', label: 'Intentos', format: (v, row) => `${v}/${(row as MlQueueRow).max_attempts}` },
  { key: 'ml_item_id', label: 'Item ML', format: (v) => v ?? '—' },
  { key: 'last_error', label: 'Último error', format: (v) => v ?? '—' },
  { key: 'created_at', label: 'Creado', format: (v) => v ? new Date(v).toLocaleDateString('es-AR') : '—' },
];

export const ML_META_EXPORT_COLUMNS: ExportColumn<MlMetaRow>[] = [
  { key: 'property_title', label: 'Propiedad', format: (v) => v ?? '—' },
  { key: 'property_code', label: 'Código', format: (v) => v ?? '—' },
  { key: 'ml_item_id', label: 'Item ML', format: (v) => v ?? '—' },
  { key: 'status', label: 'Estado' },
  { key: 'permalink', label: 'Link ML', format: (v) => v ?? '—' },
  { key: 'price', label: 'Precio ML', format: (v) => v ? `${v.toLocaleString('es-AR')}` : '—' },
  { key: 'last_sync_at', label: 'Última sync', format: (v) => v ? new Date(v).toLocaleDateString('es-AR') : '—' },
  { key: 'last_sync_status', label: 'Estado sync', format: (v) => ML_SYNC_STATUS_LABEL[v as MlSyncStatus] ?? v },
];

export function useExportMlQueue() {
  const { exportToCSV } = useExport<MlQueueRow>();
  const queue = useMlQueue({ pageSize: 1000 });

  return {
    exportToCSV: async (filename = 'ml-queue') => {
      if (queue.data?.data) {
        await exportToCSV({
          data: queue.data.data,
          columns: ML_QUEUE_EXPORT_COLUMNS,
          filename,
        });
      }
    },
    isLoading: queue.isPending,
  };
}

export function useExportMlMeta() {
  const { exportToCSV } = useExport<MlMetaRow>();
  const meta = useMlMeta({ pageSize: 1000 });

  return {
    exportToCSV: async (filename = 'ml-meta') => {
      if (meta.data?.data) {
        await exportToCSV({
          data: meta.data.data,
          columns: ML_META_EXPORT_COLUMNS,
          filename,
        });
      }
    },
    isLoading: meta.isPending,
  };
}

// ============================================================
// Export Direct Functions (for components that don't use hooks)
// ============================================================

export {
  fetchMlOverview,
  fetchMlSettings,
  fetchMlQueue,
  fetchMlMeta,
  fetchMlCategories,
  fetchMlListingTypes,
  fetchMlQuestions,
  fetchMlOrders,
  fetchMlMetrics,
  fetchMlAutoReplyTemplates,
  createMlAutoReplyTemplate,
  updateMlAutoReplyTemplate,
  deleteMlAutoReplyTemplate,
  answerMlQuestion,
  setMlEnabled,
  setMlAppId,
  setMlDefaults,
  buildAuthorizeUrl,
  disconnectMl,
  embedProperty,
};

// ============================================================
// Re-export
// ============================================================

export { queryKeys };
export type {
  MlOperation,
  MlSyncStatus,
  MlConnectionInfo,
  MlOverview,
  MlSettings,
  MlQueueRow,
  MlMetaRow,
  MlCategory,
  MlListingType,
  MlQuestion,
  MlOrder,
  MlMetrics,
  MlItemMetrics,
  MlAutoReplyTemplate,
};
export { ML_OPERATION_LABEL, ML_SYNC_STATUS_LABEL, ML_SYNC_STATUS_TONE };
export type { QueueApiRow, MetaApiRow };