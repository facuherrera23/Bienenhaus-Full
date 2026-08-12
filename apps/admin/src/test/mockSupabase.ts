/**
 * Shared Supabase mock chain builder for tests.
 * Provides a full chainable mock with all methods used by the codebase.
 */
import { type Mock, vi } from 'vitest';

/**
 * Creates a complete mock chain with all Supabase query builder methods.
 * Methods return `this` for chaining, terminal methods return promises.
 */
export function createMockChain(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    const chain: Record<string, unknown> = {
        // Query builders (return this for chaining)
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
        match: vi.fn().mockReturnThis(), // Required by ml.ts
        not: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockReturnThis(),
        returns: vi.fn().mockReturnThis(), // Used by some tests
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        // Terminal methods (return promises)
        then: vi.fn(),
        catch: vi.fn(),
        ...overrides,
    };

    // Default resolved values for terminal methods
    chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
    chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    chain.returns = vi.fn().mockResolvedValue({ data: null, error: null });

    return chain;
}

/**
 * Creates a mock Supabase client with `from` returning a mock chain.
 * Table-specific chains can be provided via `tableChains`.
 */
export function createMockSupabase(
    tableChains: Record<string, Record<string, unknown>> = {}
) {
    const defaultChain = createMockChain();

    return {
        from: vi.fn((table: string) => tableChains[table] ?? defaultChain),
        rpc: vi.fn(() => createMockChain()),
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        },
    };
}

/**
 * Helper to create `eq` mock that chains N times then resolves.
 * Used for patterns like: `.update().eq('id', id).eq('status', 'x')`
 */
export function eqWithTerminal(chainableCalls: number, terminal: unknown): Mock {
    let eq = vi.fn();
    for (let i = 0; i < chainableCalls; i++) {
        eq = eq.mockImplementationOnce(function (this: unknown) {
            return this;
        });
    }
    return eq.mockResolvedValueOnce(terminal) as Mock;
}

/**
 * Creates a valid UUID for test fixtures.
 */
export const TEST_UUID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

/**
 * Creates a second valid UUID for test fixtures.
 */
export const TEST_UUID_2 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';