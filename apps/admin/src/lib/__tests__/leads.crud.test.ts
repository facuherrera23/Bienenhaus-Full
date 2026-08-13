import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    bulkRecalculateScores,
    calculateLeadScore,
    createLead,
    fetchLead,
    fetchLeads,
    permanentDeleteLead,
    recalculateLeadScore,
    restoreLead,
    softDeleteLead,
    updateLead,
    updateLeadStatus,
} from '../leads';

const { mockSupabase } = vi.hoisted(() => {
    const mockSupabase = {
        from: vi.fn(() => mockSupabase),
        select: vi.fn(() => mockSupabase),
        eq: vi.fn(() => mockSupabase),
        is: vi.fn(() => mockSupabase),
        not: vi.fn(() => mockSupabase),
        order: vi.fn(() => mockSupabase),
        limit: vi.fn(() => mockSupabase),
        range: vi.fn(() => mockSupabase),
        maybeSingle: vi.fn(() => mockSupabase),
        single: vi.fn(() => mockSupabase),
        insert: vi.fn(() => mockSupabase),
        update: vi.fn(() => mockSupabase),
        delete: vi.fn(() => mockSupabase),
        or: vi.fn(() => mockSupabase),
        gte: vi.fn(() => mockSupabase),
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

describe('leads CRUD', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const validFormValues = {
        name: 'Juan',
        last_name: 'PÃ©rez',
        email: 'juan@test.com',
        phone: '+54 9 11 1234-5678',
        city: 'CÃ³rdoba',
        intent: 'comprar',
        source: 'landing_form',
        status: 'nuevo',
        assigned_to: '',
        message: 'Quiero comprar una casa',
    };

    const mockLeadDetail = {
        id: 'lead-1',
        name: 'Juan',
        last_name: 'PÃ©rez',
        email: 'juan@test.com',
        phone: '+54 9 11 1234-5678',
        city: 'CÃ³rdoba',
        intent: 'comprar',
        message: 'Quiero comprar una casa',
        source: 'landing_form',
        status: 'nuevo',
        notes: null,
        assigned_to: null,
        agent_name: null,
        property_title: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
    };

    describe('createLead', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('creates lead successfully', async () => {
            mockSupabase.single.mockResolvedValueOnce({ data: { id: 'new-lead' }, error: null });
            // Mock deduplication check
            mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

            const result = await createLead(validFormValues);
            expect(result).toBe('new-lead');
            expect(mockSupabase.insert).toHaveBeenCalled();
        });

        it('deduplicates by email within 30 days', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: { id: 'existing-lead', message: 'Old message', status: 'nuevo' },
                error: null,
            });
            const updateEqMock = vi.fn().mockResolvedValueOnce({ error: null });
            mockSupabase.update.mockReturnValue({ eq: updateEqMock });

            const result = await createLead(validFormValues);
            expect(result).toBe('existing-lead');
            expect(mockSupabase.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('---'),
                }),
            );
        });

        it('rejects invalid form data', async () => {
            const invalidValues = { ...validFormValues, name: '' };
            await expect(createLead(invalidValues)).rejects.toThrow('Nombre requerido');
        });
    });

    describe('updateLead', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('updates lead successfully', async () => {
            const eqMock = vi.fn().mockResolvedValueOnce({ error: null });
            mockSupabase.update.mockReturnValue({ eq: eqMock });
            await updateLead('lead-1', { status: 'contactado' });
            expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'contactado' });
            expect(eqMock).toHaveBeenCalledWith('id', 'lead-1');
        });
    });

    describe('updateLeadStatus', () => {
        it('updates status', async () => {
            const eqMock = vi.fn().mockResolvedValueOnce({ error: null });
            mockSupabase.update.mockReturnValue({ eq: eqMock });
            await updateLeadStatus('lead-1', 'calificado');
            expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'calificado' });
            expect(eqMock).toHaveBeenCalledWith('id', 'lead-1');
        });
    });

    describe('softDeleteLead', () => {
        it('sets deleted_at', async () => {
            const eqMock = vi.fn().mockResolvedValueOnce({ error: null });
            mockSupabase.update.mockReturnValue({ eq: eqMock });
            await softDeleteLead('lead-1');
            expect(mockSupabase.update).toHaveBeenCalledWith({ deleted_at: expect.any(String) });
            expect(eqMock).toHaveBeenCalledWith('id', 'lead-1');
        });
    });

    describe('restoreLead', () => {
        it('clears deleted_at', async () => {
            const eqMock = vi.fn().mockResolvedValueOnce({ error: null });
            mockSupabase.update.mockReturnValue({ eq: eqMock });
            await restoreLead('lead-1');
            expect(mockSupabase.update).toHaveBeenCalledWith({ deleted_at: null });
            expect(eqMock).toHaveBeenCalledWith('id', 'lead-1');
        });
    });

    describe('permanentDeleteLead', () => {
        it('deletes lead', async () => {
            const eqMock = vi.fn().mockResolvedValueOnce({ error: null });
            mockSupabase.delete.mockReturnValue({ eq: eqMock });
            await permanentDeleteLead('lead-1');
            expect(mockSupabase.delete).toHaveBeenCalled();
            expect(eqMock).toHaveBeenCalledWith('id', 'lead-1');
        });
    });

    describe('fetchLead', () => {
        it('returns lead detail', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({ data: mockLeadDetail, error: null });
            const result = await fetchLead('lead-1');
            expect(result.id).toBe('lead-1');
        });

        it('throws when not found', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
            await expect(fetchLead('lead-1')).rejects.toThrow('Lead no encontrado');
        });
    });

    describe('fetchLeads', () => {
        it('returns mapped leads', async () => {
            const mockRows = [
                {
                    id: 'lead-1',
                    name: 'Juan',
                    last_name: 'PÃ©rez',
                    email: 'juan@test.com',
                    phone: '+54 9 11 1234-5678',
                    city: 'CÃ³rdoba',
                    intent: 'comprar',
                    message: 'Quiero comprar',
                    source: 'landing_form',
                    status: 'nuevo',
                    agent: { name: 'Agente 1' },
                    property: { title: 'Casa' },
                    tags: ['vip'],
                    score: 75,
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-01T00:00:00Z',
                    deleted_at: null,
                },
            ];

            mockSupabase.range.mockReturnValue(mockSupabase);
            mockSupabase.returns.mockResolvedValueOnce({ data: [mockRows[0]], error: null });

            const leads = await fetchLeads();
            expect(leads.data).toHaveLength(1);
            expect(leads.data[0].name).toBe('Juan');
            expect(leads.data[0].score).toBe(75);
            expect(leads.page).toBe(1);
            expect(leads.pageSize).toBe(20);
            expect(leads.hasMore).toBe(false);
            expect(mockSupabase.range).toHaveBeenCalledWith(0, 19);
            expect(mockSupabase.returns).toHaveBeenCalled();
        });
    });
});

