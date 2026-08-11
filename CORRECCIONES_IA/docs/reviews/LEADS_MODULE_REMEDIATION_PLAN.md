# Plan de Remediación Completa — Módulo Leads Pipeline

**Objetivo:** Llevar el módulo Leads de **~85% funcional → 100% production-ready** con scoring avanzado, assignment rules, automatizaciones, testing completo y observabilidad.

---

## 📍 Estado Actual (Resumen)

| Área | % Completo | Bloqueadores para 100% |
|------|------------|------------------------|
| CRUD Core | 95% | Soft-delete/restore OK, pero sin audit trail detallado |
| Pipeline UI (Kanban + Table) | 90% | Filtros client-side only, sin saved views |
| Scoring Engine | 80% | Reglas hardcoded, no configurables, sin ML |
| Auto-assignment | 75% | Round-robin simple, sin workload balancing real |
| Import/Export CSV | 90% | Validación básica, sin dedup, sin preview avanzado |
| Landing Integration | 85% | Contact form → lead, pero sin deduplicación email/phone |
| WhatsApp Integration | 70% | Solo link directo, sin templates, sin tracking |
| Tags System | 80% | CRUD básico, sin tag groups, sin autocomplete |
| **Type Safety** | **75%** | `LeadPatch` parcial, `any` en CSV parsing, `as LeadStatus` casts |
| **Testing** | **10%** | Solo 1 test (`leads.test.ts` para CSV), sin integration/E2E |
| **Observabilidad** | **50%** | Logs básicos, sin métricas pipeline, sin alertas SLA |
| **Performance** | **75%** | Client-side filtering en 1000+ leads, kanban render pesado |

---

## 🎯 Criterios de Aceptación — "100% Funcional"

### ✅ Pipeline & Kanban
- [ ] Kanban con drag-drop nativo (HTML5) + persistencia orden
- [ ] Saved views/filters por usuario (filtros guardados)
- [ ] WIP limits por columna (configurables)
- [ ] Quick actions en tarjeta: call, WhatsApp, email, note, task
- [ ] Columnas personalizables (add/remove/reorder statuses)

### ✅ Scoring Engine Avanzado
- [ ] Reglas configurables via Admin UI (no hardcoded)
- [ ] Factores: intent, source, message length, phone, city, property interest, response time
- [ ] Score decay over time (leads fríos bajan score)
- [ ] ML-based scoring opcional (historial entrenado)
- [ ] Score breakdown visible en LeadDetail (por qué 73 pts)

### ✅ Auto-Assignment Inteligente
- [ ] Workload balancing real (leads activos por agente, no total count)
- [ ] Skill matching (agent specialties vs lead intent)
- [ ] Geographic matching (agent zone vs lead city)
- [ ] Round-robin con pesos configurables
- [ ] Assignment rules: "si score > 70 → senior agent"

### ✅ Comunicación & Tracking
- [ ] WhatsApp Business API integration (templates, tracking delivery/read)
- [ ] Email templates con variables (lead name, property, agent)
- [ ] Activity timeline automático (status changes, notes, calls, emails)
- [ ] SLA tracking: "primer contacto < 2h", "propuesta < 24h"
- [ ] Reminders automáticos para leads estancados

### ✅ Import/Export & Deduplicación
- [ ] CSV import con preview, dedup por email+phone, merge conflicts UI
- [ ] Export con filtros aplicados + columnas seleccionables
- [ ] Scheduled imports (daily/weekly from external sources)
- [ ] Duplicate detection: mismo email/phone en últimos 30 días → merge o flag

### ✅ Landing Integration
- [ ] Contact form → lead con deduplicación (email/phone existing)
- [ ] Property interest tracking (utm_source, property_id referrer)
- [ ] Lead source attribution completa (landing_form, whatsapp, ml_contacto, etc.)
- [ ] Auto-reply configurable per source/intent

### ✅ Type Safety (Strict)
- [ ] **Cero `any`** en `leads.ts`, `leads.api.ts`, `LeadsPage.tsx`, `LeadDetailPage.tsx`
- [ ] **Cero casts `as LeadStatus`** — Zod schemas para LeadPatch, LeadFormValues
- [ ] `LeadPatch` tipado estricto (no `Partial<LeadFormValues>`)

