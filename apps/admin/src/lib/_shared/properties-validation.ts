/**
 * Zod Schemas para validación runtime de Properties.
 * Elimina `any` en properties.ts, PropertyImageGallery.tsx, supabase-data.ts.
 */

import { z } from 'zod';

export const PropertyStatusSchema = z.enum([
    'borrador',
    'en_revision',
    'publicada',
    'pausada',
    'vendida',
    'alquilada',
    'archivada',
]);

export const ListingTypeSchema = z.enum(['venta', 'alquiler', 'venta_alquiler', 'emprendimiento']);

export const CurrencySchema = z.enum(['USD', 'ARS']);

export const PropertyConditionSchema = z.enum(['nuevo', 'usado', 'a_refaccionar']);

export const PropertyFormSchema = z
    .object({
        title: z.string().min(3, 'Mínimo 3 caracteres').max(120),
        status: PropertyStatusSchema.default('borrador'),
        listing_type: ListingTypeSchema,
        price: z.number().positive('Precio debe ser mayor a 0').nullable(),
        currency: CurrencySchema.default('USD'),
        expenses: z.number().min(0).nullable(),
        description: z.string().max(5000).optional(),
        address: z.string().max(300).optional().nullable(),
        location_id: z.string().uuid().nullable(),
        area_total: z.number().positive().nullable(),
        area_covered: z.number().positive().nullable(),
        bedrooms: z.number().int().min(0).max(20).nullable(),
        bathrooms: z.number().int().min(0).max(20).nullable(),
        garages: z.number().int().min(0).max(10).nullable(),
        floors: z.number().int().min(0).max(50).nullable(),
        year_built: z
            .number()
            .int()
            .min(1800)
            .max(new Date().getFullYear() + 1)
            .nullable(),
        featured: z.boolean().default(false),
        video_url: z.string().url().optional().or(z.literal('')),
        latitude: z.number().min(-90).max(90).nullable(),
        longitude: z.number().min(-180).max(180).nullable(),
    })
    .refine((data) => data.status !== 'publicada' || (data.price !== null && data.price > 0), {
        message: 'Precio obligatorio para publicar',
        path: ['price'],
    })
    .refine((data) => data.status !== 'publicada' || data.location_id !== null, {
        message: 'Zona obligatoria para publicar',
        path: ['location_id'],
    })
    .refine(
        (data) =>
            data.area_covered === null ||
            data.area_total === null ||
            data.area_covered <= data.area_total,
        { message: 'Superficie cubierta no puede exceder total', path: ['area_covered'] },
    );

export const PropertyImageSchema = z
    .object({
        property_id: z.string().uuid(),
        file: z.instanceof(File),
        alt: z.string().max(200).optional(),
    })
    .refine((data) => data.file.size <= 10 * 1024 * 1024, {
        message: 'Máximo 10 MB',
        path: ['file'],
    })
    .refine(
        (data) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(data.file.type),
        { message: 'no es una imagen', path: ['file'] },
    );

export const PropertyLocationSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    zone: z.string().nullable(),
});

export const PropertyRowSchema = z.object({
    id: z.string().uuid(),
    code: z.number().int().positive(),
    title: z.string(),
    status: PropertyStatusSchema,
    listing_type: ListingTypeSchema,
    price: z.number().nullable(),
    currency: CurrencySchema,
    location: z.string(),
    area_total: z.number().nullable(),
    bedrooms: z.number().int().nullable(),
    bathrooms: z.number().int().nullable(),
    featured: z.boolean(),
    published_at: z.string().nullable(),
    updated_at: z.string(),
    cover_url: z.string().url().nullable(),
});

export const PropertyDetailSchema = z.object({
    id: z.string().uuid(),
    code: z.number().int().positive(),
    title: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    status: PropertyStatusSchema,
    listing_type: ListingTypeSchema,
    price: z.number().nullable(),
    currency: CurrencySchema,
    expenses: z.number().nullable(),
    address: z.string().nullable(),
    location: z.string(),
    location_id: z.string().uuid().nullable(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    area_total: z.number().nullable(),
    area_covered: z.number().nullable(),
    bedrooms: z.number().int().nullable(),
    bathrooms: z.number().int().nullable(),
    garages: z.number().int().nullable(),
    year_built: z.number().int().nullable(),
    floors: z.number().int().nullable(),
    featured: z.boolean(),
    published_at: z.string().nullable(),
    updated_at: z.string(),
    video_url: z.string().url().nullable(),
    cover_url: z.string().url().nullable(),
    images: z
        .array(
            z.object({
                id: z.string().uuid(),
                url: z.string().url(),
                is_cover: z.boolean(),
                sort_order: z.number().int(),
            }),
        )
        .optional(),
    ml_meta: z
        .object({
            ml_item_id: z.number().nullable(),
            status: z.string().nullable(),
            permalink: z.string().url().nullable(),
            price: z.number().nullable(),
            last_sync_at: z.string().nullable(),
        })
        .nullable()
        .optional(),
});

export const PropertyImageRowSchema = z.object({
    id: z.string().uuid(),
    property_id: z.string().uuid(),
    url: z.string().url(),
    alt: z.string().nullable(),
    position: z.number().int().nonnegative(),
    is_cover: z.boolean(),
    created_at: z.string(),
});

// Type exports
export type PropertyStatus = z.infer<typeof PropertyStatusSchema>;
export type ListingType = z.infer<typeof ListingTypeSchema>;
export type Currency = z.infer<typeof CurrencySchema>;
export type PropertyCondition = z.infer<typeof PropertyConditionSchema>;
export type PropertyFormValues = z.infer<typeof PropertyFormSchema>;
export type PropertyImage = z.infer<typeof PropertyImageSchema>;
export type LocationOption = z.infer<typeof PropertyLocationSchema>;
export type PropertyRow = z.infer<typeof PropertyRowSchema>;
export type PropertyDetail = z.infer<typeof PropertyDetailSchema>;
export type PropertyImageRow = z.infer<typeof PropertyImageRowSchema>;

// Validation helper
export function validatePropertyForm(data: unknown): {
    valid: boolean;
    error?: string;
    data?: PropertyFormValues;
} {
    const result = PropertyFormSchema.safeParse(data);
    if (!result.success) {
        const firstError = result.error.errors[0];
        return { valid: false, error: `${firstError.path.join('.')}: ${firstError.message}` };
    }
    return { valid: true, data: result.data };
}

export function validatePropertyImage(data: unknown): { valid: boolean; error?: string } {
    const result = PropertyImageSchema.safeParse(data);
    if (!result.success) {
        const firstError = result.error.errors[0];
        return { valid: false, error: `${firstError.path.join('.')}: ${firstError.message}` };
    }
    return { valid: true };
}
