import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateLeadScore, recalculateLeadScore, bulkRecalculateScores, parseLeadsCsv, importLeadsFromCsv, bulkImportLeadsParsed } from '../leads';
import type { LeadFormValues } from '../../types/leads';

const { mockSupabase } = vi.hoisted(() => {
    const mockSupabase = {
        from: vi.fn(() => mockSupabase),
        select: vi.fn(() => mockSupabase),
        eq: vi.fn(() => mockSupabase),
        is: vi.fn(() => mockSupabase),
        not: vi.fn(() => mockSupabase),
        order: vi.fn(() => mockSupabase),
        limit: vi.fn(() => mockSupabase),
        or: vi.fn(() => mockSupabase),
        gte: vi.fn(() => mockSupabase),
        maybeSingle: vi.fn(() => mockSupabase),
        single: vi.fn(() => mockSupabase),
        insert: vi.fn(() => mockSupabase),
        update: vi.fn(() => mockSupabase),
        delete: vi.fn(() => mockSupabase),
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

describe.skip('leads scoring & csv', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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

        it('calculates score for referido', () => {
            const score = calculateLeadScore({
                intent: 'referido',
                source: 'referido',
                message: 'Mensaje muy largo que supera los cincuenta caracteres sin problema',
                phone: '+54 9 11 1234-5678',
                city: 'CÃ³rdoba',
            });
            // referido(30) + referido(30) + message>50(10) + phone(10) + city(5) = 85
            expect(score).toBeLessThanOrEqual(100);
            expect(score).toBe(85);
        });

        it('caps at 100', () => {
            const score = calculateLeadScore({
                intent: 'referido',
                source: 'referido',
                message: 'Mensaje muy largo que supera los cincuenta caracteres sin problema',
                phone: '+54 9 11 1234-5678',
                city: 'CÃ³rdoba',
            });
            expect(score).toBeLessThanOrEqual(100);
        });

        it('handles null values', () => {
            const score = calculateLeadScore({
                intent: 'otro',
                source: 'manual',
            });
            // otro(5) + manual(10) = 15
            expect(score).toBe(15);
        });

        it('handles short message', () => {
            const score = calculateLeadScore({
                intent: 'comprar',
                source: 'email',
                message: 'Hola',
                phone: '+54 9 11 1234-5678',
                city: 'CÃ³rdoba',
            });
            // comprar(30) + email(15) + phone(10) + city(5) = 60 (message < 20)
            expect(score).toBe(60);
        });

        it('handles medium message', () => {
            const score = calculateLeadScore({
                intent: 'comprar',
                source: 'email',
                message: 'Hola, quiero comprar una casa con jardÃ­n y pileta',
                phone: '+54 9 11 1234-5678',
                city: 'CÃ³rdoba',
            });
            // comprar(30) + email(15) + message>20(5) + phone(10) + city(5) = 65
            expect(score).toBe(65);
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
                    message: 'Quiero comprar una casa',
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

        it('throws for non-existent lead', async () => {
            mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });
            await expect(recalculateLeadScore('lead-1')).rejects.toThrow('Not found');
        });
    });

    describe('bulkRecalculateScores', () => {
        it('updates multiple leads', async () => {
            const recalculateLeadScoreSpy = vi.spyOn({ recalculateLeadScore }, 'recalculateLeadScore')
                .mockResolvedValueOnce(65)
                .mockResolvedValueOnce(70)
                .mockResolvedValueOnce(0);

            const updated = await bulkRecalculateScores(['lead-1', 'lead-2', 'lead-3']);
            expect(updated).toBe(2);
        });
    });

    describe('parseLeadsCsv', () => {
        it('parses valid CSV', async () => {
            const csvText = `name,last_name,email,intent,source,status,message
Juan,PÃ©rez,juan@test.com,comprar,landing_form,nuevo,Quiero comprar`;

            const result = await parseLeadsCsv(csvText);
            expect(result.valid).toHaveLength(1);
            expect(result.valid[0].name).toBe('Juan');
            expect(result.valid[0].email).toBe('juan@test.com');
            expect(result.errors).toHaveLength(0);
        });

        it('rejects CSV without required headers', async () => {
            const csvText = `name,email\nJuan,juan@test.com`;

            const result = await parseLeadsCsv(csvText);
            expect(result.valid).toHaveLength(0);
            expect(result.errors[0].message).toContain('Falta columna requerida: last_name');
        });

        it('rejects invalid intent', async () => {
            const csvText = `name,last_name,email,intent,source,status,message
Juan,PÃ©rez,juan@test.com,invalid_intent,landing_form,nuevo,Test`;

            const result = await parseLeadsCsv(csvText);
            expect(result.valid).toHaveLength(0);
            expect(result.errors[0].message).toContain('Intent invÃ¡lido');
        });

        it('rejects invalid source', async () => {
            const csvText = `name,last_name,email,intent,source,status,message
Juan,PÃ©rez,juan@test.com,comprar,invalid_source,nuevo,Test`;

            const result = await parseLeadsCsv(csvText);
            expect(result.valid).toHaveLength(0);
            expect(result.errors[0].message).toContain('Source invÃ¡lido');
        });

        it('handles missing optional fields', async () => {
            const csvText = `name,last_name,email,intent,source
Juan,PÃ©rez,juan@test.com,comprar,landing_form`;

            const result = await parseLeadsCsv(csvText);
            expect(result.valid).toHaveLength(1);
            expect(result.valid[0].status).toBe('nuevo');
            expect(result.valid[0].phone).toBeUndefined();
        });

        it('handles multiple rows with some errors', async () => {
            const csvText = `name,last_name,email,intent,source,status,message
Juan,PÃ©rez,juan@test.com,comprar,landing_form,nuevo,Quiero comprar
Maria,Gomez,maria@test.com,invalid_intent,landing_form,nuevo,Quiero vender
Carlos,Lopez,carlos@test.com,alquilar,whatsapp,nuevo,Busco depto`;

            const result = await parseLeadsCsv(csvText);
            expect(result.valid).toHaveLength(2);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].message).toContain('Intent invÃ¡lido');
        });
    });

    describe('importLeadsFromCsv', () => {
        it('imports valid leads and reports errors', async () => {
            const csvText = `name,last_name,email,intent,source,status,message
Juan,PÃ©rez,juan@test.com,comprar,landing_form,nuevo,Quiero comprar
Maria,Gomez,maria@test.com,invalid_intent,landing_form,nuevo,Quiero vender`;

            mockSupabase.single
                .mockResolvedValueOnce({ data: { id: 'lead-1' }, error: null })
                .mockResolvedValueOnce({ data: { id: 'lead-2' }, error: null });

            const result = await importLeadsFromCsv(csvText);
            expect(result.created).toBe(1);
            expect(result.errors).toHaveLength(1);
        });
    });

    describe('bulkImportLeadsParsed', () => {
        it('imports parsed leads', async () => {
            const leads = [
                { name: 'Juan', last_name: 'PÃ©rez', email: 'juan@test.com', intent: 'comprar', source: 'landing_form', status: 'nuevo', message: 'Test' },
                { name: 'Maria', last_name: 'Gomez', email: 'maria@test.com', intent: 'vender', source: 'whatsapp', status: 'nuevo', message: 'Test 2' },
            ];

            mockSupabase.single
                .mockResolvedValueOnce({ data: { id: 'lead-1' }, error: null })
                .mockResolvedValueOnce({ data: { id: 'lead-2' }, error: null });

            const result = await bulkImportLeadsParsed(leads);
            expect(result.created).toBe(2);
            expect(result.errors).toHaveLength(0);
        });

        it('handles import errors', async () => {
            const leads = [
                { name: 'Juan', last_name: 'PÃ©rez', email: 'juan@test.com', intent: 'comprar', source: 'landing_form', status: 'nuevo', message: 'Test' },
                { name: 'Maria', last_name: 'Gomez', email: 'maria@test.com', intent: 'vender', source: 'whatsapp', status: 'nuevo', message: 'Test 2' },
            ];

            mockSupabase.single
                .mockResolvedValueOnce({ data: { id: 'lead-1' }, error: null })
                .mockResolvedValueOnce({ data: null, error: { message: 'Duplicate email' } });

            const result = await bulkImportLeadsParsed(leads);
            expect(result.created).toBe(1);
            expect(result.errors).toHaveLength(1);
        });
    });
});