### ✅ Testing (Cobertura Mínima)
| Tipo | Cobertura | Archivos Objetivo |
|------|-----------|-------------------|
| Unit | **80%** | scoring, assignment, CSV parsing, tags, dedup |
| Integration | **50%** | create→auto-assign→score, status flow, bulk ops |
| E2E | **4 flujos** | Lead lifecycle, Kanban drag-drop, Import dedup, WhatsApp click |
| Contract | **100%** | CSV schema, scoring rules config |

### ✅ Observabilidad
- [ ] Métricas: `leads_created_total`, `leads_by_status`, `lead_score_distribution`, `assignment_latency_ms`, `sla_breach_count`
- [ ] Dashboard: Pipeline funnel, conversion rates, agent workload, SLA compliance
- [ ] Alertas: SLA breach > 2h, leads sin asignar > 24h, score decay alert
- [ ] Structured logs: lead_id, action, from_status, to_status, agent_id, duration_ms

---

## 📋 Plan de Trabajo Priorizado

### FASE 1 — CRÍTICO (Fundamentos) — **~4 días**

#### 1.1 Zod Schemas + Type Safety
**Archivo nuevo:** `supabase/functions/_shared/leads-validation.ts`
```typescript
import { z } from 'zod';

export const LeadStatusSchema = z.enum([
    'nuevo', 'contactado', 'calificado', 'en_proceso', 'cerrado_ganado', 'cerrado_perdido'
]);
export const LeadIntentSchema = z.enum([
    'comprar', 'vender', 'alquilar', 'invertir', 'tasar', 'desarrollador', 'otro'
]);
export const LeadSourceSchema = z.enum([
    'landing_form', 'whatsapp', 'telefono', 'email', 'referido', 'ml_contacto', 'manual'
]);

export const LeadFormSchema = z.object({
    name: z.string().min(1, 'Nombre requerido').max(50),
    last_name: z.string().min(1, 'Apellido requerido').max(50),
    email: z.string().email('Email inválido'),
    phone: z.string().regex(/^[\d\s\-\+\(\)]{10,}$/, 'Teléfono inválido').optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    intent: LeadIntentSchema,
    source: LeadSourceSchema,
    status: LeadStatusSchema.default('nuevo'),
    assigned_to: z.string().uuid().optional().nullable(),
    message: z.string().max(2000).optional().nullable(),
});

export const LeadPatchSchema = z.object({
    status: LeadStatusSchema.optional(),
    notes: z.string().max(5000).optional().nullable(),
    assigned_to: z.string().uuid().optional().nullable(),
    phone: z.string().regex(/^[\d\s\-\+\(\)]{10,}$/, 'Teléfono inválido').optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    tags: z.array(z.string().max(30)).max(10).optional(),
    score: z.number().int().min(0).max(100).optional(),
}).strict(); // No permite campos extra

export const CsvLeadRowSchema = z.object({
    name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    city: z.string().optional(),
    intent: LeadIntentSchema,
    source: LeadSourceSchema,
    status: LeadStatusSchema.optional().default('nuevo'),
    message: z.string().optional(),
});
```

**Uso en `leads.ts` y `leads.api.ts`:** Validar `createLead`, `updateLead`, `importLeadsFromCsv`, mutations.

#### 1.2 Deduplicación Landing → Leads
**En `contact-submit/index.ts` — antes de insert:**
```typescript
// Check existing lead by email OR phone (últimos 30 días)
const { data: existing } = await supabase
    .from('leads')
    .select('id, status, created_at')
    .or(`email.eq.${payload.email},phone.eq.${payload.phone}`)
    .gte('created_at', new Date(Date.now() - 30*24*60*60*1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(1);

if (existing?.[0]) {
    // Update existing lead: add message, update source if higher intent
    await supabase.from('leads').update({
        message: existing[0].message + '\n\n---\n' + payload.message,
        source: payload.source, // Keep original or upgrade
        updated_at: new Date().toISOString(),
        metadata: { ...existing[0].metadata, last_contact_ip: ip }
    }).eq('id', existing[0].id);
    
    // Return success without creating duplicate
    return new Response(JSON.stringify({ ok: true, lead_id: existing[0].id, deduplicated: true }), ...);
}
```

