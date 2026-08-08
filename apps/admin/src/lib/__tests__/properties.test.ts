import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { from } from '../../test/setup';
import {
    CONDITION_LABEL,
    createProperty,
    deletePropertyImage,
    duplicateProperty,
    fetchDeletedProperties,
    fetchFeaturedProperties,
    fetchLocations,
    fetchProperties,
    fetchPropertiesByListingType,
    fetchPropertiesByStatus,
    fetchProperty,
    fetchPropertyImages,
    LISTING_TYPE_LABEL,
    permanentDeleteProperty,
    reorderPropertyImages,
    restoreProperty,
    setPropertyCover,
    slugify,
    softDeleteProperty,
    STATUS_LABEL,
    STATUS_TONE,
    toFormValues,
    toNumeric,
    updateProperty,
    updatePropertyStatus,
    uploadPropertyImage,
} from '../properties';
import type { PropertyDetail, PropertyFormValues } from '../properties';

// ============================================================================
// Helpers
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
 * (ej. `update().eq('id', id)`). Las primeras `chainableCalls` llamadas
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

// ============================================================================
// Fixtures
// ============================================================================

const imagesApiRow = [
    { url: 'cover.webp', is_cover: true },
    { url: 'gallery.webp', is_cover: false },
];

const propertyApiRow = {
    id: 'prop-1',
    code: 1001,
    title: 'Casa Centro',
    status: 'publicada',
    listing_type: 'venta',
    price: 250000,
    currency: 'USD',
    area_total: 120,
    bedrooms: 3,
    bathrooms: 2,
    featured: true,
    published_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    location: { name: 'Centro' },
    images: imagesApiRow,
};

const propertyDetailApiRow = {
    id: 'prop-1',
    code: 1001,
    title: 'Casa Centro',
    slug: 'casa-centro',
    description: 'Casa amplia con jardin',
    status: 'publicada',
    listing_type: 'venta',
    price: 250000,
    currency: 'USD',
    expenses: 5000,
    address: 'Av. Siempre Viva 123',
    location_id: 'loc-1',
    latitude: -34.6,
    longitude: -58.4,
    area_total: 120,
    area_covered: 100,
    bedrooms: 3,
    bathrooms: 2,
    garages: 1,
    year_built: 2010,
    floors: 1,
    featured: true,
    published_at: null,
    updated_at: '2026-01-02T00:00:00Z',
    video_url: null,
    location: { name: 'Centro' },
    images: imagesApiRow,
};

const formValues: PropertyFormValues = {
    title: 'Casa Centro',
    status: 'publicada',
    listing_type: 'venta',
    price: 250000,
    currency: 'USD',
    expenses: 5000,
    description: 'Casa amplia',
    address: 'Av. Siempre Viva 123',
    location_id: 'loc-1',
    area_total: 120,
    area_covered: 100,
    bedrooms: 3,
    bathrooms: 2,
    garages: 1,
    floors: 1,
    year_built: 2010,
    featured: true,
    video_url: '',
    latitude: -34.6,
    longitude: -58.4,
};

const detail: PropertyDetail = {
    id: 'prop-1',
    code: 1001,
    title: 'Casa Centro',
    slug: 'casa-centro',
    description: 'Casa amplia',
    status: 'publicada',
    listing_type: 'venta',
    price: 250000,
    currency: 'USD',
    expenses: 5000,
    address: 'Av. Siempre Viva 123',
    location: 'Centro',
    location_id: 'loc-1',
    latitude: -34.6,
    longitude: -58.4,
    area_total: 120,
    area_covered: 100,
    bedrooms: 3,
    bathrooms: 2,
    garages: 1,
    floors: 1,
    year_built: 2010,
    featured: true,
    published_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    video_url: null,
    cover_url: 'cover.webp',
};

beforeEach(() => {
    vi.clearAllMocks();
});

// ============================================================================
// Labels y constantes re-exportadas
// ============================================================================

describe('STATUS_LABEL / STATUS_TONE', () => {
    it('map every property status to a label and tone', () => {
        expect(STATUS_LABEL.publicada).toBe('Publicada');
        expect(STATUS_LABEL.vendida).toBe('Vendida');
        expect(STATUS_TONE.publicada).toBe('success');
        expect(STATUS_TONE.vendida).toBe('info');
        expect(Object.keys(STATUS_LABEL).length).toBe(7);
    });
});

