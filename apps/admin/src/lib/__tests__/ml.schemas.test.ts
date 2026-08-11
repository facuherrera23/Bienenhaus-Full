import { describe, it, expect } from 'vitest';
import {
    MlTokenResponseSchema,
    MlItemSchema,
    MlItemPayloadSchema,
    MlCategorySchema,
    MlListingTypeSchema,
    MlQuestionSchema,
    MlOrderSchema,
    MlWebhookPayloadSchema,
    parseMlResponse,
} from '../_shared/ml.schemas';
import { validateSetting } from '../site-validation';

describe('ml.schemas Zod validation', () => {
    describe('MlTokenResponseSchema', () => {
        it('validates correct token response', () => {
            const validToken = {
                access_token: 'APP_USR-12345',
                token_type: 'bearer',
                expires_in: 21600,
                scope: 'read write',
                user_id: 123456789,
                refresh_token: 'TG-12345',
            };
            const result = MlTokenResponseSchema.safeParse(validToken);
            expect(result.success).toBe(true);
        });

        it('rejects missing required fields', () => {
            const invalid = { access_token: 'token' };
            const result = MlTokenResponseSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('rejects wrong types', () => {
            const invalid = { ...validToken, expires_in: '21600' }; // string instead of number
            const result = MlTokenResponseSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });
    });

    describe('MlItemSchema', () => {
        const validItem = {
            id: 'MLA123456789',
            title: 'Casa en venta',
            price: 250000,
            status: 'active',
            permalink: 'https://mercadolibre.com.ar/MLA-123',
            listing_type_id: 'gold_pro',
            sold_quantity: 0,
            available_quantity: 1,
            currency_id: 'ARS',
            pictures: [{ id: '1', url: 'https://img.com/1.jpg', secure_url: 'https://img.com/1.jpg', size: '500x500', max_size: '1000x1000', quality: 90 }],
            attributes: [{ id: 'ROOMS', value_name: '3' }],
        };

        it('validates correct item', () => {
            const result = MlItemSchema.safeParse(validItem);
            expect(result.success).toBe(true);
        });

        it('accepts minimal item (optional fields)', () => {
            const minimal = { id: 'MLA1', title: 'Test', price: 100, status: 'active', permalink: 'https://ml.com/1', listing_type_id: 'free' };
            const result = MlItemSchema.safeParse(minimal);
            expect(result.success).toBe(true);
        });

        it('rejects missing required fields', () => {
            const invalid = { title: 'Test' }; // missing id, price, etc.
            const result = MlItemSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });
    });

    describe('MlItemPayloadSchema', () => {
        const validPayload = {
            title: 'Casa en venta',
            category_id: 'MLA1459',
            price: 250000,
            currency_id: 'ARS',
            available_quantity: 1,
            buying_mode: 'buy_it_now',
            listing_type_id: 'gold_pro',
            condition: 'used',
            attributes: [{ id: 'ROOMS', value_name: '3' }],
        };

        it('validates correct payload', () => {
            const result = MlItemPayloadSchema.safeParse(validPayload);
            expect(result.success).toBe(true);
        });

        it('enforces condition enum', () => {
            const invalid = { ...validPayload, condition: 'nuevo' }; // should be 'new' or 'used'
            const result = MlItemPayloadSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('enforces buying_mode', () => {
            const invalid = { ...validPayload, buying_mode: 'auction' };
            const result = MlItemPayloadSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });
    });

    describe('MlCategorySchema & MlListingTypeSchema', () => {
        it('validates category', () => {
            const result = MlCategorySchema.safeParse({ id: 'MLA1459', name: 'Inmuebles' });
            expect(result.success).toBe(true);
        });

        it('validates listing type', () => {
            const result = MlListingTypeSchema.safeParse({ id: 'gold_pro', name: 'Oro Profesional' });
            expect(result.success).toBe(true);
        });
    });

    describe('MlQuestionSchema', () => {
        const validQuestion = {
            id: 1,
            item_id: 123,
            text: '¿Cuál es el precio?',
            from: { user_id: 456, nickname: 'comprador123' },
            date_created: '2024-01-01T10:00:00Z',
            status: 'UNANSWERED',
        };

        it('validates correct question', () => {
            const result = MlQuestionSchema.safeParse(validQuestion);
            expect(result.success).toBe(true);
        });

        it('accepts nullable from', () => {
            const q = { ...validQuestion, from: null };
            const result = MlQuestionSchema.safeParse(q);
            expect(result.success).toBe(true);
        });

        it('accepts optional answer', () => {
            const q = { ...validQuestion, answer: { text: 'Respuesta', status: 'ACTIVE', date_created: '2024-01-01T11:00:00Z' } };
            const result = MlQuestionSchema.safeParse(q);
            expect(result.success).toBe(true);
        });
    });

    describe('MlOrderSchema', () => {
        const validOrder = {
            id: 'order-123',
            status: 'paid',
            shipping: { status: 'delivered' },
            payments: [{ status: 'approved' }],
            order_items: [{ item: { id: 1 } }],
            buyer: { id: 456, nickname: 'buyer' },
            total_amount: 250000,
            currency_id: 'ARS',
            date_created: '2024-01-01T10:00:00Z',
            date_closed: '2024-01-02T10:00:00Z',
        };

        it('validates correct order', () => {
            const result = MlOrderSchema.safeParse(validOrder);
            expect(result.success).toBe(true);
        });

        it('handles nullable fields', () => {
            const order = { ...validOrder, buyer: null, shipping: null, payments: [] };
            const result = MlOrderSchema.safeParse(order);
            expect(result.success).toBe(true);
        });
    });

    describe('MlWebhookPayloadSchema', () => {
        const validPayload = {
            user_id: 12345,
            resource: '/questions/123',
            topic: 'questions',
            application_id: 999,
            attempts: 1,
            sent: '2024-01-01T10:00:00Z',
            received: '2024-01-01T10:00:01Z',
        };

        it('validates correct webhook payload', () => {
            const result = MlWebhookPayloadSchema.safeParse(validPayload);
            expect(result.success).toBe(true);
        });

        it('enforces topic enum', () => {
            const invalid = { ...validPayload, topic: 'invalid_topic' };
            const result = MlWebhookPayloadSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });
    });

    describe('parseMlResponse', () => {
        it('returns parsed data on success', () => {
            const data = { id: 'MLA1', title: 'Test', price: 100, status: 'active', permalink: 'https://ml.com/1', listing_type_id: 'free' };
            const result = parseMlResponse(MlItemSchema, data, 'test');
            expect(result.id).toBe('MLA1');
        });

        it('throws with detailed error on failure', () => {
            const data = { title: 'Test' }; // missing required fields
            expect(() => parseMlResponse(MlItemSchema, data, 'testOperation'))
                .toThrow('testOperation: Respuesta ML inválida');
        });
    });

    describe('validateSetting', () => {
        it('validates string type', () => {
            const result = validateSetting('test_key', 'value', 'string');
            expect(result.valid).toBe(true);
        });

        it('validates number type', () => {
            const result = validateSetting('test_key', 42, 'number');
            expect(result.valid).toBe(true);
        });

        it('rejects wrong type for number', () => {
            const result = validateSetting('test_key', 'not-a-number', 'number');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('number');
        });

        it('validates boolean type', () => {
            const result = validateSetting('test_key', true, 'boolean');
            expect(result.valid).toBe(true);
        });

        it('validates url type', () => {
            const result = validateSetting('test_key', 'https://example.com', 'url');
            expect(result.valid).toBe(true);
        });

        it('rejects invalid url', () => {
            const result = validateSetting('test_key', 'not-a-url', 'url');
            expect(result.valid).toBe(false);
        });

        it('validates email type', () => {
            const result = validateSetting('test_key', 'test@example.com', 'email');
            expect(result.valid).toBe(true);
        });

        it('rejects invalid email', () => {
            const result = validateSetting('test_key', 'invalid-email', 'email');
            expect(result.valid).toBe(false);
        });

        it('validates color hex', () => {
            const result = validateSetting('test_key', '#1FC8C3', 'color');
            expect(result.valid).toBe(true);
        });

        it('rejects invalid color', () => {
            const result = validateSetting('test_key', 'red', 'color');
            expect(result.valid).toBe(false);
        });

        it('rejects unknown value_type', () => {
            const result = validateSetting('test_key', 'value', 'unknown_type');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Unknown value_type');
        });
    });
});