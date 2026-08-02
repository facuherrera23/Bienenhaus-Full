import { useList as useListHook, useMutation, useRpc, useExport, queryKeys, type ExportColumn, type ListOptions } from './api';
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
  fetchMlCategories,
  fetchMlListingTypes,
  fetchMlMetrics,
  createMlAutoReplyTemplate,
  updateMlAutoReplyTemplate,
  deleteMlAutoReplyTemplate,
  bulkEnqueueMl,
} from './ml';

// Wrapper que bypassa el problema de resolución de tipos de useList en este módulo
function useListMl<T>(options: ListOptions<T>) {
  return useListHook<T>(options);
}

export function useMlOverview() {
  return useRpc<MlOverview, Record<string, never>>('ml_get_connection');
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

  return useListMl<MlQueueRow>({
    queryKey: queryKeys.mlQueue(filters),
    path: 'ml_sync_queue',
    select: 'id,property_id,operation,status,attempts,max_attempts,next_attempt_at,ml_item_id,last_error,created_at,property:properties(title,code)',
    filters: apiFilters,
    page: filters?.page ?? 1,
    pageSize: filters?.pageSize ?? 50,
    orderBy: 'created_at',
    ascending: false,
  });
}

export function useMlMeta(filters?: {
  property_id?: string;
  page?: number;
  pageSize?: number;
}) {
  const apiFilters: Record<string, unknown> = {};

  if (filters?.property_id) apiFilters.property_id = `eq.${filters.property_id}`;

  return useListMl<MlMetaRow>({
    queryKey: queryKeys.mlMeta(filters),
    path: 'property_ml_meta',
    select: 'property_id,ml_item_id,status,permalink,price,last_sync_at,last_sync_status,property:properties(title,code)',
    filters: apiFilters,
    page: filters?.page ?? 1,
    pageSize: filters?.pageSize ?? 100,
    orderBy: 'last_sync_at',
    ascending: false,
  });
}

export function useMlCategories() {
  return useMutation({
    mutationFn: async () => {
      return fetchMlCategories();
    },
  });
}

export function useMlListingTypes() {
  return useMutation({
    mutationFn: async () => {
      return fetchMlListingTypes();
    },
  });
}

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

export function useMlMetrics() {
  return useMutation({
    mutationFn: async () => {
      return fetchMlMetrics();
    },
  });
}

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

// ==================== ACTIONS ====================

export function useEnqueueMl() {
  return useRpc<{ itemId: number; permalink: string }, { p_property_id: string; p_operation: MlOperation }>(
    'ml_enqueue',
    {
      onSuccess: (data) => {
        console.log('ML enqueue result:', data);
      },
    }
  );
}

export function useBulkEnqueueMl() {
  return useMutation({
    mutationFn: async ({ propertyIds, operation }: { propertyIds: string[]; operation: MlOperation }) => {
      return bulkEnqueueMl(propertyIds, operation);
    },
  });
}

export function useSyncNow() {
  return useMutation({
    mutationFn: async () => {
      const { syncNow } = await import('./ml');
      return syncNow();
    },
  });
}

export function useAnswerMlQuestion() {
  return useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string; answer: string }) => {
      const { answerMlQuestion } = await import('./ml');
      return answerMlQuestion(questionId, answer);
    },
  });
}

export function useMlSettings() {
  return useMutation({
    mutationFn: async () => {
      const { fetchMlSettings } = await import('./ml');
      return fetchMlSettings();
    },
  });
}

export function useSetMlEnabled() {
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const { setMlEnabled } = await import('./ml');
      return setMlEnabled(enabled);
    },
  });
}

export function useSetMlAppId() {
  return useMutation({
    mutationFn: async (appId: string) => {
      const { setMlAppId } = await import('./ml');
      return setMlAppId(appId);
    },
  });
}

export function useSetMlDefaults() {
  return useMutation({
    mutationFn: async (defaults: { category_id: string; listing_type_id: string; condition: string }) => {
      const { setMlDefaults } = await import('./ml');
      return setMlDefaults(defaults);
    },
  });
}

export function useBuildAuthorizeUrl() {
  return useMutation({
    mutationFn: async (appId: string) => {
      const { buildAuthorizeUrl } = await import('./ml');
      return buildAuthorizeUrl(appId);
    },
  });
}

export function useDisconnectMl() {
  return useMutation({
    mutationFn: async () => {
      const { disconnectMl } = await import('./ml');
      return disconnectMl();
    },
  });
}

// ==================== EXPORT ====================

export const ML_QUEUE_EXPORT_COLUMNS: ExportColumn<MlQueueRow>[] = [
  { key: 'id', label: 'ID' },
  { key: 'property_title', label: 'Propiedad', format: (v) => v ?? '—' },
  { key: 'property_code', label: 'Código', format: (v) => v ?? '—' },
  { key: 'operation', label: 'Operación', format: (v) => ML_OPERATION_LABEL[v as MlOperation] ?? v },
  { key: 'status', label: 'Estado', format: (v) => ML_SYNC_STATUS_LABEL[v as MlSyncStatus] ?? v },
  { key: 'attempts', label: 'Intentos', format: (v) => `${v}/${v}` },
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

export { queryKeys };
export type { MlOperation, MlSyncStatus, MlConnectionInfo, MlOverview, MlSettings, MlQueueRow, MlMetaRow, MlCategory, MlListingType, MlQuestion, MlOrder, MlMetrics, MlItemMetrics, MlAutoReplyTemplate };
export { ML_OPERATION_LABEL, ML_SYNC_STATUS_LABEL, ML_SYNC_STATUS_TONE };