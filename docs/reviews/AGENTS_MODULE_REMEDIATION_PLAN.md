# Plan de Remediación Completa — Módulo Agents (Asesores)

**Objetivo:** Llevar el módulo Agents de **~85% funcional → 100% production-ready** con RBAC granular, commission tracking, schedule management, performance metrics y portal del agente.

---

## 📍 Estado Actual (Resumen)

| Área                    | % Completo | Bloqueadores para 100%                                                                   |
| ----------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| CRUD Agentes            | 95%        | Foto, datos personales, matrícula, bio, redes sociales                                   |
| Permisos (RBAC)         | 70%        | 12 permisos booleanos, pero sin roles predefinidos, sin resource-level permissions       |
| Comisiones              | 75%        | % venta/alquiler configurables, pero sin escalas, sin splits, sin liquidación automática |
| Horarios/Disponibilidad | 80%        | Semanal por día, pero sin excepciones (feriados, vacaciones), sin timezone               |
| Performance/Metrics     | 40%        | Solo count leads/visitas, sin conversion rates, sin revenue attribution                  |
| Agent Portal            | 10%        | Solo conceptos, sin login, sin dashboard, sin mobile app                                 |
| **Type Safety**         | **75%**    | `AgentFormValues` completo, pero `any` en permissions/commission/schedule JSON           |
| **Testing**             | **5%**     | Cero tests                                                                               |
| **Observabilidad**      | **30%**    | Logs básicos, sin métricas productividad                                                 |

---

## 🎯 Criterios de Aceptación — "100% Funcional"

### ✅ RBAC Granular (Resource-Level)

- [ ] Roles predefinidos: `Super Admin`, `Admin`, `Staff`, `Agent`, `Viewer`
- [ ] Resource-level permissions: `leads:read:own`, `leads:write:assigned`, `properties:read:all`, `properties:write:own`
- [ ] Permission inheritance (role + overrides individuales)
- [ ] UI: Matrix permisos por recurso/acción, heredados vs override
- [ ] Audit: quién cambió qué permiso, cuándo

### ✅ Comisiones Avanzadas

- [ ] Escalas por tramos: ej. 50% hasta $50k, 60% $50k-$100k, 70% >$100k
- [ ] Splits: co-brokerage (referral % a otro agente)
- [ ] Liquidación automática mensual (cron 1ro cada mes)
- [ ] Estado: `pending` → `approved` → `paid` → `disputed`
- [ ] Comprobante PDF auto-generado por liquidación
- [ ] Historical commission rates (versionado)

### ✅ Horarios + Disponibilidad Inteligente

- [ ] Excepciones: feriados nacionales, vacaciones, licencias
- [ ] Timezone por agente (soporte multi-sucursal)
- [ ] Recurring availability patterns (ej. "todos los martes 14-18")
- [ ] Conflict detection al crear visitas (ya en visits module)
- [ ] Calendar sync: Google/Outlook (ICal export)

### ✅ Performance Dashboard (Agent & Admin)

- [ ] KPIs: leads asignados, contactados, convertidos, revenue, commission earned
- [ ] Conversion funnel: assigned → contacted → qualified → proposal → closed
- [ ] Activity heatmap: calls, emails, whatsapps, visits por día/hora
- [ ] Leaderboard (opcional, gamification)
- [ ] Goal setting: monthly targets (leads, revenue, visits)

### ✅ Agent Portal (Mobile-First)

- [ ] Login: Magic link + PWA installable
- [ ] Dashboard: mis leads, mis visitas, mis comisiones, mis tareas
- [ ] Push notifications: nuevo lead, visita próxima, comisión aprobada
- [ ] Offline-first: cache leads/visitas, sync al conectar
- [ ] Quick actions: llamar, WhatsApp, email, check-in visita

### ✅ Type Safety (Strict)

- [ ] **Cero `any`** en `agents.ts`, `AgentFormPage.tsx`, `AgentsPage.tsx`
- [ ] Zod schemas para `AgentFormValues`, `AgentPermissions`, `AgentCommission`, `AgentSchedule`
- [ ] JSON fields tipados (`permissions: AgentPermissions`, no `Json`)

