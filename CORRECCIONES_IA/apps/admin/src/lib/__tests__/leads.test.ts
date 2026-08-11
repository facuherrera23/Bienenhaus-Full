import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { from } from '../../test/setup';
import {
    addLeadTag,
    autoAssignLead,
    bulkAutoAssignLeads,
    bulkImportLeadsParsed,
    calculateLeadScore,
    createLead,
    embedName,
    embedTitle,
    fetchLead,
    fetchLeads,
    getNextAgentForAssignment,
    importLeadsFromCsv,
    LEAD_INTENT_LABEL,
    LEAD_SOURCE_LABEL,
    LEAD_STATUS_LABEL,
    LEAD_STATUS_ORDER,
    LEAD_STATUS_TONE,
    parseLeadsCsv,
    permanentDeleteLead,
    recalculateLeadScore,
    removeLeadTag,
    restoreLead,
    setLeadTags,
    softDeleteLead,
    toLeadDetail,
    toLeadRow,
    updateLead,
    updateLeadStatus,
} from '../leads';
import type { LeadApiRow } from '../leads';
import { LeadIntentSchema, LeadSourceSchema, LeadStatusSchema } from '../_shared/leads-validation';

// ============================================================================
// Helpers
// ============================================================================

function buildChain(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
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

const leadApiRow = {
    id: 'lead-1',
    name: 'Ana',
    last_name: 'Perez',
    email: 'ana@test.com',
    phone: '+5491122334455',
    city: 'CABA',
    intent: 'comprar',
    message: 'Quiero una casa con jardin grande para mi familia numerosa',
    source: 'landing_form',
    status: 'nuevo',
    notes: null,
    assigned_to: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    deleted_at: null,
    agent: { name: 'Juan' },
    property: { title: 'Casa Centro' },
    tags: ['urgente'],
    score: 85,
} as unknown as LeadApiRow;

beforeEach(() => {
    vi.clearAllMocks();
});

// ============================================================================
// Labels y arrays de dominio
// ============================================================================

describe('LeadStatus / LeadIntent / LeadSource arrays', () => {
    it('define the canonical domain values', () => {
        expect(LeadStatusSchema.options).toEqual([
            'nuevo',
            'contactado',
            'calificado',
            'en_proceso',
            'cerrado_ganado',
            'cerrado_perdido',
        ]);
        expect(LeadIntentSchema.options).toContain('comprar');
        expect(LeadIntentSchema.options).toContain('tasar');
        expect(LeadSourceSchema.options).toContain('landing_form');
        expect(LeadSourceSchema.options).toContain('ml_contacto');
    });
});

describe('LEAD_STATUS_LABEL', () => {
    it('maps every status to a human label', () => {
        expect(LEAD_STATUS_LABEL.nuevo).toBe('Nuevo');
        expect(LEAD_STATUS_LABEL.cerrado_ganado).toBe('Ganado');
        expect(LEAD_STATUS_LABEL.cerrado_perdido).toBe('Perdido');
        expect(Object.keys(LEAD_STATUS_LABEL).length).toBe(LeadStatusSchema.options.length);
    });
});

describe('LEAD_STATUS_TONE', () => {
    it('assigns tones to all statuses', () => {
        expect(LEAD_STATUS_TONE.cerrado_ganado).toBe('success');
        expect(LEAD_STATUS_TONE.cerrado_perdido).toBe('danger');
        expect(Object.keys(LEAD_STATUS_TONE).length).toBe(LeadStatusSchema.options.length);
    });
});

describe('LEAD_STATUS_ORDER', () => {
    it('orders statuses from nuevo to cerrado_perdido', () => {
        expect(LEAD_STATUS_ORDER.nuevo).toBeLessThan(LEAD_STATUS_ORDER.en_proceso);
        expect(LEAD_STATUS_ORDER.en_proceso).toBeLessThan(LEAD_STATUS_ORDER.cerrado_ganado);
        expect(LEAD_STATUS_ORDER.cerrado_perdido).toBe(5);
    });
});

describe('LEAD_INTENT_LABEL', () => {
    it('maps every intent to a label', () => {
        expect(LEAD_INTENT_LABEL.comprar).toBe('Comprar');
        expect(LEAD_INTENT_LABEL.tasar).toBe('Tasar');
        expect(Object.keys(LEAD_INTENT_LABEL).length).toBe(LeadIntentSchema.options.length);
    });
});

describe('LEAD_SOURCE_LABEL', () => {
    it('maps every source to a label', () => {
        expect(LEAD_SOURCE_LABEL.whatsapp).toBe('WhatsApp');
        expect(LEAD_SOURCE_LABEL.ml_contacto).toBe('Mercado Libre');
        expect(Object.keys(LEAD_SOURCE_LABEL).length).toBe(LeadSourceSchema.options.length);
    });
});

// ============================================================================
// embedName / embedTitle
// ============================================================================

describe('embedName', () => {
    it('returns null for null input', () => {
        expect(embedName(null)).toBeNull();
    });

    it('returns name from object', () => {
        expect(embedName({ name: 'Juan' })).toBe('Juan');
    });

    it('returns first element name from array', () => {
        expect(embedName([{ name: 'Juan' }, { name: 'Maria' }])).toBe('Juan');
    });

    it('returns null for empty array', () => {
        expect(embedName([])).toBeNull();
    });
});

describe('embedTitle', () => {
    it('returns null for null input', () => {
        expect(embedTitle(null)).toBeNull();
    });

    it('returns title from object and array', () => {
        expect(embedTitle({ title: 'Casa' })).toBe('Casa');
        expect(embedTitle([{ title: 'Depto' }])).toBe('Depto');
    });
});

// ============================================================================
// toLeadRow
// ============================================================================

describe('toLeadRow', () => {
    it('maps a full API row into a LeadRow', () => {
        const row = toLeadRow(leadApiRow);
        expect(row.id).toBe('lead-1');
        expect(row.name).toBe('Ana');
        expect(row.intent).toBe('comprar');
        expect(row.source).toBe('landing_form');
        expect(row.status).toBe('nuevo');
        expect(row.agent).toBe('Juan');
        expect(row.tags).toEqual(['urgente']);
        expect(row.score).toBe(85);
    });

    it('defaults tags and score when missing', () => {
        const row = toLeadRow({
            ...leadApiRow,
            agent: null,
            tags: null,
            score: null,
        });
        expect(row.agent).toBeNull();
        expect(row.tags).toEqual([]);
        expect(row.score).toBe(0);
    });

    it('resolves embedded agent arrays to the first element', () => {
        const row = toLeadRow({ ...leadApiRow, agent: [{ name: 'Maria' }] });
        expect(row.agent).toBe('Maria');
    });
});

describe('toLeadDetail', () => {
    it('maps embedded relations into detail fields', () => {
        const detail = toLeadDetail(leadApiRow);
        expect(detail.agent_name).toBe('Juan');
        expect(detail.property_title).toBe('Casa Centro');
        expect(detail.notes).toBeNull();
        expect(detail.assigned_to).toBeNull();
    });
});

// ============================================================================
// calculateLeadScore
// ============================================================================

describe('calculateLeadScore', () => {
    it('scores intent + source base points', () => {
        expect(calculateLeadScore({ intent: 'comprar', source: 'referido' })).toBe(60);
        expect(calculateLeadScore({ intent: 'vender', source: 'telefono' })).toBe(50);
        expect(calculateLeadScore({ intent: 'otro', source: 'manual' })).toBe(15);
    });

    it('adds +10 for long messages (>50 chars)', () => {
        const longMessage = 'x'.repeat(51);
        expect(calculateLeadScore({ intent: 'comprar', source: 'manual', message: longMessage })).toBe(50);
    });

    it('adds +5 for medium messages (21-50 chars)', () => {
        const mediumMessage = 'x'.repeat(25);
        expect(calculateLeadScore({ intent: 'comprar', source: 'manual', message: mediumMessage })).toBe(45);
    });

    it('adds nothing for short messages (<=20 chars)', () => {
        const shortMessage = 'x'.repeat(20);
        expect(calculateLeadScore({ intent: 'comprar', source: 'manual', message: shortMessage })).toBe(40);
    });

    it('adds +10 for valid phone (>=10 digits) and +5 for city', () => {
        expect(
            calculateLeadScore({
                intent: 'comprar',
                source: 'manual',
                phone: '1122334455',
                city: 'CABA',
            }),
        ).toBe(55);
    });

    it('ignores short phone numbers', () => {
        expect(calculateLeadScore({ intent: 'comprar', source: 'manual', phone: '123' })).toBe(40);
    });

    it('caps the total score at 100', () => {
        const score = calculateLeadScore({
            intent: 'comprar',
            source: 'referido',
            message: 'x'.repeat(60),
            phone: '1122334455',
            city: 'CABA',
        });
        expect(score).toBeLessThanOrEqual(100);
        expect(score).toBe(85);
    });
});

// ============================================================================
// parseLeadsCsv
// ============================================================================

describe('parseLeadsCsv', () => {
    const validCsv = [
        'name,last_name,email,intent,source',
        'Ana,Perez,ana@test.com,comprar,landing_form',
        'Luis,Gomez,luis@test.com,vender,whatsapp',
    ].join('\n');

    it('parses a valid CSV into CsvLeadRow objects', async () => {
        const { valid, errors } = await parseLeadsCsv(validCsv);
        expect(errors).toEqual([]);
        expect(valid).toHaveLength(2);
        expect(valid[0]).toMatchObject({
            name: 'Ana',
            last_name: 'Perez',
            email: 'ana@test.com',
            intent: 'comprar',
            source: 'landing_form',
            status: 'nuevo',
        });
    });

    it('rejects empty CSV', async () => {
        const { valid, errors } = await parseLeadsCsv('');
        expect(valid).toEqual([]);
        expect(errors[0].message).toContain('CSV vac');
    });

    it('rejects CSV missing a required header', async () => {
        const csv = ['name,last_name,email,intent', 'Ana,Perez,ana@test.com,comprar'].join('\n');
        const { valid, errors } = await parseLeadsCsv(csv);
        expect(valid).toEqual([]);
        expect(errors[0].message).toContain('Falta columna requerida: source');
    });

    it('rejects rows with invalid intent', async () => {
        const csv = [
            'name,last_name,email,intent,source',
            'Ana,Perez,ana@test.com,comprar,landing_form',
            'Luis,Gomez,luis@test.com,noexiste,whatsapp',
        ].join('\n');
        const { valid, errors } = await parseLeadsCsv(csv);
        expect(valid).toHaveLength(1);
        expect(errors[0].message).toContain('Intent inv');
    });

    it('rejects rows with invalid source', async () => {
        const csv = [
            'name,last_name,email,intent,source',
            'Luis,Gomez,luis@test.com,vender,noexiste',
        ].join('\n');
        const { valid, errors } = await parseLeadsCsv(csv);
        expect(valid).toHaveLength(0);
        expect(errors[0].message).toContain('Source inv');
    });

    it('rejects rows with wrong column count', async () => {
        const csv = [
            'name,last_name,email,intent,source',
            'Ana,Perez,ana@test.com',
        ].join('\n');
        const { valid, errors } = await parseLeadsCsv(csv);
        expect(valid).toHaveLength(0);
        expect(errors[0].message).toContain('N');
    });

    it('keeps a provided status', async () => {
        const csv = [
            'name,last_name,email,intent,source,status',
            'Ana,Perez,ana@test.com,comprar,landing_form,calificado',
        ].join('\n');
        const { valid } = await parseLeadsCsv(csv);
        expect(valid[0].status).toBe('calificado');
    });
});

// ============================================================================
// API Functions - Fetch
// ============================================================================

describe('fetchLeads', () => {
    it('maps API rows via toLeadRow', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({ data: [leadApiRow], error: null }),
        });
        const result = await fetchLeads();
        expect(result.data).toHaveLength(1);
        expect(result.data[0].agent).toBe('Juan');
        expect(result.data[0].tags).toEqual(['urgente']);
    });

    it('returns empty array when no data', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
        await expect(fetchLeads()).resolves.toEqual({
            data: [],
            page: 1,
            pageSize: 20,
            hasMore: false,
        });
    });

    it('throws on error', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
        });
        await expect(fetchLeads()).rejects.toThrow('boom');
    });
});

