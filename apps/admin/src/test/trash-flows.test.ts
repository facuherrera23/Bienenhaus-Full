import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { from } from './setup';
import { supabase } from '../lib/supabase';
import { fetchDeletedLeads, permanentDeleteLead, restoreLead, softDeleteLead } from '../lib/leads';
import {
    fetchDeletedAgents,
    permanentDeleteAgent,
    restoreAgent,
    softDeleteAgent,
} from '../lib/agents';
import {
    fetchDeletedSubscribers,
    permanentDeleteSubscriber,
    restoreSubscriber,
    softDeleteSubscriber,
} from '../lib/newsletter';
import {
    fetchDeletedActionPlans,
    fetchDeletedOwners,
    permanentDeleteActionPlan,
    permanentDeleteOwner,
    restoreActionPlan,
    restoreOwner,
    softDeleteActionPlan,
    softDeleteOwner,
} from '../lib/owners/owners';

// ============================================================================
// Helpers (mismo patrón que properties.test.ts: la cadena se construye por
// test y `from` (mock compartido del setup) la devuelve para cualquier tabla).
// ============================================================================

function buildChain(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        returns: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        ...overrides,
    };
}

function mockFrom(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    const chain = buildChain(overrides);
    (from as unknown as Mock).mockReturnValue(chain);
    return chain;
}

/**
 * Mock para `eq` en funciones que encadenan `.eq()` retornable (intermedias,
 * ej. `select().eq().maybeSingle()`) y terminan con otro `.eq()` terminal
 * (ej. `delete().eq('id', id)`). Las primeras `chainableCalls` llamadas
 * devuelven el chain; la última resuelve con `terminal`.
 */
function eqWithTerminal(chainableCalls: number, terminal: unknown): Mock {
    let eq = vi.fn();
    for (let i = 0; i < chainableCalls; i++) {
        eq = eq.mockImplementationOnce(function (this: unknown) {
            return this;
        });
    }
    return eq.mockResolvedValueOnce(terminal) as Mock;
}

const storageFrom = supabase.storage.from as unknown as Mock;

beforeEach(() => {
    vi.clearAllMocks();
});

// ============================================================================
// Leads
// ============================================================================

describe('leads trash flows', () => {
    it('softDeleteLead sets deleted_at', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ error: null }) });
        await expect(softDeleteLead('lead-1')).resolves.toBeUndefined();
        expect(from).toHaveBeenCalledWith('leads');
        expect(chain.update).toHaveBeenCalledWith({ deleted_at: expect.any(String) });
    });

    it('restoreLead clears deleted_at', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ error: null }) });
        await expect(restoreLead('lead-1')).resolves.toBeUndefined();
        const patch = (chain.update as unknown as Mock).mock.calls[0][0];
        expect(patch.deleted_at).toBeNull();
    });

    it('permanentDeleteLead deletes the row', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ error: null }) });
        await expect(permanentDeleteLead('lead-1')).resolves.toBeUndefined();
        expect(chain.delete).toHaveBeenCalled();
    });

    it('throws on query error', async () => {
        mockFrom({ eq: vi.fn().mockResolvedValue({ error: { message: 'boom' } }) });
        await expect(softDeleteLead('lead-1')).rejects.toThrow('boom');
    });

    it('fetchDeletedLeads returns deleted rows', async () => {
        const chain = mockFrom({ returns: vi.fn().mockResolvedValue({ data: [], error: null }) });
        await expect(fetchDeletedLeads()).resolves.toEqual([]);
        expect(chain.not).toHaveBeenCalledWith('deleted_at', 'is', null);
        expect(chain.order).toHaveBeenCalledWith('deleted_at', { ascending: false });
    });

    it('fetchDeletedLeads throws on error', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
        });
        await expect(fetchDeletedLeads()).rejects.toThrow('boom');
    });
});

// ============================================================================
// Agents
// ============================================================================

describe('agents trash flows', () => {
    it('softDeleteAgent sets deleted_at', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ error: null }) });
        await expect(softDeleteAgent('agent-1')).resolves.toBeUndefined();
        expect(chain.update).toHaveBeenCalledWith({ deleted_at: expect.any(String) });
    });

    it('restoreAgent clears deleted_at', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ error: null }) });
        await expect(restoreAgent('agent-1')).resolves.toBeUndefined();
        const patch = (chain.update as unknown as Mock).mock.calls[0][0];
        expect(patch.deleted_at).toBeNull();
    });

    it('permanentDeleteAgent removes the photo from storage and deletes the row', async () => {
        const chain = mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({
                data: {
                    photo_url:
                        'https://supabase.co/storage/v1/object/public/agent-photos/agents/foto.jpg',
                },
                error: null,
            }),
            eq: eqWithTerminal(1, { error: null }),
        });
        await expect(permanentDeleteAgent('agent-1')).resolves.toBeUndefined();

        expect(chain.delete).toHaveBeenCalled();
        expect(storageFrom).toHaveBeenCalledWith('agent-photos');
        const bucket = storageFrom.mock.results[0].value;
        expect(bucket.remove).toHaveBeenCalledWith(['agents/foto.jpg']);
    });

    it('permanentDeleteAgent skips storage when there is no photo', async () => {
        const chain = mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: { photo_url: null }, error: null }),
            eq: eqWithTerminal(1, { error: null }),
        });
        await expect(permanentDeleteAgent('agent-1')).resolves.toBeUndefined();
        expect(chain.delete).toHaveBeenCalled();
        expect(storageFrom).not.toHaveBeenCalled();
    });

    it('fetchDeletedAgents returns deleted rows', async () => {
        const chain = mockFrom({ returns: vi.fn().mockResolvedValue({ data: [], error: null }) });
        await expect(fetchDeletedAgents()).resolves.toEqual([]);
        expect(chain.not).toHaveBeenCalledWith('deleted_at', 'is', null);
    });
});

