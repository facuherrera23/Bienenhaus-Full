import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    buildAuthorizeUrl,
    embedProperty,
    fetchMlSettings,
    setMlAppId,
    setMlDefaults,
    setMlEnabled,
} from '../ml';

// Chain-mock de supabase: cada método devuelve la cadena y `await` resuelve el
// próximo valor encolado con { data, error }. El módulo real `../supabase` se
// reemplaza por completo (también `supabaseUrl`, usado por buildAuthorizeUrl).
type QueryResult = { data: unknown; error: unknown };

const { chainMock, enqueue, resetChain } = vi.hoisted(() => {
    const queue: QueryResult[] = [];
    const methods = [
        'select', 'insert', 'update', 'delete', 'eq', 'neq', 'in', 'not',
        'is', 'order', 'limit', 'maybeSingle', 'single', 'returns', 'or',
        'ilike', 'match', 'rpc', 'from', 'range',
    ];
    const chain: Record<string, unknown> = {};
    for (const m of methods) {
        chain[m] = vi.fn(() => chain);
    }
    chain.storage = {
        from: vi.fn(() => ({
            upload: vi.fn().mockResolvedValue({ data: { path: 'x' }, error: null }),
            getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://cdn.test/img.webp' } })),
            remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
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

vi.mock('../supabase', () => ({
    supabase: chainMock,
    supabaseUrl: 'https://test.supabase.co',
}));

const fn = (name: string) => chainMock[name] as ReturnType<typeof vi.fn>;

describe('ml settings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetChain();
    });

    describe('fetchMlSettings', () => {
        it('returns defaults when no data', async () => {
            enqueue([], null);

            const settings = await fetchMlSettings();
            expect(settings.app_id).toBe('');
            expect(settings.defaults.category_id).toBe('');
            expect(settings.defaults.listing_type_id).toBe('gold_pro');
            expect(settings.defaults.condition).toBe('used');
        });

        it('parses settings from DB rows', async () => {
            enqueue(
                [
                    { key: 'ml_app_id', value: { value: 'ml-app-123' } },
                    {
                        key: 'ml_defaults',
                        value: {
                            category_id: 'MLA1459',
                            listing_type_id: 'gold_special',
                            condition: 'new',
                        },
                    },
                ],
                null,
            );

            const settings = await fetchMlSettings();
            expect(settings.app_id).toBe('ml-app-123');
            expect(settings.defaults.category_id).toBe('MLA1459');
            expect(settings.defaults.listing_type_id).toBe('gold_special');
            expect(settings.defaults.condition).toBe('new');
        });

        it('throws on query error', async () => {
            enqueue(null, { message: 'DB down' });
            await expect(fetchMlSettings()).rejects.toThrow('DB down');
        });

        it('queries the right rows', async () => {
            enqueue([], null);
            await fetchMlSettings();
            expect(fn('from')).toHaveBeenCalledWith('site_settings');
            expect(fn('in')).toHaveBeenCalledWith('key', ['ml_app_id', 'ml_defaults', 'ml_client_secret']);
        });
    });

    describe('setMlAppId', () => {
        it('inserts a new setting when none exists', async () => {
            enqueue(null, null); // maybeSingle → sin fila
            enqueue(null, null); // insert → sin error

            await setMlAppId('app-123');
            expect(fn('insert')).toHaveBeenCalledWith({
                key: 'ml_app_id',
                value: { value: 'app-123' },
                value_type: 'json',
                is_public: false,
            });
            expect(fn('update')).not.toHaveBeenCalled();
        });

        it('updates the existing setting', async () => {
            enqueue({ id: 'setting-1' }, null); // maybeSingle → fila existente
            enqueue(null, null); // update → sin error

            await setMlAppId('app-456');
            expect(fn('update')).toHaveBeenCalledWith({ value: { value: 'app-456' } });
            expect(fn('eq')).toHaveBeenCalledWith('id', 'setting-1');
            expect(fn('insert')).not.toHaveBeenCalled();
        });
    });

    describe('setMlEnabled', () => {
        it('wraps the boolean value', async () => {
            enqueue(null, null);
            enqueue(null, null);

            await setMlEnabled(true);
            expect(fn('insert')).toHaveBeenCalledWith({
                key: 'ml_enabled',
                value: { value: true },
                value_type: 'json',
                is_public: false,
            });
        });
    });

    describe('setMlDefaults', () => {
        it('stores defaults directly (sin wrapper { value })', async () => {
            enqueue(null, null);
            enqueue(null, null);

            const defaults = {
                category_id: 'MLA1459',
                listing_type_id: 'gold_pro',
                condition: 'used',
            };
            await setMlDefaults(defaults);
            expect(fn('insert')).toHaveBeenCalledWith({
                key: 'ml_defaults',
                value: defaults,
                value_type: 'json',
                is_public: false,
            });
        });
    });

    describe('buildAuthorizeUrl', () => {
        it('builds the ML OAuth URL with appId and supabase redirect', () => {
            const url = new URL(buildAuthorizeUrl('app-123'));
            expect(url.origin + url.pathname).toBe('https://auth.mercadolibre.com.ar/authorization');
            expect(url.searchParams.get('response_type')).toBe('code');
            expect(url.searchParams.get('client_id')).toBe('app-123');
            expect(url.searchParams.get('redirect_uri')).toBe(
                'https://test.supabase.co/functions/v1/ml-oauth',
            );
        });

        it('encodes admin origin in the state param', () => {
            const url = new URL(buildAuthorizeUrl('app-123'));
            const state = JSON.parse(atob(url.searchParams.get('state') ?? ''));
            expect(state).toEqual({ admin: window.location.origin });
        });
    });

    describe('embedProperty', () => {
        it('returns nulls for null input', () => {
            expect(embedProperty(null)).toEqual({ title: null, code: null });
        });

        it('returns the object as-is for a single object', () => {
            expect(embedProperty({ title: 'Casa', code: 123 })).toEqual({ title: 'Casa', code: 123 });
        });

        it('returns the first element for an array', () => {
            const arr = [
                { title: 'A', code: 1 },
                { title: 'B', code: 2 },
            ];
            expect(embedProperty(arr)).toEqual({ title: 'A', code: 1 });
        });
    });
});
