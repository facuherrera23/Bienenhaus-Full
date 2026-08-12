import { describe, expect, it } from 'vitest';
import {
    CsvLeadRowSchema,
    LeadActivitySchema,
    LeadFormSchema,
    LeadPatchSchema,
    LeadScoreFactorsSchema,
    LeadTagSchema,
} from '../_shared/leads-validation';

describe('leads-validation Zod schemas', () => {
    describe('LeadFormSchema', () => {
        const validForm = {
            name: 'Juan',
            last_name: 'Pérez',
            email: 'juan@test.com',
            phone: '+54 9 11 1234-5678',
            city: 'Córdoba',
            intent: 'comprar',
            source: 'landing_form',
            status: 'nuevo',
            assigned_to: '',
            message: 'Quiero comprar una casa',
        };

        it('validates correct form', () => {
            const result = LeadFormSchema.safeParse(validForm);
            expect(result.success).toBe(true);
        });

        it('requires name', () => {
            const invalid = { ...validForm, name: '' };
            const result = LeadFormSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('requires last_name', () => {
            const invalid = { ...validForm, last_name: '' };
            const result = LeadFormSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('validates email format', () => {
            const invalid = { ...validForm, email: 'invalid-email' };
            const result = LeadFormSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('enforces intent enum', () => {
            const invalid = { ...validForm, intent: 'invalid_intent' };
            const result = LeadFormSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('enforces source enum', () => {
            const invalid = { ...validForm, source: 'invalid_source' };
            const result = LeadFormSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('enforces status enum', () => {
            const invalid = { ...validForm, status: 'invalid_status' };
            const result = LeadFormSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('defaults status to nuevo', () => {
            const { status, ...rest } = validForm;
            const result = LeadFormSchema.safeParse(rest);
            expect(result.success).toBe(true);
            expect(result.data?.status).toBe('nuevo');
        });

        it('validates assigned_to as UUID or empty', () => {
            const invalid = { ...validForm, assigned_to: 'not-uuid' };
            const result = LeadFormSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });
    });

    describe('LeadPatchSchema', () => {
        it('allows partial updates', () => {
            const patch = { status: 'contactado' };
            const result = LeadPatchSchema.safeParse(patch);
            expect(result.success).toBe(true);
        });

        it('enforces status enum', () => {
            const patch = { status: 'invalid' };
            const result = LeadPatchSchema.safeParse(patch);
            expect(result.success).toBe(false);
        });

        it('allows empty patch', () => {
            const result = LeadPatchSchema.safeParse({});
            expect(result.success).toBe(true);
        });
    });

    describe('CsvLeadRowSchema', () => {
        const validRow = {
            name: 'Juan',
            last_name: 'Pérez',
            email: 'juan@test.com',
            phone: '+54 9 11 1234-5678',
            city: 'Córdoba',
            intent: 'comprar',
            source: 'landing_form',
            status: 'nuevo',
            message: 'Quiero comprar',
        };

        it('validates correct row', () => {
            const result = CsvLeadRowSchema.safeParse(validRow);
            expect(result.success).toBe(true);
        });

        it('rejects invalid email', () => {
            const invalid = { ...validRow, email: 'not-email' };
            const result = CsvLeadRowSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('rejects invalid intent', () => {
            const invalid = { ...validRow, intent: 'invalid' };
            const result = CsvLeadRowSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('rejects invalid source', () => {
            const invalid = { ...validRow, source: 'invalid' };
            const result = CsvLeadRowSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('defaults status to nuevo', () => {
            const { status, ...rest } = {
                name: 'Juan',
                last_name: 'Pérez',
                email: 'juan@test.com',
                intent: 'comprar',
                source: 'landing_form',
            };
            const result = CsvLeadRowSchema.safeParse(rest);
            expect(result.success).toBe(true);
            expect(result.data?.status).toBe('nuevo');
        });
    });

    describe('LeadScoreFactorsSchema', () => {
        it('validates default factors', () => {
            const factors = {};
            const result = LeadScoreFactorsSchema.safeParse(factors);
            expect(result.success).toBe(true);
            expect(result.data?.intent_buy).toBe(30);
            expect(result.data?.max_score).toBe(100);
        });

        it('enforces ranges', () => {
            const invalid = { intent_buy: 150 };
            const result = LeadScoreFactorsSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });
    });

    describe('LeadActivitySchema', () => {
        it('validates correct activity', () => {
            const activity = {
                lead_id: '123e4567-e89b-12d3-a456-426614174000',
                action: 'status_changed',
                from_value: 'nuevo',
                to_value: 'contactado',
                agent_id: '123e4567-e89b-12d3-a456-426614174001',
                metadata: { note: 'Llamada realizada' },
            };
            const result = LeadActivitySchema.safeParse(activity);
            expect(result.success).toBe(true);
        });

        it('enforces action enum', () => {
            const invalid = { lead_id: '123', action: 'invalid_action' };
            const result = LeadActivitySchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });
    });

    describe('LeadTagSchema', () => {
        it('validates correct tag', () => {
            const tag = { lead_id: '123e4567-e89b-12d3-a456-426614174000', tag: 'vip' };
            const result = LeadTagSchema.safeParse(tag);
            expect(result.success).toBe(true);
        });

        it('rejects empty tag', () => {
            const invalid = { lead_id: '123', tag: '' };
            const result = LeadTagSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('enforces max length', () => {
            const invalid = { lead_id: '123', tag: 'a'.repeat(31) };
            const result = LeadTagSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });
    });
});