// ============================================================================
// Newsletter
// ============================================================================

describe('newsletter trash flows', () => {
    const subscriberRow = {
        id: 'sub-1',
        email: 'test@example.com',
        source: 'landing_footer',
        status: 'active',
        created_at: '2026-01-01T00:00:00Z',
        deleted_at: null,
    };

    it('softDeleteSubscriber sets deleted_at', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ error: null }) });
        await expect(softDeleteSubscriber('sub-1')).resolves.toBeUndefined();
        expect(from).toHaveBeenCalledWith('newsletter_subscribers');
        expect(chain.update).toHaveBeenCalledWith({ deleted_at: expect.any(String) });
    });

    it('permanentDeleteSubscriber deletes the row', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ error: null }) });
        await expect(permanentDeleteSubscriber('sub-1')).resolves.toBeUndefined();
        expect(chain.delete).toHaveBeenCalled();
    });

    it('restoreSubscriber clears deleted_at and returns the refreshed subscriber', async () => {
        const chain = mockFrom({
            // 1ª llamada de eq: update().eq('id', id) → terminal
            // 2ª llamada de eq: select().eq('id', id) → retornable (sigue a maybeSingle)
            eq: vi.fn().mockResolvedValueOnce({ error: null }).mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: subscriberRow, error: null }),
        });
        const result = await restoreSubscriber('sub-1');
        expect(result).toEqual({
            id: 'sub-1',
            email: 'test@example.com',
            source: 'landing_footer',
            status: 'active',
            created_at: '2026-01-01T00:00:00Z',
            deleted_at: undefined,
        });
        const updatePatch = (chain.update as unknown as Mock).mock.calls[0][0];
        expect(updatePatch.deleted_at).toBeNull();
    });

    it('fetchDeletedSubscribers returns deleted rows', async () => {
        const chain = mockFrom({ returns: vi.fn().mockResolvedValue({ data: [], error: null }) });
        await expect(fetchDeletedSubscribers()).resolves.toEqual([]);
        expect(chain.not).toHaveBeenCalledWith('deleted_at', 'is', null);
    });

    it('fetchDeletedSubscribers throws on error', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
        });
        await expect(fetchDeletedSubscribers()).rejects.toThrow('boom');
    });
});

// ============================================================================
// Owners
// ============================================================================

describe('owners trash flows', () => {
    it('softDeleteOwner sets deleted_at', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ error: null }) });
        await expect(softDeleteOwner('owner-1')).resolves.toBeUndefined();
        expect(from).toHaveBeenCalledWith('owners');
        expect(chain.update).toHaveBeenCalledWith({ deleted_at: expect.any(String) });
    });

    it('restoreOwner clears deleted_at', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ error: null }) });
        await expect(restoreOwner('owner-1')).resolves.toBeUndefined();
        const patch = (chain.update as unknown as Mock).mock.calls[0][0];
        expect(patch.deleted_at).toBeNull();
    });

    it('permanentDeleteOwner deletes the row', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ error: null }) });
        await expect(permanentDeleteOwner('owner-1')).resolves.toBeUndefined();
        expect(chain.delete).toHaveBeenCalled();
    });

    it('throws on query error', async () => {
        mockFrom({ eq: vi.fn().mockResolvedValue({ error: { message: 'boom' } }) });
        await expect(softDeleteOwner('owner-1')).rejects.toThrow('boom');
    });

    it('fetchDeletedOwners returns deleted rows (order terminal, sin .returns)', async () => {
        const chain = mockFrom({ order: vi.fn().mockResolvedValue({ data: [], error: null }) });
        await expect(fetchDeletedOwners()).resolves.toEqual([]);
        expect(chain.not).toHaveBeenCalledWith('deleted_at', 'is', null);
    });

    it('fetchDeletedOwners throws on error', async () => {
        mockFrom({ order: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }) });
        await expect(fetchDeletedOwners()).rejects.toThrow('boom');
    });
});

// ============================================================================
// Action Plans
// ============================================================================

describe('action plans trash flows', () => {
    it('softDeleteActionPlan sets deleted_at', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ error: null }) });
        await expect(softDeleteActionPlan('plan-1')).resolves.toBeUndefined();
        expect(from).toHaveBeenCalledWith('property_action_plans');
        expect(chain.update).toHaveBeenCalledWith({ deleted_at: expect.any(String) });
    });

    it('restoreActionPlan clears deleted_at', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ error: null }) });
        await expect(restoreActionPlan('plan-1')).resolves.toBeUndefined();
        const patch = (chain.update as unknown as Mock).mock.calls[0][0];
        expect(patch.deleted_at).toBeNull();
    });

    it('permanentDeleteActionPlan deletes the row', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ error: null }) });
        await expect(permanentDeleteActionPlan('plan-1')).resolves.toBeUndefined();
        expect(chain.delete).toHaveBeenCalled();
    });

    it('fetchDeletedActionPlans returns deleted rows (order terminal)', async () => {
        const chain = mockFrom({ order: vi.fn().mockResolvedValue({ data: [], error: null }) });
        await expect(fetchDeletedActionPlans()).resolves.toEqual([]);
        expect(chain.not).toHaveBeenCalledWith('deleted_at', 'is', null);
    });

    it('fetchDeletedActionPlans throws on error', async () => {
        mockFrom({ order: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }) });
        await expect(fetchDeletedActionPlans()).rejects.toThrow('boom');
    });
});
