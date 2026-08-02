import { z } from 'zod';

// ==================== PROPERTY SCHEMAS ====================

export const propertyStatusSchema = z.enum([
  'borrador',
  'en_revision',
  'publicada',
  'pausada',
  'vendida',
  'alquilada',
  'archivada',
]);

export const listingTypeSchema = z.enum(['venta', 'alquiler', 'venta_alquiler', 'emprendimiento']);

export const propertyConditionSchema = z.enum(['nuevo', 'usado', 'a_refaccionar']);

export const currencySchema = z.enum(['USD', 'ARS']);

export const propertyFormSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(120),
  status: propertyStatusSchema,
  listing_type: listingTypeSchema,
  price: z.number().positive('El precio debe ser positivo').nullable().optional(),
  currency: currencySchema.default('USD'),
  expenses: z.number().min(0).nullable().optional(),
  description: z.string().max(5000).optional(),
  address: z.string().max(200).optional(),
  location_id: z.string().uuid().nullable().optional(),
  area_total: z.number().positive().nullable().optional(),
  area_covered: z.number().positive().nullable().optional(),
  bedrooms: z.number().int().min(0).max(50).nullable().optional(),
  bathrooms: z.number().int().min(0).max(50).nullable().optional(),
  garages: z.number().int().min(0).max(20).nullable().optional(),
  floors: z.number().int().min(0).max(100).nullable().optional(),
  year_built: z.number().int().min(1800).max(new Date().getFullYear() + 1).nullable().optional(),
  featured: z.boolean().default(false),
  video_url: z.string().url('URL de video inválida').optional().or(z.literal('')),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export const propertyCreateSchema = propertyFormSchema.refine(
  (data) => data.listing_type !== 'venta' || (data.price != null && data.price > 0),
  { message: 'El precio es obligatorio para propiedades en venta', path: ['price'] }
).refine(
  (data) => data.listing_type !== 'alquiler' || (data.price != null && data.price > 0),
  { message: 'El precio es obligatorio para propiedades en alquiler', path: ['price'] }
);

// ==================== LEAD SCHEMAS ====================

export const leadStatusSchema = z.enum([
  'nuevo',
  'contactado',
  'calificado',
  'en_proceso',
  'cerrado_ganado',
  'cerrado_perdido',
]);

export const leadIntentSchema = z.enum([
  'comprar',
  'vender',
  'alquilar',
  'invertir',
  'tasar',
  'desarrollador',
  'otro',
]);

export const leadSourceSchema = z.enum([
  'landing_form',
  'whatsapp',
  'telefono',
  'email',
  'referido',
  'ml_contacto',
  'manual',
]);

export const leadFormSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  last_name: z.string().min(1, 'Apellido requerido').max(100),
  email: z.string().email('Email inválido').max(255),
  phone: z.string().max(50).default(''),
  city: z.string().max(100).default(''),
  intent: leadIntentSchema,
  source: leadSourceSchema,
  status: leadStatusSchema.default('nuevo'),
  assigned_to: z.string().uuid().default(''),
  message: z.string().max(2000).default(''),
});

// ==================== AGENT SCHEMAS ====================

export const agentPermissionsSchema = z.object({
  can_view_leads: z.boolean().default(true),
  can_edit_leads: z.boolean().default(true),
  can_view_properties: z.boolean().default(true),
  can_edit_properties: z.boolean().default(false),
  can_view_visits: z.boolean().default(true),
  can_manage_visits: z.boolean().default(true),
  can_view_ml: z.boolean().default(true),
  can_manage_ml: z.boolean().default(false),
  can_view_reports: z.boolean().default(false),
  can_manage_agents: z.boolean().default(false),
  can_manage_settings: z.boolean().default(false),
});

export const agentCommissionSchema = z.object({
  sale_percentage: z.number().min(0).max(100).default(50),
  rental_percentage: z.number().min(0).max(100).default(100),
  fixed_per_sale: z.number().min(0).optional(),
  fixed_per_rental: z.number().min(0).optional(),
  min_commission: z.number().min(0).optional(),
  max_commission: z.number().min(0).optional(),
});

export const agentScheduleSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato HH:MM'),
  end_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato HH:MM'),
  is_available: z.boolean().default(true),
  break_start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato HH:MM').optional(),
  break_end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato HH:MM').optional(),
});

export const agentFormSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  email: z.string().email('Email inválido').max(255),
  phone: z.string().max(50).default(''),
  matricula: z.string().max(50).default(''),
  role: z.string().max(100).default(''),
  bio: z.string().max(2000).default(''),
  specialties: z.string().max(500).default(''),
  linkedin: z.string().url('URL inválida').optional().or(z.literal('')).default(''),
  instagram: z.string().url('URL inválida').optional().or(z.literal('')).default(''),
  whatsapp: z.string().url('URL inválida').optional().or(z.literal('')).default(''),
  is_active: z.boolean().default(true),
  sort_order: z.string().regex(/^\d+$/).default('0'),
  photo_url: z.string().url('URL inválida').optional().or(z.literal('')).default(''),
});

// ==================== VALIDATION HELPERS ====================

export function validatePropertyForm(data: unknown) {
  return propertyFormSchema.safeParse(data);
}

export function validatePropertyCreate(data: unknown) {
  return propertyCreateSchema.safeParse(data);
}

export function validateLeadForm(data: unknown) {
  return leadFormSchema.safeParse(data);
}

export function validateAgentForm(data: unknown) {
  return agentFormSchema.safeParse(data);
}

export function validateAgentPermissions(data: unknown) {
  return agentPermissionsSchema.safeParse(data);
}

export function validateAgentCommission(data: unknown) {
  return agentCommissionSchema.safeParse(data);
}

export function validateAgentSchedule(data: unknown) {
  return agentScheduleSchema.array().safeParse(data);
}

// ==================== TYPE EXPORTS ====================

export type PropertyFormInput = z.infer<typeof propertyFormSchema>;
export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;
export type LeadFormInput = z.infer<typeof leadFormSchema>;
export type AgentFormInput = z.infer<typeof agentFormSchema>;
export type AgentPermissionsInput = z.infer<typeof agentPermissionsSchema>;
export type AgentCommissionInput = z.infer<typeof agentCommissionSchema>;
export type AgentScheduleInput = z.infer<typeof agentScheduleSchema>;