### ✅ Testing (Cobertura Mínima)

| Tipo        | Cobertura    | Archivos Objetivo                                                    |
| ----------- | ------------ | -------------------------------------------------------------------- |
| Unit        | **80%**      | commission calculation, schedule conflicts, permission matrix        |
| Integration | **50%**      | create agent → assign leads → schedule visits → calculate commission |
| E2E         | **3 flujos** | Agent lifecycle, Commission liquidation, Portal login + dashboard    |

### ✅ Observabilidad

- [ ] Métricas: `agents_created`, `commissions_liquidated`, `visits_completed`, `conversion_rate`, `portal_active_users`
- [ ] Dashboard: Team productivity, individual performance, commission pipeline
- [ ] Alertas: liquidation failed, agent inactive > 7d, target at risk

---

## 📋 Plan de Trabajo Priorizado

### FASE 1 — CRÍTICO (Fundamentos) — **~3 días**

#### 1.1 Zod Schemas + RBAC Resource-Level

**Archivo nuevo:** `supabase/functions/_shared/agents-validation.ts`

```typescript
import { z } from 'zod';

// Permisos tipados (no Json)
export const AgentPermissionsSchema = z.object({
    can_view_leads: z.boolean(),
    can_edit_leads: z.boolean(),
    can_view_properties: z.boolean(),
    can_edit_properties: z.boolean(),
    can_view_visits: z.boolean(),
    can_manage_visits: z.boolean(),
    can_view_ml: z.boolean(),
    can_manage_ml: z.boolean(),
    can_view_reports: z.boolean(),
    can_manage_agents: z.boolean(),
    can_manage_settings: z.boolean(),
});
export type AgentPermissions = z.infer<typeof AgentPermissionsSchema>;

export const AgentCommissionSchema = z.object({
    sale_percentage: z.number().min(0).max(100),
    rental_percentage: z.number().min(0).max(100),
    // Escalas opcionales
    sale_tiers: z
        .array(
            z.object({
                min_amount: z.number().nonnegative(),
                max_amount: z.number().positive().optional(),
                percentage: z.number().min(0).max(100),
            }),
        )
        .optional(),
    rental_tiers: z
        .array(
            z.object({
                min_amount: z.number().nonnegative(),
                max_amount: z.number().positive().optional(),
                percentage: z.number().min(0).max(100),
            }),
        )
        .optional(),
    // Splits
    referral_percentage: z.number().min(0).max(50).default(0),
});
export type AgentCommission = z.infer<typeof AgentCommissionSchema>;

export const AgentScheduleSchema = z.object({
    day_of_week: z.number().int().min(0).max(6),
    start_time: z.string().regex(/^\d{2}:\d{2}$/),
    end_time: z.string().regex(/^\d{2}:\d{2}$/),
    is_available: z.boolean().default(true),
    timezone: z.string().default('America/Argentina/Buenos_Aires'),
    // Excepciones
    exceptions: z
        .array(
            z.object({
                date: z.string().date(), // ISO date
                reason: z.string().optional(), // 'holiday', 'vacation', 'sick'
                available: z.boolean().default(false),
            }),
        )
        .optional(),
});
export type AgentSchedule = z.infer<typeof AgentScheduleSchema>;

export const AgentFormSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    phone: z
        .string()
        .regex(/^[\d\s\-\+\(\)]{10,}$/)
        .optional()
        .nullable(),
    matricula: z.string().max(50).optional().nullable(),
    role: z.string().max(50).optional().nullable(),
    bio: z.string().max(1000).optional().nullable(),
    specialties: z.string().max(500).optional().nullable(),
    linkedin: z.string().url().optional().nullable(),
    instagram: z.string().url().optional().nullable(),
    whatsapp: z.string().url().optional().nullable(),
    is_active: z.boolean().default(true),
    sort_order: z.number().int().default(0),
    photo_url: z.string().url().optional().nullable(),
    permissions: AgentPermissionsSchema,
    commission: AgentCommissionSchema,
    schedule: z.array(AgentScheduleSchema),
    timezone: z.string().default('America/Argentina/Buenos_Aires'),
});
```

