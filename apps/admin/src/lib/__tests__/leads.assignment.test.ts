import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    autoAssignLead,
    bulkAutoAssignLeads,
    fetchAgents,
    getNextAgentForAssignment,
} from '../leads';

const { mockSupabase } = vi.hoisted(() => {
    const mockSupabase = {
        from: vi.fn(() => mockSupabase),
        select: vi.fn(() => mockSupabase),
        eq: vi.fn(() => mockSupabase),
        is: vi.fn(() => mockSupabase),
        order: vi.fn(() => mockSupabase),
        limit: vi.fn(() => mockSupabase),
        contains: vi.fn(() => mockSupabase),
        maybeSingle: vi.fn(() => mockSupabase),
        single: vi.fn(() => mockSupabase),
        update: vi.fn(() => mockSupabase),
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

describe.skip('leads assignment', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchAgents', () => {
        it('returns active agents ordered by sort_order', async () => {
            const mockAgents = [
                { id: 'agent-1', name: 'Agente 1' },
                { id: 'agent-2', name: 'Agente 2' },
            ];
            mockSupabase.returns.mockResolvedValueOnce({ data: mockAgents, error: null });

            const agents = await fetchAgents();
            expect(agents).toHaveLength(2);
            expect(agents[0].name).toBe('Agente 1');
        });
    });

    describe('getNextAgentForAssignment', () => {
        it('returns agent with least leads', async () => {
            mockSupabase.returns.mockResolvedValueOnce({
                data: [{ id: 'agent-1', name: 'Agente 1', leads: { count: 5 } }],
                error: null,
            });

            const agent = await getNextAgentForAssignment();
            expect(agent?.id).toBe('agent-1');
        });

        it('filters by specialty matching lead intent', async () => {
            mockSupabase.returns.mockResolvedValueOnce({
                data: [{ id: 'agent-1', name: 'Agente Comprar', leads: { count: 3 } }],
                error: null,
            });

            const agent = await getNextAgentForAssignment({ intent: 'comprar', city: 'CÃ³rdoba' });
            expect(agent?.id).toBe('agent-1');
            expect(mockSupabase.contains).toHaveBeenCalledWith('specialties', ['comprar']);
        });

        it('returns null when no agents available', async () => {
            mockSupabase.returns.mockResolvedValueOnce({ data: [], error: null });
            const agent = await getNextAgentForAssignment();
            expect(agent).toBeNull();
        });
    });

    describe('autoAssignLead', () => {
        it('assigns lead to best agent', async () => {
            mockSupabase.single.mockResolvedValueOnce({
                data: { intent: 'comprar', city: 'CÃ³rdoba' },
                error: null,
            });
            mockSupabase.returns.mockResolvedValueOnce({
                data: [{ id: 'agent-1', name: 'Agente 1', leads: { count: 2 } }],
                error: null,
            });
            mockSupabase.update.mockResolvedValueOnce({ error: null });

            const result = await autoAssignLead('lead-1');
            expect(result).toEqual({ agentId: 'agent-1', agentName: 'Agente 1' });
            expect(mockSupabase.update).toHaveBeenCalledWith({ assigned_to: 'agent-1' });
        });

        it('returns null when no agent available', async () => {
            mockSupabase.single.mockResolvedValueOnce({
                data: { intent: 'comprar', city: 'CÃ³rdoba' },
                error: null,
            });
            mockSupabase.returns.mockResolvedValueOnce({ data: [], error: null });

            const result = await autoAssignLead('lead-1');
            expect(result).toBeNull();
        });
    });

    describe('bulkAutoAssignLeads', () => {
        it('assigns multiple leads', async () => {
            vi.spyOn({ autoAssignLead }, 'autoAssignLead')
                .mockResolvedValueOnce({ agentId: 'agent-1', agentName: 'Agente 1' })
                .mockResolvedValueOnce({ agentId: 'agent-2', agentName: 'Agente 2' })
                .mockResolvedValueOnce(null);

            const result = await bulkAutoAssignLeads(['lead-1', 'lead-2', 'lead-3']);
            expect(result.assigned).toBe(2);
            expect(result.skipped).toBe(1);
        });
    });
});
