import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchMlMeta, fetchMlOverview, fetchMlQueue } from '../ml';
import type { MlOverview } from '../../types/ml';

// Chain-mock de supabase: cada método devuelve la cadena y `await` resuelve el
// próximo valor encolado con { data, error }. `ml.ts` importa `supabase` desde
// `@bienenhaus/supabase`, así que el mock reemplaza ese módulo por completo.
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

describe('ml queue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetChain();
    });

    describe('fetchMlQueue', () => {
        it('returns mapped queue rows', async () => {
            const mockRows = [
                {
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
                },
            ];

            enqueue(mockRows, null);

            const queue = await fetchMlQueue();
            expect(queue).toHaveLength(1);
            expect(queue[0].property_title).toBe('Casa');
            expect(queue[0].property_code).toBe(123);
            expect(queue[0].operation).toBe('publish');
            expect(queue[0].status).toBe('pending');
        });

        it('returns empty array on error', async () => {
            enqueue(null, { message: 'DB error' });
            await expect(fetchMlQueue()).rejects.toThrow('DB error');
        });

        it('handles null property', async () => {
            const mockRows = [{ ...{}, property: null }];
            enqueue(mockRows, null);

            const queue = await fetchMlQueue();
            expect(queue[0].property_title).toBeNull();
            expect(queue[0].property_code).toBeNull();
        });
    });

    describe('fetchMlMeta', () => {
        it('returns mapped meta rows', async () => {
            const mockRows = [
                {
                    property_id: 'prop-1',
                    ml_item_id: 987654321,
                    status: 'active',
                    permalink: 'https://mercadolibre.com.ar/item/MLA123',
                    price: 285000,
                    last_sync_at: '2024-01-01T12:00:00Z',
                    last_sync_status: 'success',
                    property: { title: 'Casa', code: 123 },
                },
            ];

            enqueue(mockRows, null);

            const meta = await fetchMlMeta();
            expect(meta).toHaveLength(1);
            expect(meta[0].property_title).toBe('Casa');
            expect(meta[0].ml_item_id).toBe(987654321);
            expect(meta[0].price).toBe(285000);
        });
    });

    describe('fetchMlOverview', () => {
        it('returns overview with connection', async () => {
            const mockOverview: MlOverview = {
                ml_enabled: true,
                connection: {
                    id: 'conn-1',
                    provider: 'mercadolibre',
                    site_id: 'MLA',
                    user_id: 123456,
                    nickname: 'test_user',
                    email: 'test@example.com',
                    token_expires_at: new Date(Date.now() + 3600000).toISOString(),
                    is_active: true,
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-01T00:00:00Z',
                },
            };

            enqueue(mockOverview, null);

            const overview = await fetchMlOverview();
            expect(overview.ml_enabled).toBe(true);
            expect(overview.connection?.nickname).toBe('test_user');
        });

        it('returns empty overview on error', async () => {
            enqueue(null, { message: 'RPC error' });
            await expect(fetchMlOverview()).rejects.toThrow('RPC error');
        });

        it('returns disabled when no connection', async () => {
            enqueue({ ml_enabled: false, connection: null }, null);
            const overview = await fetchMlOverview();
            expect(overview.ml_enabled).toBe(false);
            expect(overview.connection).toBeNull();
        });
    });
});
