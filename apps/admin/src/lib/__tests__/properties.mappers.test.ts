import { describe, it, expect, vi } from 'vitest';
import { toPropertyRow, toPropertyDetail, toFormValues, embedLocationName, slugify, toNumeric } from '../properties';
import type { PropertyApiRow, PropertyDetailApiRow, PropertyDetail } from '../types/properties';

describe('properties mappers', () => {
    const baseApiRow: PropertyApiRow = {
        id: 'prop-1',
        code: 123,
        title: 'Casa Test',
        status: 'publicada',
        listing_type: 'venta',
        price: 250000,
        currency: 'USD',
        area_total: 200,
        bedrooms: 3,
        bathrooms: 2,
        featured: false,
        published_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        location: { name: 'Villa Belgrano' },
        images: [{ url: 'https://img.com/1.jpg', is_cover: true }],
    } as PropertyApiRow;

    const baseDetailApiRow: PropertyDetailApiRow = {
        ...baseApiRow,
        slug: 'casa-test',
        description: 'Descripción test',
        expenses: 5000,
        address: 'Calle 123',
        location_id: 'loc-1',
        latitude: -34.6,
        longitude: -58.4,
        area_total: 200,
        area_covered: 150,
        bathrooms: 2,
        garages: 1,
        year_built: 2020,
        floors: 2,
        video_url: 'https://youtube.com/watch?v=test',
    } as PropertyDetailApiRow;

    describe('toPropertyRow', () => {
        it('maps nested property object correctly', () => {
            const mapped = toPropertyRow(baseApiRow);
            expect(mapped.property_title).toBe('Villa Belgrano');
            expect(mapped.property_code).toBe(123);
            expect(mapped.cover_url).toBe('https://img.com/1.jpg');
        });

        it('handles array location', () => {
            const row = { ...baseApiRow, location: [{ name: 'Array Location' }] };
            const mapped = toPropertyRow(row);
            expect(mapped.location).toBe('Array Location');
        });

        it('handles null location', () => {
            const row = { ...baseApiRow, location: null };
            const mapped = toPropertyRow(row);
            expect(mapped.location).toBe('Sin zona');
        });

        it('handles null images', () => {
            const row = { ...baseApiRow, images: null };
            const mapped = toPropertyRow(row);
            expect(mapped.cover_url).toBeNull();
        });

        it('handles empty images array', () => {
            const row = { ...baseApiRow, images: [] };
            const mapped = toPropertyRow(row);
            expect(mapped.cover_url).toBeNull();
        });
    });

    describe('toPropertyDetail', () => {
        it('maps all fields correctly', () => {
            const detail = toPropertyDetail(baseDetailApiRow);
            expect(detail.title).toBe('Casa Test');
            expect(detail.price).toBe(250000);
            expect(detail.currency).toBe('USD');
            expect(detail.expenses).toBe(5000);
            expect(detail.area_total).toBe(200);
            expect(detail.area_covered).toBe(150);
            expect(detail.location).toBe('Villa Belgrano');
        });

        it('handles null price', () => {
            const row = { ...baseDetailApiRow, price: null };
            const detail = toPropertyDetail(row);
            expect(detail.price).toBeNull();
        });

        it('handles null expenses', () => {
            const row = { ...baseDetailApiRow, expenses: null };
            const detail = toPropertyDetail(row);
            expect(detail.expenses).toBeNull();
        });
    });

    describe('toFormValues', () => {
        it('maps all fields correctly', () => {
            const detail: PropertyDetail = {
                id: 'prop-1',
                code: 123,
                title: 'Casa Test',
                slug: 'casa-test',
                description: 'Descripción test',
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
                featured: true,
                published_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
                video_url: 'https://youtube.com/watch?v=test',
                cover_url: 'https://img.com/cover.jpg',
                location: 'Villa Belgrano',
                location_id: 'loc-1',
                images: [],
                ml_meta: null,
            };

            const form = toFormValues(detail);
            expect(form.title).toBe('Casa Test');
            expect(form.status).toBe('publicada');
            expect(form.listing_type).toBe('venta');
            expect(form.price).toBe(250000);
            expect(form.currency).toBe('USD');
            expect(form.expenses).toBe(5000);
            expect(form.description).toBe('Descripción test');
            expect(form.address).toBe('Calle 123');
            expect(form.location_id).toBe('loc-1');
            expect(form.area_total).toBe(200);
            expect(form.area_covered).toBe(150);
            expect(form.bedrooms).toBe(3);
            expect(form.bathrooms).toBe(2);
            expect(form.garages).toBe(1);
            expect(form.floors).toBe(2);
            expect(form.year_built).toBe(2020);
            expect(form.featured).toBe(true);
            expect(form.video_url).toBe('https://youtube.com/watch?v=test');
        });

        it('handles null values gracefully', () => {
            const detail = {
                ...mockPropertyDetail(),
                description: null,
                expenses: null,
                address: null,
                video_url: null,
            };
            const form = toFormValues(detail);
            expect(form.description).toBe('');
            expect(form.expenses).toBeNull();
            expect(form.address).toBe('');
            expect(form.video_url).toBe('');
        });
    });

    describe('embedLocationName', () => {
        it('handles null', () => {
            expect(embedLocationName(null)).toBeNull();
        });

        it('handles single object', () => {
            expect(embedLocationName({ name: 'Villa Belgrano' })).toBe('Villa Belgrano');
        });

        it('handles array', () => {
            expect(embedLocationName([{ name: 'Villa Belgrano' }])).toBe('Villa Belgrano');
        });

        it('handles empty array', () => {
            expect(embedLocationName([])).toBeNull();
        });
    });

    describe('slugify', () => {
        it('converts basic title', () => {
            expect(slugify('Casa Moderna en Country')).toBe('casa-moderna-en-country');
        });

        it('handles special characters', () => {
            expect(slugify('Casa en Villa Belgrano')).toBe('casa-en-villa-belgrano');
        });

        it('removes accents', () => {
            expect(slugify('Departación en Núñez')).toBe('departacion-en-nunez');
        });

        it('limits length', () => {
            const longTitle = 'A'.repeat(100);
            expect(slugify(longTitle).length).toBe(80);
        });
    });

    describe('toNumeric', () => {
        it('converts valid number', () => {
            expect(toNumeric('123.45')).toBe(123.45);
        });

        it('returns null for empty', () => {
            expect(toNumeric('')).toBeNull();
        });

        it('returns null for invalid', () => {
            expect(toNumeric('abc')).toBeNull();
        });
    });

    function mockPropertyDetail() {
        return {
            id: 'prop-1',
            code: 123,
            title: 'Casa Test',
            slug: 'casa-test',
            description: null,
            status: 'publicada',
            listing_type: 'venta',
            price: 250000,
            currency: 'USD',
            expenses: null,
            address: null,
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
            featured: true,
            published_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            video_url: null,
            cover_url: 'https://img.com/cover.jpg',
            location: 'Villa Belgrano',
            location_id: 'loc-1',
            images: [],
            ml_meta: null,
        };
    }
});