describe('LISTING_TYPE_LABEL / CONDITION_LABEL', () => {
    it('map listing types and conditions', () => {
        expect(LISTING_TYPE_LABEL.venta).toBe('Venta');
        expect(LISTING_TYPE_LABEL.alquiler).toBe('Alquiler');
        expect(CONDITION_LABEL.nuevo).toBe('Nuevo');
        expect(CONDITION_LABEL.a_refaccionar).toBe('A refaccionar');
    });
});

// ============================================================================
// Helpers puros
// ============================================================================

describe('toNumeric', () => {
    it('returns null for null/undefined/empty', () => {
        expect(toNumeric(null)).toBeNull();
        expect(toNumeric(undefined)).toBeNull();
        expect(toNumeric('')).toBeNull();
        expect(toNumeric('   ')).toBeNull();
    });

    it('parses valid numeric strings', () => {
        expect(toNumeric('250000')).toBe(250000);
        expect(toNumeric(' 42 ')).toBe(42);
        expect(toNumeric('12.5')).toBe(12.5);
    });

    it('returns null for non-numeric input', () => {
        expect(toNumeric('abc')).toBeNull();
        expect(toNumeric('12abc')).toBeNull();
    });
});

describe('slugify', () => {
    it('lowercases and replaces spaces with hyphens', () => {
        expect(slugify('Casa Centro')).toBe('casa-centro');
    });

    it('strips accents', () => {
        expect(slugify('Casa Céntrica')).toBe('casa-centrica');
    });

    it('trims leading/trailing hyphens and collapses separators', () => {
        expect(slugify('  Casa   Centro  ')).toBe('casa-centro');
        expect(slugify('-Casa-')).toBe('casa');
    });

    it('truncates to 80 chars', () => {
        const long = 'a'.repeat(120);
        expect(slugify(long)).toHaveLength(80);
    });
});

// ============================================================================
// Mappers
// ============================================================================

describe('toFormValues', () => {
    it('maps a detail into form values with empty-string defaults', () => {
        const values = toFormValues(detail);
        expect(values.title).toBe('Casa Centro');
        expect(values.status).toBe('publicada');
        expect(values.price).toBe(250000);
        expect(values.description).toBe('Casa amplia');
        expect(values.video_url).toBe('');
    });

    it('defaults null description/address/video to empty strings', () => {
        const values = toFormValues({ ...detail, description: null, address: null, video_url: null });
        expect(values.description).toBe('');
        expect(values.address).toBe('');
        expect(values.video_url).toBe('');
    });
});

// ============================================================================
// API Functions - Fetch
// ============================================================================

describe('fetchProperties', () => {
    it('maps API rows via toPropertyRow', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({ data: [propertyApiRow], error: null }),
        });
        const rows = await fetchProperties();
        expect(rows).toHaveLength(1);
        expect(rows[0].id).toBe('prop-1');
        expect(rows[0].title).toBe('Casa Centro');
        expect(rows[0].location).toBe('Centro');
        expect(rows[0].cover_url).toBe('cover.webp');
    });

    it('defaults location to Sin zona and cover to first image when missing', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({
                data: [
                    {
                        ...propertyApiRow,
                        location: null,
                        images: [{ url: 'only.webp', is_cover: false }],
                    },
                ],
                error: null,
            }),
        });
        const rows = await fetchProperties();
        expect(rows[0].location).toBe('Sin zona');
        expect(rows[0].cover_url).toBe('only.webp');
    });

    it('returns empty array when no data', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
        await expect(fetchProperties()).resolves.toEqual([]);
    });

    it('throws on error', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
        });
        await expect(fetchProperties()).rejects.toThrow('boom');
    });
});

describe('fetchProperty', () => {
    it('returns detail when found', async () => {
        mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: propertyDetailApiRow, error: null }),
        });
        const detailRow = await fetchProperty('prop-1');
        expect(detailRow.id).toBe('prop-1');
        expect(detailRow.slug).toBe('casa-centro');
        expect(detailRow.price).toBe(250000);
        expect(detailRow.cover_url).toBe('cover.webp');
    });

    it('throws when not found', async () => {
        mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        });
        await expect(fetchProperty('nope')).rejects.toThrow('Propiedad no encontrada');
    });

    it('throws on error', async () => {
        mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
        });
        await expect(fetchProperty('prop-1')).rejects.toThrow('boom');
    });
});