**En `agents.ts` — validación de permisos:**

```typescript
// Helper: verificar permiso
export function hasPermission(agent: AgentRow, resource: string, action: string): boolean {
    const permKey = `can_${action}_${resource}` as keyof AgentPermissions;
    return agent.permissions?.[permKey] ?? false;
}

// Middleware para edge functions
export async function requirePermission(
    userId: string,
    resource: string,
    action: string,
): Promise<boolean> {
    const { data: agent } = await supabase
        .from('agents')
        .select('permissions')
        .eq('id', userId)
        .single();
    return hasPermission(agent, resource, action);
}
```

#### 1.2 Commission Liquidation Engine

**Migración:** `supabase/migrations/0051_agent_commissions_liquidation.sql`

```sql
CREATE TABLE agent_commission_liquidations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id uuid REFERENCES agents(id),
    period_start date NOT NULL,
    period_end date NOT NULL,
    status text NOT NULL CHECK (status IN ('draft', 'pending_approval', 'approved', 'paid', 'disputed')),
    -- Totales
    total_sales_revenue numeric(15,2) DEFAULT 0,
    total_rental_revenue numeric(15,2) DEFAULT 0,
    total_commission numeric(15,2) DEFAULT 0,
    -- Detalle
    sales_count int DEFAULT 0,
    rental_count int DEFAULT 0,
    -- Referencias
    deal_ids uuid[], -- leads/visits/orders que generaron comisión
    -- Metadatos
    calculated_at timestamptz DEFAULT now(),
    approved_at timestamptz,
    approved_by uuid REFERENCES admin_users(id),
    paid_at timestamptz,
    pdf_url text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_commission_liquidations_agent ON agent_commission_liquidations(agent_id, period_start);
```

**Edge Function:** `supabase/functions/agent-commission-liquidate/index.ts` (Cron 1ro cada mes 02:00)

```typescript
async function calculateLiquidation(
    agentId: string,
    periodStart: Date,
    periodEnd: Date,
): Promise<LiquidationData> {
    // 1. Obtener deals cerrados en período (leads status=cerrado_ganado, visits=completada, orders=delivered)
    const deals = await getClosedDeals(agentId, periodStart, periodEnd);

    // 2. Calcular comisión por deal usando escalas (tiers)
    let totalCommission = 0;
    for (const deal of deals) {
        const rate = getCommissionRate(agent.commission, deal.type, deal.amount);
        totalCommission += (deal.amount * rate) / 100;
        // Aplicar referral split si existe
        if (deal.referred_by) {
            totalCommission -= (deal.amount * agent.commission.referral_percentage) / 100;
        }
    }

    return {
        total_sales_revenue: salesRevenue,
        total_rental_revenue: rentalRevenue,
        total_commission: totalCommission,
        sales_count: salesDeals.length,
        rental_count: rentalDeals.length,
        deal_ids: deals.map((d) => d.id),
    };
}

// Generar PDF
async function generateLiquidationPDF(liquidation: LiquidationData): Promise<string> {
    // Puppeteer → HTML template → PDF → Storage
}
```

#### 1.3 Schedule Exceptions + Timezone

**En `agents.ts` — `AgentSchedule` extendido:**

```typescript
// Validar disponibilidad considerando excepciones
export async function isAgentAvailable(agentId: string, dateTime: Date): Promise<boolean> {
    const { data: schedule } = await supabase
        .from('agent_availability')
        .select('*')
        .eq('agent_id', agentId)
        .eq('is_active', true);

    const dayOfWeek = dateTime.getDay();
    const timeStr = dateTime.toTimeString().slice(0, 5);
    const dateStr = dateTime.toISOString().split('T')[0];

    // 1. Check exceptions first
    const exception = schedule.find((s) => s.exceptions?.some((e) => e.date === dateStr));
    if (exception) return exception.available;

    // 2. Check regular schedule
    const slot = schedule.find((s) => s.day_of_week === dayOfWeek && s.is_available);
    if (!slot) return false;

    return slot.start_time <= timeStr && slot.end_time >= timeStr;
}
```