#### 1.3 Scoring Engine Configurable (DB + UI)
**Migración:** `supabase/migrations/0042_lead_scoring_rules.sql`
```sql
CREATE TABLE lead_scoring_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    factor text NOT NULL, -- 'intent', 'source', 'message_length', 'phone', 'city', 'property_interest', 'response_time'
    condition jsonb NOT NULL, -- { operator: 'eq', value: 'comprar' }
    points int NOT NULL, -- positive or negative
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Seed default rules (matching current calculateLeadScore)
INSERT INTO lead_scoring_rules (name, factor, condition, points) VALUES
('Intent: Comprar', 'intent', '{"operator": "eq", "value": "comprar"}', 30),
('Intent: Vender', 'intent', '{"operator": "eq", "value": "vender"}', 25),
('Source: WhatsApp', 'source', '{"operator": "eq", "value": "whatsapp"}', 20),
('Source: Teléfono', 'source', '{"operator": "eq", "value": "telefono"}', 25),
('Source: Referido', 'source', '{"operator": "eq", "value": "referido"}', 30),
('Message > 50 chars', 'message_length', '{"operator": "gt", "value": 50}', 10),
('Message > 20 chars', 'message_length', '{"operator": "gt", "value": 20}', 5),
('Has Phone', 'phone', '{"operator": "exists"}', 10),
('Has City', 'city', '{"operator": "exists"}', 5);
```

**En `leads.ts` — `calculateLeadScore` dinámico:**
```typescript
export async function calculateLeadScore(lead: LeadScoreInput): Promise<number> {
    const { data: rules } = await supabase
        .from('lead_scoring_rules')
        .select('factor, condition, points')
        .eq('is_active', true);

    let score = 0;
    for (const rule of rules ?? []) {
        if (evaluateCondition(lead, rule.factor, rule.condition)) {
            score += rule.points;
        }
    }
    return Math.min(score, 100);
}

function evaluateCondition(lead: LeadScoreInput, factor: string, condition: any): boolean {
    const value = lead[factor];
    switch (condition.operator) {
        case 'eq': return value === condition.value;
        case 'gt': return (value?.length ?? 0) > condition.value;
        case 'exists': return !!value && value.length > 0;
        default: return false;
    }
}
```

**Admin UI:** `ConfigPage` → pestaña "Scoring Rules" con tabla CRUD (factor, condition JSON, points).

#### 1.4 Structured Logging + Basic Metrics
**Archivo nuevo:** `supabase/functions/_shared/leads-logger.ts`
```typescript
interface LeadLogEntry {
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    action: 'created' | 'updated' | 'status_changed' | 'assigned' | 'scored' | 'imported' | 'deleted';
    lead_id: string;
    from_status?: string;
    to_status?: string;
    agent_id?: string;
    score?: number;
    duration_ms?: number;
    metadata?: Record<string, unknown>;
}

export function logLeadAction(entry: Omit<LeadLogEntry, 'timestamp' | 'level'>): void {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', ...entry }));
}
```

**Aplicar en `leads.ts` mutaciones:**
```typescript
const start = Date.now();
await updateLead(...);
logLeadAction({
    action: 'status_changed',
    lead_id: id,
    from_status: oldStatus,
    to_status: status,
    duration_ms: Date.now() - start,
});
```

---

### FASE 2 — ALTO (Pipeline Features) — **~5 días**

#### 2.1 Kanban Drag-Drop + Persistencia Orden
**En `LeadsPage.tsx` — usar `@dnd-kit` o HTML5 nativo mejorado:**
```typescript
// Estado: columnOrder: Record<LeadStatus, string[]> (lead IDs ordenados)
// On drag end: updateLeadOrder(column, newOrder) → RPC batch update positions

// Migración: agregar `kanban_position` int a leads
ALTER TABLE leads ADD COLUMN kanban_position int DEFAULT 0;
```