describe('fetchDeletedProperties / fetchPropertiesByStatus / fetchPropertiesByListingType', () => {
    it('fetch deleted properties', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({ data: [propertyApiRow], error: null }),
        });
        const rows = await fetchDeletedProperties();
        expect(rows).toHaveLength(1);
    });

    it('filters by status', async () => {
        const chain = mockFrom({
            returns: vi.fn().mockResolvedValue({ data: [propertyApiRow], error: null }),
        });
        const rows = await fetchPropertiesByStatus('publicada');
        expect(rows).toHaveLength(1);
        expect(chain.eq).toHaveBeenCalledWith('status', 'publicada');
    });

    it('filters by listing type', async () => {
        const chain = mockFrom({
            returns: vi.fn().mockResolvedValue({ data: [propertyApiRow], error: null }),
        });
        const rows = await fetchPropertiesByListingType('venta');
        expect(rows).toHaveLength(1);
        expect(chain.eq).toHaveBeenCalledWith('listing_type', 'venta');
    });

    it('throws on error', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
        });
        await expect(fetchPropertiesByStatus('publicada')).rejects.toThrow('boom');
    });
});

describe('fetchFeaturedProperties', () => {
    it('applies the default limit of 6', async () => {
        const chain = mockFrom({
            returns: vi.fn().mockResolvedValue({ data: [propertyApiRow], error: null }),
        });
        const rows = await fetchFeaturedProperties();
        expect(rows).toHaveLength(1);
        expect(chain.limit).toHaveBeenCalledWith(6);
    });

    it('honors a custom limit', async () => {
        const chain = mockFrom({
            returns: vi.fn().mockResolvedValue({ data: [], error: null }),
        });
        await fetchFeaturedProperties(3);
        expect(chain.limit).toHaveBeenCalledWith(3);
    });
});

describe('fetchLocations', () => {
    it('returns locations', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({
                data: [
                    { id: 'loc-1', name: 'Centro', zone: 'CABA' },
                    { id: 'loc-2', name: 'Norte', zone: null },
                ],
                error: null,
            }),
        });
        const locations = await fetchLocations();
        expect(locations).toHaveLength(2);
        expect(locations[0].name).toBe('Centro');
    });

    it('throws on error', async () => {
        mockFrom({
            returns: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
        });
        await expect(fetchLocations()).rejects.toThrow('boom');
    });
});

describe('fetchPropertyImages', () => {
    it('returns images ordered by position', async () => {
        const chain = mockFrom({
            returns: vi.fn().mockResolvedValue({
                data: [
                    { id: 'img-1', property_id: 'prop-1', url: 'a.webp', alt: null, position: 0, is_cover: true, created_at: '2026-01-01T00:00:00Z' },
                ],
                error: null,
            }),
        });
        const images = await fetchPropertyImages('prop-1');
        expect(images).toHaveLength(1);
        expect(images[0].url).toBe('a.webp');
        expect(chain.order).toHaveBeenCalledWith('position', { ascending: true });
    });
});

// ============================================================================
// API Functions - CRUD
// ============================================================================

describe('createProperty', () => {
    it('creates a property, slugs the title and sets published_at for publicada', async () => {
        const chain = mockFrom({
            single: vi.fn().mockResolvedValue({ data: { id: 'new-1' }, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: propertyDetailApiRow, error: null }),
        });
        const result = await createProperty(formValues);
        expect(result.id).toBe('prop-1');
        const payload = (chain.insert as unknown as Mock).mock.calls[0][0];
        expect(payload.title).toBe('Casa Centro');
        expect(payload.slug).toBe('casa-centro');
        expect(payload.status).toBe('publicada');
        expect(typeof payload.published_at).toBe('string');
        expect(payload.video_url).toBeNull();
    });

    it('leaves published_at null for non-publicada status', async () => {
        const chain = mockFrom({
            single: vi.fn().mockResolvedValue({ data: { id: 'new-1' }, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: propertyDetailApiRow, error: null }),
        });
        await createProperty({ ...formValues, status: 'borrador' });
        const payload = (chain.insert as unknown as Mock).mock.calls[0][0];
        expect(payload.published_at).toBeNull();
    });

    it('maps duplicate key errors to a friendly message', async () => {
        mockFrom({
            single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'duplicate key value violates unique constraint', code: '23505' },
            }),
        });
        await expect(createProperty(formValues)).rejects.toThrow(
            'Ya existe una propiedad con ese título.',
        );
    });

    it('throws on other errors', async () => {
        mockFrom({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
        });
        await expect(createProperty(formValues)).rejects.toThrow('boom');
    });
});