---

### FASE 2 — ALTO (Performance + Portal) — **~4 días**

#### 2.1 Performance Dashboard (Admin + Agent)

**En `AgentsPage.tsx` — tabs por agente:**

```tsx
const AgentPerformanceTab = ({ agentId }: { agentId: string }) => {
    const { data: metrics } = useQuery({
        queryKey: ['agent-performance', agentId],
        queryFn: () => fetchAgentPerformance(agentId),
    });

    return (
        <div className="grid grid-cols-4 gap-4">
            <StatCard label="Leads Asignados" value={metrics?.assigned_leads} />
            <StatCard label="Contactados" value={metrics?.contacted_leads} />
            <StatCard label="Convertidos" value={metrics?.converted_leads} />
            <StatCard label="Revenue" value={formatCurrency(metrics?.revenue)} />
            <StatCard label="Comisión" value={formatCurrency(metrics?.commission)} />
            <StatCard label="Visitas" value={metrics?.visits_completed} />
            <StatCard label="Conversion %" value={`${metrics?.conversion_rate}%`} />
            <StatCard label="Avg Days to Close" value={metrics?.avg_days_to_close} />
        </div>
    );
};
```

**Metrics Edge Function:** `supabase/functions/agent-performance-metrics/index.ts`

```typescript
async function fetchAgentPerformance(agentId: string, from: Date, to: Date) {
    // Queries paralelas para todos los KPIs
    const [leads, visits, deals, commissions] = await Promise.all([
        supabase
            .from('leads')
            .select('status, created_at, assigned_at')
            .eq('assigned_to', agentId)
            .gte('created_at', from)
            .lte('created_at', to),
        supabase
            .from('visits')
            .select('status, starts_at, completed_at')
            .eq('agent_id', agentId)
            .gte('starts_at', from)
            .lte('starts_at', to),
        supabase
            .from('leads')
            .select('price, status, closed_at')
            .eq('assigned_to', agentId)
            .in('status', ['cerrado_ganado'])
            .gte('closed_at', from)
            .lte('closed_at', to),
        supabase
            .from('agent_commission_liquidations')
            .select('total_commission')
            .eq('agent_id', agentId)
            .gte('period_start', from)
            .lte('period_end', to),
    ]);
    // Calcular KPIs...
}
```

#### 2.2 Agent Portal (PWA + Magic Link)

**Edge Function:** `supabase/functions/agent-portal-auth/index.ts`

```typescript
// Magic link login (igual que owner portal)
async function createAgentMagicLink(agentId: string): Promise<string> {
    const { data: agent } = await supabase
        .from('agents')
        .select('email, name')
        .eq('id', agentId)
        .single();
    const { data: link } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: agent.email,
        options: { redirectTo: `${ADMIN_BASE_URL}/agent-portal` },
    });
    // Enviar email + WhatsApp
    return link.properties?.action_link ?? '';
}
```

**Portal Pages (`/agent-portal`):**

```tsx
// PWA Manifest + Service Worker
// Pages: Dashboard, Mis Leads, Mis Visitas, Mis Comisiones, Perfil
// Features:
// - Offline cache (IndexedDB) para leads/visitas
// - Push notifications (nuevo lead, visita en 1h, comisión aprobada)
// - Quick actions: Llamar, WhatsApp, Check-in QR
// - Dark mode, responsive mobile-first
```

#### 2.3 Calendar Sync (ICal Export)

**Edge Function:** `supabase/functions/agent-calendar-export/index.ts`