#### 2.2 Auto-Assignment Inteligente
**En `leads.ts` — `getNextAgentForAssignment` mejorado:**
```typescript
export async function getNextAgentForAssignment(lead?: { intent: LeadIntent; city?: string }): Promise<AgentOption | null> {
    // 1. Filtrar agentes activos con specialties matching lead.intent
    // 2. Filtrar por zone matching lead.city
    // 3. Calcular workload: COUNT(leads) WHERE assigned_to=agent AND status IN ('nuevo','contactado','calificado','en_proceso')
    // 4. Score = (1 / (workload + 1)) * specialty_match * zone_match
    // 5. Return agent con mayor score
}
```

**Reglas configurables:** `assignment_rules` table (skill_weight, zone_weight, max_workload).

#### 2.3 WhatsApp Business API Integration
**Edge Function nueva:** `supabase/functions/whatsapp-send/index.ts`
```typescript
// Meta WhatsApp Cloud API
// Templates: lead_new, lead_followup, proposal_sent, appointment_reminder
// Tracking: message_id, status (sent/delivered/read/failed), webhook updates
```

**En `LeadDetailPage.tsx` — botón WhatsApp mejorado:**
```tsx
const handleWhatsApp = async (template: 'lead_new' | 'followup' | 'proposal') => {
    const res = await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: cleanPhone, template, variables: { name: lead.name, property: lead.property_title } }),
    });
    // Log en lead_communications
};
```

#### 2.4 Activity Timeline Automático
**Migración:** `supabase/migrations/0043_lead_activity.sql`
```sql
CREATE TABLE lead_activity (
    id bigserial PRIMARY KEY,
    lead_id uuid REFERENCES leads(id),
    action text NOT NULL, -- 'status_change', 'note_added', 'assigned', 'call_made', 'email_sent', 'whatsapp_sent', 'score_changed'
    from_value text,
    to_value text,
    agent_id uuid REFERENCES admin_users(id),
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_lead_activity_lead ON lead_activity(lead_id, created_at DESC);
```

**Trigger en `leads` UPDATE:** Auto-insert en `lead_activity` para status, assigned_to, score, notes changes.

#### 2.5 SLA Tracking & Alertas
**Config:** `sla_rules` table (status, max_hours, escalation_agent).
**Cron job:** `check-sla-breaches` cada 15 min → alert Slack/Sentry si lead en status > max_hours sin actividad.

---

### FASE 3 — MEDIO (Polish & Scale) — **~3 días**

#### 3.1 Import/Export Avanzado
- CSV Import: dedup preview (email/phone), conflict resolution UI (merge/update/skip)
- Export: column picker, filtered export, scheduled exports (email daily digest)

#### 3.2 Saved Views / Filters
- User-specific saved filter sets (name, filters, columns, sort)
- Default view per role

#### 3.3 Lead Detail Enhancements
- Property interest carousel (si múltiples properties)
- Communication history tab (unifica notes, calls, emails, whatsapps, activity)
- Document upload (contratos, DNI, escrituras) → `lead_documents` table

#### 3.4 Performance Optimizations
- Server-side filtering/pagination (ya en `useLeads` pero mejorar kanban virtualization)
- Virtualized kanban columns (`react-window` equivalent para Preact)
- Debounced search (300ms)

#### 3.5 Landing Form Enhancements
- Multi-step form (progressive disclosure)
- reCAPTCHA v3 invisible
- UTM tracking automático (source, medium, campaign, content, term)

---

## 🧪 Estrategia de Testing Detallada

### Unit Tests (Vitest) — Target: 80%

| Módulo | Funciones | Casos Críticos |
|--------|-----------|----------------|
| `leads.ts` scoring | `calculateLeadScore` (dynamic rules), `recalculateLeadScore` | Rule evaluation, max 100, decay over time |
| `leads.ts` assignment | `getNextAgentForAssignment`, `autoAssignLead`, `bulkAutoAssignLeads` | Workload balancing, skill match, zone match, no agents available |
| `leads.ts` CSV | `parseLeadsCsv`, `importLeadsFromCsv`, `bulkImportLeadsParsed` | Valid/invalid rows, dedup detection, required headers |
| `leads.ts` tags | `addLeadTag`, `removeLeadTag`, `setLeadTags` | Duplicate prevention, case sensitivity, max 10 |
| `leads.ts` CRUD | `createLead`, `updateLead`, `softDeleteLead`, `restoreLead` | Status transitions, assigned_to null handling |
| `validation.ts` | `LeadFormSchema`, `LeadPatchSchema`, `CsvLeadRowSchema` | Valid/edge cases, strict mode rejects extra fields |

