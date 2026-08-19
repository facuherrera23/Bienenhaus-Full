# Plan de Integración Modular: Auditoría Completa y Conexión de Módulos

> **Estado**: En progreso
> **Fecha**: 2026-08-17
> **Objetivo**: Conectar todos los módulos entre sí de forma coherente y eficiente. Cada módulo debe alimentar a los demás cuando corresponda, eliminando silos de datos y automatizando flujos cruzados.

---

## 🎯 Auditoría de Conexiones Existentes vs Faltantes

### Mapa de Conexiones Actuales (las que YA existen en schema)

```
Properties ──FK──> locations
Properties ──FK──> categories
Properties ──FK──> property_types
Properties ──1:N──> property_images
Properties ──1:N──> property_features
Properties ──1:1──> property_ml_meta
Properties ──1:N──> property_valuations
Properties ──1:N──> property_action_plans
Properties ──M:N──> owners (via property_owners)
Properties ──1:N──> property_drafts

Leads ──FK──> agents (assigned_to)
Leads ──FK──> properties (property_id)
Leads ──1:N──> lead_tags
Leads ──1:N──> lead_scores

Agents ──1:N──> visits (agent_id)
Agents ──1:N──> agent_availability
Agents ──1:N──> agent_specialties
Agents ──1:N──> agent_permissions
Agents ──1:1──> agents_realtime (shadow)

Visits ──FK──> properties (property_id)
Visits ──FK──> leads (lead_id)
Visits ──FK──> agents (agent_id)
Visits ──1:N──> visit_reminders

Chat ──1:N──> chat_channels
Chat ──1:N──> chat_messages
Chat ──1:N──> chat_channel_participants
Chat ──1:N──> chat_message_reads
Chat channels can link to: property_id, lead_id

Owners ──1:N──> property_owners (→ properties)
Owners ──1:N──> property_price_analyses (→ properties)
Owners ──1:N──> property_action_plans (→ properties)
Owners ──1:N──> action_plan_tasks
Owners ──1:N──> owner_communications
Owners ──1:N──> owner_reports

ML ──1:1──> ml_connection
ML ──1:N──> ml_sync_queue (→ properties)
ML ──1:N──> ml_sync_history
ML ──1:N──> ml_sync_dead_letter
ML ──1:N──> property_ml_meta (→ properties)
```

### 🔴 Conexiones FALTANTES (Gaps Críticos)

| # | Gap | De → A | Descripción | Impacto |
|---|-----|--------|-------------|---------|
| **G1** | Leads → Visitas automáticas | `leads` → `visits` | Al convertir lead (status=nuevo, visita_programada), no se crea visita automáticamente | El agente debe crear visita manualmente |
| **G2** | Leads → Auto-asignación agente | `leads` → `agents` | `assigned_to` se setea por round-robin pero no considera especialidad/ubicación del agente | Leads pueden ir al agente equivocado |
| **G3** | Visita → Estado lead sync | `visits` → `leads` | Al completar una visita, el status del lead no se actualiza | Lead queda en estado desactualizado |
| **G4** | Agentes ↔ Propiedades | `agents` ↔ `properties` | No hay tabla de asignación agente↔propiedad (quién administra qué propiedad) | No se puede filtrar propiedades por agente |
| **G5** | Chat → Canales automáticos | `chat_channels` | No se crean canales automáticamente al crear lead o visita | El usuario debe crear canales manualmente |
| **G6** | Owner ↔ WhatsApp | `owner_communications` | No hay integración WhatsApp real, solo registro manual | El usuario copia/pega el msg a WhatsApp |
| **G7** | Valuations ↔ Properties FK | `property_valuations` → `properties` | FK existe pero no hay trigger que actualice el precio estimado en `properties` | El precio de propiedad no refleja tasación |
| **G8** | Trash inconsistente | Tablas various | No todas las entidades tienen soft-delete (valuations, price_analyses, etc.) | Datos se pierden sin recuperación |
| **G9** | Dashboard ↔ Todos módulos | Dashboard | Solo muestra leads y propiedades, no visitas, chat, ML ni owners | Vista incompleta del negocio |
| **G10** | Retención automática trash | `trash_retention_policies` | Tabla existe pero `process-retention-policies` edge fn puede no estar ejecutándose | Papelera crece indefinidamente |

