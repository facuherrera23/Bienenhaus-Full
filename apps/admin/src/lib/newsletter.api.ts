import { useList, useItem, useCreate, useUpdate, useDelete, useMutation, useExport, queryKeys, type ExportColumn } from './api';
import type {
  NewsletterSource,
  NewsletterStatus,
  NewsletterSubscriber,
} from '../types/newsletter';
import {
  NEWSLETTER_SOURCE_LABEL,
  NEWSLETTER_STATUS_LABEL,
} from '../types/newsletter';

const NEWSLETTER_PATH = 'newsletter_subscribers';

export function useSubscribers(filters?: {
  status?: NewsletterStatus;
  source?: NewsletterSource;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const apiFilters: Record<string, unknown> = { deleted_at: 'is.null' };

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
    !!id
  );
}

export function useCreateSubscriber() {
  return useCreate<NewsletterSubscriber, Partial<NewsletterSubscriber>>(
    queryKeys.leads([{ newsletter: true }]),
    NEWSLETTER_PATH,
    {
      invalidateKeys: [queryKeys.leads([{ newsletter: true }])],
    }
  );
}

export function useUpdateSubscriber() {
  return useUpdate<NewsletterSubscriber, Partial<NewsletterSubscriber>>(
    queryKeys.leads([{ newsletter: true }]),
    NEWSLETTER_PATH,
    {
      invalidateKeys: [queryKeys.leads([{ newsletter: true }])],
    }
  );
}

export function useDeleteSubscriber() {
  return useDelete(
    queryKeys.leads([{ newsletter: true }]),
    NEWSLETTER_PATH,
    {
      invalidateKeys: [queryKeys.leads([{ newsletter: true }])],
    }
  );
}

export function useSoftDeleteSubscriber() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { softDeleteSubscriber } = await import('./newsletter');
      return softDeleteSubscriber(id);
    },
  });
}

export function useRestoreSubscriber() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { restoreSubscriber } = await import('./newsletter');
      return restoreSubscriber(id);
    },
  });
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

export function useExportSubscribers() {
  const { exportToCSV } = useExport<NewsletterSubscriber>();
  const subscribers = useSubscribers({ pageSize: 1000 });

  const columns: ExportColumn<NewsletterSubscriber>[] = [
    { key: 'email', label: 'Email' },
    { key: 'source', label: 'Origen', format: (v) => NEWSLETTER_SOURCE_LABEL[v as NewsletterSource] ?? v },
    { key: 'status', label: 'Estado', format: (v) => NEWSLETTER_STATUS_LABEL[v as NewsletterStatus] ?? v },
    { key: 'created_at', label: 'Creado', format: (v) => v ? new Date(v).toLocaleDateString('es-AR') : '—' },
  ];

  return {
    exportToCSV: async (filename = 'newsletter') => {
      if (subscribers.data?.data) {
        await exportToCSV({
          data: subscribers.data.data,
          columns,
          filename,
        });
      }
    },
    isLoading: subscribers.isPending,
  };
}

export { queryKeys };
export type { NewsletterSource, NewsletterStatus, NewsletterSubscriber };
export { NEWSLETTER_SOURCE_LABEL, NEWSLETTER_STATUS_LABEL };