### Integration Tests

| Flujo | Verificación |
|-------|--------------|
| Create lead (landing) → auto-score → auto-assign → Kanban appears | Score calculated, agent assigned, lead in correct column |
| Status flow: nuevo → contactado → calificado → en_proceso → ganado | Activity log entries, timestamps, SLA tracking |
| Bulk auto-assign 50 leads → workload balanced | Each agent gets ~equal active leads |
| CSV import with duplicates → dedup preview → merge | Existing leads updated, not duplicated |
| WhatsApp send → webhook delivery status → activity log | Message tracked, status updated |

### E2E Tests (Playwright) — 4 Flujos Críticos

```typescript
// apps/admin/e2e/leads-flows.spec.ts
test('Lead lifecycle: landing form → kanban → won', async ({ page }) => {
    // 1. Landing: fill contact form → submit
    // 2. Admin: /leads → verify lead appears in "nuevo" column
    // 3. Drag to "contactado" → verify activity log
    // 4. Assign to agent → verify assignment
    // 5. Add note, advance through pipeline → "cerrado_ganado"
    // 6. Verify conversion metrics updated
});

test('Kanban drag-drop persists order', async ({ page }) => {
    // 1. Drag lead A above lead B in "calificado"
    // 2. Refresh → verify order persisted
    // 3. Verify kanban_position updated in DB
});

test('CSV import with deduplication', async ({ page }) => {
    // 1. Create lead with email test@example.com
    // 2. Import CSV with same email → preview shows conflict
    // 3. Choose "merge" → verify original lead updated with new message
    // 4. No duplicate created
});

test('WhatsApp click → template sent → tracked', async ({ page }) => {
    // 1. LeadDetailPage → click WhatsApp button
    // 2. Mock WhatsApp API → verify template variables
    // 3. Verify lead_communications entry created
    // 4. Mock webhook delivery → verify status updated
});
```

---

## 📁 Archivos a Crear / Modificar

### Nuevos Archivos
- [ ] `supabase/functions/_shared/leads-validation.ts`
- [ ] `supabase/functions/_shared/leads-logger.ts`
- [ ] `supabase/functions/whatsapp-send/index.ts`
- [ ] `supabase/functions/check-sla-breaches/index.ts` (cron)
- [ ] `supabase/migrations/0042_lead_scoring_rules.sql`
- [ ] `supabase/migrations/0043_lead_activity.sql`
- [ ] `supabase/migrations/0044_lead_documents.sql` (opcional)
- [ ] `apps/admin/src/lib/__tests__/leads.scoring.test.ts`
- [ ] `apps/admin/src/lib/__tests__/leads.assignment.test.ts`
- [ ] `apps/admin/src/lib/__tests__/leads.csv.test.ts`
- [ ] `apps/admin/src/lib/__tests__/leads.tags.test.ts`
- [ ] `apps/admin/src/lib/__tests__/leads.crud.test.ts`
- [ ] `apps/admin/src/lib/__tests__/validation.test.ts`
- [ ] `apps/admin/src/test/integration/leads-pipeline.test.ts`
- [ ] `apps/admin/e2e/leads-flows.spec.ts`
- [ ] `apps/admin/src/pages/ConfigPage.tsx` — scoring rules tab
- [ ] `apps/admin/src/components/LeadActivityTimeline.tsx`

### Archivos a Modificar
- [ ] `apps/admin/src/lib/leads.ts` — dynamic scoring, smart assignment, dedup helpers, structured logging
- [ ] `apps/admin/src/lib/leads.api.ts` — Zod validation en mutations, new hooks
- [ ] `apps/admin/src/pages/LeadsPage.tsx` — kanban drag-drop, saved views, virtualization
- [ ] `apps/admin/src/pages/LeadDetailPage.tsx` — WhatsApp templates, activity timeline, property carousel
- [ ] `supabase/functions/contact-submit/index.ts` — deduplication logic
- [ ] `apps/landing/src/components/Contact.tsx` — UTM tracking, reCAPTCHA
- [ ] `apps/admin/src/lib/supabase.ts` — `callRpc` type-safe