describe('fetchLead', () => {
    it('returns detail when found', async () => {
        mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: leadApiRow, error: null }),
        });
        const detail = await fetchLead('lead-1');
        expect(detail.agent_name).toBe('Juan');
        expect(detail.property_title).toBe('Casa Centro');
    });

    it('throws when not found', async () => {
        mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
        await expect(fetchLead('nope')).rejects.toThrow('Lead no encontrado');
    });

    it('throws on error', async () => {
        mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
        });
        await expect(fetchLead('lead-1')).rejects.toThrow('boom');
    });
});

// ============================================================================
// API Functions - CRUD
// ============================================================================

describe('createLead', () => {
    it('creates a lead and returns its id', async () => {
        const chain = mockFrom({
            single: vi.fn().mockResolvedValue({ data: { id: 'new-1' }, error: null }),
        });
        const id = await createLead({
            name: '  Ana  ',
            last_name: ' Perez ',
            email: 'ana@test.com',
            phone: '1122334455',
            city: 'CABA',
            intent: 'comprar',
            source: 'landing_form',
            status: 'nuevo',
            assigned_to: '',
            message: ' Hola ',
        });
        expect(id).toBe('new-1');
        const insertPayload = (chain.insert as unknown as Mock).mock.calls[0][0];
        expect(insertPayload.name).toBe('Ana');
        expect(insertPayload.last_name).toBe('Perez');
        expect(insertPayload.message).toBe('Hola');
    });

    it('throws on error', async () => {
        mockFrom({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
        });
        await expect(
            createLead({
                name: 'Ana',
                last_name: 'Perez',
                email: 'ana@test.com',
                phone: '',
                city: '',
                intent: 'comprar',
                source: 'manual',
                status: 'nuevo',
                assigned_to: '',
                message: '',
            }),
        ).rejects.toThrow('boom');
    });
});