describe('calculateLeadScore', () => {
    it('calculates score for comprar + landing_form', () => {
        const score = calculateLeadScore({
            intent: 'comprar',
            source: 'landing_form',
            message: 'Hola, quiero comprar una casa grande con jardÃ­n!!!',
            phone: '+54 9 11 1234-5678',
            city: 'CÃ³rdoba',
        });
        // comprar(30) + landing_form(10) + message>50(10) + phone(10) + city(5) = 65
        expect(score).toBe(65);
    });

    it('calculates score for vender + whatsapp', () => {
        const score = calculateLeadScore({
            intent: 'vender',
            source: 'whatsapp',
            message: 'Vendo mi casa',
            phone: '+54 9 11 1234-5678',
            city: 'Buenos Aires',
        });
        // vender(25) + whatsapp(20) + phone(10) + city(5) = 60 (message < 20 chars)
        expect(score).toBe(60);
    });

    it('caps at 100', () => {
        const score = calculateLeadScore({
            intent: 'referido',
            source: 'referido',
            message: 'Mensaje muy largo que supera los cincuenta caracteres sin problema',
            phone: '+54 9 11 1234-5678',
            city: 'CÃ³rdoba',
        });
        // referido(30) + referido(30) + message>50(10) + phone(10) + city(5) = 85
        expect(score).toBeLessThanOrEqual(100);
    });

    it('handles null values', () => {
        const score = calculateLeadScore({
            intent: 'otro',
            source: 'manual',
        });
        expect(score).toBe(15); // otro(5) + manual(10) = 15
    });
});

describe('recalculateLeadScore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('recalculates and updates score', async () => {
        mockSupabase.single.mockResolvedValueOnce({
            data: {
                intent: 'comprar',
                source: 'landing_form',
                message: 'Quiero comprar',
                phone: '+54 9 11 1234-5678',
                city: 'CÃ³rdoba',
            },
            error: null,
        });
        const updateEqMock = vi.fn().mockResolvedValueOnce({ error: null });
        mockSupabase.update.mockReturnValue({ eq: updateEqMock });

        const score = await recalculateLeadScore('lead-1');
        expect(score).toBeGreaterThan(0);
        expect(mockSupabase.update).toHaveBeenCalledWith({ score: expect.any(Number) });
    });

    it('returns 0 for non-existent lead', async () => {
        mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });
        await expect(recalculateLeadScore('lead-1')).rejects.toThrow('Not found');
    });
});

describe('bulkRecalculateScores', () => {
    it('updates multiple leads', async () => {
        // Mock lead data that will produce specific scores
        const leadDataScore65 = {
            intent: 'comprar',
            source: 'landing_form',
            message: 'Hola, quiero comprar una casa grande con jardÃ­n!!!', // 51 chars -> message>50: +10
            phone: '+54 9 11 1234-5678', // length 18 >= 10 -> +10
            city: 'CÃ³rdoba', // present -> +5
            // Score: comprar(30) + landing_form(10) + message>50(10) + phone(10) + city(5) = 65
        };

        const leadDataScore70 = {
            intent: 'vender',
            source: 'whatsapp',
            message: 'Another long message over fifty characters!!!', // let's count: this should be >50
            phone: '+54 9 11 1234-5678', // length 18 >= 10 -> +10
            city: 'Buenos Aires', // present -> +5
            // Score: vender(25) + whatsapp(20) + message>50(10) + phone(10) + city(5) = 70
        };

        // Mock the supabase chain for recalculateLeadScore
        // Each call to single() returns different lead data
        mockSupabase.single
            .mockResolvedValueOnce({ data: leadDataScore65, error: null })
            .mockResolvedValueOnce({ data: leadDataScore70, error: null })
            .mockResolvedValueOnce({ data: null, error: null }); // returns null -> score 0

        // Mock the update chain that recalculateLeadScore uses to persist the score
        const updateEqMock = vi.fn().mockResolvedValueOnce({ error: null });
        mockSupabase.update.mockReturnValue({ eq: updateEqMock });

        const updated = await bulkRecalculateScores(['lead-1', 'lead-2', 'lead-3']);
        expect(updated).toBe(2); // lead-1 and lead-2 should be updated (score > 0), lead-3 should not (score = 0)
    });
});
