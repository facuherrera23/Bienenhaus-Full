📘 MÓDULO DE PROPIETARIOS — ESPECIFICACIÓN TÉCNICA COMPLETA
Proyecto: BIENENHAUS PROPIEDADES
Versión: 1.0
Contexto: Módulo nuevo a agregar al sistema existente (Landing + Admin + Supabase)
1. CONTEXTO DEL SISTEMA EXISTENTE
BIENENHAUS es una plataforma full-stack para inmobiliarias con:
Landing pública (Preact + Vite): catálogo de propiedades, filtros, newsletter, SEO/PWA.
Panel Admin (Preact + Vite + Supabase): CRM completo con dashboard, CRUD de propiedades, leads, agentes, usuarios admin, Mercado Libre, calendario de visitas, chat interno en tiempo real, papelera universal con soft delete, y CMS de la landing.
Backend: Supabase (PostgreSQL 17, Auth, Realtime, Storage, Edge Functions Deno 2).
Estado: preact-signals (global), TanStack Query (server state).
Estilos: Design tokens en CSS, CSS Modules.
Base de datos: 21 migraciones. Tablas clave: properties, leads, agents, admin_users, visits, chat_channels, chat_messages, newsletter_subscribers, + tablas ML.
Soft delete: patrón universal con columna deleted_at en todas las tablas principales.
RLS: políticas por rol (super_admin, admin, staff, viewer).
Auditoría: activity_log, properties_history con triggers.
2. OBJETIVO DEL MÓDULO
Crear un sistema de gestión de cartera de propietarios que permita:
Registrar y gestionar propietarios (personas físicas/jurídicas) y asociarlos a propiedades.
Analizar el precio de mercado de cada propiedad para determinar si está bien, barata o cara.
Crear planes de acción con tareas concretas para mejorar la comercialización.
Mantener un historial de comunicaciones con cada propietario (llamadas, WhatsApp, emails, reuniones).
Generar y enviar reportes automáticos al propietario con el estado de su propiedad.
(Futuro) Darle al propietario un portal privado para ver el estado de su inmueble.
3. MODELO DE DATOS (MIGRACIÓN SQL)
Crear archivo: supabase/migrations/0022_owners_module.sql
sql
-- ============================================================
-- 0022_owners_module.sql
-- Módulo de Propietarios, Análisis de Precio, Planes de Acción
-- ============================================================

-- Enums
create type owner_type as enum ('persona_fisica', 'persona_juridica');
create type owner_preferred_contact as enum ('email', 'whatsapp', 'call');
create type price_status as enum ('way_below', 'below', 'fair', 'above', 'way_above', 'premium');
create type market_trend as enum ('rising', 'stable', 'falling');
create type action_plan_category as enum ('pricing', 'marketing', 'condition', 'legal', 'other');
create type action_plan_priority as enum ('low', 'medium', 'high', 'urgent');
create type action_plan_status as enum ('pending', 'in_progress', 'completed', 'cancelled');
create type communication_type as enum ('email', 'whatsapp', 'call', 'meeting', 'report', 'note');
create type communication_status as enum ('draft', 'sent', 'delivered', 'read', 'failed');
create type report_type as enum ('price_analysis', 'visit_summary', 'market_update', 'weekly', 'monthly', 'custom');

