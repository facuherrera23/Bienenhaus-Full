# 📘 MÓDULO DE PROPIETARIOS — ESPECIFICACIÓN TÉCNICA COMPLETA

**Proyecto:** BIENENHAUS PROPIEDADES  
**Versión:** 1.0  
**Contexto:** Módulo nuevo a agregar al sistema existente (Landing + Admin + Supabase)

---

## 1. CONTEXTO DEL SISTEMA EXISTENTE

BIENENHAUS es una plataforma full-stack para inmobiliarias con:

- **Landing pública** (Preact + Vite): catálogo de propiedades, filtros, newsletter, SEO/PWA.
- **Panel Admin** (Preact + Vite + Supabase): CRM completo con dashboard, CRUD de propiedades, leads, agentes, usuarios admin, Mercado Libre, calendario de visitas, chat interno en tiempo real, papelera universal con soft delete, y CMS de la landing.
- **Backend:** Supabase (PostgreSQL 17, Auth, Realtime, Storage, Edge Functions Deno 2).
- **Estado:** `preact-signals` (global), TanStack Query (server state).
- **Estilos:** Design tokens en CSS, CSS Modules.
- **Base de datos:** 21 migraciones. Tablas clave: `properties`, `leads`, `agents`, `admin_users`, `visits`, `chat_channels`, `chat_messages`, `newsletter_subscribers`, + tablas ML.
- **Soft delete:** patrón universal con columna `deleted_at` en todas las tablas principales.
- **RLS:** políticas por rol (`super_admin`, `admin`, `staff`, `viewer`).
- **Auditoría:** `activity_log`, `properties_history` con triggers.

---

## 2. OBJETIVO DEL MÓDULO

Crear un sistema de **gestión de cartera de propietarios** que permita:

1. **Registrar y gestionar propietarios** (personas físicas/jurídicas) y asociarlos a propiedades.
2. **Analizar el precio de mercado** de cada propiedad para determinar si está bien, barata o cara.
3. **Crear planes de acción** con tareas concretas para mejorar la comercialización.
4. **Mantener un historial de comunicaciones** con cada propietario (llamadas, WhatsApp, emails, reuniones).
5. **Generar y enviar reportes automáticos** al propietario con el estado de su propiedad.
6. (Futuro) Darle al propietario un **portal privado** para ver el estado de su inmueble.

---

## 3. MODELO DE DATOS (MIGRACIÓN SQL)

Crear archivo: `supabase/migrations/0022_owners_module.sql`

```sql
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
  company_name text,
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
  role text default 'propietario',
  created_at timestamptz default now(),
  unique(property_id, owner_id)
);

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
```

---

## 4. ESQUEMAS ZOD (VALIDACIÓN)

En `apps/admin/src/lib/owners/schemas.ts`:

```typescript
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
```

---

## 5. API / FUNCIONES DE SUPABASE (CLIENTE JS)

En `apps/admin/src/lib/owners/`:

### `owners.ts` — CRUD de propietarios

```typescript
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
    .select(`*, property_owners(property_id, ownership_percentage, is_primary_contact, role, properties:property_id(title, address, price, status))`)
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

export async function linkOwnerToProperty(link: PropertyOwnerLink) {
  const { data, error } = await supabase.from('property_owners').insert(link).select().single();
  if (error) throw error;
  return data;
}

export async function unlinkOwnerFromProperty(propertyId: string, ownerId: string) {
  const { error } = await supabase.from('property_owners').delete().eq('property_id', propertyId).eq('owner_id', ownerId);
  if (error) throw error;
}
```

### `price-analysis.ts` — Análisis de precio

```typescript
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
```

### `action-plans.ts` — Planes de acción

```typescript
export async function fetchActionPlans(filters?: { property_id?: string; assigned_to?: string; status?: string }) {
  let q = supabase.from('property_action_plans')
    .select('*, property:properties(title), owner:owners(full_name), assignee:admin_users(full_name)')
    .is('deleted_at', null);
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
```

### `communications.ts` — Comunicaciones

```typescript
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
```

---

