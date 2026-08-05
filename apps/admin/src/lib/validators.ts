import { z } from 'zod';

// ============================================================
// Property Schemas
// ============================================================

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
  location_id: z.string().uuid('Ubicación inválida').nullable().optional(),
  area_total: z.number().positive('El área total debe ser positiva').nullable().optional(),
  area_covered: z.number().positive('El área cubierta debe ser positiva').nullable().optional(),
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

export const propertyCreateSchema = propertyFormSchema
  .refine(
    (data) => data.listing_type !== 'venta' || (data.price != null && data.price > 0),
    { message: 'El precio es obligatorio para propiedades en venta', path: ['price'] }
  )
  .refine(
    (data) => data.listing_type !== 'alquiler' || (data.price != null && data.price > 0),
    { message: 'El precio es obligatorio para propiedades en alquiler', path: ['price'] }
  )
  .refine(
    (data) => data.listing_type !== 'venta_alquiler' || (data.price != null && data.price > 0),
    { message: 'El precio es obligatorio para propiedades en venta/alquiler', path: ['price'] }
  );

export const propertyUpdateSchema = propertyFormSchema.partial();

// ============================================================
// Lead Schemas
// ============================================================

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
  assigned_to: z.union([z.string().uuid('Agente inválido'), z.literal('')]).default(''),
  message: z.string().max(2000).default(''),
});

export const leadUpdateSchema = leadFormSchema.partial();

// ============================================================
// Agent Schemas
// ============================================================

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
  sort_order: z.string().regex(/^\d+$/, 'Orden debe ser un número').default('0'),
  photo_url: z.string().url('URL inválida').optional().or(z.literal('')).default(''),
});

export const agentUpdateSchema = agentFormSchema.partial();

// ============================================================
// Visit Schemas
// ============================================================

export const visitStatusSchema = z.enum([
  'programada',
  'confirmada',
  'en_curso',
  'completada',
  'cancelada',
  'no_show',
]);

export const visitTypeSchema = z.enum(['presencial', 'virtual', 'telefonica']);

const visitBaseObject = z.object({
  title: z.string().min(1, 'Título requerido').max(200),
  description: z.string().max(2000).optional(),
  lead_id: z.string().uuid('Lead inválido').nullable().optional(),
  property_id: z.string().uuid('Propiedad inválida').nullable().optional(),
  agent_id: z.string().uuid('Agente requerido').min(1, 'Agente requerido'),
  starts_at: z.string().datetime({ message: 'Fecha y hora de inicio inválida' }),
  ends_at: z.string().datetime({ message: 'Fecha y hora de fin inválida' }),
  status: visitStatusSchema.default('programada'),
  location: z.string().max(200).optional(),
  meeting_type: visitTypeSchema.nullable().optional(),
  meeting_link: z.string().url('URL inválida').optional().or(z.literal('')),
  notes: z.string().max(2000).optional(),
});

export const visitFormSchema = visitBaseObject.refine(
  (data) => new Date(data.ends_at) > new Date(data.starts_at),
  { message: 'La fecha de fin debe ser posterior a la fecha de inicio', path: ['ends_at'] }
);
export const visitUpdateSchema = visitBaseObject.partial();

// ============================================================
// Newsletter Schemas
// ============================================================

export const newsletterSourceSchema = z.enum([
  'landing_footer',
  'manual',
  'otro',
]);

export const newsletterStatusSchema = z.enum([
  'active',
  'unsubscribed',
  'bounced',
  'complained',
]);

export const newsletterSubscriberSchema = z.object({
  email: z.string().email('Email inválido').max(255),
  source: newsletterSourceSchema.default('manual'),
  status: newsletterStatusSchema.default('active'),
});

export const newsletterUpdateSchema = newsletterSubscriberSchema.partial();

// ============================================================
// Admin Schemas
// ============================================================

export const adminRoleSchema = z.enum([
  'super_admin',
  'admin',
  'staff',
  'viewer',
]);

export const adminUserSchema = z.object({
  email: z.string().email('Email inválido').max(255),
  full_name: z.string().min(1, 'Nombre completo requerido').max(100),
  role: adminRoleSchema.default('viewer'),
  is_active: z.boolean().default(true),
  must_change_password: z.boolean().default(false),
});

export const adminUserUpdateSchema = adminUserSchema.partial();

// ============================================================
// ML Schemas
// ============================================================

export const mlOperationSchema = z.enum(['publish', 'update', 'delete']);

export const mlSyncStatusSchema = z.enum([
  'pending',
  'processing',
  'success',
  'failed',
  'cancelled',
]);

export const mlSettingsSchema = z.object({
  app_id: z.string().min(1, 'App ID requerido'),
  defaults: z.object({
    category_id: z.string().min(1, 'Categoría requerida'),
    listing_type_id: z.string().min(1, 'Tipo de publicación requerido'),
    condition: z.string().min(1, 'Condición requerida'),
  }),
});

// ============================================================
// Chat Schemas
// ============================================================

export const chatChannelTypeSchema = z.enum(['direct', 'group', 'property', 'lead']);

