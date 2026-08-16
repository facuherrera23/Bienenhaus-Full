import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { bulkEnqueueMl, fetchMlDeadLetter, fetchMlQueueInfinite, startMlOAuth } from '../ml';

// Chain-mock de supabase: cada método devuelve la cadena y `await` resuelve el
// próximo valor encolado con { data, error }. `ml.ts` importa `supabase` desde
// `@bienenhaus/supabase`, así que el mock reemplaza ese módulo por completo.
// (Mismo patrón que ml.queue.test.ts.)
type QueryResult = { data: unknown; error: unknown };

const { chainMock, enqueue, resetChain } = vi.hoisted(() => {
    const queue: QueryResult[] = [];
    const methods = [
        'select',
        'insert',
        'update',
        'delete',
        'eq',
        'neq',
        'in',
        'not',
        'is',
        'order',
        'limit',
        'range',
        'maybeSingle',
        'single',
        'returns',
        'or',
        'ilike',
        'match',
        'rpc',
        'from',
    ];
    const chain: Record<string, unknown> = {};
    for (const m of methods) {
        chain[m] = vi.fn(() => chain);
    }
    chain.auth = {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    };
    (chain as { then?: unknown }).then = (
        onFulfilled: (v: QueryResult) => unknown,
        _onRejected?: (e: unknown) => unknown,
    ) => {
        const next = queue.shift() ?? { data: null, error: null };
        return Promise.resolve(next).then(onFulfilled);
    };
    const enqueue = (data: unknown, error: unknown = null) => queue.push({ data, error });
    const resetChain = () => {
        queue.length = 0;
    };
    return { chainMock: chain, enqueue, resetChain };
});

vi.mock('@bienenhaus/supabase', () => ({
    supabase: chainMock,
    supabaseUrl: 'https://test.supabase.co',
}));

const authMock = chainMock.auth as {
    getSession: ReturnType<typeof vi.fn>;
    getUser: ReturnType<typeof vi.fn>;
};

const queueRow = {
    id: 1,
    property_id: 'prop-1',
    operation: 'publish',
    status: 'pending',
    attempts: 0,
    max_attempts: 5,
    next_attempt_at: '2024-01-01T00:00:00Z',
    ml_item_id: null,
    last_error: null,
    created_at: '2024-01-01T00:00:00Z',
    property: { title: 'Casa', code: 123 },
};

const deadLetterRow = {
    id: 1,
    original_queue_id: 10,
    property_id: 'prop-1',
    operation: 'update',
    attempts: 3,
    max_attempts: 5,
    last_error: 'MLA timeout',
    payload: { foo: 'bar' },
    ml_item_id: 'MLA123',
    created_at: '2024-01-01T00:00:00Z',
    moved_at: '2024-01-02T00:00:00Z',
    resolved_at: null,
    resolved_by: null,
    resolution_notes: null,
    property: { title: 'Casa', code: 123 },
};

const anonKeyEnv = 'VITE_SUPABASE_ANON_KEY' as const;

