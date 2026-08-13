import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    createDirectChannel,
    createGroupChannel,
    createLeadChannel,
    createPropertyChannel,
    fetchChannels,
} from '../chat';
import type { ChatChannel } from '../../types/chat';

const { mockSupabase } = vi.hoisted(() => {
    const mockSupabase = {
        from: vi.fn(() => mockSupabase),
        select: vi.fn(() => mockSupabase),
        eq: vi.fn(() => mockSupabase),
        is: vi.fn(() => mockSupabase),
        not: vi.fn(() => mockSupabase),
        order: vi.fn(() => mockSupabase),
        maybeSingle: vi.fn(() => mockSupabase),
        single: vi.fn(() => mockSupabase),
        insert: vi.fn(() => mockSupabase),
        returns: vi.fn(() => mockSupabase),
        auth: {
            getUser: vi.fn(),
        },
        storage: {
            from: vi.fn(),
        },
        rpc: vi.fn().mockResolvedValue({ error: null }),
    };
    return { mockSupabase };
});

vi.mock('@supabase/supabase-js', () => ({
    createClient: () => mockSupabase,
}));

describe.skip('chat channels', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchChannels', () => {
        it('returns active channels for agent', async () => {
            const mockChannels = [
                {
                    id: 'ch-1',
                    type: 'direct',
                    participants: [{ agent: { name: 'Agent 1' } }],
                    last_message: [{ id: 'msg-1', content: 'Hello' }],
                },
                {
                    id: 'ch-2',
                    type: 'group',
                    participants: [{ agent: { name: 'Agent 2' } }],
                    last_message: [],
                },
            ];
            mockSupabase.returns.mockResolvedValueOnce({ data: mockChannels, error: null });

            const channels = await fetchChannels('agent-1');
            expect(channels).toHaveLength(2);
            expect(channels[0].type).toBe('direct');
        });
    });

    describe('createDirectChannel', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('creates new direct channel when none exists', async () => {
            mockSupabase.returns.mockResolvedValueOnce({ data: [], error: null }); // existing check
            mockSupabase.single.mockResolvedValueOnce({ data: { id: 'new-ch' }, error: null }); // create channel
            mockSupabase.insert.mockResolvedValueOnce({ error: null }); // insert participants
            mockSupabase.returns.mockResolvedValueOnce({
                data: { id: 'new-ch', type: 'direct', participants: [], last_message: [] },
                error: null,
            }); // fetchChannel

            const result = await createDirectChannel(['agent-1', 'agent-2'], 'agent-1');
            expect(result.id).toBe('new-ch');
            expect(result.type).toBe('direct');
        });

        it('returns existing channel if already exists', async () => {
            mockSupabase.returns.mockResolvedValueOnce({
                data: [
                    {
                        id: 'existing-ch',
                        type: 'direct',
                        participants: [{ agent_id: 'agent-1' }, { agent_id: 'agent-2' }],
                    },
                ],
                error: null,
            });
            mockSupabase.returns.mockResolvedValueOnce({
                data: { id: 'existing-ch', type: 'direct' },
                error: null,
            });

            const result = await createDirectChannel(['agent-1', 'agent-2'], 'agent-1');
            expect(result.id).toBe('existing-ch');
        });
    });

    describe('createGroupChannel', () => {
        it('creates group channel with participants', async () => {
            mockSupabase.single.mockResolvedValueOnce({ data: { id: 'group-ch' }, error: null });
            mockSupabase.insert.mockResolvedValueOnce({ error: null });
            mockSupabase.returns.mockResolvedValueOnce({
                data: { id: 'group-ch', type: 'group', participants: [] },
                error: null,
            });

            const result = await createGroupChannel(
                'Grupo Test',
                ['agent-1', 'agent-2', 'agent-3'],
                'agent-1',
            );
            expect(result.id).toBe('group-ch');
            expect(result.type).toBe('group');
            expect(result.name).toBe('Grupo Test');
        });
    });

    describe('createPropertyChannel', () => {
        it('creates property channel with property name', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: { title: 'Casa Test' },
                error: null,
            });
            mockSupabase.single.mockResolvedValueOnce({ data: { id: 'prop-ch' }, error: null });
            mockSupabase.insert.mockResolvedValueOnce({ error: null });
            mockSupabase.returns.mockResolvedValueOnce({
                data: { id: 'prop-ch', type: 'property', name: 'Casa Test' },
                error: null,
            });

            const result = await createPropertyChannel('prop-1', ['agent-1', 'agent-2'], 'agent-1');
            expect(result.id).toBe('prop-ch');
            expect(result.type).toBe('property');
            expect(result.name).toBe('Casa Test');
        });
    });

    describe('createLeadChannel', () => {
        it('creates lead channel with lead name', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: { name: 'Juan', last_name: 'PÃ©rez' },
                error: null,
            });
            mockSupabase.single.mockResolvedValueOnce({ data: { id: 'lead-ch' }, error: null });
            mockSupabase.insert.mockResolvedValueOnce({ error: null });
            mockSupabase.returns.mockResolvedValueOnce({
                data: { id: 'lead-ch', type: 'lead', name: 'Juan PÃ©rez' },
                error: null,
            });

            const result = await createLeadChannel('lead-1', ['agent-1', 'agent-2'], 'agent-1');
            expect(result.id).toBe('lead-ch');
            expect(result.type).toBe('lead');
            expect(result.name).toBe('Juan PÃ©rez');
        });
    });
});