describe('updateProperty', () => {
    it('sets published_at when publishing an unpublished property', async () => {
        const chain = mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: propertyDetailApiRow, error: null }),
            eq: eqWithTerminal(1, { error: null }),
        });
        await expect(updateProperty('prop-1', formValues)).resolves.toBeUndefined();
        const patch = (chain.update as unknown as Mock).mock.calls[0][0];
        expect(patch.status).toBe('publicada');
        expect(typeof patch.published_at).toBe('string');
    });

    it('re-slugs when the title changes', async () => {
        const chain = mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: propertyDetailApiRow, error: null }),
            eq: eqWithTerminal(1, { error: null }),
        });
        await updateProperty('prop-1', { ...formValues, title: 'Casa Centro 2' });
        const patch = (chain.update as unknown as Mock).mock.calls[0][0];
        expect(patch.slug).toBe('casa-centro-2');
    });

    it('does not set published_at when already published', async () => {
        const chain = mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({
                data: { ...propertyDetailApiRow, published_at: '2026-01-01T00:00:00Z' },
                error: null,
            }),
            eq: eqWithTerminal(1, { error: null }),
        });
        await updateProperty('prop-1', formValues);
        const patch = (chain.update as unknown as Mock).mock.calls[0][0];
        expect(patch.published_at).toBeUndefined();
    });

    it('throws on update error', async () => {
        mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: propertyDetailApiRow, error: null }),
            eq: eqWithTerminal(1, { error: { message: 'boom' } }),
        });
        await expect(updateProperty('prop-1', formValues)).rejects.toThrow('boom');
    });
});

describe('updatePropertyStatus', () => {
    it('sets published_at when transitioning to publicada without one', async () => {
        const chain = mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: { published_at: null }, error: null }),
            eq: eqWithTerminal(1, { error: null }),
        });
        await updatePropertyStatus('prop-1', 'publicada');
        const patch = (chain.update as unknown as Mock).mock.calls[0][0];
        expect(patch.status).toBe('publicada');
        expect(typeof patch.published_at).toBe('string');
    });

    it('keeps published_at when already published', async () => {
        const chain = mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({
                data: { published_at: '2026-01-01T00:00:00Z' },
                error: null,
            }),
            eq: eqWithTerminal(1, { error: null }),
        });
        await updatePropertyStatus('prop-1', 'publicada');
        const patch = (chain.update as unknown as Mock).mock.calls[0][0];
        expect(patch.status).toBe('publicada');
        expect(patch.published_at).toBeUndefined();
    });

    it('skips the published_at lookup for non-publicada status', async () => {
        const chain = mockFrom({
            eq: vi.fn().mockResolvedValue({ error: null }),
        });
        await updatePropertyStatus('prop-1', 'pausada');
        expect(chain.maybeSingle).not.toHaveBeenCalled();
        const patch = (chain.update as unknown as Mock).mock.calls[0][0];
        expect(patch.status).toBe('pausada');
        expect(patch.published_at).toBeUndefined();
    });

    it('throws on error', async () => {
        mockFrom({
            eq: vi.fn().mockResolvedValue({ error: { message: 'boom' } }),
        });
        await expect(updatePropertyStatus('prop-1', 'pausada')).rejects.toThrow('boom');
    });
});

// ============================================================================
// API Functions - Soft Delete, Restore, Duplicate
// ============================================================================

describe('softDeleteProperty / restoreProperty', () => {
    it('sets deleted_at on soft delete', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ error: null }) });
        await expect(softDeleteProperty('prop-1')).resolves.toBeUndefined();
        const patch = (chain.update as unknown as Mock).mock.calls[0][0];
        expect(typeof patch.deleted_at).toBe('string');
    });

    it('clears deleted_at on restore', async () => {
        const chain = mockFrom({ eq: vi.fn().mockResolvedValue({ error: null }) });
        await expect(restoreProperty('prop-1')).resolves.toBeUndefined();
        const patch = (chain.update as unknown as Mock).mock.calls[0][0];
        expect(patch.deleted_at).toBeNull();
    });

    it('throws on error', async () => {
        mockFrom({ eq: vi.fn().mockResolvedValue({ error: { message: 'boom' } }) });
        await expect(softDeleteProperty('prop-1')).rejects.toThrow('boom');
    });
});

