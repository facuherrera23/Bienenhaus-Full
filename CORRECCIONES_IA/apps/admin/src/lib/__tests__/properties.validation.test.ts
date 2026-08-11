import { describe, it, expect } from 'vitest';
import {
    PropertyFormSchema,
    PropertyImageSchema,
    PropertyRowSchema,
    PropertyDetailSchema,
    validatePropertyForm,
    validatePropertyImage,
} from '../_shared/properties-validation';

describe('properties-validation Zod schemas', () => {
    describe('PropertyFormSchema', () => {
        const validForm = {
            title: 'Casa Moderna en Country',
            status: 'publicada',
            listing_type: 'venta',
            price: 250000,
            currency: 'USD',
            expenses: 5000,
            description: 'Hermosa casa en country',
            address: 'Calle 123, Villa Belgrano',
            location_id: '123e4567-e89b-12d3-a456-426614174000',
            area_total: 200,
            area_covered: 150,
            bedrooms: 3,
            bathrooms: 2,
            garages: 1,
            floors: 2,
            year_built: 2020,
            featured: false,
            video_url: 'https://youtube.com/watch?v=test',
            latitude: -34.6,
            longitude: -58.4,
        };

        it('validates correct form', () => {
            const result = PropertyFormSchema.safeParse(validForm);
            expect(result.success).toBe(true);
        });

        it('requires title', () => {
            const invalid = { ...validForm, title: '' };
            const result = PropertyFormSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('enforces title max length', () => {
            const invalid = { ...validForm, title: 'A'.repeat(121) };
            const result = PropertyFormSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('enforces status enum', () => {
            const invalid = { ...validForm, status: 'invalid_status' };
            const result = PropertyFormSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('enforces listing_type enum', () => {
            const invalid = { ...validForm, listing_type: 'invalid' };
            const result = PropertyFormSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('enforces currency enum', () => {
            const invalid = { ...validForm, currency: 'EUR' };
            const result = PropertyFormSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('requires price > 0 when publicada', () => {
            const invalid = { ...validForm, status: 'publicada', price: 0 };
            const result = PropertyFormSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('allows null price when borrador', () => {
            const valid = { ...validForm, status: 'borrador', price: null };
            const result = PropertyFormSchema.safeParse(valid);
            expect(result.success).toBe(true);
        });

        it('requires location_id when publicada', () => {
            const invalid = { ...validForm, status: 'publicada', location_id: null };
            const result = PropertyFormSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('validates area_covered <= area_total', () => {
            const invalid = { ...validForm, area_total: 100, area_covered: 150 };
            const result = PropertyFormSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('allows null area_covered', () => {
            const valid = { ...validForm, area_covered: null };
            const result = PropertyFormSchema.safeParse(valid);
            expect(result.success).toBe(true);
        });

        it('validates bedrooms range', () => {
            const invalid = { ...validForm, bedrooms: 25 };
            const result = PropertyFormSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('validates video_url format', () => {
            const invalid = { ...validForm, video_url: 'not-a-url' };
            const result = PropertyFormSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('allows empty video_url', () => {
            const valid = { ...validForm, video_url: '' };
            const result = PropertyFormSchema.safeParse(valid);
            expect(result.success).toBe(true);
        });

        it('validates latitude range', () => {
            const invalid = { ...validForm, latitude: 100 };
            const result = PropertyFormSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('validates longitude range', () => {
            const invalid = { ...validForm, longitude: -200 };
            const result = PropertyFormSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });
    });

    describe('PropertyImageSchema', () => {
        it('validates correct image', () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            const result = PropertyImageSchema.safeParse({ property_id: '123e4567-e89b-12d3-a456-426614174000', file, alt: 'test' });
            expect(result.success).toBe(true);
        });

        it('rejects non-image files', () => {
            const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
            const result = PropertyImageSchema.safeParse({ property_id: '123e4567-e89b-12d3-a456-426614174000', file });
            expect(result.success).toBe(false);
        });

        it('rejects files over 10MB', () => {
            const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
            const result = PropertyImageSchema.safeParse({ property_id: '123e4567-e89b-12d3-a456-426614174000', file: largeFile });
            expect(result.success).toBe(false);
        });

        it('accepts valid image types', () => {
            const types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            types.forEach(type => {
                const file = new File(['test'], `test.${type.split('/')[1]}`, { type });
                const result = PropertyImageSchema.safeParse({ property_id: '123e4567-e89b-12d3-a456-426614174000', file });
                expect(result.success).toBe(true);
            });
        });
    });

    describe('PropertyRowSchema', () => {
        it('validates correct row', () => {
            const row = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                code: 123,
                title: 'Casa Test',
                status: 'publicada',
                listing_type: 'venta',
                price: 250000,
                currency: 'USD',
                location: 'Villa Belgrano',
                area_total: 200,
                bedrooms: 3,
                bathrooms: 2,
                featured: false,
                published_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
                cover_url: 'https://img.com/cover.jpg',
            };
            const result = PropertyRowSchema.safeParse(row);
            expect(result.success).toBe(true);
        });
    });

    describe('PropertyDetailSchema', () => {
        it('validates correct detail', () => {
            const detail = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                code: 123,
                title: 'Casa Test',
                slug: 'casa-test',
                description: 'Descripción',
                status: 'publicada',
                listing_type: 'venta',
                price: 250000,
                currency: 'USD',
                expenses: 5000,
                address: 'Calle 123',
                location_id: '123e4567-e89b-12d3-a456-426614174000',
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
                video_url: 'https://youtube.com/watch?v=test',
                cover_url: 'https://img.com/cover.jpg',
                location: 'Villa Belgrano',
                location_id: '123e4567-e89b-12d3-a456-426614174000',
                images: [],
                ml_meta: null,
            };
            const result = PropertyDetailSchema.safeParse(detail);
            expect(result.success).toBe(true);
        });
    });

    describe('validatePropertyForm', () => {
        it('returns valid with data', () => {
            const valid = {
                title: 'Casa Test',
                status: 'publicada',
                listing_type: 'venta',
                price: 250000,
                currency: 'USD',
                expenses: 5000,
                description: 'Desc',
                address: 'Calle 123',
                location_id: '123e4567-e89b-12d3-a456-426614174000',
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
            const result = validatePropertyForm(valid);
            expect(result.valid).toBe(true);
            expect(result.data).toBeDefined();
        });

        it('returns error for invalid', () => {
            const invalid = { title: '' };
            const result = validatePropertyForm(invalid);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('validatePropertyImage', () => {
        it('returns valid for correct image', () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            const result = validatePropertyImage({ property_id: '123e4567-e89b-12d3-a456-426614174000', file, alt: 'test' });
            expect(result.valid).toBe(true);
        });

        it('returns error for invalid', () => {
            const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
            const result = validatePropertyImage({ property_id: '123e4567-e89b-12d3-a456-426614174000', file });
            expect(result.valid).toBe(false);
            expect(result.error).toContain('no es una imagen');
        });
    });
});