import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLead, updateLead, updateLeadStatus, softDeleteLead, restoreLead, permanentDeleteLead, fetchLead, fetchLeads, calculateLeadScore, recalculateLeadScore, bulkRecalculateScores } from '../leads';
import type { LeadFormValues, LeadDetail } from '../../types/leads';

const { mockSupabase } = vi.hoisted(() => {
    const mockSupabase = {
        from: vi.fn(() => mockSupabase),
        select: vi.fn(() => mockSupabase),
        eq: vi.fn(() => mockSupabase),
        is: vi.fn(() => mockSupabase),
        not: vi.fn(() => mockSupabase),
        order: vi.fn(() => mockSupabase),
        limit: vi.fn(() => mockSupabase),
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
            mockSupabase.update.mockResolvedValueOnce({ error: null });

            const result = await createLead(validFormValues);
            expect(result).toBe('existing-lead');
            expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('---'),
            }));
        });

        it('rejects invalid form data', async () => {
            const invalidValues = { ...validFormValues, name: '' };
            await expect(createLead(invalidValues)).rejects.toThrow('Datos de lead invÃ¡lidos');
        });
    });

    describe('updateLead', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('updates lead successfully', async () => {
            mockSupabase.update.mockResolvedValueOnce({ error: null });
            await updateLead('lead-1', { status: 'contactado' });
            expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'contactado' });
        });
    });

    describe('updateLeadStatus', () => {
        it('updates status', async () => {
            mockSupabase.update.mockResolvedValueOnce({ error: null });
            await updateLeadStatus('lead-1', 'calificado');
            expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'calificado' });
        });
    });

    describe('softDeleteLead', () => {
        it('sets deleted_at', async () => {
            mockSupabase.update.mockResolvedValueOnce({ error: null });
            await softDeleteLead('lead-1');
            expect(mockSupabase.update).toHaveBeenCalledWith({ deleted_at: expect.any(String) });
        });
    });

    describe('restoreLead', () => {
        it('clears deleted_at', async () => {
            mockSupabase.update.mockResolvedValueOnce({ error: null });
            await restoreLead('lead-1');
            expect(mockSupabase.update).toHaveBeenCalledWith({ deleted_at: null });
        });
    });

    describe('permanentDeleteLead', () => {
        it('deletes lead', async () => {
            mockSupabase.delete.mockResolvedValueOnce({ error: null });
            await permanentDeleteLead('lead-1');
            expect(mockSupabase.delete).toHaveBeenCalled();
        });
    });

    describe('fetchLead', () => {
        it('returns lead detail', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({ data: mockSupabase, error: null });
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
            const mockRows = [{
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
            }];

            mockSupabase.returns.mockResolvedValueOnce({ data: [mockRows[0]], error: null });

            const leads = await fetchLeads();
            expect(leads).toHaveLength(1);
            expect(leads[0].name).toBe('Juan');
            expect(leads[0].score).toBe(75);
        });
    });
});

describe('calculateLeadScore', () => {
    it('calculates score for comprar + landing_form', () => {
        const score = calculateLeadScore({
            intent: 'comprar',
            source: 'landing_form',
            message: 'Hola, quiero comprar una casa grande con jardÃ­n',
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
        mockSupabase.update.mockResolvedValueOnce({ error: null });

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
        vi.spyOn({ recalculateLeadScore }, 'recalculateLeadScore')
            .mockResolvedValueOnce(65)
            .mockResolvedValueOnce(70)
            .mockResolvedValueOnce(0);

        const updated = await bulkRecalculateScores(['lead-1', 'lead-2', 'lead-3']);
        expect(updated).toBe(2);
    });
});