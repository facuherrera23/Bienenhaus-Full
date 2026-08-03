import { supabase, supabaseUrl } from '../supabase';

export interface ApiError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
  status: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  status: number;
  /** Total row count from PostgREST `Content-Range` header (e.g. `0-19/42`). */
  count?: number;
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  requireAuth?: boolean;
}

function buildUrl(path: string, params?: Record<string, any>): string {
  const url = new URL(`${supabaseUrl}/rest/v1/${path.replace(/^\/+/, '')}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function getAuthHeader(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { params, requireAuth = true, headers, ...fetchOptions } = options;

  const url = buildUrl(path, params);
  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Prefer': 'return=representation',
    ...headers,
  };

  if (requireAuth) {
    const token = await getAuthHeader();
    if (token) {
      (requestHeaders as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  const apikey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!apikey) {
    throw new Error('VITE_SUPABASE_ANON_KEY is not set. Cannot make API requests.');
  }
  (requestHeaders as Record<string, string>)['apikey'] = apikey;

  const response = await fetch(url, {
    ...fetchOptions,
    headers: requestHeaders,
  });

  let data: T | null = null;
  let error: ApiError | null = null;
  let count: number | undefined;

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      error = {
        code: json?.code || 'API_ERROR',
        message: json?.message || json?.details || 'Error en la petición',
        details: json?.details,
        hint: json?.hint,
        status: response.status,
      };
    } else {
      data = json as T;
      const contentRange = response.headers.get('content-range');
      const total = contentRange?.match(/\/(\d+)$/)?.[1];
      if (total !== undefined) count = Number(total);
    }
  } else if (!response.ok) {
    const text = await response.text().catch(() => '');
    error = {
      code: 'HTTP_ERROR',
      message: text || `Error ${response.status}`,
      status: response.status,
    };
  }

  return { data, error, status: response.status, count };
}

// Helpers comunes
export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) }),

  patch: <T>(path: string, body: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};

// Wrapper para Supabase RPC calls
export async function rpcCall<T>(
  functionName: string,
  params: Record<string, any> = {}
): Promise<ApiResponse<T>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const apikey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!apikey) {
    throw new Error('VITE_SUPABASE_ANON_KEY is not set. Cannot make RPC calls.');
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': apikey,
    },
    body: JSON.stringify(params),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      data: null,
      error: {
        code: json?.code || 'RPC_ERROR',
        message: json?.message || 'Error en RPC',
        details: json?.details,
        hint: json?.hint,
        status: response.status,
      },
      status: response.status,
    };
  }

  return { data: json as T, error: null, status: response.status };
}

// Query key factory para React Query
export const queryKeys = {
  properties: (filters?: Record<string, any>) => ['properties', filters] as const,
  property: (id: string) => ['property', id] as const,
  leads: (filters?: Record<string, any>) => ['leads', filters] as const,
  lead: (id: string) => ['lead', id] as const,
  agents: (filters?: Record<string, any>) => ['agents', filters] as const,
  agent: (id: string) => ['agent', id] as const,
  visits: (filters?: Record<string, any>) => ['visits', filters] as const,
  mlQueue: (filters?: Record<string, any>) => ['ml-queue', filters] as const,
  mlMeta: (filters?: Record<string, any>) => ['ml-meta', filters] as const,
  mlOverview: () => ['ml-overview'] as const,
  mlQuestions: (filters?: Record<string, any>) => ['ml-questions', filters] as const,
  mlOrders: (filters?: Record<string, any>) => ['ml-orders', filters] as const,
  mlTemplates: () => ['ml-templates'] as const,
  siteSettings: (key?: string) => ['site-settings', key] as const,
  siteContent: (section?: string, locale?: string) => ['site-content', section, locale] as const,
};