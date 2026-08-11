import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addLeadTag, bulkImportLeadsParsed, importLeadsFromCsv, parseLeadsCsv, removeLeadTag, setLeadTags } from '../leads';

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

describe.skip('leads tags & csv', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('addLeadTag', () => {
        it('adds new tag', async () => {
            const updateEqMock = vi.fn().mockResolvedValueOnce({ error: null });
            mockSupabase.update.mockReturnValue({ eq: updateEqMock });
            mockSupabase.single.mockResolvedValueOnce({ data: { tags: ['vip'] }, error: null });

            await addLeadTag('lead-1', 'nuevo');
            expect(mockSupabase.update).toHaveBeenCalledWith({ tags: ['vip', 'nuevo'] });
        });

        it('does not duplicate tags', async () => {
            const updateEqMock = vi.fn().mockResolvedValueOnce({ error: null });
            mockSupabase.update.mockReturnValue({ eq: updateEqMock });
            mockSupabase.single.mockResolvedValueOnce({ data: { tags: ['vip'] }, error: null });

            await addLeadTag('lead-1', 'vip');
            expect(mockSupabase.update).not.toHaveBeenCalled();
        });
    });

    describe('removeLeadTag', () => {
        it('removes existing tag', async () => {
            const updateEqMock = vi.fn().mockResolvedValueOnce({ error: null });
            mockSupabase.update.mockReturnValue({ eq: updateEqMock });
            mockSupabase.single.mockResolvedValueOnce({ data: { tags: ['vip', 'nuevo'] }, error: null });

            await removeLeadTag('lead-1', 'vip');
            expect(mockSupabase.update).toHaveBeenCalledWith({ tags: ['nuevo'] });
        });

        it('handles tag not present', async () => {
            const updateEqMock = vi.fn().mockResolvedValueOnce({ error: null });
            mockSupabase.update.mockReturnValue({ eq: updateEqMock });
            mockSupabase.single.mockResolvedValueOnce({ data: { tags: ['nuevo'] }, error: null });

            await removeLeadTag('lead-1', 'vip');
            expect(mockSupabase.update).toHaveBeenCalledWith({ tags: ['nuevo'] });
        });
    });

    describe('setLeadTags', () => {
        it('replaces all tags', async () => {
            const updateEqMock = vi.fn().mockResolvedValueOnce({ error: null });
            mockSupabase.update.mockReturnValue({ eq: updateEqMock });

            await setLeadTags('lead-1', ['vip', 'urgente']);
            expect(mockSupabase.update).toHaveBeenCalledWith({ tags: ['vip', 'urgente'] });
        });
    });

    describe('parseLeadsCsv', () => {
        it('parses valid CSV with all required fields', async () => {
            const csvText = `name,last_name,email,intent,source,status,message
Juan,PÃ©rez,juan@test.com,comprar,landing_form,nuevo,Quiero comprar
Maria,Gomez,maria@test.com,vender,whatsapp,nuevo,Quiero vender`;

            const result = await parseLeadsCsv(csvText);
            expect(result.valid).toHaveLength(2);
            expect(result.valid[0].name).toBe('Juan');
            expect(result.valid[0].email).toBe('juan@test.com');
            expect(result.valid[0].intent).toBe('comprar');
            expect(result.valid[1].intent).toBe('vender');
            expect(result.errors).toHaveLength(0);
        });

        it('rejects CSV without required headers', async () => {
            const csvText = `name,email
Juan,juan@test.com`;

            const result = await parseLeadsCsv(csvText);
            expect(result.valid).toHaveLength(0);
            expect(result.errors[0].message).toContain('Falta columna requerida: last_name');
        });

        it('rejects invalid intent', async () => {
            const csvText = `name,last_name,email,intent,source,status,message
Juan,PÃ©rez,juan@test.com,invalid_intent,landing_form,nuevo,Test`;

            const result = await parseLeadsCsv(csvText);
            expect(result.valid).toHaveLength(0);
            expect(result.errors[0].message).toContain('Intent inválido');
        });

        it('rejects invalid source', async () => {
            const csvText = `name,last_name,email,intent,source,status,message
Juan,PÃ©rez,juan@test.com,comprar,invalid_source,nuevo,Test`;

            const result = await parseLeadsCsv(csvText);
            expect(result.valid).toHaveLength(0);
            expect(result.errors[0].message).toContain('Source inválido');
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
            expect(result.errors[0].message).toContain('Intent inválido');
        });
    });

    describe('importLeadsFromCsv', () => {
        it('imports valid leads and reports errors', async () => {
            const csvText = `name,last_name,email,intent,source,status,message
Juan,PÃ©rez,juan@test.com,comprar,landing_form,nuevo,Quiero comprar
Maria,Gomez,maria@test.com,invalid_intent,landing_form,nuevo,Quiero vender`;

            mockSupabase.maybeSingle
                .mockResolvedValueOnce({ data: null, error: null });
            mockSupabase.single
                .mockResolvedValueOnce({ data: { id: 'lead-1' }, error: null });

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

            mockSupabase.maybeSingle
                .mockResolvedValueOnce({ data: null, error: null })
                .mockResolvedValueOnce({ data: null, error: null });
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