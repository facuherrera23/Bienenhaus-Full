import {
    type ExportColumn,
    queryKeys,
    useExport,
    useList as useListHook,
    useMutation,
    useRpc,
} from './api';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
    ML_OPERATION_LABEL,
    ML_SYNC_STATUS_LABEL,
    ML_SYNC_STATUS_TONE,
    type MlAutoReplyTemplate,
    type MlCategory,
    type MlConnectionInfo,
    type MlDeadLetterRow,
    type MlItemMetrics,
    type MlListingType,
    type MlMetaRow,
    type MlMetrics,
    type MlOperation,
    type MlOrder,
    type MlOverview,
    type MlQuestion,
    type MlQueueRow,
    type MlSettings,
    type MlSyncStatus,
} from '../types/ml';
import {
    answerMlQuestion,
    buildAuthorizeUrl,
    createMlAutoReplyTemplate,
    deleteDeadLetter,
    deleteMlAutoReplyTemplate,
    disconnectMl,
    embedProperty,
    fetchMlAutoReplyTemplates,
    fetchMlCategories,
    fetchMlDeadLetter,
    fetchMlListingTypes,
    fetchMlMeta,
    fetchMlMetaInfinite,
    fetchMlMetrics,
    fetchMlOrders,
    fetchMlOverview,
    fetchMlQuestions,
    fetchMlQuestionsInfinite,
    fetchMlQueue,
    fetchMlQueueInfinite,
    fetchMlSettings,
    type MetaApiRow,
    type QueueApiRow,
    retryDeadLetter,
    revokeMlTokens,
    setMlAppId,
    setMlDefaults,
    setMlEnabled,
    toMlMetaRow,
    toMlQueueRow,
    updateMlAutoReplyTemplate,
} from './ml';

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
    const apiFilters: Record<string, string | number | boolean | undefined> = { deleted_at: 'is.null' };

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

export function useMlQueueInfinite(filters?: { status?: MlSyncStatus; operation?: MlOperation; pageSize?: number }) {
    return useInfiniteQuery({
        queryKey: ['ml-queue-infinite', filters],
        queryFn: ({ pageParam = 1 }) => fetchMlQueueInfinite(pageParam, filters?.pageSize ?? 50),
        getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.page + 1 : undefined,
        initialPageParam: 1,
    });
}

