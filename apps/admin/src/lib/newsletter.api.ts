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
    NEWSLETTER_SOURCE_LABEL,
    NEWSLETTER_STATUS_LABEL,
    type NewsletterSource,
    type NewsletterStatus,
    type NewsletterSubscriber,
} from '../types/newsletter';
import {
    bulkCreateSubscribers,
    bulkDeleteSubscribers,
    bulkUpdateSubscribers,
    countSubscribers,
    createSubscriber,
    deleteSubscriber,
    exportSubscribersToCSV,
    fetchDeletedSubscribers,
    fetchSubscriber,
    fetchSubscribers,
    restoreSubscriber,
    subscribeFromLanding,
    unsubscribeSubscriber,
    updateSubscriber,
} from './newsletter';

const NEWSLETTER_PATH = 'newsletter_subscribers';

// ============================================================
// Query Hooks
// ============================================================

export function useSubscribers(filters?: {
    status?: NewsletterStatus;
    source?: NewsletterSource;
    search?: string;
    page?: number;
    pageSize?: number;
}) {
    const apiFilters: Record<string, string | number | boolean | undefined> = {
        deleted_at: 'is.null',
    };

    if (filters?.status) apiFilters.status = `eq.${filters.status}`;
    if (filters?.source) apiFilters.source = `eq.${filters.source}`;
    if (filters?.search) apiFilters.email = `ilike.*${filters.search}*`;

    return useList<NewsletterSubscriber>({
        queryKey: queryKeys.leads([{ newsletter: filters }]),
        path: NEWSLETTER_PATH,
        select: 'id,email,source,status,created_at',
        filters: apiFilters,
        page: filters?.page ?? 1,
        pageSize: filters?.pageSize ?? 20,
        orderBy: 'created_at',
        ascending: false,
    });
}

export function useSubscriber(id: string | null) {
    return useItem<NewsletterSubscriber>(
        queryKeys.leads([{ newsletter: id }]),
        NEWSLETTER_PATH,
        id,
        !!id,
    );
}

export function useFetchDeletedSubscribers() {
    return useList<NewsletterSubscriber>({
        queryKey: queryKeys.leads([{ newsletter: { deleted: true } }]),
        path: NEWSLETTER_PATH,
        select: 'id,email,source,status,created_at',
        filters: { deleted_at: 'not.is.null' },
        page: 1,
        pageSize: 50,
        orderBy: 'deleted_at',
        ascending: false,
    });
}

export function useCountSubscribers(options?: {
    status?: NewsletterStatus;
    source?: NewsletterSource;
    includeDeleted?: boolean;
}) {
    return useMutation({
        mutationFn: async () => {
            return countSubscribers(options);
        },
    });
}

// ============================================================
// Mutation Hooks - CRUD
// ============================================================

export function useCreateSubscriber() {
    return useCreate<NewsletterSubscriber, Partial<NewsletterSubscriber>>(
        queryKeys.leads([{ newsletter: true }]),
        NEWSLETTER_PATH,
        {
            invalidateKeys: [queryKeys.leads([{ newsletter: true }])],
        },
    );
}

export function useUpdateSubscriber() {
    return useUpdate<NewsletterSubscriber, Partial<NewsletterSubscriber>>(
        queryKeys.leads([{ newsletter: true }]),
        NEWSLETTER_PATH,
        {
            invalidateKeys: [queryKeys.leads([{ newsletter: true }])],
        },
    );
}

export function useDeleteSubscriber() {
    return useDelete(queryKeys.leads([{ newsletter: true }]), NEWSLETTER_PATH, {
        invalidateKeys: [queryKeys.leads([{ newsletter: true }])],
    });
}

// ============================================================
// Mutation Hooks - Soft Delete & Restore
// ============================================================

export function useSoftDeleteSubscriber() {
    return useMutation({
        mutationFn: async (id: string) => {
            return deleteSubscriber(id, false);
        },
    });
}

export function usePermanentDeleteSubscriber() {
    return useMutation({
        mutationFn: async (id: string) => {
            return deleteSubscriber(id, true);
        },
    });
}

export function useRestoreSubscriber() {
    return useMutation({
        mutationFn: async (id: string) => {
            return restoreSubscriber(id);
        },
    });
}

// ============================================================
// Mutation Hooks - Bulk Operations
// ============================================================

export function useBulkCreateSubscribers() {
    return useMutation({
        mutationFn: async ({ emails, source }: { emails: string[]; source?: NewsletterSource }) => {
            return bulkCreateSubscribers(emails, source);
        },
    });
}

export function useBulkUpdateSubscribers() {
    return useMutation({
        mutationFn: async ({
            ids,
            params,
        }: {
            ids: string[];
            params: { status?: NewsletterStatus; source?: NewsletterSource };
        }) => {
            return bulkUpdateSubscribers(ids, params);
        },
    });
}

export function useBulkDeleteSubscribers() {
    return useMutation({
        mutationFn: async ({ ids, permanent }: { ids: string[]; permanent?: boolean }) => {
            return bulkDeleteSubscribers(ids, permanent ?? false);
        },
    });
}

// ============================================================
// Mutation Hooks - Landing/Webhook
// ============================================================

export function useSubscribeFromLanding() {
    return useMutation({
        mutationFn: async ({ email, source }: { email: string; source?: NewsletterSource }) => {
            return subscribeFromLanding({ email, source });
        },
    });
}

export function useUnsubscribeSubscriber() {
    return useMutation({
        mutationFn: async (email: string) => {
            return unsubscribeSubscriber(email);
        },
    });
}

// ============================================================
// Export
// ============================================================

export const SUBSCRIBER_EXPORT_COLUMNS: ExportColumn<NewsletterSubscriber>[] = [
    { key: 'email', label: 'Email' },
    {
        key: 'source',
        label: 'Origen',
        format: (v) => NEWSLETTER_SOURCE_LABEL[v as NewsletterSource] ?? v,
    },
    {
        key: 'status',
        label: 'Estado',
        format: (v) => NEWSLETTER_STATUS_LABEL[v as NewsletterStatus] ?? v,
    },
    {
        key: 'created_at',
        label: 'Creado',
        format: (v) => (v ? new Date(v as string).toLocaleDateString('es-AR') : '—'),
    },
];

export function useExportSubscribers() {
    const { exportToCSV } = useExport<NewsletterSubscriber>();
    const subscribers = useSubscribers({ pageSize: 1000 });

    return {
        exportToCSV: async (filename = 'newsletter') => {
            if (subscribers.data?.data) {
                await exportToCSV({
                    data: subscribers.data.data,
                    columns: SUBSCRIBER_EXPORT_COLUMNS,
                    filename,
                });
            }
        },
        isLoading: subscribers.isPending,
    };
}

// ============================================================
// Export Direct Functions (for components that don't use hooks)
// ============================================================

export {
    fetchSubscribers,
    fetchSubscriber,
    fetchDeletedSubscribers,
    createSubscriber,
    updateSubscriber,
    deleteSubscriber,
    restoreSubscriber,
    countSubscribers,
    bulkCreateSubscribers,
    bulkUpdateSubscribers,
    bulkDeleteSubscribers,
    exportSubscribersToCSV,
    subscribeFromLanding,
    unsubscribeSubscriber,
};

// ============================================================
// Re-export
// ============================================================

export { queryKeys };
export type { NewsletterSource, NewsletterStatus, NewsletterSubscriber };
export { NEWSLETTER_SOURCE_LABEL, NEWSLETTER_STATUS_LABEL };