## 6. PÁGINAS Y COMPONENTES DEL ADMIN

### Nuevas rutas en el router

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/owners` | `OwnersPage` | Lista de propietarios con búsqueda, filtros, contador de propiedades. |
| `/owners/new` | `OwnerFormPage` | Formulario de alta/edición de propietario. |
| `/owners/:id` | `OwnerDetailPage` | Perfil completo: datos, propiedades, timeline de comunicaciones, reportes. |
| `/properties/:id/owners` | (tab en PropertyDetail) | Asignar/desasignar propietarios a esta propiedad. |
| `/properties/:id/analysis` | `PriceAnalysisPage` | Análisis de precio de la propiedad, comparables, gauge visual. |
| `/properties/:id/plans` | `ActionPlansPage` | Lista de planes de acción de la propiedad. |
| `/action-plans` | `ActionPlansDashboard` | Todos los planes del equipo, filtrables (Kanban o tabla). |
| `/action-plans/:id` | `ActionPlanDetailPage` | Detalle del plan con tareas, progreso, asignaciones. |
| `/communications` | `CommunicationsPage` | Centro de comunicaciones con propietarios. |
| `/reports` | `ReportsPage` | Generador de reportes para enviar a propietarios. |

### Componentes compartidos nuevos

| Componente | Props | Función |
|------------|-------|---------|
| `OwnerCard` | `owner, propertyCount` | Card resumen para listas. |
| `OwnerForm` | `owner?, onSubmit` | Formulario reutilizable (alta/edición). |
| `PropertyOwnerManager` | `propertyId` | Asignar/quitar propietarios de una propiedad. |
| `PriceAnalysisGauge` | `analysis` | Gauge visual (verde/amarillo/rojo) del estado de precio. |
| `ComparablePropertyInput` | `value[], onChange` | Formulario para agregar comparables. |
| `ActionPlanCard` | `plan, tasks[]` | Card de plan con progreso de tareas. |
| `ActionPlanTaskList` | `tasks[], onToggle` | Lista de tareas con checkboxes. |
| `CommunicationTimeline` | `communications[]` | Timeline vertical de comunicaciones. |
| `OwnerReportGenerator` | `propertyId, ownerId` | Wizard para generar reporte. |
| `OwnerReportPreview` | `report` | Preview del reporte antes de enviar. |

---

## 7. FLUJOS DE USUARIO DETALLADOS

### FLUJO A: Alta de propietario y vinculación

1. Admin va a **Propietarios → Nuevo** o desde ficha de propiedad **→ Agregar propietario**.
2. Completa formulario (`OwnerForm`): nombre, email, teléfono, DNI/CUIT, dirección, tipo, notas, contacto preferido.
3. Guarda. Sistema crea registro en `owners`.
4. Desde ficha de propiedad (pestaña "Propietarios"), busca propietario por nombre/DNI.
5. Selecciona, define: porcentaje de propiedad, si es contacto principal, rol.
6. Guarda relación en `property_owners`.
7. Propietario aparece en ficha de propiedad y propiedad en perfil del propietario.

### FLUJO B: Análisis de precio

1. Admin va a **Propiedad → Análisis de Precio**.
2. Ve último análisis (si existe) y fecha de validez.
3. Clic en **"Nuevo análisis"**.
4. Completa:
   - Precio estimado de mercado
   - Precio por m² del mercado (opcional)
   - Precio de publicación actual (auto desde `properties.price`)
   - Comparables: array de propiedades similares
   - Tendencia del mercado
   - Notas y recomendación
5. Sistema calcula automáticamente:
   - `price_difference_pct = ((our - market) / market) * 100`
   - `price_status` según rangos:
     - `< -20%` → `way_below`
     - `-20% a -10%` → `below`
     - `-10% a +5%` → `fair`
     - `+5% a +10%` → `premium`
     - `+10% a +20%` → `above`
     - `> +20%` → `way_above`
6. Muestra **gauge visual**:
   - 🟢 Verde: `fair`, `below`, `way_below`
   - 🟡 Amarillo: `premium`
   - 🔴 Rojo: `above`, `way_above`
7. Guarda en `property_price_analyses`. Muestra historial.

### FLUJO C: Crear plan de acción

1. Desde análisis de precio (si precio está mal) o manualmente desde **Propiedad → Planes de Acción**.
2. Clic en **"Nuevo plan"**.
3. Completa: título, descripción, categoría, prioridad, fecha límite, asignado a, propietario relacionado.
4. Guarda. Plan aparece en estado `pending`.
5. Dentro del plan, se agregan **tareas** con responsable y fecha.
6. Agente marca tareas como completadas. Cuando todas están `completed`, el plan puede marcarse `completed`.
7. Planes `pending`/`in_progress` con `due_date` vencida aparecen en dashboard como alerta.

### FLUJO D: Comunicación con propietario

1. Desde perfil de propietario o propiedad, clic en **"Nueva comunicación"**.
2. Selecciona tipo: WhatsApp, llamada, reunión, nota interna, email, reporte.
3. Llamada/reunión/nota: se guarda como registro histórico.
4. WhatsApp: genera link `https://wa.me/<phone>?text=<mensaje>` y guarda registro como `sent`.
5. Reporte: usa generador de reportes (Flujo E).
6. Comunicaciones aparecen en **timeline** en perfil del propietario.