describe('ml api', () => {
    beforeAll(() => {
        import.meta.env[anonKeyEnv] = 'test-key';
    });

    afterAll(() => {
        delete import.meta.env[anonKeyEnv];
    });

    beforeEach(() => {
        vi.clearAllMocks();
        resetChain();
        vi.mocked(authMock.getSession).mockResolvedValue({ data: { session: null }, error: null });
        vi.mocked(authMock.getUser).mockResolvedValue({ data: { user: null }, error: null });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('startMlOAuth', () => {
        it('throws when no session', async () => {
            await expect(startMlOAuth()).rejects.toThrow('No hay sesion iniciada');
        });

        it('returns state and code_challenge from the edge function', async () => {
            vi.mocked(authMock.getSession).mockResolvedValue({
                data: { session: { access_token: 'test-token' } },
                error: null,
            });
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ state: 'st-1', code_challenge: 'cc-1' }),
            });
            vi.stubGlobal('fetch', fetchMock);

            const result = await startMlOAuth();

            expect(result).toEqual({ state: 'st-1', code_challenge: 'cc-1' });
            const [url, init] = vi.mocked(fetchMock).mock.calls[0] as [string, RequestInit];
            expect(url).toBe('https://test.supabase.co/functions/v1/ml-oauth');
            expect(init.method).toBe('POST');
            const body = JSON.parse(init.body as string) as {
                action: string;
                admin: string;
            };
            expect(body.action).toBe('start');
            expect(body.admin.endsWith('/admin')).toBe(true);
        });

        it('throws when the response is not ok', async () => {
            vi.mocked(authMock.getSession).mockResolvedValue({
                data: { session: { access_token: 'test-token' } },
                error: null,
            });
            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' }),
            );

            await expect(startMlOAuth()).rejects.toThrow('No se pudo iniciar OAuth');
        });
    });

    describe('bulkEnqueueMl', () => {
        it('throws when no properties are selected', async () => {
            await expect(bulkEnqueueMl([], 'publish')).rejects.toThrow(
                'No hay propiedades seleccionadas',
            );
        });

        it('throws when no session', async () => {
            await expect(bulkEnqueueMl(['p1'], 'publish')).rejects.toThrow(
                'No hay sesion iniciada',
            );
        });

        it('returns enqueued and skipped counts', async () => {
            vi.mocked(authMock.getSession).mockResolvedValue({
                data: { session: { access_token: 'test-token' } },
                error: null,
            });
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ enqueued: 3, skipped: 1 }),
            });
            vi.stubGlobal('fetch', fetchMock);

            const result = await bulkEnqueueMl(['p1', 'p2'], 'publish');

            expect(result).toEqual({ enqueued: 3, skipped: 1 });
            const [url, init] = vi.mocked(fetchMock).mock.calls[0] as [string, RequestInit];
            expect(url).toBe('https://test.supabase.co/functions/v1/ml-bulk-enqueue');
            expect(init.method).toBe('POST');
            const body = JSON.parse(init.body as string) as {
                property_ids: string[];
                operation: string;
            };
            expect(body.property_ids).toEqual(['p1', 'p2']);
            expect(body.operation).toBe('publish');
        });

        it('falls back to zero counts when the payload has no keys', async () => {
            vi.mocked(authMock.getSession).mockResolvedValue({
                data: { session: { access_token: 'test-token' } },
                error: null,
            });
            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
            );

            const result = await bulkEnqueueMl(['p1'], 'delete');
            expect(result).toEqual({ enqueued: 0, skipped: 0 });
        });
    });

    describe('fetchMlQueueInfinite', () => {
        it('maps rows and returns the page', async () => {
            enqueue([queueRow], null);

            const result = await fetchMlQueueInfinite(2, 50);

            expect(result.page).toBe(2);
            expect(result.data).toHaveLength(1);
            expect(result.data[0].property_title).toBe('Casa');
            expect(result.data[0].property_code).toBe(123);
            expect(result.hasNextPage).toBe(false);
        });

        it('applies the correct range for the requested page', async () => {
            enqueue([], null);

            await fetchMlQueueInfinite(2, 50);
            expect(chainMock.range).toHaveBeenCalledWith(50, 99);

            resetChain();
            enqueue([], null);
            await fetchMlQueueInfinite(3, 25);
            expect(chainMock.range).toHaveBeenCalledWith(50, 74);
        });

        it('reports hasNextPage when a full page is returned', async () => {
            enqueue(Array.from({ length: 50 }, (_, i) => ({ ...queueRow, id: i + 1 })), null);

            const result = await fetchMlQueueInfinite(1, 50);
            expect(result.data).toHaveLength(50);
            expect(result.hasNextPage).toBe(true);
        });

        it('propagates query errors', async () => {
            enqueue(null, { message: 'DB error' });
            await expect(fetchMlQueueInfinite()).rejects.toThrow('DB error');
        });
    });

    describe('fetchMlDeadLetter', () => {
        it('maps rows keeping ml_item_id as string or null', async () => {
            enqueue([deadLetterRow, { ...deadLetterRow, id: 2, ml_item_id: null }], null);

            const result = await fetchMlDeadLetter();

            expect(result.data).toHaveLength(2);
            expect(result.data[0].ml_item_id).toBe('MLA123');
            expect(result.data[1].ml_item_id).toBeNull();
            expect(result.data[0].property_title).toBe('Casa');
            expect(result.data[0].property_code).toBe(123);
            expect(result.data[0].payload).toEqual({ foo: 'bar' });
        });

        it('applies the correct range for the requested page', async () => {
            enqueue([], null);

            await fetchMlDeadLetter({ page: 2, pageSize: 50 });
            expect(chainMock.range).toHaveBeenCalledWith(50, 99);
        });

        it('falls back to count 0 when the response has no count', async () => {
            enqueue([deadLetterRow], null);

            const result = await fetchMlDeadLetter();
            expect(result.count).toBe(0);
        });

        it('reports hasNextPage when a full page is returned', async () => {
            enqueue(Array.from({ length: 50 }, (_, i) => ({ ...deadLetterRow, id: i + 1 })), null);

            const result = await fetchMlDeadLetter();
            expect(result.data).toHaveLength(50);
            expect(result.hasNextPage).toBe(true);
        });

        it('propagates query errors', async () => {
            enqueue(null, { message: 'DB error' });
            await expect(fetchMlDeadLetter()).rejects.toThrow('DB error');
        });
    });
});
