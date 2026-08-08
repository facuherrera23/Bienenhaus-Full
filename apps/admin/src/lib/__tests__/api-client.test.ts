import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { supabase, supabaseUrl } from '../supabase';
import { api, apiRequest, queryKeys, rpcCall } from '../api/client';

const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const fetchMock = vi.fn();

function mockResponse(overrides: {
    ok?: boolean;
    status?: number;
    headers?: Record<string, string>;
    json?: () => Promise<unknown>;
    text?: () => Promise<string>;
}): Response {
    const { ok = true, status = 200, headers = {}, json, text } = overrides;
    const normalizedHeaders = Object.fromEntries(
        Object.entries({ 'Content-Type': 'application/json', ...headers }).map(
            ([name, value]) => [name.toLowerCase(), value],
        ),
    );
    return {
        ok,
        status,
        headers: { get: (name: string) => normalizedHeaders[name.toLowerCase()] ?? null },
        json: json ?? (async () => null),
        text: text ?? (async () => ''),
    } as unknown as Response;
}

function mockSession(token: string | null): void {
    (supabase.auth.getSession as unknown as Mock).mockResolvedValue({
        data: { session: token ? { access_token: token } : null },
        error: null,
    });
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    mockSession(null);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
});

describe('apiRequest', () => {
    it('construye la URL del path contra el REST de Supabase', async () => {
        fetchMock.mockResolvedValue(mockResponse({ json: async () => [{ id: 1 }] }));

        await apiRequest('properties');

        const [url] = fetchMock.mock.calls[0];
        expect(url).toBe(`${supabaseUrl}/rest/v1/properties`);
    });

    it('normaliza slashes iniciales del path y agrega query params', async () => {
        fetchMock.mockResolvedValue(mockResponse({ json: async () => [] }));

        await apiRequest('/properties', { params: { select: 'id,name', limit: 5 } });

        const [url] = fetchMock.mock.calls[0] as [string];
        expect(url).toContain('/rest/v1/properties');
        const parsed = new URL(url);
        expect(parsed.searchParams.get('select')).toBe('id,name');
        expect(parsed.searchParams.get('limit')).toBe('5');
    });

    it('omite params undefined o null', async () => {
        fetchMock.mockResolvedValue(mockResponse({ json: async () => [] }));

        await apiRequest('properties', { params: { skip: undefined, nada: null, keep: 'x' } });

        const [url] = fetchMock.mock.calls[0] as [string];
        const parsed = new URL(url);
        expect(parsed.searchParams.has('skip')).toBe(false);
        expect(parsed.searchParams.has('nada')).toBe(false);
        expect(parsed.searchParams.get('keep')).toBe('x');
    });

    it('envía headers de API y apikey', async () => {
        fetchMock.mockResolvedValue(mockResponse({ json: async () => [] }));

        await apiRequest('properties');

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/rest/v1/properties'),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Prefer: 'return=representation',
                    apikey: ANON_KEY,
                }),
            }),
        );
    });

    it('agrega Authorization Bearer cuando hay sesión', async () => {
        mockSession('tok-123');
        fetchMock.mockResolvedValue(mockResponse({ json: async () => [] }));

        await apiRequest('properties');

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/rest/v1/properties'),
            expect.objectContaining({
                headers: expect.objectContaining({ Authorization: 'Bearer tok-123' }),
            }),
        );
    });

    it('no agrega Authorization cuando requireAuth es false', async () => {
        mockSession('tok-123');
        fetchMock.mockResolvedValue(mockResponse({ json: async () => [] }));

        await apiRequest('properties', { requireAuth: false });

        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        const headers = init.headers as Record<string, string>;
        expect(headers.Authorization).toBeUndefined();
    });

    it('parsea data y count desde el header content-range', async () => {
        fetchMock.mockResolvedValue(
            mockResponse({
                json: async () => [{ id: 1 }, { id: 2 }],
                headers: { 'Content-Range': '0-19/42' },
            }),
        );

        const res = await apiRequest<{ id: number }[]>('properties');

        expect(res.data).toEqual([{ id: 1 }, { id: 2 }]);
        expect(res.error).toBeNull();
        expect(res.status).toBe(200);
        expect(res.count).toBe(42);
    });

    it('mapea el error JSON con code, message, details y hint', async () => {
        fetchMock.mockResolvedValue(
            mockResponse({
                ok: false,
                status: 404,
                json: async () => ({
                    code: 'PGRST116',
                    message: 'Not found',
                    details: 'detalle',
                    hint: 'pista',
                }),
            }),
        );

        const res = await apiRequest('properties');

        expect(res.data).toBeNull();
        expect(res.error).toEqual({
            code: 'PGRST116',
            message: 'Not found',
            details: 'detalle',
            hint: 'pista',
            status: 404,
        });
    });

    it('usa fallbacks cuando el JSON de error es inválido', async () => {
        fetchMock.mockResolvedValue(
            mockResponse({ ok: false, status: 400, json: async () => null }),
        );

        const res = await apiRequest('properties');

        expect(res.error).toEqual({
            code: 'API_ERROR',
            message: 'Error en la petición',
            status: 400,
        });
    });

    it('mapea errores no-JSON como HTTP_ERROR con el texto de la respuesta', async () => {
        fetchMock.mockResolvedValue(
            mockResponse({
                ok: false,
                status: 500,
                headers: { 'Content-Type': 'text/plain' },
                text: async () => 'boom',
            }),
        );

        const res = await apiRequest('properties');

        expect(res.error).toEqual({ code: 'HTTP_ERROR', message: 'boom', status: 500 });
    });

    it('usa el status como mensaje cuando el error no-JSON viene vacío', async () => {
        fetchMock.mockResolvedValue(
            mockResponse({
                ok: false,
                status: 503,
                headers: { 'Content-Type': 'text/plain' },
                text: async () => '',
            }),
        );

        const res = await apiRequest('properties');

        expect(res.error).toEqual({ code: 'HTTP_ERROR', message: 'Error 503', status: 503 });
    });

    it('tolera que response.text() falle en errores no-JSON', async () => {
        fetchMock.mockResolvedValue(
            mockResponse({
                ok: false,
                status: 502,
                headers: { 'Content-Type': 'text/plain' },
                text: async () => {
                    throw new Error('network down');
                },
            }),
        );

        const res = await apiRequest('properties');

        expect(res.error).toEqual({ code: 'HTTP_ERROR', message: 'Error 502', status: 502 });
    });

    it('lanza error si falta la anon key', async () => {
        vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

        await expect(apiRequest('properties')).rejects.toThrow(
            'VITE_SUPABASE_ANON_KEY is not set',
        );
    });

    it('devuelve data null sin error para respuestas OK no-JSON', async () => {
        fetchMock.mockResolvedValue(
            mockResponse({ headers: { 'Content-Type': 'text/plain' }, text: async () => 'ok' }),
        );

        const res = await apiRequest('properties');

        expect(res).toEqual({ data: null, error: null, status: 200 });
    });

    it('tolera que response.json() falle en respuestas OK', async () => {
        fetchMock.mockResolvedValue(
            mockResponse({
                json: async () => {
                    throw new Error('bad json');
                },
            }),
        );

        const res = await apiRequest('properties');

        expect(res.data).toBeNull();
        expect(res.error).toBeNull();
        expect(res.status).toBe(200);
    });

    it('usa details como mensaje cuando el error no trae message', async () => {
        fetchMock.mockResolvedValue(
            mockResponse({
                ok: false,
                status: 422,
                json: async () => ({ code: 'PGRST324', details: 'detalle interno' }),
            }),
        );

        const res = await apiRequest('properties');

        expect(res.error).toEqual({
            code: 'PGRST324',
            message: 'detalle interno',
            details: 'detalle interno',
            status: 422,
        });
    });

    it('fusiona headers custom con los defaults', async () => {
        fetchMock.mockResolvedValue(mockResponse({ json: async () => [] }));

        await apiRequest('properties', { headers: { 'X-Custom': 'yes' } });

        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        const headers = init.headers as Record<string, string>;
        expect(headers['X-Custom']).toBe('yes');
    });
});