### FLUJO E: Generar y enviar reporte

1. Desde perfil de propietario o propiedad, clic en **"Generar reporte"**.
2. Selecciona tipo:
   - **Análisis de precio**: precio publicado vs. mercado, gauge, comparables, recomendación.
   - **Resumen de visitas**: cuántas visitas tuvo, fechas, feedback.
   - **Estado general**: combinación de precio + visitas + leads + planes activos.
3. Sistema arma `content_json` automáticamente con datos reales.
4. Admin puede editar contenido antes de enviar.
5. Genera reporte. Guarda en `owner_reports` con status `draft`.
6. Admin clic en **"Enviar por WhatsApp"** o **"Enviar por email"**.
7. Actualiza a `sent` y registra comunicación en `owner_communications`.

---

## 8. INTEGRACIONES CON MÓDULOS EXISTENTES

| Módulo existente | Integración |
|------------------|-------------|
| **`properties`** | Pestaña "Propietarios" y "Análisis". Precio de `properties.price` usado en análisis. |
| **`leads`** | En reportes: "X leads interesados". Desde perfil de propietario se ven leads de sus propiedades. |
| **`visits`** | Visitas agendadas en reportes. Notificación automática al propietario cuando se agenda visita (trigger futuro). |
| **`agents`** | Planes de acción asignados a agentes. Propietario puede tener agente referente. |
| **`chat`** | Canal de chat interno tipo `property` automático al vincular propietario. |
| **`Mercado Libre`** | Estado de publicación ML en análisis de precio. Tareas tipo "republicar en ML". |
| **`Dashboard`** | Nuevos KPIs: propiedades sobrevaloradas, planes pendientes, propietarios sin contacto reciente. |
| **`Papelera`** | `owners` y `property_action_plans` integrados al sistema de papelera universal. |
| **`activity_log`** | Triggers de auditoría para cambios en `owners`, `property_action_plans`, etc. |

---

## 9. NUEVOS KPIs PARA EL DASHBOARD

```typescript
const newKPIs = [
  { label: 'Propiedades sobrevaloradas', value: countWhere(price_status in ('above', 'way_above')) },
  { label: 'Planes de acción pendientes', value: countWhere(status = 'pending' or status = 'in_progress') },
  { label: 'Tareas vencidas', value: countWhere(task.due_date < now() and status != 'completed') },
  { label: 'Propietarios sin contacto > 30 días', value: countWhere(last_communication_date < now() - 30 days) },
  { label: 'Análisis de precio vencidos', value: countWhere(valid_until < now()) },
  { label: 'Propietarios totales', value: count(owners) },
];
```

---

## 10. CONSIDERACIONES TÉCNICAS

### Soft Delete
Todas las tablas nuevas (`owners`, `property_action_plans`) usan `deleted_at`. Queries por defecto filtran `.is('deleted_at', null)` salvo en Papelera.