```typescript
export function generateICalendar(visits: VisitRow[]): string {
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//BIENENHAUS//Agent Calendar//ES',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
    ];

    for (const visit of visits) {
        lines.push(
            'BEGIN:VEVENT',
            `UID:${visit.id}@bienenhaus.com`,
            `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
            `DTSTART:${formatDateForICal(visit.starts_at)}`,
            `DTEND:${formatDateForICal(visit.ends_at)}`,
            `SUMMARY:${visit.title}`,
            `DESCRIPTION:${visit.description ?? ''}\\nLead: ${visit.lead_name}\\nProperty: ${visit.property_title}`,
            `LOCATION:${visit.location ?? ''}`,
            'END:VEVENT',
        );
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
}
```

---

### FASE 3 — MEDIO (Polish) — **~2 días**

#### 3.1 Testing

- Unit: commission tiers calculation, schedule availability with exceptions, permission matrix
- Integration: create agent → assign leads → schedule visits → liquidate commission → PDF
- E2E: Agent lifecycle, Commission liquidation, Portal login + dashboard

#### 3.2 Observabilidad

- Metrics: agents_created, commissions_liquidated, visits_completed, conversion_rate, portal_active_users
- Dashboard: Team productivity, individual performance, commission pipeline
- Alertas: liquidation failed, agent inactive > 7d, target at risk (< 80% monthly goal)

---

## 📁 Archivos a Crear / Modificar

### Nuevos

- [ ] `supabase/functions/_shared/agents-validation.ts`
- [ ] `supabase/functions/agent-commission-liquidate/index.ts`
- [ ] `supabase/functions/agent-performance-metrics/index.ts`
- [ ] `supabase/functions/agent-portal-auth/index.ts`
- [ ] `supabase/functions/agent-calendar-export/index.ts`
- [ ] `supabase/migrations/0051_agent_commissions_liquidation.sql`
- [ ] `supabase/migrations/0052_agent_performance_views.sql` (materialized views)
- [ ] `apps/admin/src/lib/__tests__/agents.commissions.test.ts`
- [ ] `apps/admin/src/lib/__tests__/agents.schedule.test.ts`
- [ ] `apps/admin/src/lib/__tests__/agents.permissions.test.ts`
- [ ] `apps/admin/e2e/agents-flows.spec.ts`
- [ ] `apps/admin/src/pages/AgentPortal/` (PWA pages)

### Modificar

- [ ] `apps/admin/src/lib/agents.ts` — Zod schemas, commission engine, schedule exceptions, performance queries
- [ ] `apps/admin/src/lib/agents.api.ts` — hooks para liquidations, performance, portal
- [ ] `apps/admin/src/pages/AgentFormPage.tsx` — commission tiers UI, schedule exceptions, timezone
- [ ] `apps/admin/src/pages/AgentsPage.tsx` — performance tab, bulk liquidation
- [ ] `apps/admin/src/pages/AgentPortal/` — PWA pages

---

## 📊 Métricas de Éxito

| KPI                             | Baseline    | Target              |
| ------------------------------- | ----------- | ------------------- |
| Commission calculation accuracy | Manual      | **100% (auto)**     |
| Liquidation generation time     | ~30 min/mes | **<2 min (auto)**   |
| Agent portal adoption           | 0%          | **>80% en 30 días** |
| Schedule conflict detection     | Manual      | **100% auto**       |
| TypeScript errors               | ~10         | **0**               |
| Test coverage                   | 5%          | **≥80%**            |

---

## 📅 Cronograma (1.5 semanas)

| Día  | Entregables                                                    |
| ---- | -------------------------------------------------------------- |
| 1-2  | Zod schemas, RBAC resource-level, commission engine + tiers    |
| 3-4  | Liquidation cron + PDF, schedule exceptions + timezone         |
| 5-6  | Performance metrics + dashboard, Agent Portal PWA + magic link |
| 7-8  | Calendar sync, Unit tests, Integration tests                   |
| 9-10 | E2E 3 flujos, Observabilidad, Code review                      |

---

## ⚠️ Riesgos

| Riesgo                              | Mitigación                                             |
| ----------------------------------- | ------------------------------------------------------ |
| Commission tiers complexity         | Empezar simple (flat %), iterar a tiers                |
| Puppeteer memory en liquidation PDF | `@sparticuz/chromium` + streaming upload               |
| Portal PWA offline sync conflicts   | Last-write-wins + server timestamp authority           |
| Multi-timezone scheduling           | Normalizar todo a UTC en DB, display en agent timezone |

---

**Documento vivo** — Actualizar conforme se completan tareas.