export function useMlMeta(filters?: { property_id?: string; page?: number; pageSize?: number }) {
    const apiFilters: Record<string, string | number | boolean | undefined> = {};

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

export function useMlMetaInfinite(filters?: { property_id?: string; pageSize?: number }) {
    return useInfiniteQuery({
        queryKey: ['ml-meta-infinite', filters],
        queryFn: ({ pageParam = 1 }) => fetchMlMetaInfinite(pageParam, filters?.pageSize ?? 100),
        getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.page + 1 : undefined,
        initialPageParam: 1,
    });
}

// ============================================================
// Query Hooks - Questions & Orders
// ============================================================

export function useMlQuestions(filters?: { status?: string; page?: number; pageSize?: number }) {
    const apiFilters: Record<string, string | number | boolean | undefined> = {};

    if (filters?.status) apiFilters.status = `eq.${filters.status}`;

    return useListHook<MlQuestion>({
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

export function useMlQuestionsInfinite(filters?: { status?: string; pageSize?: number }) {
    return useInfiniteQuery({
        queryKey: ['ml-questions-infinite', filters],
        queryFn: ({ pageParam = 1 }) => fetchMlQuestionsInfinite(pageParam, filters?.pageSize ?? 50),
        getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.page + 1 : undefined,
        initialPageParam: 1,
    });
}

export function useMlOrders(filters?: { status?: string; page?: number; pageSize?: number }) {
    const apiFilters: Record<string, string | number | boolean | undefined> = {};

    if (filters?.status) apiFilters.status = `eq.${filters.status}`;

    return useListHook<MlOrder>({
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
    return useListHook<MlAutoReplyTemplate>({
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
        mutationFn: async (
            template: Omit<MlAutoReplyTemplate, 'id' | 'created_at' | 'updated_at'>,
        ) => {
            return createMlAutoReplyTemplate(template);
        },
    });
}

export function useUpdateMlAutoReplyTemplate() {
    return useMutation({
        mutationFn: async ({
            id,
            template,
        }: {
            id: number;
            template: Partial<MlAutoReplyTemplate>;
        }) => {
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
        mutationFn: async (defaults: {
            category_id: string;
            listing_type_id: string;
            condition: string;
        }) => {
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

export function useRevokeMlTokens() {
    return useMutation({
        mutationFn: async () => {
            return revokeMlTokens();
        },
    });
}

// ============================================================
// Query Hooks - Dead Letter Queue
// ============================================================

export function useMlDeadLetter(filters?: { status?: string; page?: number; pageSize?: number }) {
    return useQuery({
        queryKey: ['ml-dead-letter', filters],
        queryFn: () => fetchMlDeadLetter(filters),
    });
}

export function useMlDeadLetterInfinite(filters?: { status?: string; pageSize?: number }) {
    return useInfiniteQuery({
        queryKey: ['ml-dead-letter-infinite', filters],
        queryFn: ({ pageParam = 1 }) => fetchMlDeadLetter({ page: pageParam, pageSize: filters?.pageSize ?? 50 }),
        getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.page + 1 : undefined,
        initialPageParam: 1,
    });
}

export function useRetryDeadLetter() {
    return useMutation({
        mutationFn: async (id: number) => {
            return retryDeadLetter(id);
        },
    });
}

export function useDeleteDeadLetter() {
    return useMutation({
        mutationFn: async (id: number) => {
            return deleteDeadLetter(id);
        },
    });
}

// ============================================================
// Export
// ============================================================

export const ML_QUEUE_EXPORT_COLUMNS: ExportColumn<MlQueueRow>[] = [
    { key: 'id', label: 'ID' },
    { key: 'property_title', label: 'Propiedad', format: (v) => String(v ?? '—') },
    { key: 'property_code', label: 'Código', format: (v) => String(v ?? '—') },
    {
        key: 'operation',
        label: 'Operación',
        format: (v) => ML_OPERATION_LABEL[v as MlOperation] ?? v,
    },
    { key: 'status', label: 'Estado', format: (v) => ML_SYNC_STATUS_LABEL[v as MlSyncStatus] ?? v },
    {
        key: 'attempts',
        label: 'Intentos',
        format: (v, row) => `${v}/${(row as MlQueueRow).max_attempts}`,
    },
    { key: 'ml_item_id', label: 'Item ML', format: (v) => String(v ?? '—') },
    { key: 'last_error', label: 'Último error', format: (v) => String(v ?? '—') },
    {
        key: 'created_at',
        label: 'Creado',
        format: (v) => (v ? new Date(v as string).toLocaleDateString('es-AR') : '—'),
    },
];

export const ML_META_EXPORT_COLUMNS: ExportColumn<MlMetaRow>[] = [
    { key: 'property_title', label: 'Propiedad', format: (v) => String(v ?? '—') },
    { key: 'property_code', label: 'Código', format: (v) => String(v ?? '—') },
    { key: 'ml_item_id', label: 'Item ML', format: (v) => String(v ?? '—') },
    { key: 'status', label: 'Estado' },
    { key: 'permalink', label: 'Link ML', format: (v) => String(v ?? '—') },
    { key: 'price', label: 'Precio ML', format: (v) => (v ? (v as number).toLocaleString('es-AR') : '—') },
    {
        key: 'last_sync_at',
        label: 'Última sync',
        format: (v) => (v ? new Date(v as string).toLocaleDateString('es-AR') : '—'),
    },
    {
        key: 'last_sync_status',
        label: 'Estado sync',
        format: (v) => ML_SYNC_STATUS_LABEL[v as MlSyncStatus] ?? v,
    },
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
    revokeMlTokens,
    fetchMlDeadLetter,
    retryDeadLetter,
    deleteDeadLetter,
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
    MlDeadLetterRow,
};
export { ML_OPERATION_LABEL, ML_SYNC_STATUS_LABEL, ML_SYNC_STATUS_TONE };
export type { QueueApiRow, MetaApiRow };