describe('api helpers', () => {
    it('api.get usa método GET', async () => {
        fetchMock.mockResolvedValue(mockResponse({ json: async () => [] }));

        await api.get('properties');

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/rest/v1/properties'),
            expect.objectContaining({ method: 'GET' }),
        );
    });

    it('api.post envía el body serializado con método POST', async () => {
        fetchMock.mockResolvedValue(mockResponse({ json: async () => ({ id: 1 }) }));

        const res = await api.post('properties', { title: 'Casa', price: 100 });

        expect(res.data).toEqual({ id: 1 });
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/rest/v1/properties'),
            expect.objectContaining({ method: 'POST', body: '{"title":"Casa","price":100}' }),
        );
    });

    it('api.patch envía el body serializado con método PATCH', async () => {
        fetchMock.mockResolvedValue(mockResponse({ json: async () => ({ id: 1 }) }));

        await api.patch('properties', { price: 200 });

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/rest/v1/properties'),
            expect.objectContaining({ method: 'PATCH', body: '{"price":200}' }),
        );
    });

    it('api.delete usa método DELETE', async () => {
        fetchMock.mockResolvedValue(mockResponse({ json: async () => null }));

        await api.delete('properties?id=eq.1');

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/rest/v1/properties?id=eq.1'),
            expect.objectContaining({ method: 'DELETE' }),
        );
    });
});

