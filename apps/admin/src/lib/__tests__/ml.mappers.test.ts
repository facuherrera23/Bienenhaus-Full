import { describe, expect, it } from 'vitest';
import { embedProperty, toMlMetaRow, toMlQueueRow } from '../ml';

describe('ML mappers', () => {
    describe('embedProperty', () => {
        it('returns null for null input', () => {
            const result = embedProperty(null);
            expect(result).toEqual({ title: null, code: null });
        });

        it('returns null for undefined input', () => {
            const result = embedProperty(undefined);
            expect(result).toEqual({ title: null, code: null });
        });

        it('handles single object', () => {
            const result = embedProperty({ title: 'Casa en Belgrano', code: 123 });
            expect(result).toEqual({ title: 'Casa en Belgrano', code: 123 });
        });

        it('handles array of objects', () => {
            const result = embedProperty([
                { title: 'Casa 1', code: 123 },
                { title: 'Casa 2', code: 456 },
            ]);
            expect(result).toEqual({ title: 'Casa 1', code: 123 });
        });

        it('handles empty array', () => {
            const result = embedProperty([]);
            expect(result).toEqual({ title: null, code: null });
        });
    });

    describe('toMlQueueRow', () => {
        const baseQueueRow = {
            id: 'queue-1',
            property_id: 'prop-1',
            operation: 'publish' as const,
            status: 'pending' as const,
            attempts: 0,
            max_attempts: 3,
            next_attempt_at: '2024-01-01T00:00:00Z',
            ml_item_id: null,
            last_error: null,
            created_at: '2024-01-01T00:00:00Z',
            property: { title: 'Casa en Belgrano', code: 123 },
        };

        it('maps queue row with property object', () => {
            const result = toMlQueueRow(baseQueueRow);
            expect(result).toEqual({
                id: 'queue-1',
                property_id: 'prop-1',
                operation: 'publish',
                status: 'pending',
                attempts: 0,
                max_attempts: 3,
                next_attempt_at: '2024-01-01T00:00:00Z',
                ml_item_id: null,
                last_error: null,
                created_at: '2024-01-01T00:00:00Z',
                property_title: 'Casa en Belgrano',
                property_code: 123,
            });
        });

        it('maps queue row with null property', () => {
            const result = toMlQueueRow({ ...baseQueueRow, property: null });
            expect(result.property_title).toBeNull();
            expect(result.property_code).toBeNull();
        });

        it('maps queue row with property array', () => {
            const result = toMlQueueRow({
                ...baseQueueRow,
                property: [{ title: 'Casa 1', code: 123 }, { title: 'Casa 2', code: 456 }],
            });
            expect(result.property_title).toBe('Casa 1');
            expect(result.property_code).toBe(123);
        });
    });

    describe('toMlMetaRow', () => {
        const baseMetaRow = {
            id: 'meta-1',
            property_id: 'prop-1',
            ml_item_id: 'MLA123456',
            listing_type: 'gold_special',
            condition: 'new',
            status: 'active',
            price: 100000,
            currency_id: 'ARS',
            available_quantity: 1,
            sold_quantity: 0,
            permalink: 'https://mercadolibre.com.ar/item/MLA123456',
            thumbnail: 'https://img.ml.com/thumb.jpg',
            pictures: ['https://img.ml.com/pic1.jpg'],
            last_sync_at: '2024-01-01T00:00:00Z',
            sync_error: null,
            property: { title: 'Casa en Belgrano', code: 123 },
        };

        it('maps meta row with property object', () => {
            const result = toMlMetaRow(baseMetaRow);
            expect(result).toEqual({
                property_id: 'prop-1',
                ml_item_id: 'MLA123456',
                status: 'active',
                permalink: 'https://mercadolibre.com.ar/item/MLA123456',
                price: 100000,
                last_sync_at: '2024-01-01T00:00:00Z',
                last_sync_status: undefined,
                property_title: 'Casa en Belgrano',
                property_code: 123,
            });
        });

        it('maps meta row with null property', () => {
            const result = toMlMetaRow({ ...baseMetaRow, property: null });
            expect(result.property_title).toBeNull();
            expect(result.property_code).toBeNull();
        });
    });
});