import { beforeEach, describe, expect, it, vi } from 'vitest';
import { embedProperty, toMlMetaRow, toMlQueueRow } from '../ml';

// Mock data
const mockQueueApiRow = {
    id: 1,
    property_id: 'prop-123',
    operation: 'publish' as const,
    status: 'pending' as const,
    attempts: 0,
    max_attempts: 5,
    next_attempt_at: '2024-01-01T00:00:00Z',
    ml_item_id: null,
    last_error: null,
    created_at: '2024-01-01T00:00:00Z',
    property: { title: 'Casa Moderna', code: 123 },
};

const mockMetaApiRow = {
    property_id: 'prop-123',
    ml_item_id: 987654321,
    status: 'active',
    permalink: 'https://mercadolibre.com.ar/item/MLA123',
    price: 285000,
    last_sync_at: '2024-01-01T12:00:00Z',
    last_sync_status: 'success' as const,
    property: { title: 'Casa Moderna', code: 123 },
};

describe('ml mappers', () => {
    describe('toMlQueueRow', () => {
        it('maps nested property object correctly', () => {
            const mapped = toMlQueueRow(mockQueueApiRow);
            expect(mapped.property_title).toBe('Casa Moderna');
            expect(mapped.property_code).toBe(123);
            expect(mapped.operation).toBe('publish');
            expect(mapped.status).toBe('pending');
        });

        it('maps array property correctly', () => {
            const rowWithArray = {
                ...mockQueueApiRow,
                property: [{ title: 'Array Casa', code: 456 }],
            };
            const mapped = toMlQueueRow(rowWithArray);
            expect(mapped.property_title).toBe('Array Casa');
            expect(mapped.property_code).toBe(456);
        });

        it('handles null property', () => {
            const rowWithNull = { ...mockQueueApiRow, property: null };
            const mapped = toMlQueueRow(rowWithNull);
            expect(mapped.property_title).toBeNull();
            expect(mapped.property_code).toBeNull();
        });
    });

    describe('toMlMetaRow', () => {
        it('maps meta row with property correctly', () => {
            const mapped = toMlMetaRow(mockMetaApiRow);
            expect(mapped.property_title).toBe('Casa Moderna');
            expect(mapped.property_code).toBe(123);
            expect(mapped.ml_item_id).toBe(987654321);
            expect(mapped.price).toBe(285000);
        });

        it('handles null price', () => {
            const rowWithNullPrice = { ...mockMetaApiRow, price: null };
            const mapped = toMlMetaRow(rowWithNullPrice);
            expect(mapped.price).toBeNull();
        });
    });

    describe('embedProperty', () => {
        it('handles null', () => {
            expect(embedProperty(null)).toEqual({ title: null, code: null });
        });

        it('handles single object', () => {
            expect(embedProperty({ title: 'Casa', code: 123 })).toEqual({
                title: 'Casa',
                code: 123,
            });
        });

        it('handles array (takes first)', () => {
            expect(
                embedProperty([
                    { title: 'First', code: 1 },
                    { title: 'Second', code: 2 },
                ]),
            ).toEqual({ title: 'First', code: 1 });
        });

        it('handles empty array', () => {
            expect(embedProperty([])).toEqual({ title: null, code: null });
        });
    });
});
