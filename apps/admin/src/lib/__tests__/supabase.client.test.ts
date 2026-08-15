import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCreateTypedClient = vi.hoisted(() => vi.fn());

vi.mock('@bienenhaus/supabase', () => ({
    createTypedClient: mockCreateTypedClient,
    supabase: {},
    supabaseUrl: 'https://test.supabase.co',
    getAuthUser: vi.fn(),
    getSession: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(),
}));

import { getAdminSupabase } from '../supabase';

describe('Admin Supabase', () => {
    const mockClient = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockCreateTypedClient.mockResolvedValue(mockClient);
    });

    describe('getAdminSupabase', () => {
        it('creates typed client on first call', async () => {
            const client = await getAdminSupabase();
            expect(mockCreateTypedClient).toHaveBeenCalledWith({ schema: 'public' });
            expect(client).toBe(mockClient);
        });
    });
});