describe('rpcCall', () => {
    it('llama al endpoint RPC con Authorization y apikey', async () => {
        mockSession('rpc-tok');
        fetchMock.mockResolvedValue(mockResponse({ json: async () => ({ result: 42 }) }));

        const res = await rpcCall<{ result: number }>('ml_enqueue', { property_id: 'p1' });

        expect(res).toEqual({ data: { result: 42 }, error: null, status: 200 });
        expect(fetchMock).toHaveBeenCalledWith(
            `${supabaseUrl}/rest/v1/rpc/ml_enqueue`,
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: 'Bearer rpc-tok',
                    apikey: ANON_KEY,
                }),
                body: '{"property_id":"p1"}',
            }),
        );
    });

    it('mapea el error del RPC', async () => {
        mockSession('rpc-tok');
        fetchMock.mockResolvedValue(
            mockResponse({
                ok: false,
                status: 400,
                json: async () => ({ code: '42P01', message: 'Undefined table' }),
            }),
        );

        const res = await rpcCall('ml_enqueue', {});

        expect(res.data).toBeNull();
        expect(res.error).toEqual({
            code: '42P01',
            message: 'Undefined table',
            status: 400,
        });
    });

    it('usa fallbacks cuando el JSON de error del RPC es inválido', async () => {
        mockSession('rpc-tok');
        fetchMock.mockResolvedValue(mockResponse({ ok: false, status: 500, json: async () => null }));

        const res = await rpcCall('ml_enqueue', {});

        expect(res.error).toEqual({ code: 'RPC_ERROR', message: 'Error en RPC', status: 500 });
    });

    it('lanza error si falta la anon key', async () => {
        vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

        await expect(rpcCall('ml_enqueue', {})).rejects.toThrow(
            'VITE_SUPABASE_ANON_KEY is not set',
        );
    });

    it('no lanza si no hay sesión (token undefined)', async () => {
        fetchMock.mockResolvedValue(mockResponse({ json: async () => ({ ok: true }) }));

        const res = await rpcCall('ml_enqueue', {});

        expect(res.data).toEqual({ ok: true });
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/rest/v1/rpc/ml_enqueue'),
            expect.objectContaining({
                headers: expect.objectContaining({ Authorization: 'Bearer undefined' }),
            }),
        );
    });

    it('usa RPC_ERROR si el JSON de error no es parseable', async () => {
        mockSession('rpc-tok');
        fetchMock.mockResolvedValue(
            mockResponse({
                ok: false,
                status: 502,
                json: async () => {
                    throw new Error('bad json');
                },
            }),
        );

        const res = await rpcCall('ml_enqueue', {});

        expect(res.error).toEqual({ code: 'RPC_ERROR', message: 'Error en RPC', status: 502 });
    });
});

describe('queryKeys', () => {
    it('arma las keys de propiedades y leads', () => {
        expect(queryKeys.properties({ status: 'publicada' })).toEqual([
            'properties',
            { status: 'publicada' },
        ]);
        expect(queryKeys.property('p1')).toEqual(['property', 'p1']);
        expect(queryKeys.leads()).toEqual(['leads', undefined]);
        expect(queryKeys.lead('l1')).toEqual(['lead', 'l1']);
    });

    it('arma las keys de ml, site y valuation', () => {
        expect(queryKeys.mlOverview()).toEqual(['ml-overview']);
        expect(queryKeys.siteContent('hero', 'es')).toEqual(['site-content', 'hero', 'es']);
        expect(queryKeys.valuationDraft(null)).toEqual(['valuation-draft', null]);
    });

    it('arma las keys de owners, agents, visits y chat', () => {
        expect(queryKeys.owners({ deleted: true })).toEqual(['owners', { deleted: true }]);
        expect(queryKeys.agents()).toEqual(['agents', undefined]);
        expect(queryKeys.agent('ag1')).toEqual(['agent', 'ag1']);
        expect(queryKeys.visits({ from: '2026-01-01' })).toEqual(['visits', { from: '2026-01-01' }]);
        expect(queryKeys.chat()).toEqual(['chat', undefined]);
    });

    it('arma las keys de ml, site, valuations y drafts', () => {
        expect(queryKeys.mlQueue()).toEqual(['ml-queue', undefined]);
        expect(queryKeys.mlMeta('p1')).toEqual(['ml-meta', 'p1']);
        expect(queryKeys.mlQuestions()).toEqual(['ml-questions', undefined]);
        expect(queryKeys.mlOrders()).toEqual(['ml-orders', undefined]);
        expect(queryKeys.mlTemplates()).toEqual(['ml-templates']);
        expect(queryKeys.siteSettings('hero')).toEqual(['site-settings', 'hero']);
        expect(queryKeys.valuations()).toEqual(['valuations', undefined]);
        expect(queryKeys.valuation('v1')).toEqual(['valuation', 'v1']);
        expect(queryKeys.valuationDrafts()).toEqual(['valuation-drafts', undefined]);
    });
});