### Papelera Universal
Agregar `owners` y `property_action_plans` (y tareas en cascada) al sistema de papelera existente (`TrashPage`). Al restaurar un plan, restaurar también sus tareas.

### Triggers de auditoría
Agregar a `activity_log` cuando:
- Se crea/edita/elimina un propietario.
- Se crea/edita un análisis de precio.
- Se crea/completa un plan de acción.
- Se envía una comunicación.

### Performance
- `property_owners` necesita índices en `owner_id` y `property_id`.
- Queries de dashboard deben usar `count()` eficiente o vistas materializadas si el volumen crece.

### Realtime (opcional)
- Suscribirse a cambios en `property_action_plans` para actualizar dashboard en tiempo real cuando un agente completa una tarea.

### Edge Function futura
- `generate-owner-report`: Edge Function que genere PDF a partir de `content_json`.

---

## 11. ROADMAP DE IMPLEMENTACIÓN

**Fase 1: Fundación (días 1–3)**
- [ ] Crear migración `0022_owners_module.sql` con tablas, enums, triggers, RLS.
- [ ] Crear tipos TypeScript en `apps/admin/src/lib/owners/types.ts`.
- [ ] Crear esquemas Zod en `apps/admin/src/lib/owners/schemas.ts`.
- [ ] Crear funciones de API: `owners.ts`, `property-owners.ts`.

**Fase 2: CRUD de Propietarios (días 4–6)**
- [ ] Página `OwnersPage`: tabla con búsqueda, filtros, contador de propiedades.
- [ ] Página `OwnerFormPage`: formulario alta/edición con validación Zod.
- [ ] Página `OwnerDetailPage`: perfil, propiedades, timeline, reportes.
- [ ] Componentes `OwnerCard`, `OwnerForm`.
- [ ] Integrar con Papelera (soft delete + restore).

**Fase 3: Vinculación Propiedad-Propietario (días 7–8)**
- [ ] Pestaña "Propietarios" en ficha de propiedad (`PropertyOwnerManager`).
- [ ] Buscador de propietarios existentes + creación inline.
- [ ] Tabla de propietarios vinculados con %, rol, contacto principal.
- [ ] Botón para desvincular.

**Fase 4: Análisis de Precio (días 9–12)**
- [ ] Página `PriceAnalysisPage` en ficha de propiedad.
- [ ] Formulario con comparables dinámicos (`ComparablePropertyInput`).
- [ ] Cálculo automático de `price_difference_pct` y `price_status`.
- [ ] Componente `PriceAnalysisGauge` (SVG o CSS).
- [ ] Historial de análisis previos.

**Fase 5: Planes de Acción (días 13–17)**
- [ ] CRUD de planes (`property_action_plans`).
- [ ] CRUD de tareas (`action_plan_tasks`).
- [ ] Página `ActionPlansPage` por propiedad.
- [ ] Página `ActionPlansDashboard` global (tabla o Kanban).
- [ ] Página `ActionPlanDetailPage` con tareas y progreso.
- [ ] Marcado de tareas/planes como completados.

**Fase 6: Comunicaciones y Reportes (días 18–21)**
- [ ] Tabla `owner_communications` + CRUD.
- [ ] Componente `CommunicationTimeline`.
- [ ] Generador de reportes (`OwnerReportGenerator`).
- [ ] Preview de reporte (`OwnerReportPreview`).
- [ ] Envío por WhatsApp (link wa.me).
- [ ] Páginas `CommunicationsPage` y `ReportsPage`.

**Fase 7: Dashboard + Polish (días 22–24)**
- [ ] Agregar KPIs nuevos al dashboard.
- [ ] Integrar con `activity_log` (auditoría).
- [ ] Integrar con sistema de papelera existente.
- [ ] Tests manuales de flujos completos.
- [ ] Revisar RLS y permisos por rol.

---

## 12. QUERIES ÚTILES

```sql
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
```

---

**Autor:** Facundo Herrera  
**Proyecto:** BIENENHAUS PROPIEDADES