---

## 📋 PLANES DE IMPLEMENTACIÓN POR GAP

### PLAN G1: Leads → Visitas Automáticas

**Objetivo**: Cuando un lead se marca como "interesado" o "visita_programada", crear una visita automáticamente.

**Archivos a modificar**:
- `apps/admin/src/lib/leads.api.ts` — Hook `useUpdateLeadStatus` → disparar creación de visita
- `apps/admin/src/lib/visits.api.ts` — Función `createVisitFromLead(leadId)`
- `apps/admin/src/pages/LeadsPage.tsx` — Botón "Programar visita" en tabla
- `apps/admin/src/pages/LeadDetailPage.tsx` — Sección "Visitas programadas"

**Flujo**:
1. Lead cambia status → `visita_programada` o `nuevo`
2. Se busca último agente asignado + horarios disponibles (`agent_availability`)
3. Se crea visita con: property_id (del lead), lead_id, agent_id, fecha sugerida
4. Se crea recordatorio automático (`visit_reminders`)
5. Se notifica al agente via chat canal (si existe)

**SQL**: No requiere nueva migración (FKs ya existen)

---

### PLAN G2: Auto-asignación Inteligente de Agentes

**Objetivo**: Asignar leads al agente más adecuado según especialidad y ubicación.

**Archivos a modificar**:
- `apps/admin/src/lib/leads.ts` — Función `assignLeadIntelligently(lead)`
- `apps/admin/src/lib/agents.ts` — Nueva función `findBestAgent(propertyType, location)`
- `apps/admin/src/types/agents.ts` — Tipos para scoring

**Algoritmo**:
1. Obtener agentes activos con sus `agent_specialties`
2. Filtrar por especialidad que matchee el tipo de propiedad del lead
3. Filtrar por ubicación (zonas del agente vs ubicación de la propiedad)
4. Filtrar por carga actual (leads activos asignados < umbral)
5. Seleccionar el de mayor score; fallback a round-robin

**SQL**: No requiere nueva migración

---

### PLAN G3: Visita → Sync Estado Lead

**Objetivo**: Al completar una visita, actualizar el status del lead.

**Archivos a modificar**:
- `apps/admin/src/lib/visits.api.ts` — Mutation `useCompleteVisit` → actualizar lead
- `apps/admin/src/lib/leads.ts` — Función `updateLeadFromVisit(visitId, outcome)`

**Flujo**:
1. Visita se marca como `completada`
2. Se lee `lead_id` de la visita
3. Se actualiza lead: `status = 'en_seguimiento'`, `last_visit_at = now()`
4. Se agrega tag automático: `visitado`
5. Se registra en `activity_log`

**SQL**: No requiere nueva migración

---

### PLAN G4: Agentes ↔ Propiedades (Asignación)

**Objetivo**: Crear tabla de asignación agente↔propiedad para saber quién administra qué.

**Archivos a modificar**:
- Nueva migración SQL
- `apps/admin/src/lib/agents.ts` — CRUD de asignaciones
- `apps/admin/src/lib/properties.api.ts` — Filtrar por agente asignado
- `apps/admin/src/pages/PropertiesPage.tsx` — Filtro "Mi propiedad" / "Todas"
- `apps/admin/src/pages/AgentDetailPage.tsx` — Tab "Propiedades asignadas"

**SQL (nueva migración 0068)**:
```sql
CREATE TABLE IF NOT EXISTS agent_property_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES admin_users(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT,
    UNIQUE(agent_id, property_id)
);

ALTER TABLE agent_property_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff CRUD agent_property_assignments"
    ON agent_property_assignments FOR ALL
    USING (is_staff())
    WITH CHECK (is_staff());
```

---

### PLAN G5: Chat → Canales Automáticos

**Objetivo**: Crear canal de chat automáticamente al crear lead o asignar visita.

