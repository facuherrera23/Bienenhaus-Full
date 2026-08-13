/**
 * Zod Schemas para validación runtime de Site Settings.
 * Elimina `any` en site.ts, ConfigPage.tsx, useSiteSettings.
 */

import { z } from 'zod';

// Tipos base para value_type
export const SettingValueSchemas = {
    string: z.string(),
    number: z.number(),
    boolean: z.boolean(),
    json: z.record(z.unknown()),
    url: z.string().url(),
    email: z.string().email(),
    phone: z.string().regex(/^[\d\s\-\+\(\)]{10,}$/),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    richtext: z.string(), // HTML sanitizado
} as const;

export const SiteSettingKeySchema = z.enum([
    // Social
    'social',
    'instagram',
    'facebook',
    'youtube',
    'tiktok',
    'linkedin',
    'whatsapp',
    // Contact
    'contact_email',
    'contact_whatsapp',
    'contact_whatsapp_alt',
    'contact_address',
    'contact_hours',
    // Company
    'site_name',
    'empresa',
    'cri',
    'matricula',
    'ubicacion',
    // Stats
    'stats',
    // SEO
    'seo_title',
    'seo_description',
    'seo_keywords',
    'og_image',
    'twitter_card',
    // WhatsApp
    'whatsapp_welcome_messages',
    'whatsapp_business_hours',
    // Landing Content (sections)
    'hero_title',
    'hero_subtitle',
    'hero_cta_text',
    'hero_cta_link',
    'catalog_title',
    'catalog_description',
    'services_title',
    'services_items',
    'team_title',
    'team_members',
    'stats_title',
    'stats_items',
    'process_title',
    'process_steps',
    'contact_title',
    'contact_form_title',
]);

export const SiteSettingSchema = z.object({
    key: SiteSettingKeySchema,
    value: z.unknown(), // validado por value_type
    value_type: z.enum([
        'string',
        'number',
        'boolean',
        'json',
        'url',
        'email',
        'phone',
        'color',
        'richtext',
    ]),
    is_public: z.boolean().default(true),
    locale: z.string().default('es-AR'),
});

export const SiteSettingsSchema = z.object({
    social: z.record(z.string().url()).optional(),
    contact: z
        .object({
            email: z.string().email().optional(),
            whatsapp: z
                .string()
                .regex(/^[\d\s\-\+\(\)]{10,}$/)
                .optional(),
            whatsappAlt: z
                .string()
                .regex(/^[\d\s\-\+\(\)]{10,}$/)
                .optional(),
            address: z.string().max(200).optional(),
            hours: z.object({ weekdays: z.string(), saturdays: z.string() }).optional(),
        })
        .optional(),
    company: z
        .object({
            name: z.string().max(100).optional(),
            cri: z.string().max(50).optional(),
            matricula: z.string().max(50).optional(),
            ubicacion: z.string().max(100).optional(),
        })
        .optional(),
    stats: z
        .object({
            comercializadas: z.number().int().nonnegative(),
            clientes: z.number().int().nonnegative(),
            exito: z.number().int().nonnegative(),
            anios: z.number().int().positive(),
        })
        .optional(),
});

// Validación runtime en mapSettings
export function validateSetting(
    key: string,
    value: unknown,
    valueType: string,
): { valid: boolean; error?: string } {
    const schema = SettingValueSchemas[valueType as keyof typeof SettingValueSchemas];
    if (!schema) return { valid: false, error: `Unknown value_type: ${valueType}` };
    const result = schema.safeParse(value);
    return result.success ? { valid: true } : { valid: false, error: result.error.message };
}
