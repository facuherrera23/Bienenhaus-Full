import { describe, expect, it } from 'vitest';
import { embedLocationName, slugify, toFormValues, toNumeric } from '../properties';
import type { PropertyDetail } from '../../types/properties';

describe.skip('properties helpers', () => {
    describe('slugify', () => {
        it('converts basic title to slug', () => {
            expect(slugify('Casa Moderna en Country')).toBe('casa-moderna-en-country');
        });

        it('handles special characters', () => {
            expect(slugify('Casa en Villa Belgrano')).toBe('casa-en-villa-belgrano');
        });

        it('removes accents', () => {
            expect(slugify('Departación en Núñez')).toBe('departacion-en-nunez');
        });

        it('limits length to 80 chars', () => {
            const longTitle = 'A'.repeat(100);
            expect(slugify(longTitle).length).toBe(80);
        });

        it('handles empty string', () => {
            expect(slugify('')).toBe('');
        });

        it('handles multiple spaces', () => {
            expect(slugify('Casa    Moderna   En   Country')).toBe('casa-moderna-en-country');
        });

        it('removes special characters', () => {
            expect(slugify('Casa @#$% Moderna!')).toBe('casa-moderna');
        });
    });

    describe('toNumeric', () => {
        it('converts valid number string', () => {
            expect(toNumeric('123.45')).toBe(123.45);
        });

        it('converts integer string', () => {
            expect(toNumeric('100')).toBe(100);
        });

        it('returns null for empty string', () => {
            expect(toNumeric('')).toBeNull();
        });

        it('returns null for whitespace', () => {
            expect(toNumeric('   ')).toBeNull();
        });

        it('returns null for invalid number', () => {
            expect(toNumeric('abc')).toBeNull();
        });

        it('returns null for null/undefined', () => {
            expect(toNumeric(null)).toBeNull();
            expect(toNumeric(undefined)).toBeNull();
        });

        it('handles negative numbers', () => {
            expect(toNumeric('-50')).toBe(-50);
        });

        it('handles scientific notation', () => {
            expect(toNumeric('1e3')).toBe(1000);
        });
    });

    describe('toFormValues', () => {
        const mockPropertyDetail: PropertyDetail = {
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

        it('maps all fields correctly', () => {
            const form = toFormValues(mockPropertyDetail);
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
            const propertyWithNulls = {
                ...mockPropertyDetail(),
                description: null,
                expenses: null,
                address: null,
                video_url: null,
            };
            const form = toFormValues(propertyWithNulls);
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

        it('handles array with multiple items (takes first)', () => {
            expect(embedLocationName([{ name: 'First' }, { name: 'Second' }])).toBe('First');
        });
    });
});