---

## 🚀 Comandos de Validación

```bash
# TypeCheck
pnpm typecheck

# Unit tests coverage ≥ 80%
pnpm test -- --coverage

# Integration tests
pnpm dlx supabase start
pnpm test:integration -- --filter=leads-pipeline

# E2E tests
pnpm build
pnpm test:e2e -- --project=chromium --grep="Lead Critical"

# Visual regression (kanban + detail)
pnpm test:visual -- --filter="LeadsPage,LeadDetailPage"
```

---

## 📊 Métricas de Éxito (KPIs)

| KPI | Baseline | Target | Medición |
|-----|----------|--------|----------|
| Lead creation → first contact | ~4h | **<2h** | SLA dashboard |
| Auto-assignment latency | ~500ms | **<200ms** | Structured logs |
| CSV import 1000 rows | ~30s | **<10s** | Batch insert + async |
| Kanban drag-drop persist | ~800ms | **<200ms** | RPC duration |
| TypeScript errors (leads) | ~12 | **0** | `pnpm typecheck` |
| Test coverage (leads lib) | 10% | **≥80%** | Vitest coverage |
| E2E pass rate | N/A | **100% (4 flujos)** | Playwright report |
| Duplicate leads (landing) | ~5% | **<0.5%** | Deduplication rate |
| SLA compliance | ~60% | **>90%** | SLA dashboard |

---

## 📅 Cronograma (2 semanas / 1 ingeniero)

| Semana | Días | Entregables |
|--------|------|-------------|
| 1 | 1-2 | Zod schemas, deduplication landing, dynamic scoring DB+UI |
| 1 | 3-4 | Structured logging, auto-assignment smart, WhatsApp Edge Function |
| 1 | 5 | Activity timeline, SLA tracking, basic metrics |
| 2 | 1-2 | Kanban drag-drop persist, saved views, virtualization |
| 2 | 3 | Import/export advanced, dedup preview, conflict UI |
| 2 | 4 | Unit tests (80%), Integration tests |
| 2 | 5 | E2E 4 flujos, visual regression, performance tuning |

---

## ⚠️ Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| WhatsApp Business API approval delay | Alta | Medio | Desarrollar con mock, templates pre-aprobados |
| Scoring rules UI complexity | Media | Bajo | Empezar simple (JSON editor), iterar |
| Kanban drag-drop en mobile | Media | Medio | Testear temprano, fallback click-to-move |
| SLA cron job load en miles de leads | Baja | Alto | Índices compuestos, batch processing |
| Meta API rate limits WhatsApp | Media | Medio | Queue local + retry exponencial |

---

## ✅ Definition of Done

### Fase 1 Done When:
- [ ] Zod schemas validan create/update/import en runtime
- [ ] Landing contact form deduplica leads (email/phone 30 días)
- [ ] Scoring rules en DB + Admin UI CRUD
- [ ] Structured logs en todas mutaciones leads
- [ ] Cero `any` / casts inseguros en leads lib

### Fase 2 Done When:
- [ ] Kanban drag-drop persiste orden (kanban_position)
- [ ] Auto-assignment balancea workload + skills + zones
- [ ] WhatsApp templates funcionales + tracking
- [ ] Activity timeline automático en LeadDetail
- [ ] SLA tracking + alertas configuradas

### Fase 3 Done When:
- [ ] CSV import con dedup preview + merge UI
- [ ] Saved views/filters por usuario
- [ ] Unit tests ≥80%, Integration + E2E 4 flujos pasan
- [ ] Visual regression kanban + detail
- [ ] Code review aprobado + merge a main

---

## 📚 Referencias

- **Meta WhatsApp Business API:** https://developers.facebook.com/docs/whatsapp
- **Zod:** https://zod.dev/
- **@dnd-kit:** https://dndkit.com/ (o HTML5 nativo)
- **Supabase Cron:** https://supabase.com/docs/guides/database/cron-jobs
- **AGENTS.md** — Critical Modules > Leads Pipeline

---

**Documento vivo** — Actualizar conforme se completan tareas. Cada fase PR separado con tests pasando.