**Archivos a modificar**:
- `apps/admin/src/lib/chat.ts` — Función `createChannelForEntity(type, entityId)`
- `apps/admin/src/lib/leads.api.ts` — Al crear lead → crear canal "Lead: Nombre"
- `apps/admin/src/lib/visits.api.ts` — Al crear visita → crear canal "Visita: Propiedad"
- `apps/admin/src/pages/ChatPage.tsx` — Filtros por tipo de canal

**Flujo**:
1. Lead se crea → `createChannel('lead', leadId, leadName)` → auto-agregar agente asignado
2. Visita se crea → `createChannel('visit', visitId, propertyName)` → auto-agregar agente
3. Al asignar agente a lead → agregar como participante al canal del lead
4. En ChatPage, filtros: "Mis canales", "Leads", "Visitas", "Propiedades"

**SQL**: No requiere nueva migración (tipos `chat_channel_type` ya incluyen 'lead' y 'property')

---

### PLAN G6: Owner ↔ Comunicaciones WhatsApp

**Objetivo**: Registrar comunicaciones WhatsApp reales (no solo entry manual).

**Archivos a modificar**:
- `apps/admin/src/pages/CommunicationsPage.tsx` — Botón "Enviar WhatsApp" que abra wa.me
- `apps/admin/src/lib/owners/owners.ts` — Auto-registrar comunicaciones outbound
- `apps/admin/src/components/owners/WhatsAppButton.tsx` — Componente reutilizable

**Flujo**:
1. Click "Enviar WhatsApp" → abrir `wa.me/<phone>?text=<template>`
2. Después de enviar → mostrar toast "¿Mensaje enviado?" → registrar en `owner_communications`
3. Auto-set: `type = 'whatsapp'`, `status = 'sent'`, `sent_at = now()`
4. Plantillas predefinidas: "Seguimiento", "Visita confirmada", "Actualización precio"

**SQL**: No requiere nueva migración

---

### PLAN G7: Valuations → Property Price Sync

**Objetivo**: Al finalizar tasación, actualizar precio estimado en la propiedad.

**Archivos a modificar**:
- Nueva migración SQL (trigger)
- `apps/admin/src/lib/valuationApi.ts` — Ya llama a `property_valuations`, verificar sync

**SQL (nueva migración 0069)**:
```sql
-- Trigger: al finalizar tasación, actualizar property.price con el valor estimado
CREATE OR REPLACE FUNCTION sync_property_price_from_valuation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'finalized' AND OLD.status != 'finalized' THEN
        UPDATE properties
        SET price = NEW.estimated_value,
            updated_at = now()
        WHERE id = NEW.property_id
          AND NEW.estimated_value IS NOT NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_valuation_price
    AFTER UPDATE ON property_valuations
    FOR EACH ROW
    EXECUTE FUNCTION sync_property_price_from_valuation();
```

---

### PLAN G8: Trash Unificado

**Objetivo**: Asegurar que todas las entidades críticas tengan soft-delete y恢复.

**Entidades SIN soft-delete actual**:
- `property_valuations` — Sin `deleted_at`
- `property_price_analyses` — Sin `deleted_at`
- `owner_communications` — Sin `deleted_at`
- `owner_reports` — Sin `deleted_at`
- `valuation_comparables` — Sin `deleted_at`

**SQL (nueva migración 0070)**:
```sql
ALTER TABLE property_valuations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE property_price_analyses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE owner_communications ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE owner_reports ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE valuation_comparables ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Policies para soft delete
CREATE POLICY "staff trash property_valuations"
    ON property_valuations FOR SELECT
    USING (is_staff() OR deleted_at IS NULL);

CREATE POLICY "staff trash property_price_analyses"
    ON property_price_analyses FOR SELECT
    USING (is_staff() OR deleted_at IS NULL);
```

**Archivos a modificar**:
- `apps/admin/src/pages/TrashPage.tsx` — Agregar tabs: "Tasaciones", "Análisis de Precio", "Comunicaciones"
- `apps/admin/src/lib/valuationApi.ts` — Soft delete / restore functions
- `apps/admin/src/lib/owners/owners.ts` — Soft delete para communications y reports

