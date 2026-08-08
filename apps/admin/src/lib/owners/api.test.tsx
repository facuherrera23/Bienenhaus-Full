import { beforeEach, describe, expect, it, vi } from 'vitest';
import { from } from '@/test/setup';
import {
    completeActionPlan,
    createCommunication,
    createOwner,
    createPriceAnalysis,
    fetchActionPlans,
    fetchCommunications,
    fetchDeletedOwners,
    fetchOwnerById,
    fetchOwners,
    fetchOwnersPaginated,
    fetchPriceAnalysis,
    fetchPropertyOwners,
    fetchReportById,
    linkOwnerToProperty,
    permanentDeleteOwner,
    restoreOwner,
    softDeleteOwner,
    unlinkOwnerFromProperty,
    updateOwner,
    updatePriceAnalysis,
    updatePropertyOwnerLink,
} from './owners';

// ============================================================
// Fixtures
// ============================================================

const ownerRow = {
    id: '1',
    full_name: 'Juan Pérez',
    email: 'juan@test.com',
    phone: '+5491112345678',
    dni_cuit: '20123456789',
    address: 'Calle 123',
    owner_type: 'persona_fisica',
    company_name: null,
    notes: null,
    preferred_contact: 'whatsapp',
    created_by: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    deleted_at: null,
};

const ownerDetailRow = {
    ...ownerRow,
    property_owners: [
        {
            property_id: 'p1',
            ownership_percentage: 50,
            is_primary_contact: true,
            role: 'Titular',
            properties: {
                title: 'Casa Centro',
                address: 'Av. 1',
                price: 150000,
                status: 'publicada',
            },
        },
    ],
};

type QueryResponse = { data: unknown; error: unknown; count?: number };

/**
 * Crea un builder encadenable de Supabase: todos los métodos de filtro
 * devuelven `this`, `single`/`maybeSingle` devuelven la respuesta y el
 * builder mismo es "thenable" (cubre los casos donde se hace `await` del
 * resultado encadenado, ej. `.select().is().order()`).
 */
function makeBuilder(response: QueryResponse = { data: null, error: null }) {
    return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        single: vi.fn(() => Promise.resolve(response)),
        maybeSingle: vi.fn(() => Promise.resolve(response)),
        then: (resolve: (v: QueryResponse) => void) => resolve(response),
    };
}

// ============================================================
// Tests
// ============================================================

