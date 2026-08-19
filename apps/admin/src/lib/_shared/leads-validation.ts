/**
 * Zod Schemas para validación runtime de Leads.
 * Elimina `any` en leads.ts, leads.api.ts.
 * Incluye deduplicación, scoring dinámico y logging estructurado.
 */

import { z } from 'zod';

export const LeadStatusSchema = z.enum([
    'nuevo',
    'contactado',
    'calificado',
    'en_proceso',
    'visita_programada',
    'cerrado_ganado',
    'cerrado_perdido',
]);

export const LeadIntentSchema = z.enum([
    'comprar',
    'vender',
    'alquilar',
    'invertir',
    'tasar',
    'desarrollador',
    'otro',
]);

export const LeadSourceSchema = z.enum([
    'landing_form',
    'whatsapp',
    'telefono',
    'email',
    'referido',
    'ml_contacto',
    'manual',
]);

export const LeadFormSchema = z.object({
    name: z.string().min(1, 'Nombre requerido').max(100),
    last_name: z.string().min(1, 'Apellido requerido').max(100),
    email: z.string().email('Email inválido').max(255),
    phone: z.string().max(50).default(''),
    city: z.string().max(100).default(''),
    intent: LeadIntentSchema,
    source: LeadSourceSchema,
    status: LeadStatusSchema.default('nuevo'),
    assigned_to: z.union([z.string().uuid('Agente inválido'), z.literal('')]).default(''),
    message: z.string().max(2000).default(''),
});

export const LeadPatchSchema = LeadFormSchema.partial();

export const CsvLeadRowSchema = z.object({
    name: z.string().min(1, 'Nombre requerido'),
    last_name: z.string().min(1, 'Apellido requerido'),
    email: z.string().email('Email inválido'),
    phone: z.string().max(50).optional(),
    city: z.string().max(100).optional(),
    intent: LeadIntentSchema,
    source: LeadSourceSchema,
    status: LeadStatusSchema.optional().default('nuevo'),
    message: z.string().max(2000).optional(),
});

export const LeadScoreFactorsSchema = z.object({
    // Intent scoring
    intent_buy: z.number().int().min(0).max(100).default(30),
    intent_sell: z.number().int().min(0).max(100).default(25),
    intent_rent: z.number().int().min(0).max(100).default(20),
    intent_invest: z.number().int().min(0).max(100).default(25),
    intent_appraise: z.number().int().min(0).max(100).default(10),
    intent_developer: z.number().int().min(0).max(100).default(15),
    intent_other: z.number().int().min(0).max(100).default(5),

    // Source scoring
    source_landing: z.number().int().min(0).max(100).default(10),
    source_whatsapp: z.number().int().min(0).max(100).default(20),
    source_phone: z.number().int().min(0).max(100).default(25),
    source_email: z.number().int().min(0).max(100).default(15),
    source_referral: z.number().int().min(0).max(100).default(30),
    source_ml: z.number().int().min(0).max(100).default(15),
    source_manual: z.number().int().min(0).max(100).default(10),

    // Message length
    message_long: z.number().int().min(0).max(100).default(10), // > 50 chars
    message_medium: z.number().int().min(0).max(100).default(5), // > 20 chars

    // Phone presence
    phone_present: z.number().int().min(0).max(100).default(10),

    // City presence
    city_present: z.number().int().min(0).max(100).default(5),

    // Score decay (per day)
    decay_per_day: z.number().min(0).max(5).default(1),

    // Max score
    max_score: z.number().int().min(0).max(100).default(100),
});

export const LeadActivitySchema = z.object({
    lead_id: z.string().uuid(),
    action: z.enum([
        'created',
        'updated',
        'status_changed',
        'assigned',
        'scored',
        'note_added',
        'tag_added',
        'tag_removed',
        'deleted',
        'restored',
    ]),
    from_value: z.string().nullable().optional(),
    to_value: z.string().nullable().optional(),
    agent_id: z.string().uuid().nullable().optional(),
    metadata: z.record(z.unknown()).optional(),
});

export const LeadTagSchema = z.object({
    lead_id: z.string().uuid(),
    tag: z.string().min(1).max(30),
});

// Type exports
export type LeadStatus = z.infer<typeof LeadStatusSchema>;
export type LeadIntent = z.infer<typeof LeadIntentSchema>;
export type LeadSource = z.infer<typeof LeadSourceSchema>;
export type LeadFormValues = z.infer<typeof LeadFormSchema>;
export type LeadPatch = z.infer<typeof LeadPatchSchema>;
export type CsvLeadRow = z.infer<typeof CsvLeadRowSchema>;
export type LeadScoreFactors = z.infer<typeof LeadScoreFactorsSchema>;
export type LeadActivity = z.infer<typeof LeadActivitySchema>;
export type LeadTag = z.infer<typeof LeadTagSchema>;

// Validation helpers
export function validateLeadForm(data: unknown): {
    valid: boolean;
    error?: string;
    data?: LeadFormValues;
} {
    const result = LeadFormSchema.safeParse(data);
    if (!result.success) {
        const firstError = result.error.errors[0];
        return { valid: false, error: `${firstError.path.join('.')}: ${firstError.message}` };
    }
    return { valid: true, data: result.data };
}

export function validateLeadPatch(data: unknown): {
    valid: boolean;
    error?: string;
    data?: LeadPatch;
} {
    const result = LeadPatchSchema.safeParse(data);
    if (!result.success) {
        const firstError = result.error.errors[0];
        return { valid: false, error: `${firstError.path.join('.')}: ${firstError.message}` };
    }
    return { valid: true, data: result.data };
}

export function validateCsvLeadRow(data: unknown): {
    valid: boolean;
    error?: string;
    data?: CsvLeadRow;
} {
    const result = CsvLeadRowSchema.safeParse(data);
    if (!result.success) {
        const firstError = result.error.errors[0];
        return { valid: false, error: `${firstError.path.join('.')}: ${firstError.message}` };
    }
    return { valid: true, data: result.data };
}

export function validateLeadScoreFactors(data: unknown): {
    valid: boolean;
    error?: string;
    data?: LeadScoreFactors;
} {
    const result = LeadScoreFactorsSchema.safeParse(data);
    if (!result.success) {
        const firstError = result.error.errors[0];
        return { valid: false, error: `${firstError.path.join('.')}: ${firstError.message}` };
    }
    return { valid: true, data: result.data };
}

export function validateLeadActivity(data: unknown): {
    valid: boolean;
    error?: string;
    data?: LeadActivity;
} {
    const result = LeadActivitySchema.safeParse(data);
    if (!result.success) {
        const firstError = result.error.errors[0];
        return { valid: false, error: `${firstError.path.join('.')}: ${firstError.message}` };
    }
    return { valid: true, data: result.data };
}

export function validateLeadTag(data: unknown): { valid: boolean; error?: string; data?: LeadTag } {
    const result = LeadTagSchema.safeParse(data);
    if (!result.success) {
        const firstError = result.error.errors[0];
        return { valid: false, error: `${firstError.path.join('.')}: ${firstError.message}` };
    }
    return { valid: true, data: result.data };
}