describe('updateLead / updateLeadStatus', () => {
    it('updates a lead without error', async () => {
        mockFrom({ eq: vi.fn().mockResolvedValue({ error: null }) });
        await expect(updateLead('lead-1', { status: 'contactado' })).resolves.toBeUndefined();
        await expect(updateLeadStatus('lead-1', 'contactado')).resolves.toBeUndefined();
    });

    it('throws on update error', async () => {
        mockFrom({ eq: vi.fn().mockResolvedValue({ error: { message: 'boom' } }) });
        await expect(updateLead('lead-1', { status: 'contactado' })).rejects.toThrow('boom');
    });
});

// ============================================================================
// API Functions - Soft Delete & Restore
// ============================================================================

describe('softDeleteLead / restoreLead / permanentDeleteLead', () => {
    it('soft deletes, restores and purges without error', async () => {
        mockFrom({ eq: vi.fn().mockResolvedValue({ error: null }) });
        await expect(softDeleteLead('lead-1')).resolves.toBeUndefined();
        await expect(restoreLead('lead-1')).resolves.toBeUndefined();
        await expect(permanentDeleteLead('lead-1')).resolves.toBeUndefined();
    });

    it('throws when supabase returns an error', async () => {
        mockFrom({ eq: vi.fn().mockResolvedValue({ error: { message: 'boom' } }) });
        await expect(softDeleteLead('lead-1')).rejects.toThrow('boom');
        await expect(restoreLead('lead-1')).rejects.toThrow('boom');
        await expect(permanentDeleteLead('lead-1')).rejects.toThrow('boom');
    });
});

