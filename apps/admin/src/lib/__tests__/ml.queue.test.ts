import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchMlQueue, fetchMlMeta, fetchMlOverview } from '../ml';
import type { MlOverview } from '../../types/ml';

const { mockSupabase } = vi.hoisted(() => {
    const mockSupabase = {
        from: vi.fn(() => mockSupabase),
        select: vi.fn(() => mockSupabase),
        eq: vi.fn(() => mockSupabase),
        is: vi.fn(() => mockSupabase),
        not: vi.fn(() => mockSupabase),
        order: vi.fn(() => mockSupabase),
        limit: vi.fn(() => mockSupabase),
        returns: vi.fn(() => mockSupabase),
        maybeSingle: vi.fn(() => mockSupabase),
        single: vi.fn(() => mockSupabase),
        rpc: vi.fn(() => mockSupabase),
        auth: {
            getSession: vi.fn(),
        },
    };
    return { mockSupabase };
});

vi.mock('@supabase/supabase-js', () => ({
    createClient: () => mockSupabase,
}));

describe('ml queue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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

            mockSupabase.returns.mockResolvedValueOnce({ data: mockRows, error: null });

            const queue = await fetchMlQueue();
            expect(queue).toHaveLength(1);
            expect(queue[0].property_title).toBe('Casa');
            expect(queue[0].property_code).toBe(123);
            expect(queue[0].operation).toBe('publish');
            expect(queue[0].status).toBe('pending');
        });

        it('returns empty array on error', async () => {
            mockSupabase.returns.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
            await expect(fetchMlQueue()).rejects.toThrow('DB error');
        });

        it('handles null property', async () => {
            const mockRows = [
                { ...mockSupabase, property: null },
            ];
            mockSupabase.returns.mockResolvedValueOnce({ data: mockRows, error: null });

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

            mockSupabase.returns.mockResolvedValueOnce({ data: mockRows, error: null });

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

            mockSupabase.rpc.mockResolvedValueOnce({ data: mockOverview, error: null });

            const overview = await fetchMlOverview();
            expect(overview.ml_enabled).toBe(true);
            expect(overview.connection?.nickname).toBe('test_user');
        });

        it('returns empty overview on error', async () => {
            mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'RPC error' } });
            await expect(fetchMlOverview()).rejects.toThrow('RPC error');
        });

        it('returns disabled when no connection', async () => {
            mockSupabase.rpc.mockResolvedValueOnce({ data: { ml_enabled: false, connection: null }, error: null });
            const overview = await fetchMlOverview();
            expect(overview.ml_enabled).toBe(false);
            expect(overview.connection).toBeNull();
        });
    });
});