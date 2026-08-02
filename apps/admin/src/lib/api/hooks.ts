import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { api, rpcCall, ApiResponse, ApiError } from './client';
import { supabase } from '../supabase';

// Type helpers
export type { ApiResponse, ApiError };

// Export CSV hook
export interface ExportColumn<T> {
  key: keyof T | string;
  label: string;
  format?: (value: any, row: T) => string;
}

export function useExport<T extends Record<string, any>>() {
  const exportToCSV = async (options: {
    data: T[];
    columns: ExportColumn<T>[];
    filename: string;
  }) => {
    const { data, columns, filename } = options;
    
    const headers = columns.map(c => c.label).join(',');
    const rows = data.map(row => 
      columns.map(col => {
        const key = col.key as keyof T;
        let value: any = row[key];
        if (col.format) value = col.format(value, row);
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return { exportToCSV };
}
export interface ListOptions<_T> {
  queryKey: QueryKey;
  path: string;
  select?: string;
  filters?: Record<string, any>;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  ascending?: boolean;
  enabled?: boolean;
  staleTime?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useList<T>({
  queryKey,
  path,
  select = '*',
  filters = {},
  page = 1,
  pageSize = 20,
  orderBy = 'created_at',
  ascending = false,
  enabled = true,
  staleTime = 30_000,
}: ListOptions<T>) {
  const from = (page - 1) * pageSize;

  const queryParams: Record<string, any> = {
    select,
    limit: pageSize,
    offset: from,
    order: `${orderBy}.${ascending ? 'asc' : 'desc'}`,
    ...filters,
  };

  return useQuery({
    queryKey: [...queryKey, { page, pageSize, orderBy, ascending, filters }],
    queryFn: async () => {
      const { data, error } = await api.get<PaginatedResult<T>>(path, {
        params: queryParams,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled,
    staleTime,
    placeholderData: (previous) => previous,
  });
}

// Generic single item hook
export function useItem<T>(_queryKey: QueryKey, path: string, id: string | null, enabled = true) {
  return useQuery({
    queryKey: [_queryKey, id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await api.get<T>(`${path}?id=eq.${id}&select=*&limit=1`);
      if (error) throw new Error(error.message);
      return (data as T[])?.[0] ?? null;
    },
    enabled: enabled && !!id,
  });
}

// Generic create hook
export function useCreate<T, TBody>(
  _queryKey: QueryKey,
  path: string,
  options?: {
    invalidateKeys?: QueryKey[];
    onSuccess?: (data: T) => void;
    onError?: (error: ApiError) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: TBody) => {
      const { data, error } = await api.post<T>(path, body);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      options?.invalidateKeys?.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      options?.onSuccess?.(data as T);
    },
    onError: (error: ApiError) => {
      options?.onError?.(error);
    },
  });
}

// Generic update hook
export function useUpdate<T, TBody>(
  _queryKey: QueryKey,
  path: string,
  options?: {
    invalidateKeys?: QueryKey[];
    onSuccess?: (data: T) => void;
    onError?: (error: ApiError) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: TBody }) => {
      const { data, error } = await api.patch<T>(`${path}?id=eq.${id}`, body, {
        headers: { 'Prefer': 'return=representation' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      options?.invalidateKeys?.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      options?.onSuccess?.(data as T);
    },
    onError: (error: ApiError) => {
      options?.onError?.(error);
    },
  });
}

// Generic delete hook
export function useDelete(
  _queryKey: QueryKey,
  path: string,
  options?: {
    invalidateKeys?: QueryKey[];
    onSuccess?: () => void;
    onError?: (error: ApiError) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.delete(`${path}?id=eq.${id}`);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      options?.invalidateKeys?.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      options?.onSuccess?.();
    },
    onError: (error: ApiError) => {
      options?.onError?.(error);
    },
  });
}

// RPC hook for Supabase functions
export function useRpc<T, TParams>(
  functionName: string,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: ApiError) => void;
  }
) {
  return useMutation<T, ApiError, TParams>({
    mutationFn: async (params: TParams) => {
      const { data, error } = await rpcCall<T>(functionName, params as Record<string, any>);
      if (error) throw error;
      return data as T;
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
}

// File upload hook
export function useUpload(bucket: string) {
  return useMutation({
    mutationFn: async ({ file, path }: { file: File; path: string }) => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);
      
      return { path: data.path, publicUrl };
    },
  });
}

// Real-time subscription hook (placeholder)
export function useRealtime<T>(
  _table: string,
  _filter: string,
  _callback: (payload: { new: T; old: T; eventType: 'INSERT' | 'UPDATE' | 'DELETE' }) => void,
  _enabled = true
) {
  // This would need the realtime client setup - placeholder for now
  // Implementation would use supabase.channel().on().subscribe()
  
  return { subscribe: () => {}, unsubscribe: () => {} };
}