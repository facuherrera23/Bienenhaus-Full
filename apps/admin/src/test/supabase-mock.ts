import { vi } from 'vitest';

// Export mock functions that tests can use
export const __mocks = {
    signInWithPassword: vi
        .fn()
        .mockResolvedValue({ data: { user: null, session: null }, error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
};

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => {
    const createClient = vi.fn(() => ({
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            gt: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lt: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            like: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            range: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            upsert: vi.fn().mockReturnThis(),
        })),
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
            getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
            signInWithPassword: vi
                .fn()
                .mockResolvedValue({ data: { user: null, session: null }, error: null }),
            signOut: vi.fn().mockResolvedValue({ error: null }),
        },
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn().mockResolvedValue({ data: { path: 'test' }, error: null }),
                remove: vi.fn().mockResolvedValue({ error: null }),
                getPublicUrl: vi.fn(() => ({
                    data: { publicUrl: 'https://example.com/test.jpg' },
                })),
                list: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
        },
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn(),
            unsubscribe: vi.fn(),
        })),
        removeChannel: vi.fn(),
    }));

    return { createClient };
});