export const messageTypeSchema = z.enum(['text', 'file', 'image']);

export const chatMessageSchema = z.object({
  content: z.string().min(1, 'Mensaje requerido').max(10000),
  message_type: messageTypeSchema.default('text'),
  file_url: z.string().url('URL inválida').optional().or(z.literal('')),
  file_name: z.string().max(255).optional(),
  file_size: z.number().int().min(0).max(100 * 1024 * 1024).optional(),
  reply_to_id: z.string().uuid('Mensaje inválido').nullable().optional(),
});

// ============================================================
// User Schemas
// ============================================================

export const userRegistrationSchema = z.object({
  email: z.string().email('Email inválido').max(255),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(100),
  confirm_password: z.string().min(8),
  full_name: z.string().min(1, 'Nombre completo requerido').max(100),
}).refine(
  (data) => data.password === data.confirm_password,
  { message: 'Las contraseñas no coinciden', path: ['confirm_password'] }
);

export const userLoginSchema = z.object({
  email: z.string().email('Email inválido').max(255),
  password: z.string().min(1, 'Contraseña requerida'),
});

export const userPasswordResetSchema = z.object({
  email: z.string().email('Email inválido').max(255),
});

export const userPasswordUpdateSchema = z.object({
  current_password: z.string().min(1, 'Contraseña actual requerida'),
  new_password: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres').max(100),
  confirm_new_password: z.string().min(8),
}).refine(
  (data) => data.new_password === data.confirm_new_password,
  { message: 'Las contraseñas no coinciden', path: ['confirm_new_password'] }
);

// ============================================================
// Validation Helpers
// ============================================================

export function validatePropertyForm(data: unknown) {
  return propertyFormSchema.safeParse(data);
}

export function validatePropertyCreate(data: unknown) {
  return propertyCreateSchema.safeParse(data);
}

export function validatePropertyUpdate(data: unknown) {
  return propertyUpdateSchema.safeParse(data);
}

export function validateLeadForm(data: unknown) {
  return leadFormSchema.safeParse(data);
}

export function validateLeadUpdate(data: unknown) {
  return leadUpdateSchema.safeParse(data);
}

export function validateAgentForm(data: unknown) {
  return agentFormSchema.safeParse(data);
}

export function validateAgentUpdate(data: unknown) {
  return agentUpdateSchema.safeParse(data);
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

export function validateVisitForm(data: unknown) {
  return visitFormSchema.safeParse(data);
}

export function validateVisitUpdate(data: unknown) {
  return visitUpdateSchema.safeParse(data);
}

export function validateNewsletterSubscriber(data: unknown) {
  return newsletterSubscriberSchema.safeParse(data);
}

export function validateNewsletterUpdate(data: unknown) {
  return newsletterUpdateSchema.safeParse(data);
}

export function validateAdminUser(data: unknown) {
  return adminUserSchema.safeParse(data);
}

export function validateAdminUserUpdate(data: unknown) {
  return adminUserUpdateSchema.safeParse(data);
}

export function validateMlSettings(data: unknown) {
  return mlSettingsSchema.safeParse(data);
}

export function validateChatMessage(data: unknown) {
  return chatMessageSchema.safeParse(data);
}

export function validateUserRegistration(data: unknown) {
  return userRegistrationSchema.safeParse(data);
}

export function validateUserLogin(data: unknown) {
  return userLoginSchema.safeParse(data);
}

export function validateUserPasswordReset(data: unknown) {
  return userPasswordResetSchema.safeParse(data);
}

export function validateUserPasswordUpdate(data: unknown) {
  return userPasswordUpdateSchema.safeParse(data);
}

// ============================================================
// Type Exports
// ============================================================

export type PropertyFormInput = z.infer<typeof propertyFormSchema>;
export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;
export type PropertyUpdateInput = z.infer<typeof propertyUpdateSchema>;
export type LeadFormInput = z.infer<typeof leadFormSchema>;
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;
export type AgentFormInput = z.infer<typeof agentFormSchema>;
export type AgentUpdateInput = z.infer<typeof agentUpdateSchema>;
export type AgentPermissionsInput = z.infer<typeof agentPermissionsSchema>;
export type AgentCommissionInput = z.infer<typeof agentCommissionSchema>;
export type AgentScheduleInput = z.infer<typeof agentScheduleSchema>;
export type VisitFormInput = z.infer<typeof visitFormSchema>;
export type VisitUpdateInput = z.infer<typeof visitUpdateSchema>;
export type NewsletterSubscriberInput = z.infer<typeof newsletterSubscriberSchema>;
export type NewsletterUpdateInput = z.infer<typeof newsletterUpdateSchema>;
export type AdminUserInput = z.infer<typeof adminUserSchema>;
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;
export type MlSettingsInput = z.infer<typeof mlSettingsSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type UserPasswordResetInput = z.infer<typeof userPasswordResetSchema>;
export type UserPasswordUpdateInput = z.infer<typeof userPasswordUpdateSchema>;

// ============================================================
// Re-export Zod
// ============================================================

export { z };