describe('Owners API Functions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        from.mockImplementation(() => makeBuilder({ data: null, error: null }));
    });

    describe('fetchOwners', () => {
        it('returns mapped owner rows', async () => {
            const builder = makeBuilder({ data: [ownerRow], error: null, count: 1 });
            from.mockImplementation(() => builder);

            const result = await fetchOwners();

            expect(result).toHaveLength(1);
            expect(result[0].full_name).toBe('Juan Pérez');
            expect(result[0].property_count).toBe(0);
            expect(builder.is).toHaveBeenCalledWith('deleted_at', null);
            expect(builder.order).toHaveBeenCalledWith('full_name');
        });

        it('applies search filter', async () => {
            const builder = makeBuilder({ data: [ownerRow], error: null, count: 1 });
            from.mockImplementation(() => builder);

            await fetchOwners('Juan');

            expect(builder.ilike).toHaveBeenCalledWith('full_name', '%Juan%');
        });

        it('throws on query error', async () => {
            const builder = makeBuilder({ data: null, error: { message: 'DB error' } });
            from.mockImplementation(() => builder);

            await expect(fetchOwners()).rejects.toThrow('DB error');
        });
    });

    describe('fetchOwnersPaginated', () => {
        it('returns data, count and total pages', async () => {
            const builder = makeBuilder({ data: [ownerRow], error: null, count: 1 });
            from.mockImplementation(() => builder);

            const result = await fetchOwnersPaginated({ page: 1, pageSize: 20 });

            expect(result.data).toHaveLength(1);
            expect(result.data[0].full_name).toBe('Juan Pérez');
            expect(result.count).toBe(1);
            expect(result.totalPages).toBe(1);
            expect(result.page).toBe(1);
            expect(builder.select).toHaveBeenCalledWith(expect.any(String), { count: 'exact' });
            expect(builder.is).toHaveBeenCalledWith('deleted_at', null);
        });

        it('applies search and owner_type filters', async () => {
            const builder = makeBuilder({ data: [ownerRow], error: null, count: 1 });
            from.mockImplementation(() => builder);

            await fetchOwnersPaginated({ search: 'Juan', owner_type: 'persona_fisica' });

            expect(builder.ilike).toHaveBeenCalledWith('full_name', '%Juan%');
            expect(builder.eq).toHaveBeenCalledWith('owner_type', 'persona_fisica');
        });

        it('filters by has_properties post-query', async () => {
            const ownerWithProps = {
                ...ownerRow,
                id: '2',
                property_owners: [
                    {
                        property_id: 'p1',
                        ownership_percentage: 100,
                        is_primary_contact: true,
                        role: '',
                    },
                ],
            };
            const builder = makeBuilder({
                data: [ownerRow, ownerWithProps],
                error: null,
                count: 2,
            });
            from.mockImplementation(() => builder);

            const result = await fetchOwnersPaginated({ has_properties: true });

            expect(result.data).toHaveLength(1);
            expect(result.data[0].id).toBe('2');
        });

        it('throws on query error', async () => {
            const builder = makeBuilder({ data: null, error: { message: 'DB error' } });
            from.mockImplementation(() => builder);

            await expect(fetchOwnersPaginated({})).rejects.toThrow('DB error');
        });
    });

    describe('fetchOwnerById', () => {
        it('returns owner detail with embedded properties', async () => {
            const builder = makeBuilder({ data: ownerDetailRow, error: null });
            from.mockImplementation(() => builder);

            const result = await fetchOwnerById('1');

            expect(result.id).toBe('1');
            expect(result.properties).toHaveLength(1);
            expect(result.properties[0].title).toBe('Casa Centro');
            expect(result.properties[0].is_primary_contact).toBe(true);
            expect(builder.eq).toHaveBeenCalledWith('id', '1');
            expect(builder.single).toHaveBeenCalled();
        });

        it('throws on error', async () => {
            const builder = makeBuilder({ data: null, error: { message: 'Not found' } });
            from.mockImplementation(() => builder);

            await expect(fetchOwnerById('999')).rejects.toThrow('Not found');
        });
    });

    describe('createOwner', () => {
        it('creates and returns the new owner', async () => {
            const created = { ...ownerRow, id: '3', full_name: 'Nuevo Propietario' };
            const builder = makeBuilder({ data: created, error: null });
            from.mockImplementation(() => builder);

            const result = await createOwner({
                full_name: 'Nuevo Propietario',
                email: 'nuevo@test.com',
                owner_type: 'persona_fisica',
                preferred_contact: 'whatsapp',
            });

            expect(result.id).toBe('3');
            expect(result.full_name).toBe('Nuevo Propietario');
            expect(builder.insert).toHaveBeenCalledWith(
                expect.objectContaining({ full_name: 'Nuevo Propietario' }),
            );
        });

        it('throws on error', async () => {
            const builder = makeBuilder({ data: null, error: { message: 'Duplicate email' } });
            from.mockImplementation(() => builder);

            await expect(
                createOwner({
                    full_name: 'A',
                    email: 'a@a.com',
                    owner_type: 'persona_fisica',
                    preferred_contact: 'whatsapp',
                }),
            ).rejects.toThrow('Duplicate email');
        });
    });

    describe('updateOwner', () => {
        it('updates and returns the owner', async () => {
            const updated = { ...ownerRow, full_name: 'Juan Actualizado' };
            const builder = makeBuilder({ data: updated, error: null });
            from.mockImplementation(() => builder);

            const result = await updateOwner('1', { full_name: 'Juan Actualizado' });

            expect(result.full_name).toBe('Juan Actualizado');
            expect(builder.update).toHaveBeenCalledWith({ full_name: 'Juan Actualizado' });
            expect(builder.eq).toHaveBeenCalledWith('id', '1');
        });

        it('throws on error', async () => {
            const builder = makeBuilder({ data: null, error: { message: 'Update failed' } });
            from.mockImplementation(() => builder);

            await expect(updateOwner('1', { full_name: 'X' })).rejects.toThrow('Update failed');
        });
    });

    describe('softDeleteOwner', () => {
        it('sets deleted_at timestamp', async () => {
            const builder = makeBuilder({ data: null, error: null });
            from.mockImplementation(() => builder);

            await softDeleteOwner('1');

            expect(builder.update).toHaveBeenCalledWith({ deleted_at: expect.any(String) });
            expect(builder.eq).toHaveBeenCalledWith('id', '1');
        });

        it('throws on error', async () => {
            const builder = makeBuilder({ data: null, error: { message: 'Delete failed' } });
            from.mockImplementation(() => builder);

            await expect(softDeleteOwner('1')).rejects.toThrow('Delete failed');
        });
    });

    describe('restoreOwner', () => {
        it('clears deleted_at', async () => {
            const builder = makeBuilder({ data: null, error: null });
            from.mockImplementation(() => builder);

            await restoreOwner('1');

            expect(builder.update).toHaveBeenCalledWith({ deleted_at: null });
            expect(builder.eq).toHaveBeenCalledWith('id', '1');
        });
    });

    describe('permanentDeleteOwner', () => {
        it('hard deletes the owner', async () => {
            const builder = makeBuilder({ data: null, error: null });
            from.mockImplementation(() => builder);

            await permanentDeleteOwner('1');

            expect(builder.delete).toHaveBeenCalled();
            expect(builder.eq).toHaveBeenCalledWith('id', '1');
        });
    });

    describe('fetchDeletedOwners', () => {
        it('returns only soft-deleted owners', async () => {
            const deleted = [{ ...ownerRow, deleted_at: '2024-01-03T00:00:00Z' }];
            const builder = makeBuilder({ data: deleted, error: null });
            from.mockImplementation(() => builder);

            const result = await fetchDeletedOwners();

            expect(result).toHaveLength(1);
            expect(result[0].deleted_at).toBe('2024-01-03T00:00:00Z');
            expect(builder.not).toHaveBeenCalledWith('deleted_at', 'is', null);
        });
    });

    describe('Property-Owner Links', () => {
        const linkRow = {
            id: 'l1',
            property_id: 'p1',
            owner_id: '1',
            ownership_percentage: 50,
            is_primary_contact: true,
            role: 'Titular',
            created_at: '2024-01-01T00:00:00Z',
            properties: { title: 'Casa Centro' },
            owners: { full_name: 'Juan Pérez' },
        };

        it('fetches owners linked to a property', async () => {
            const builder = makeBuilder({ data: [linkRow], error: null });
            from.mockImplementation(() => builder);

            const result = await fetchPropertyOwners('p1');

            expect(result).toHaveLength(1);
            expect(result[0].property_title).toBe('Casa Centro');
            expect(result[0].owner_name).toBe('Juan Pérez');
            expect(builder.eq).toHaveBeenCalledWith('property_id', 'p1');
        });

        it('links an owner to a property', async () => {
            const builder = makeBuilder({ data: linkRow, error: null });
            from.mockImplementation(() => builder);

            const result = await linkOwnerToProperty({
                property_id: 'p1',
                owner_id: '1',
                ownership_percentage: 50,
                is_primary_contact: true,
                role: 'Titular',
            });

            expect(result.id).toBe('l1');
            expect(builder.insert).toHaveBeenCalledWith(
                expect.objectContaining({ property_id: 'p1', owner_id: '1' }),
            );
        });

        it('unlinks an owner from a property', async () => {
            const builder = makeBuilder({ data: null, error: null });
            from.mockImplementation(() => builder);

            await unlinkOwnerFromProperty('p1', '1');

            expect(builder.delete).toHaveBeenCalled();
            expect(builder.eq).toHaveBeenCalledWith('property_id', 'p1');
            expect(builder.eq).toHaveBeenCalledWith('owner_id', '1');
        });

        it('updates a link ownership percentage', async () => {
            const updated = { ...linkRow, ownership_percentage: 75 };
            const builder = makeBuilder({ data: updated, error: null });
            from.mockImplementation(() => builder);

            const result = await updatePropertyOwnerLink('p1', '1', { ownership_percentage: 75 });

            expect(result.ownership_percentage).toBe(75);
            expect(builder.update).toHaveBeenCalledWith({ ownership_percentage: 75 });
        });
    });

    describe('Price Analysis', () => {
        const analysisRow = {
            id: 'pa1',
            property_id: 'p1',
            estimated_market_price: 150000,
            price_per_sqm_market: 1500,
            our_listing_price: 150000,
            price_difference_pct: 0,
            price_status: 'fair',
            market_trend: 'stable',
            comparable_properties: [],
            recommendation: 'Mantener precio',
            notes: null,
            analyzed_by: null,
            analysis_date: '2024-01-01T00:00:00Z',
            valid_until: null,
            created_at: '2024-01-01T00:00:00Z',
        };

        it('fetches latest price analysis for a property', async () => {
            const builder = makeBuilder({ data: analysisRow, error: null });
            from.mockImplementation(() => builder);

            const result = await fetchPriceAnalysis('p1');

            expect(result?.id).toBe('pa1');
            expect(result?.price_status).toBe('fair');
            expect(builder.maybeSingle).toHaveBeenCalled();
        });

        it('returns null when no analysis exists', async () => {
            const builder = makeBuilder({ data: null, error: null });
            from.mockImplementation(() => builder);

            const result = await fetchPriceAnalysis('p1');

            expect(result).toBeNull();
        });

        it('computes price_status as fair when listing equals market', async () => {
            const created = { ...analysisRow, id: 'pa2' };
            const builder = makeBuilder({ data: created, error: null });
            from.mockImplementation(() => builder);

            await createPriceAnalysis({
                property_id: 'p1',
                estimated_market_price: 100000,
                our_listing_price: 100000,
                comparable_properties: [],
            });

            expect(builder.insert).toHaveBeenCalledWith(
                expect.objectContaining({ price_status: 'fair' }),
            );
        });

        it('marks price as way_above when listing is 30% over market', async () => {
            const created = { ...analysisRow, id: 'pa3' };
            const builder = makeBuilder({ data: created, error: null });
            from.mockImplementation(() => builder);

            await createPriceAnalysis({
                property_id: 'p1',
                estimated_market_price: 100000,
                our_listing_price: 130000,
                comparable_properties: [],
            });

            expect(builder.insert).toHaveBeenCalledWith(
                expect.objectContaining({ price_status: 'way_above' }),
            );
        });

        it('recalculates price_status on update when prices change', async () => {
            const updated = { ...analysisRow, our_listing_price: 120000, price_difference_pct: 20 };
            const builder = makeBuilder({ data: updated, error: null });
            from.mockImplementation(() => builder);

            const result = await updatePriceAnalysis('pa1', {
                estimated_market_price: 100000,
                our_listing_price: 120000,
            });

            expect(result.price_difference_pct).toBe(20);
            expect(builder.update).toHaveBeenCalledWith(
                expect.objectContaining({ price_status: 'above' }),
            );
        });
    });

    describe('Action Plans', () => {
        const planRow = {
            id: 'ap1',
            property_id: 'p1',
            owner_id: null,
            title: 'Seguimiento propietario',
            description: null,
            category: 'other',
            priority: 'medium',
            status: 'pending',
            due_date: null,
            completed_at: null,
            assigned_to: null,
            created_by: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            deleted_at: null,
            property: { title: 'Casa Centro' },
        };

        it('fetches action plans with pagination and filters', async () => {
            const builder = makeBuilder({ data: [planRow], error: null, count: 1 });
            from.mockImplementation(() => builder);

            const result = await fetchActionPlans({ status: 'pending' });

            expect(result.data).toHaveLength(1);
            expect(result.data[0].property_title).toBe('Casa Centro');
            expect(result.data[0].tasks_count).toBe(0);
            expect(builder.is).toHaveBeenCalledWith('deleted_at', null);
            expect(builder.eq).toHaveBeenCalledWith('status', 'pending');
        });

        it('applies overdue filter', async () => {
            const builder = makeBuilder({ data: [planRow], error: null, count: 1 });
            from.mockImplementation(() => builder);

            await fetchActionPlans({ overdue: true });

            expect(builder.lt).toHaveBeenCalledWith('due_date', expect.any(String));
            expect(builder.in).toHaveBeenCalledWith('status', ['pending', 'in_progress']);
        });

        it('completes an action plan', async () => {
            const builder = makeBuilder({ data: null, error: null });
            from.mockImplementation(() => builder);

            await completeActionPlan('ap1');

            expect(builder.update).toHaveBeenCalledWith({
                status: 'completed',
                completed_at: expect.any(String),
            });
            expect(builder.eq).toHaveBeenCalledWith('id', 'ap1');
        });
    });

    describe('Communications', () => {
        const commRow = {
            id: 'c1',
            owner_id: '1',
            property_id: null,
            type: 'whatsapp',
            subject: null,
            content: 'Hola',
            status: 'sent',
            sent_at: '2024-01-01T00:00:00Z',
            sent_by: null,
            created_at: '2024-01-01T00:00:00Z',
        };

        it('creates a communication with status sent', async () => {
            const created = { ...commRow, id: 'c2' };
            const builder = makeBuilder({ data: created, error: null });
            from.mockImplementation(() => builder);

            const result = await createCommunication({
                owner_id: '1',
                type: 'whatsapp',
                content: 'Hola',
            });

            expect(result.id).toBe('c2');
            expect(builder.insert).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'sent', sent_at: expect.any(String) }),
            );
        });

        it('fetches communications filtered by owner', async () => {
            const builder = makeBuilder({ data: [commRow], error: null, count: 1 });
            from.mockImplementation(() => builder);

            const result = await fetchCommunications({ owner_id: '1' });

            expect(result.data).toHaveLength(1);
            expect(builder.eq).toHaveBeenCalledWith('owner_id', '1');
        });
    });

    describe('Reports', () => {
        const reportRow = {
            id: 'r1',
            property_id: 'p1',
            owner_id: '1',
            report_type: 'tasacion',
            title: 'Informe de tasación',
            content_json: {},
            pdf_url: null,
            generated_at: '2024-01-01T00:00:00Z',
            sent_at: null,
            status: 'draft',
            created_by: null,
            created_at: '2024-01-01T00:00:00Z',
            property: { title: 'Casa Centro' },
        };

        it('fetches a report by id', async () => {
            const builder = makeBuilder({ data: reportRow, error: null });
            from.mockImplementation(() => builder);

            const result = await fetchReportById('r1');

            expect(result?.title).toBe('Informe de tasación');
            expect(result?.property_title).toBe('Casa Centro');
            expect(builder.maybeSingle).toHaveBeenCalled();
        });

        it('returns null when report not found', async () => {
            const builder = makeBuilder({ data: null, error: null });
            from.mockImplementation(() => builder);

            const result = await fetchReportById('999');

            expect(result).toBeNull();
        });
    });
});