describe('permanentDeleteProperty', () => {
    it('removes storage images and deletes the row', async () => {
        mockFrom({
            eq: vi.fn().mockResolvedValue({
                data: [{ url: 'https://example.com/storage/v1/object/public/property-images/foo.webp' }],
                error: null,
            }),
        });
        await expect(permanentDeleteProperty('prop-1')).resolves.toBeUndefined();
    });

    it('deletes without touching storage when there are no images', async () => {
        mockFrom({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        });
        await expect(permanentDeleteProperty('prop-1')).resolves.toBeUndefined();
    });

    it('throws on delete error', async () => {
        mockFrom({
            eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
        });
        await expect(permanentDeleteProperty('prop-1')).rejects.toThrow('boom');
    });
});

describe('duplicateProperty', () => {
    it('creates a borrador copy with (Copia) suffix', async () => {
        const chain = mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({ data: propertyDetailApiRow, error: null }),
            single: vi.fn().mockResolvedValue({ data: { id: 'new-1' }, error: null }),
        });
        const result = await duplicateProperty('prop-1');
        expect(result.id).toBe('prop-1');
        const payload = (chain.insert as unknown as Mock).mock.calls[0][0];
        expect(payload.title).toBe('Casa Centro (Copia)');
        expect(payload.status).toBe('borrador');
        expect(payload.featured).toBe(false);
    });
});

// ============================================================================
// API Functions - Images
// ============================================================================

describe('uploadPropertyImage', () => {
    it('uploads a webp file and inserts an image row', async () => {
        const chain = mockFrom({
            single: vi.fn().mockResolvedValue({
                data: {
                    id: 'img-1',
                    property_id: 'prop-1',
                    url: 'https://example.com/test.jpg',
                    alt: 'foto',
                    position: 0,
                    is_cover: false,
                    created_at: '2026-01-01T00:00:00Z',
                },
                error: null,
            }),
        });
        const file = new File(['fake-webp'], 'foto.webp', { type: 'image/webp' });
        const result = await uploadPropertyImage('prop-1', file, 'foto');
        expect(result.id).toBe('img-1');
        expect(result.url).toBe('https://example.com/test.jpg');
        const payload = (chain.insert as unknown as Mock).mock.calls[0][0];
        expect(payload.property_id).toBe('prop-1');
        expect(payload.position).toBe(0);
        expect(payload.is_cover).toBe(false);
    });
});

describe('deletePropertyImage', () => {
    it('deletes the row and removes the storage file', async () => {
        mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({
                data: { url: 'https://example.com/storage/v1/object/public/property-images/foo.webp' },
                error: null,
            }),
            eq: eqWithTerminal(1, { error: null }),
        });
        await expect(deletePropertyImage('img-1')).resolves.toBeUndefined();
    });

    it('throws on delete error', async () => {
        mockFrom({
            maybeSingle: vi.fn().mockResolvedValue({
                data: { url: 'https://example.com/foo.webp' },
                error: null,
            }),
            eq: eqWithTerminal(1, { error: { message: 'boom' } }),
        });
        await expect(deletePropertyImage('img-1')).rejects.toThrow('boom');
    });
});

describe('setPropertyCover', () => {
    it('clears previous covers and sets the new one', async () => {
        const chain = mockFrom({ eq: eqWithTerminal(2, { error: null }) });
        await expect(setPropertyCover('prop-1', 'img-1')).resolves.toBeUndefined();
        const updates = (chain.update as unknown as Mock).mock.calls.map((c) => c[0]);
        expect(updates[0]).toEqual({ is_cover: false });
        expect(updates[1]).toEqual({ is_cover: true });
    });

    it('throws when setting the new cover fails', async () => {
        mockFrom({ eq: eqWithTerminal(2, { error: { message: 'boom' } }) });
        await expect(setPropertyCover('prop-1', 'img-1')).rejects.toThrow('boom');
    });
});

describe('reorderPropertyImages', () => {
    it('issues positional updates for every image', async () => {
        const chain = mockFrom({ eq: vi.fn().mockReturnThis() });
        await expect(
            reorderPropertyImages('prop-1', ['img-a', 'img-b', 'img-c']),
        ).resolves.toBeUndefined();
        const updates = (chain.update as unknown as Mock).mock.calls.map((c) => c[0]);
        expect(updates).toEqual([{ position: 0 }, { position: 1 }, { position: 2 }]);
    });
});
