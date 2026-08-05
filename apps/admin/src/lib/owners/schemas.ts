import { z } from 'zod';

// ============================================================
// Enums
// ============================================================

export type ReportType = 'price_analysis' | 'visit_summary' | 'market_update' | 'weekly' | 'monthly' | 'custom';

// ============================================================
// Owner Schemas
// ============================================================

export const ownerSchema = z.object({
  id: z.string().uuid().optional(),
  full_name: z.string().min(2, 'El nombre es obligatorio'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(8, 'Teléfono muy corto').optional().or(z.literal('')),
  dni_cuit: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  owner_type: z.enum(['persona_fisica', 'persona_juridica']),
  company_name: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  preferred_contact: z.enum(['email', 'whatsapp', 'call']),
});

export type OwnerFormValues = z.infer<typeof ownerSchema>;

export const propertyOwnerLinkSchema = z.object({
  property_id: z.string().uuid(),
  owner_id: z.string().uuid(),
  ownership_percentage: z.number().min(0.01).max(100),
  is_primary_contact: z.boolean(),
  role: z.string(),
});

export type PropertyOwnerLinkFormValues = z.infer<typeof propertyOwnerLinkSchema>;

// ============================================================
// Price Analysis Schemas
// ============================================================

export const comparablePropertySchema = z.object({
  address: z.string().min(3, 'Dirección obligatoria'),
  price: z.number().min(0, 'Precio inválido'),
  sqm: z.number().min(1).optional().nullable(),
  date: z.string().min(1, 'Fecha obligatoria'),
  source: z.string().optional().nullable(),
});

export type ComparableProperty = z.infer<typeof comparablePropertySchema>;

export const priceAnalysisSchema = z.object({
  property_id: z.string().uuid(),
  estimated_market_price: z.number().min(0, 'Precio de mercado inválido'),
  price_per_sqm_market: z.number().min(0).optional().nullable(),
  our_listing_price: z.number().min(0, 'Precio de publicación inválido'),
  market_trend: z.enum(['rising', 'stable', 'falling']),
  comparable_properties: z.array(comparablePropertySchema),
  recommendation: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  valid_until: z.string().datetime().optional().nullable(),
});

export type PriceAnalysisFormValues = z.infer<typeof priceAnalysisSchema>;

// ============================================================
// Action Plan Schemas
// ============================================================

export const actionPlanSchema = z.object({
  property_id: z.string().uuid(),
  owner_id: z.string().uuid().optional().nullable(),
  title: z.string().min(3, 'Título obligatorio'),
  description: z.string().optional().nullable(),
  category: z.enum(['pricing', 'marketing', 'condition', 'legal', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_date: z.string().datetime().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
});

export type ActionPlanFormValues = z.infer<typeof actionPlanSchema>;

export const actionPlanTaskSchema = z.object({
  plan_id: z.string().uuid(),
  title: z.string().min(2, 'Título obligatorio'),
  description: z.string().optional().nullable(),
  due_date: z.string().datetime().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  completed_at: z.string().datetime().optional().nullable(),
});

export type ActionPlanTaskFormValues = z.infer<typeof actionPlanTaskSchema>;

// ============================================================
// Communication Schemas
// ============================================================

export const communicationSchema = z.object({
  owner_id: z.string().uuid(),
  property_id: z.string().uuid().optional().nullable(),
  type: z.enum(['email', 'whatsapp', 'call', 'meeting', 'report', 'note']),
  subject: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
});

export type CommunicationFormValues = z.infer<typeof communicationSchema>;

export type CommunicationType = z.infer<typeof communicationSchema.shape.type>;

// ============================================================
// Report Schemas
// ============================================================

export const reportSchema = z.object({
  property_id: z.string().uuid(),
  owner_id: z.string().uuid(),
  report_type: z.enum(['price_analysis', 'visit_summary', 'market_update', 'weekly', 'monthly', 'custom']),
  title: z.string().optional().nullable(),
  content_json: z.record(z.unknown()),
});

export type ReportFormValues = z.infer<typeof reportSchema>;

// ============================================================
// Filter/Query Schemas
// ============================================================

export const ownersFiltersSchema = z.object({
  search: z.string().optional(),
  owner_type: z.enum(['persona_fisica', 'persona_juridica']).optional(),
  preferred_contact: z.enum(['email', 'whatsapp', 'call']).optional(),
  has_properties: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['full_name', 'created_at', 'updated_at']).default('full_name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type OwnersFilters = z.infer<typeof ownersFiltersSchema>;

export const actionPlansFiltersSchema = z.object({
  property_id: z.string().uuid().optional(),
  owner_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  category: z.enum(['pricing', 'marketing', 'condition', 'legal', 'other']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  overdue: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['due_date', 'created_at', 'priority', 'title']).default('due_date'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type ActionPlansFilters = z.infer<typeof actionPlansFiltersSchema>;

export const communicationsFiltersSchema = z.object({
  owner_id: z.string().uuid().optional(),
  property_id: z.string().uuid().optional(),
  type: z.enum(['email', 'whatsapp', 'call', 'meeting', 'report', 'note']).optional(),
  status: z.enum(['draft', 'sent', 'delivered', 'read', 'failed']).optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['created_at', 'sent_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CommunicationsFilters = z.infer<typeof communicationsFiltersSchema>;

export const reportsFiltersSchema = z.object({
  property_id: z.string().uuid().optional(),
  owner_id: z.string().uuid().optional(),
  report_type: z.enum(['price_analysis', 'visit_summary', 'market_update', 'weekly', 'monthly', 'custom']).optional(),
  status: z.enum(['draft', 'sent', 'delivered', 'read', 'failed']).optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['generated_at', 'sent_at']).default('generated_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ReportsFilters = z.infer<typeof reportsFiltersSchema>;