-- 1. PROPIETARIOS
create table owners (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  dni_cuit text unique,
  address text,
  owner_type owner_type default 'persona_fisica',
  company_name text, -- solo si es persona_juridica
  notes text,
  preferred_contact owner_preferred_contact default 'whatsapp',
  created_by uuid references admin_users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- 2. RELACIÓN PROPIEDAD ↔ PROPIETARIO (muchos a muchos)
create table property_owners (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  owner_id uuid not null references owners(id) on delete cascade,
  ownership_percentage numeric(5,2) default 100 check (ownership_percentage > 0 and ownership_percentage <= 100),
  is_primary_contact boolean default false,
  role text default 'propietario', -- 'propietario', 'copropietario', 'apoderado', 'representante'
  created_at timestamptz default now(),
  unique(property_id, owner_id)
);

-- Índice para buscar propiedades de un propietario rápido
create index idx_property_owners_owner_id on property_owners(owner_id);
create index idx_property_owners_property_id on property_owners(property_id);

-- 3. ANÁLISIS DE PRECIO
create table property_price_analyses (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  estimated_market_price numeric not null check (estimated_market_price >= 0),
  price_per_sqm_market numeric,
  our_listing_price numeric not null,
  price_difference_pct numeric generated always as (
    case when estimated_market_price > 0 
    then round(((our_listing_price - estimated_market_price) / estimated_market_price * 100)::numeric, 2)
    else 0 end
  ) stored,
  price_status price_status,
  market_trend market_trend default 'stable',
  comparable_properties jsonb default '[]',
  recommendation text,
  notes text,
  analyzed_by uuid references admin_users(id),
  analysis_date timestamptz default now(),
  valid_until timestamptz,
  created_at timestamptz default now()
);

-- 4. PLANES DE ACCIÓN
create table property_action_plans (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  owner_id uuid references owners(id) on delete set null,
  title text not null,
  description text,
  category action_plan_category default 'other',
  priority action_plan_priority default 'medium',
  status action_plan_status default 'pending',
  due_date timestamptz,
  completed_at timestamptz,
  assigned_to uuid references admin_users(id),
  created_by uuid references admin_users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- 5. TAREAS DEL PLAN
create table action_plan_tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references property_action_plans(id) on delete cascade,
  title text not null,
  description text,
  status action_plan_status default 'pending',
  due_date timestamptz,
  completed_at timestamptz,
  assigned_to uuid references admin_users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. COMUNICACIONES CON PROPIETARIO
create table owner_communications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references owners(id) on delete cascade,
  property_id uuid references properties(id) on delete set null,
  type communication_type not null,
  subject text,
  content text,
  status communication_status default 'draft',
  sent_at timestamptz,
  sent_by uuid references admin_users(id),
  created_at timestamptz default now()
);

-- 7. REPORTES GENERADOS
create table owner_reports (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  owner_id uuid not null references owners(id) on delete cascade,
  report_type report_type not null,
  title text,
  content_json jsonb default '{}',
  pdf_url text,
  generated_at timestamptz default now(),
  sent_at timestamptz,
  status communication_status default 'draft',
  created_by uuid references admin_users(id)
);

-- Triggers para updated_at
create trigger set_owners_updated_at
  before update on owners
  for each row execute procedure set_updated_at();

create trigger set_property_action_plans_updated_at
  before update on property_action_plans
  for each row execute procedure set_updated_at();

create trigger set_action_plan_tasks_updated_at
  before update on action_plan_tasks
  for each row execute procedure set_updated_at();

-- ============================================================
-- RLS POLICIES
-- ============================================================

alter table owners enable row level security;
alter table property_owners enable row level security;
alter table property_price_analyses enable row level security;
alter table property_action_plans enable row level security;
alter table action_plan_tasks enable row level security;
alter table owner_communications enable row level security;
alter table owner_reports enable row level security;

-- Staff puede hacer todo
create policy "staff_manage_owners" on owners for all to authenticated using (is_staff());
create policy "staff_manage_property_owners" on property_owners for all to authenticated using (is_staff());
create policy "staff_manage_price_analyses" on property_price_analyses for all to authenticated using (is_staff());
create policy "staff_manage_action_plans" on property_action_plans for all to authenticated using (is_staff());
create policy "staff_manage_action_tasks" on action_plan_tasks for all to authenticated using (is_staff());
create policy "staff_manage_communications" on owner_communications for all to authenticated using (is_staff());
create policy "staff_manage_reports" on owner_reports for all to authenticated using (is_staff());

-- Viewers solo pueden leer
create policy "viewer_read_owners" on owners for select to authenticated using (is_viewer());
create policy "viewer_read_property_owners" on property_owners for select to authenticated using (is_viewer());
create policy "viewer_read_price_analyses" on property_price_analyses for select to authenticated using (is_viewer());
create policy "viewer_read_action_plans" on property_action_plans for select to authenticated using (is_viewer());
create policy "viewer_read_action_tasks" on action_plan_tasks for select to authenticated using (is_viewer());
create policy "viewer_read_communications" on owner_communications for select to authenticated using (is_viewer());
create policy "viewer_read_reports" on owner_reports for select to authenticated using (is_viewer());

-- Soft delete: las vistas públicas (si las hay) solo ven deleted_at IS NULL
-- En el admin, el staff puede ver todo (incluyendo papelera) por las policies de arriba
4. ESQUEMAS ZOD (VALIDACIÓN)
En apps/admin/src/lib/owners/schemas.ts (o similar):
TypeScript
import { z } from 'zod';

export const ownerSchema = z.object({
  id: z.string().uuid().optional(),
  full_name: z.string().min(2, 'El nombre es obligatorio'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(8, 'Teléfono muy corto').optional().or(z.literal('')),
  dni_cuit: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  owner_type: z.enum(['persona_fisica', 'persona_juridica']).default('persona_fisica'),
  company_name: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  preferred_contact: z.enum(['email', 'whatsapp', 'call']).default('whatsapp'),
});

export const propertyOwnerLinkSchema = z.object({
  property_id: z.string().uuid(),
  owner_id: z.string().uuid(),
  ownership_percentage: z.number().min(0.01).max(100).default(100),
  is_primary_contact: z.boolean().default(false),
  role: z.string().default('propietario'),
});

export const priceAnalysisSchema = z.object({
  property_id: z.string().uuid(),
  estimated_market_price: z.number().min(0),
  price_per_sqm_market: z.number().min(0).optional(),
  our_listing_price: z.number().min(0),
  market_trend: z.enum(['rising', 'stable', 'falling']).default('stable'),
  comparable_properties: z.array(z.object({
    address: z.string(),
    price: z.number(),
    sqm: z.number().optional(),
    date: z.string(),
    source: z.string().optional(),
  })).default([]),
  recommendation: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  valid_until: z.string().datetime().optional().or(z.literal('')),
});

export const actionPlanSchema = z.object({
  property_id: z.string().uuid(),
  owner_id: z.string().uuid().optional().or(z.literal('')),
  title: z.string().min(3, 'Título obligatorio'),
  description: z.string().optional().or(z.literal('')),
  category: z.enum(['pricing', 'marketing', 'condition', 'legal', 'other']).default('other'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.string().datetime().optional().or(z.literal('')),
  assigned_to: z.string().uuid().optional().or(z.literal('')),
});

export const actionPlanTaskSchema = z.object({
  plan_id: z.string().uuid(),
  title: z.string().min(2),
  description: z.string().optional().or(z.literal('')),
  due_date: z.string().datetime().optional().or(z.literal('')),
  assigned_to: z.string().uuid().optional().or(z.literal('')),
});

export const communicationSchema = z.object({
  owner_id: z.string().uuid(),
  property_id: z.string().uuid().optional().or(z.literal('')),
  type: z.enum(['email', 'whatsapp', 'call', 'meeting', 'report', 'note']),
  subject: z.string().optional().or(z.literal('')),
  content: z.string().optional().or(z.literal('')),
});
5. API / FUNCIONES DE SUPABASE (CLIENTE JS)
En apps/admin/src/lib/owners/ crear archivos:
owners.ts — CRUD de propietarios
TypeScript
import { supabase } from '../supabase';
import type { Owner, PropertyOwnerLink } from './types';

export async function fetchOwners(search?: string) {
  let q = supabase.from('owners').select('*').is('deleted_at', null).order('full_name');
  if (search) q = q.ilike('full_name', `%${search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data as Owner[];
}

export async function fetchOwnerById(id: string) {
  const { data, error } = await supabase
    .from('owners')
    .select('*, property_owners(property_id, ownership_percentage, is_primary_contact, role, properties:property_id(title, address, price, status))')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createOwner(owner: Omit<Owner, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('owners').insert(owner).select().single();
  if (error) throw error;
  return data;
}

export async function updateOwner(id: string, owner: Partial<Owner>) {
  const { data, error } = await supabase.from('owners').update(owner).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function softDeleteOwner(id: string) {
  const { error } = await supabase.from('owners').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

// Vincular propietario a propiedad
export async function linkOwnerToProperty(link: PropertyOwnerLink) {
  const { data, error } = await supabase.from('property_owners').insert(link).select().single();
  if (error) throw error;
  return data;
}

export async function unlinkOwnerFromProperty(propertyId: string, ownerId: string) {
  const { error } = await supabase.from('property_owners').delete().eq('property_id', propertyId).eq('owner_id', ownerId);
  if (error) throw error;
}
price-analysis.ts — Análisis de precio
TypeScript
export async function fetchPriceAnalysis(propertyId: string) {
  const { data, error } = await supabase
    .from('property_price_analyses')
    .select('*')
    .eq('property_id', propertyId)
    .order('analysis_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createPriceAnalysis(analysis: any) {
  // Calcular price_status automáticamente antes de enviar
  const diff = ((analysis.our_listing_price - analysis.estimated_market_price) / analysis.estimated_market_price) * 100;
  let status = 'fair';
  if (diff < -20) status = 'way_below';
  else if (diff < -10) status = 'below';
  else if (diff > 20) status = 'way_above';
  else if (diff > 10) status = 'above';
  else if (diff > 5) status = 'premium';

  const { data, error } = await supabase
    .from('property_price_analyses')
    .insert({ ...analysis, price_status: status })
    .select()
    .single();
  if (error) throw error;
  return data;
}
action-plans.ts — Planes de acción
TypeScript
export async function fetchActionPlans(filters?: { property_id?: string; assigned_to?: string; status?: string }) {
  let q = supabase.from('property_action_plans').select('*, property:properties(title), owner:owners(full_name), assignee:admin_users(full_name)').is('deleted_at', null);
  if (filters?.property_id) q = q.eq('property_id', filters.property_id);
  if (filters?.assigned_to) q = q.eq('assigned_to', filters.assigned_to);
  if (filters?.status) q = q.eq('status', filters.status);
  const { data, error } = await q.order('due_date', { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchTasksByPlan(planId: string) {
  const { data, error } = await supabase
    .from('action_plan_tasks')
    .select('*, assignee:admin_users(full_name)')
    .eq('plan_id', planId)
    .order('due_date');
  if (error) throw error;
  return data;
}

export async function completeTask(taskId: string) {
  const { error } = await supabase
    .from('action_plan_tasks')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', taskId);
  if (error) throw error;
}

export async function completePlan(planId: string) {
  const { error } = await supabase
    .from('property_action_plans')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', planId);
  if (error) throw error;
}
communications.ts — Comunicaciones
TypeScript
export async function fetchCommunications(ownerId: string) {
  const { data, error } = await supabase
    .from('owner_communications')
    .select('*, property:properties(title)')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function sendCommunication(comm: any) {
  const { data, error } = await supabase
    .from('owner_communications')
    .insert({ ...comm, status: 'sent', sent_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}
6. PÁGINAS Y COMPONENTES DEL ADMIN
Nuevas rutas en el router (apps/admin/src/pages/)
Table
Ruta	Componente	Descripción
/owners	OwnersPage	Lista de propietarios con búsqueda, filtros, contador de propiedades.
/owners/new	OwnerFormPage	Formulario de alta/edición de propietario.
/owners/:id	OwnerDetailPage	Perfil completo: datos, propiedades, timeline de comunicaciones, reportes.
/properties/:id/owners	(tab en PropertyDetail)	Asignar/desasignar propietarios, ver porcentajes.
/properties/:id/analysis	PriceAnalysisPage	Formulario de análisis de precio, historial, gauge visual.
/properties/:id/plans	ActionPlansPage	Lista de planes de acción de la propiedad.
/action-plans	ActionPlansDashboard	Todos los planes del equipo, filtrables (Kanban o tabla).
/action-plans/:id	ActionPlanDetailPage	Detalle del plan con tareas, progreso, asignaciones.
/communications	CommunicationsPage	Centro de comunicaciones con propietarios.
/reports	ReportsPage	Generador de reportes para enviar a propietarios.
Componentes compartidos nuevos (apps/admin/src/components/)
Table
Componente	Props	Función
OwnerCard	owner, propertyCount	Card resumen para listas.
OwnerForm	owner?, onSubmit	Formulario reutilizable (alta/edición).
PropertyOwnerManager	propertyId	Asignar/quitar propietarios de una propiedad.
PriceAnalysisGauge	analysis	Gauge visual (verde/amarillo/rojo) del estado de precio.
ComparablePropertyInput	value[], onChange	Formulario para agregar comparables.
ActionPlanCard	plan, tasks[]	Card de plan con progreso de tareas.
ActionPlanTaskList	tasks[], onToggle	Lista de tareas con checkboxes.
CommunicationTimeline	communications[]	Timeline vertical de comunicaciones.
OwnerReportGenerator	propertyId, ownerId	Wizard para generar reporte.
OwnerReportPreview	report	Preview del reporte antes de enviar.
7. FLUJOS DE USUARIO DETALLADOS
FLUJO A: Alta de un propietario y vinculación a propiedad
El admin va a Propietarios → Nuevo o desde la ficha de una propiedad → Agregar propietario.
Completa el formulario (OwnerForm): nombre, email, teléfono, DNI/CUIT, dirección, tipo, notas, contacto preferido.
Guarda. El sistema crea el registro en owners.
Desde la ficha de la propiedad (pestaña "Propietarios"), busca el propietario por nombre/DNI.
Lo selecciona, define:
Porcentaje de propiedad (default 100%).
Si es contacto principal.
Rol (propietario, copropietario, apoderado).
Guarda la relación en property_owners.
El propietario aparece en la ficha de la propiedad y la propiedad aparece en el perfil del propietario.
FLUJO B: Análisis de precio de una propiedad
El admin va a Propiedad → Análisis de Precio.
Ve el último análisis (si existe) y su fecha de validez.
Clic en "Nuevo análisis".
Completa:
Precio estimado de mercado: basado en comparables, tasaciones, conocimiento del agente.
Precio por m² del mercado: opcional.
Precio de publicación actual: se carga automáticamente desde properties.price.
Comparables: array de propiedades similares (dirección, precio, m², fecha, fuente).
Tendencia del mercado: subiendo, estable, bajando.
Notas y recomendación: texto libre.
El sistema calcula automáticamente:
price_difference_pct = ((our - market) / market) * 100
price_status según rangos:
< -20% → way_below (muy por debajo)
-20% a -10% → below (por debajo)
-10% a +5% → fair (justo)
+5% a +10% → premium (premium)
+10% a +20% → above (por encima)
> +20% → way_above (muy por encima)
Se muestra un gauge visual con colores:
🟢 Verde: fair, below, way_below
🟡 Amarillo: premium
🔴 Rojo: above, way_above
Se guarda en property_price_analyses. Se muestra historial de análisis previos.
FLUJO C: Crear un plan de acción
Desde el análisis de precio (si el precio está mal) o manualmente desde Propiedad → Planes de Acción.
Clic en "Nuevo plan".
Completa:
Título: ej. "Ajustar precio y renovar fotos"
Descripción
Categoría: pricing, marketing, condition, legal, other
Prioridad: low, medium, high, urgent
Fecha límite
Asignado a: agente responsable
Propietario relacionado (opcional)
Guarda. El plan aparece en estado pending.
Dentro del plan, se agregan tareas:
"Bajar precio a $X"
"Sacar nuevas fotos del living"
"Publicar en Instagram"
Cada tarea tiene su propio responsable y fecha.
El agente marca tareas como completadas. Cuando todas las tareas están completed, el plan puede marcarse como completed.
Los planes pending o in_progress con due_date vencida aparecen en el dashboard como alerta.
FLUJO D: Comunicación con el propietario
Desde el perfil del propietario o de la propiedad, clic en "Nueva comunicación".
Selecciona tipo: WhatsApp, llamada, reunión, nota interna, email, reporte.
Si es llamada/reunión/nota: se guarda como registro histórico.
Si es WhatsApp: se genera un link https://wa.me/<phone>?text=<mensaje> y se guarda el registro como sent.
Si es reporte: se usa el generador de reportes (ver Flujo E).
Todas las comunicaciones aparecen en un timeline en el perfil del propietario, ordenadas cronológicamente.
FLUJO E: Generar y enviar un reporte al propietario
Desde el perfil del propietario o la propiedad, clic en "Generar reporte".
Selecciona tipo:
Análisis de precio: incluye precio publicado vs. mercado, gauge, comparables, recomendación.
Resumen de visitas: cuántas visitas tuvo, fechas, feedback.
Estado general: combinación de precio + visitas + leads + planes de acción activos.
El sistema arma automáticamente el contenido (content_json) con datos reales de la base:
Datos de la propiedad.
Último análisis de precio.
Conteo de visitas (de visits).
Conteo de leads (de leads).
Planes de acción activos.
El admin puede editar el contenido antes de enviar.
Genera el reporte. Se guarda en owner_reports con status draft.
El admin clic en "Enviar por WhatsApp" o "Enviar por email" (cuando haya SMTP).
Se actualiza a sent y se registra una comunicación en owner_communications.
8. INTEGRACIONES CON MÓDULOS EXISTENTES
Table
Módulo existente	Integración
properties	Cada propiedad tiene pestaña "Propietarios" y "Análisis". El precio de properties.price se usa en el análisis.
leads	En reportes al propietario se incluye: "X leads interesados". Se puede ver desde el perfil del propietario cuántos leads tiene su propiedad.
visits	Las visitas agendadas se muestran en reportes. Se puede notificar al propietario automáticamente cuando se agenda una visita (vía trigger o edge function futura).
agents	Los planes de acción se asignan a agentes (assigned_to). Cada propietario puede tener un agente referente (a definir en property_owners o owners).
chat	Se puede crear automáticamente un canal de chat interno tipo property cuando se vincula un propietario, para que el equipo comente sobre esa propiedad/cartera.
Mercado Libre	En el análisis de precio se puede incluir el estado de publicación en ML. En planes de acción puede haber tareas del tipo " republicar en ML".
Dashboard	Nuevos KPIs: propiedades sobrevaloradas, planes pendientes, propietarios sin contacto reciente, tareas vencidas.
Papelera	owners, property_action_plans y action_plan_tasks deben integrarse al sistema de papelera universal (soft delete + restore + purge).
activity_log	Agregar triggers de auditoría para cambios en owners, property_action_plans, etc.
9. NUEVOS KPIs PARA EL DASHBOARD
Agregar widgets en DashboardCharts o DashboardPage:
TypeScript
const newKPIs = [
  { label: 'Propiedades sobrevaloradas', value: countWhere(price_status in ('above', 'way_above')) },
  { label: 'Planes de acción pendientes', value: countWhere(status = 'pending' or status = 'in_progress') },
  { label: 'Tareas vencidas', value: countWhere(task.due_date < now() and status != 'completed') },
  { label: 'Propietarios sin contacto > 30 días', value: countWhere(last_communication_date < now() - 30 days) },
  { label: 'Análisis de precio vencidos', value: countWhere(valid_until < now()) },
  { label: 'Propietarios totales', value: count(owners) },
];
10. CONSIDERACIONES TÉCNICAS
Soft Delete
Todas las tablas nuevas (owners, property_action_plans) deben usar el patrón de deleted_at. Las queries por defecto deben filtrar .is('deleted_at', null) a menos que se esté en la página de Papelera.
Papelera Universal
Agregar owners y property_action_plans (y sus tareas en cascada) al sistema de papelera existente (TrashPage). Al restaurar un plan, restaurar también sus tareas.
Triggers de auditoría
Agregar a activity_log cuando:
Se crea/edita/elimina un propietario.
Se crea/edita un análisis de precio.
Se crea/completa un plan de acción.
Se envía una comunicación.
Performance
property_owners necesita índices en owner_id y property_id.
Las queries de dashboard deben usar count() eficiente o vistas materializadas si el volumen crece.
Realtime (opcional pero recomendado)
Suscribirse a cambios en property_action_plans para que el dashboard se actualice en tiempo real cuando un agente completa una tarea.
Edge Function futura (no prioridad inicial)
generate-owner-report: Edge Function que genere un PDF a partir del content_json usando una librería de PDF (ej. pdfmake o puppeteer en Deno).
11. ROADMAP DE IMPLEMENTACIÓN (PARA EL ASISTENTE IA)
Fase 1: Fundación (días 1–3)
[ ] Crear migración 0022_owners_module.sql con todas las tablas, enums, triggers, RLS.
[ ] Crear tipos TypeScript en apps/admin/src/lib/owners/types.ts.
[ ] Crear esquemas Zod en apps/admin/src/lib/owners/schemas.ts.
[ ] Crear funciones de API: owners.ts, property-owners.ts.
Fase 2: CRUD de Propietarios (días 4–6)
[ ] Página OwnersPage: tabla con búsqueda, filtros, contador de propiedades.
[ ] Página OwnerFormPage: formulario de alta/edición con validación Zod.
[ ] Página OwnerDetailPage: perfil, propiedades asociadas, timeline de comunicaciones.
[ ] Componente OwnerCard, OwnerForm.
[ ] Integrar con Papelera (soft delete + restore).
Fase 3: Vinculación Propiedad-Propietario (días 7–8)
[ ] Pestaña "Propietarios" en la ficha de propiedad (PropertyOwnerManager).
[ ] Buscador de propietarios existentes + creación inline.
[ ] Tabla de propietarios vinculados con %, rol, contacto principal.
[ ] Botón para desvincular.
Fase 4: Análisis de Precio (días 9–12)
[ ] Página PriceAnalysisPage en la ficha de propiedad.
[ ] Formulario con comparables dinámicos (ComparablePropertyInput).
[ ] Cálculo automático de price_difference_pct y price_status.
[ ] Componente PriceAnalysisGauge (SVG o CSS).
[ ] Historial de análisis previos.
Fase 5: Planes de Acción (días 13–17)
[ ] CRUD de planes (property_action_plans).
[ ] CRUD de tareas (action_plan_tasks).
[ ] Página ActionPlansPage por propiedad.
[ ] Página ActionPlansDashboard global (tabla o Kanban).
[ ] Página ActionPlanDetailPage con lista de tareas y progreso.
[ ] Marcado de tareas/planes como completados.
Fase 6: Comunicaciones y Reportes (días 18–21)
[ ] Tabla owner_communications + CRUD.
[ ] Componente CommunicationTimeline.
[ ] Generador de reportes (OwnerReportGenerator).
[ ] Preview de reporte (OwnerReportPreview).
[ ] Envío por WhatsApp (link wa.me).
[ ] Página CommunicationsPage y ReportsPage.
Fase 7: Dashboard + Polish (días 22–24)
[ ] Agregar KPIs nuevos al dashboard.
[ ] Integrar con activity_log (auditoría).
[ ] Integrar con sistema de papelera existente.
[ ] Tests manuales de flujos completos.
[ ] Revisar RLS y permisos por rol.
12. EJEMPLOS DE QUERIES ÚTILES
sql
-- Propietarios con cantidad de propiedades
select o.*, count(po.property_id) as property_count
from owners o
left join property_owners po on o.id = po.owner_id
where o.deleted_at is null
group by o.id;

-- Propiedades sobrevaloradas con datos del propietario
select p.title, p.price, pa.estimated_market_price, pa.price_difference_pct, pa.price_status, o.full_name
from properties p
join property_price_analyses pa on p.id = pa.property_id
join property_owners po on p.id = po.property_id
join owners o on po.owner_id = o.id
where pa.price_status in ('above', 'way_above')
and pa.valid_until > now();

-- Planes de acción vencidos o urgentes
select pap.*, p.title as property_title, au.full_name as assigned_name
from property_action_plans pap
join properties p on pap.property_id = p.id
left join admin_users au on pap.assigned_to = au.id
where pap.status in ('pending', 'in_progress')
and (pap.due_date < now() or pap.priority = 'urgent');
