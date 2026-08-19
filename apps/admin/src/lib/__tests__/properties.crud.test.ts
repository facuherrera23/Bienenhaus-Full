import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    createProperty,
    duplicateProperty,
    fetchProperty,
    permanentDeleteProperty,
    restoreProperty,
    softDeleteProperty,
    updateProperty,
} from '../properties';
import type { PropertyDetail, PropertyFormValues } from '../../types/properties';

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
        storage: {
            from: vi.fn(() => ({
                remove: vi.fn().mockResolvedValue({ error: null }),
            })),
        },
        rpc: vi.fn().mockResolvedValue({ error: null }),
    };
    return { mockSupabase };
});

vi.mock('@supabase/supabase-js', () => ({
    createClient: () => mockSupabase,
}));

describe.skip('properties CRUD', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const validFormValues: PropertyFormValues = {
        title: 'Casa Test',
        status: 'publicada',
        listing_type: 'venta',
        price: 250000,
        currency: 'USD',
        expenses: 5000,
        description: 'DescripciÃ³n test',
        address: 'Calle 123',
        location_id: 'loc-1',
        area_total: 200,
        area_covered: 150,
        bedrooms: 3,
        bathrooms: 2,
        garages: 1,
        floors: 2,
        year_built: 2020,
        featured: false,
        video_url: '',
        latitude: -34.6,
        longitude: -58.4,
    };

    const mockPropertyDetail: PropertyDetail = {
        id: 'prop-1',
        code: 123,
        title: 'Casa Test',
        slug: 'casa-test',
        description: 'DescripciÃ³n test',
        status: 'publicada',
        listing_type: 'venta',
        price: 250000,
        currency: 'USD',
        expenses: 5000,
        address: 'Calle 123',
        location_id: 'loc-1',
        latitude: -34.6,
        longitude: -58.4,
        area_total: 200,
        area_covered: 150,
        bedrooms: 3,
        bathrooms: 2,
        garages: 1,
        year_built: 2020,
        floors: 2,
        featured: false,
        published_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        video_url: '',
        cover_url: 'https://img.com/cover.jpg',
        location: 'Villa Belgrano',
        images: [],
        ml_meta: null,
    };

    describe('createProperty', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('creates property successfully', async () => {
            mockSupabase.single.mockResolvedValueOnce({ data: { id: 'new-prop' }, error: null });
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: mockPropertyDetail,
                error: null,
            });

            const result = await createProperty(validFormValues);
            expect(result.id).toBe('prop-1');
            expect(mockSupabase.insert).toHaveBeenCalled();
        });

        it('validates required fields', async () => {
            const invalidValues = { ...validFormValues, title: '' };
            await expect(createProperty(invalidValues)).rejects.toThrow(
                'Datos de propiedad invÃ¡lidos',
            );
        });

        it('validates price for publicada status', async () => {
            const invalidValues = { ...validFormValues, status: 'publicada' as const, price: 0 };
            await expect(createProperty(invalidValues)).rejects.toThrow(
                'Precio obligatorio para publicar',
            );
        });

        it('validates location_id for publicada status', async () => {
            const invalidValues = {
                ...validFormValues,
                status: 'publicada' as const,
                location_id: null,
            };
            await expect(createProperty(invalidValues)).rejects.toThrow(
                'Zona obligatoria para publicar',
            );
        });

        it('validates area_covered <= area_total', async () => {
            const invalidValues = { ...validFormValues, area_total: 100, area_covered: 150 };
            await expect(createProperty(invalidValues)).rejects.toThrow(
                'Superficie cubierta no puede exceder total',
            );
        });

        it('handles duplicate slug error', async () => {
            mockSupabase.single.mockRejectedValueOnce({
                message: 'duplicate key value violates unique constraint',
                code: '23505',
            });
            await expect(createProperty(validFormValues)).rejects.toThrow(
                'Ya existe una propiedad con ese tÃ­tulo.',
            );
        });
    });

    describe('updateProperty', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('updates property successfully', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: mockPropertyDetail,
                error: null,
            });
            mockSupabase.update.mockResolvedValueOnce({ error: null });

            await updateProperty('prop-1', validFormValues);
            expect(mockSupabase.update).toHaveBeenCalled();
        });

        it('sets published_at when status changes to publicada', async () => {
            const draftProperty = {
                ...mockPropertyDetail,
                status: 'borrador' as const,
                published_at: null,
            };
            mockSupabase.maybeSingle.mockResolvedValueOnce({ data: draftProperty, error: null });
            mockSupabase.update.mockResolvedValueOnce({ error: null });

            await updateProperty('prop-1', { ...validFormValues, status: 'publicada' });
            expect(mockSupabase.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    published_at: expect.any(String),
                }),
            );
        });

        it('updates slug when title changes', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: { ...mockPropertyDetail, title: 'Old Title' },
                error: null,
            });
            mockSupabase.update.mockResolvedValueOnce({ error: null });

            await updateProperty('prop-1', { ...validFormValues, title: 'New Title' });
            expect(mockSupabase.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    slug: 'new-title',
                }),
            );
        });

        it('rejects invalid data', async () => {
            const invalidValues = { ...validFormValues, title: '' };
            await expect(updateProperty('prop-1', invalidValues)).rejects.toThrow(
                'Datos de propiedad invÃ¡lidos',
            );
        });
    });

    describe('softDeleteProperty', () => {
        it('sets deleted_at', async () => {
            mockSupabase.update.mockResolvedValueOnce({ error: null });
            await softDeleteProperty('prop-1');
            expect(mockSupabase.update).toHaveBeenCalledWith({ deleted_at: expect.any(String) });
        });
    });

    describe('restoreProperty', () => {
        it('clears deleted_at', async () => {
            mockSupabase.update.mockResolvedValueOnce({ error: null });
            await restoreProperty('prop-1');
            expect(mockSupabase.update).toHaveBeenCalledWith({ deleted_at: null });
        });
    });

    describe('permanentDeleteProperty', () => {
        it('deletes images from storage and then property', async () => {
            mockSupabase.select.mockResolvedValueOnce({
                data: [
                    {
                        url: 'https://supabase.co/storage/v1/object/public/property-images/prop-1/img1.jpg',
                    },
                ],
                error: null,
            });
            mockSupabase.storage.from.mockReturnValue({
                remove: vi.fn().mockResolvedValue({ error: null }),
            });
            mockSupabase.delete.mockResolvedValueOnce({ error: null });

            await permanentDeleteProperty('prop-1');
            expect(mockSupabase.storage.from).toHaveBeenCalledWith('property-images');
            expect(mockSupabase.delete).toHaveBeenCalled();
        });
    });

    describe('duplicateProperty', () => {
        it('creates copy with modified title and borrador status', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: mockPropertyDetail,
                error: null,
            });
            mockSupabase.single.mockResolvedValueOnce({ data: { id: 'dup-prop' }, error: null });
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: {
                    ...mockPropertyDetail,
                    id: 'dup-prop',
                    title: 'Casa Test (Copia)',
                    status: 'borrador',
                },
                error: null,
            });

            const result = await duplicateProperty('prop-1');
            expect(result.title).toBe('Casa Test (Copia)');
            expect(result.status).toBe('borrador');
            expect(result.featured).toBe(false);
        });
    });

    describe('fetchProperty', () => {
        it('returns property detail', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: mockPropertyDetail,
                error: null,
            });
            const result = await fetchProperty('prop-1');
            expect(result.title).toBe('Casa Test');
        });

        it('throws when not found', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
            await expect(fetchProperty('prop-1')).rejects.toThrow('Propiedad no encontrada');
        });
    });
});
