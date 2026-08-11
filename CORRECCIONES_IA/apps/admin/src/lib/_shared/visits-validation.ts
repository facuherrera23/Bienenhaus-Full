/**
 * Zod Schemas para validación runtime de Visits.
 * Elimina `any` en visits.ts, VisitsPage.tsx, edge functions.
 */

import { z } from 'zod';

export const VisitStatusSchema = z.enum(['programada', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_show']);
export const VisitTypeSchema = z.enum(['presencial', 'virtual', 'telefonica']);

export const RecurrenceRuleSchema = z.discriminatedUnion('frequency', [
    z.object({ frequency: z.literal('daily'), interval: z.number().int().min(1).max(30) }),
    z.object({ frequency: z.literal('weekly'), interval: z.number().int().min(1).max(12), days_of_week: z.array(z.number().int().min(0).max(6)).min(1), exceptions: z.array(z.string().date()).optional() }),
    z.object({ frequency: z.literal('monthly'), interval: z.number().int().min(1).max(12), day_of_month: z.number().int().min(1).max(31).optional(), exceptions: z.array(z.string().date()).optional() }),
    z.object({ frequency: z.literal('yearly'), interval: z.number().int().min(1).max(10), exceptions: z.array(z.string().date()).optional() }),
]);

export const VisitFormSchema = z.object({
    lead_id: z.string().uuid().nullable(),
    property_id: z.string().uuid().nullable(),
    agent_id: z.string().uuid(),
    title: z.string().min(3).max(120),
    description: z.string().max(1000).optional(),
    starts_at: z.string().datetime(),
    ends_at: z.string().datetime(),
    status: VisitStatusSchema.default('programada'),
    location: z.string().max(200).nullable(),
    meeting_type: VisitTypeSchema.optional(),
    meeting_link: z.string().url().nullable(),
    notes: z.string().max(2000).optional(),
}).refine(data => new Date(data.ends_at) > new Date(data.starts_at), { message: 'Fin debe ser después de inicio', path: ['ends_at'] });

export const VisitPatchSchema = z.object({
    title: z.string().min(3).max(120).optional(),
    description: z.string().max(1000).optional(),
    starts_at: z.string().datetime().optional(),
    ends_at: z.string().datetime().optional(),
    status: VisitStatusSchema.optional(),
    location: z.string().max(200).nullable().optional(),
    meeting_type: VisitTypeSchema.optional().nullable(),
    meeting_link: z.string().url().nullable().optional(),
    notes: z.string().max(2000).optional(),
    lead_id: z.string().uuid().nullable().optional(),
    property_id: z.string().uuid().nullable().optional(),
    agent_id: z.string().uuid().optional(),
}).refine(data => !data.starts_at || !data.ends_at || new Date(data.ends_at) > new Date(data.starts_at), { message: 'Fin debe ser después de inicio', path: ['ends_at'] });

export const QrCheckinPayloadSchema = z.object({
    visitId: z.string().uuid(),
    agentLat: z.number().min(-90).max(90).optional(),
    agentLng: z.number().min(-180).max(180).optional(),
    photoBase64: z.string().optional(),
});

export const VisitReminderSchema = z.object({
    type: z.enum(['reminder_24h', 'reminder_2h', 'reminder_30min']),
    trigger_minutes_before: z.number().int().positive(),
    is_sent: z.boolean().default(false),
});

export const AgentAvailabilitySchema = z.object({
    agent_id: z.string().uuid(),
    day_of_week: z.number().int().min(0).max(6),
    start_time: z.string().regex(/^\d{2}:\d{2}$/),
    end_time: z.string().regex(/^\d{2}:\d{2}$/),
    is_active: z.boolean().default(true),
    timezone: z.string().default('America/Argentina/Buenos_Aires'),
    exceptions: z.array(z.object({
        date: z.string().date(),
        reason: z.string().optional(),
        available: z.boolean().default(false),
    })).optional(),
});

// Type exports
export type VisitStatus = z.infer<typeof VisitStatusSchema>;
export type VisitType = z.infer<typeof VisitTypeSchema>;
export type RecurrenceRule = z.infer<typeof RecurrenceRuleSchema>;
export type VisitFormValues = z.infer<typeof VisitFormSchema>;
export type VisitPatch = z.infer<typeof VisitPatchSchema>;
export type QrCheckinPayload = z.infer<typeof QrCheckinPayloadSchema>;
export type VisitReminder = z.infer<typeof VisitReminderSchema>;
export type AgentAvailability = z.infer<typeof AgentAvailabilitySchema>;

// Validation helpers
export function validateVisitForm(data: unknown): { valid: boolean; error?: string; data?: any } {
    const result = VisitFormSchema.safeParse(data);
    if (!result.success) {
        const firstError = result.error.errors[0];
        return { valid: false, error: `${firstError.path.join('.')}: ${firstError.message}` };
    }
    return { valid: true, data: result.data };
}

export function validateVisitPatch(data: unknown): { valid: boolean; error?: string; data?: any } {
    const result = VisitPatchSchema.safeParse(data);
    if (!result.success) {
        const firstError = result.error.errors[0];
        return { valid: false, error: `${firstError.path.join('.')}: ${firstError.message}` };
    }
    return { valid: true, data: result.data };
}

export function validateQrCheckin(data: unknown): { valid: boolean; error?: string; data?: any } {
    const result = QrCheckinPayloadSchema.safeParse(data);
    if (!result.success) {
        const firstError = result.error.errors[0];
        return { valid: false, error: `${firstError.path.join('.')}: ${firstError.message}` };
    }
    return { valid: true, data: result.data };
}