// ============================================================================
// API Functions - Assignment
// ============================================================================

describe('getNextAgentForAssignment', () => {
    it('returns the agent with fewer leads', async () => {
        mockFrom({
            limit: vi.fn().mockResolvedValue({
                data: [{ id: 'a1', name: 'Juan' }],
                error: null,
            }),
        });
        await expect(getNextAgentForAssignment()).resolves.toEqual({ id: 'a1', name: 'Juan' });
    });

    it('returns null when there are no agents', async () => {
        mockFrom({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        });
        await expect(getNextAgentForAssignment()).resolves.toBeNull();
    });

    it('throws on error', async () => {
        mockFrom({
            limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
        });
        await expect(getNextAgentForAssignment()).rejects.toThrow('boom');
    });
});

describe('autoAssignLead', () => {
    it('assigns the lead to the next agent', async () => {
        mockFrom({
            limit: vi.fn().mockResolvedValue({
                data: [{ id: '11111111-1111-1111-1111-111111111111', name: 'Juan' }],
                error: null,
            }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        });
        await expect(autoAssignLead('lead-1')).resolves.toEqual({
            agentId: '11111111-1111-1111-1111-111111111111',
            agentName: 'Juan',
        });
    });

    it('returns null when no agent is available', async () => {
        mockFrom({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        });
        await expect(autoAssignLead('lead-1')).resolves.toBeNull();
    });
});

describe('bulkAutoAssignLeads', () => {
    it('counts assigned and skipped leads', async () => {
        mockFrom({
            limit: vi.fn().mockResolvedValue({
                data: [{ id: '11111111-1111-1111-1111-111111111111', name: 'Juan' }],
                error: null,
            }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        });
        await expect(bulkAutoAssignLeads(['l1', 'l2', 'l3'])).resolves.toEqual({
            assigned: 3,
            skipped: 0,
        });
    });

    it('skips leads when there are no agents', async () => {
        mockFrom({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        });
        await expect(bulkAutoAssignLeads(['l1', 'l2'])).resolves.toEqual({
            assigned: 0,
            skipped: 2,
        });
    });
});

// ============================================================================
// API Functions - Score
// ============================================================================

describe('recalculateLeadScore', () => {
    it('recalculates and persists the score', async () => {
        const chain = mockFrom({
            single: vi.fn().mockResolvedValue({
                data: {
                    intent: 'comprar',
                    source: 'referido',
                    message: null,
                    phone: null,
                    city: null,
                },
                error: null,
            }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        });
        await expect(recalculateLeadScore('lead-1')).resolves.toBe(60);
        const updatePayload = (chain.update as unknown as Mock).mock.calls[0][0];
        expect(updatePayload.score).toBe(60);
    });

    it('returns 0 when the lead does not exist', async () => {
        mockFrom({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
        await expect(recalculateLeadScore('nope')).resolves.toBe(0);
    });
});

// ============================================================================
// API Functions - Tags
// ============================================================================

describe('addLeadTag', () => {
    it('adds a new tag', async () => {
        const chain = mockFrom({
            single: vi.fn().mockResolvedValue({ data: { tags: ['a'] }, error: null }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        });
        await expect(addLeadTag('lead-1', 'b')).resolves.toBeUndefined();
        const updatePayload = (chain.update as unknown as Mock).mock.calls[0][0];
        expect(updatePayload.tags).toEqual(['a', 'b']);
    });

    it('skips update when the tag already exists', async () => {
        const chain = mockFrom({
            single: vi.fn().mockResolvedValue({ data: { tags: ['a'] }, error: null }),
        });
        await expect(addLeadTag('lead-1', 'a')).resolves.toBeUndefined();
        expect(chain.update as unknown as Mock).not.toHaveBeenCalled();
    });

    it('handles missing tags array', async () => {
        const chain = mockFrom({
            single: vi.fn().mockResolvedValue({ data: { tags: null }, error: null }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        });
        await expect(addLeadTag('lead-1', 'x')).resolves.toBeUndefined();
        const updatePayload = (chain.update as unknown as Mock).mock.calls[0][0];
        expect(updatePayload.tags).toEqual(['x']);
    });
});

describe('removeLeadTag', () => {
    it('removes an existing tag', async () => {
        const chain = mockFrom({
            single: vi.fn().mockResolvedValue({ data: { tags: ['a', 'b'] }, error: null }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        });
        await expect(removeLeadTag('lead-1', 'a')).resolves.toBeUndefined();
        const updatePayload = (chain.update as unknown as Mock).mock.calls[0][0];
        expect(updatePayload.tags).toEqual(['b']);
    });
});

describe('setLeadTags', () => {
    it('sets the full tag list', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ error: null }) });
        await expect(setLeadTags('lead-1', ['x', 'y'])).resolves.toBeUndefined();
        const updatePayload = (chain.update as unknown as Mock).mock.calls[0][0];
        expect(updatePayload.tags).toEqual(['x', 'y']);
    });
});

// ============================================================================
// API Functions - Import
// ============================================================================

describe('importLeadsFromCsv', () => {
    it('imports valid rows and reports per-row errors', async () => {
        mockFrom({
            single: vi.fn().mockResolvedValue({ data: { id: 'new-1' }, error: null }),
        });
        const csv = [
            'name,last_name,email,intent,source',
            'Ana,Perez,ana@test.com,comprar,landing_form',
            'Luis,Gomez,luis@test.com,noexiste,whatsapp',
        ].join('\n');
        const { created, errors } = await importLeadsFromCsv(csv);
        expect(created).toBe(1);
        expect(errors.some((e) => e.message.includes('Intent inv'))).toBe(true);
    });

    it('returns zero created for empty CSV', async () => {
        const { created, errors } = await importLeadsFromCsv('');
        expect(created).toBe(0);
        expect(errors.length).toBeGreaterThan(0);
    });
});

describe('bulkImportLeadsParsed', () => {
    it('creates leads for each parsed row', async () => {
        mockFrom({
            single: vi.fn().mockResolvedValue({ data: { id: 'new-1' }, error: null }),
        });
        const { created, errors } = await bulkImportLeadsParsed([
            {
                name: 'Ana',
                last_name: 'Perez',
                email: 'ana@test.com',
                intent: 'comprar',
                source: 'manual',
            },
            {
                name: 'Luis',
                last_name: 'Gomez',
                email: 'luis@test.com',
                intent: 'vender',
                source: 'whatsapp',
            },
        ]);
        expect(created).toBe(2);
        expect(errors).toEqual([]);
    });

    it('collects errors from failed inserts', async () => {
        mockFrom({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
        });
        const { created, errors } = await bulkImportLeadsParsed([
            {
                name: 'Ana',
                last_name: 'Perez',
                email: 'ana@test.com',
                intent: 'comprar',
                source: 'manual',
            },
        ]);
        expect(created).toBe(0);
        expect(errors[0].message).toBe('boom');
    });
});