---

### PLAN G9: Dashboard Unificado

**Objetivo**: Dashboard que muestre métricas de TODOS los módulos.

**Archivos a modificar**:
- `apps/admin/src/pages/Dashboard.tsx` — Reescribir con métricas multi-módulo
- `apps/admin/src/components/DashboardCharts.tsx` — Agregar charts de visitas, ML, owners

**Métricas a agregar**:
| Módulo | KPI | Chart |
|--------|-----|-------|
| **Visits** | Visitas hoy/sem/mes, tasa completada | Línea temporal |
| **ML** | Publicaciones activas, sync pendientes, errores | Barras por status |
| **Owners** | Propietarios activos, comunicaciones mes | Donut tipos |
| **Chat** | Mensajes hoy, canales activos | Sparkline |
| **Valuations** | Tasaciones mes, valor total estimado | Timeline |
| **Action Plans** | Planes activos, tareas pendientes | Progress bars |

**SQL**: No requiere migración (RPCs o queries directas)

---

### PLAN G10: Retención Automática Trash

**Objetivo**: Asegurar que `process-retention-policies` se ejecute regularmente.

**Archivos a modificar**:
- `supabase/migrations/0071_retention_cron.sql` — Cron job para ejecutar la función
- `supabase/functions/process-retention-policies/index.ts` — Verificar que funciona correctamente

**SQL (nueva migración 0071)**:
```sql
-- Cron para procesar retención de papelera cada lunes a las 3am
SELECT cron.schedule(
    'trash-retention-weekly',
    '0 3 * * 1',
    $$SELECT net.http_post(
        url := current_setting('app.settings.supabase_url') || '/functions/v1/process-retention-policies',
        headers := '{"Authorization": "Bearer " || current_setting('app.settings.service_role_key')}'
    )$$
);
```

---

## 📦 MIGRACIONES NECESARIAS (Consolidadas)

| # | Archivo | Descripción | Gaps cubiertos |
|---|---------|-------------|----------------|
| **0068** | `0068_agent_property_assignments.sql` | Tabla `agent_property_assignments` | G4 |
| **0069** | `0069_valuation_price_sync.sql` | Trigger sync precio tasación → propiedad | G7 |
| **0070** | `0070_unified_soft_delete.sql` | Soft delete en 5 tablas faltantes | G8 |
| **0071** | `0071_trash_retention_cron.sql` | Cron retención papelera | G10 |
| **0072** | `0072_ml_auto_sync_flags.sql` | Flags auto-sync ML en properties/site_settings | PLAN_ML FASE 2 |

---

## 🗓️ ORDEN DE EJECUCIÓN RECOMENDADO

### Semana 1: SQL + Backend
1. **0068** — Agent↔Property assignments (G4)
2. **0069** — Valuation price sync (G7)
3. **0070** — Unified soft delete (G8)
4. **0071** — Trash retention cron (G10)
5. **0072** — ML auto sync flags (ML Plan Fase 2)
6. **G1** — Leads → Visitas automáticas
7. **G3** — Visita → Sync lead status

### Semana 2: Integración Frontend
8. **G2** — Auto-asignación inteligente
9. **G5** — Chat canales automáticos
10. **G6** — Owner WhatsApp integration
11. **G9** — Dashboard unificado
12. **ML Plan Fase 1** — UI unificada en Properties

### Semana 3: ML Integration + Polish
13. **ML Plan Fase 3** — Import ML → Properties
14. **ML Plan Fase 4** — Config defaults
15. **ML Plan Fase 5** — Observabilidad
16. **Testing E2E** de todas las integraciones
17. **SQL consolidation** — Unificar 67+7 = 74 migraciones en schema limpio

### Semana 4: Production Reset
18. Revisar y limpiar todas las migraciones
19. Drop all tables en Supabase cloud
20. Re-aplicar migraciones consolidadas
21. Verificación final E2E
22. Deploy

---

*Documento vivo — actualizar conforme se implemente*
