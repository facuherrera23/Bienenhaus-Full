# Plan de Remediación Completa — Módulo Visits Calendar

**Objetivo:** Llevar el módulo Visitas de **~90% funcional → 100% production-ready** con validación Zod, let me create the validation schemas and start implementing.

---

## 📍 Estado Actual (Resumen)

| Área                         | % Completo | Bloqueadores para 100%                                             |
| ---------------------------- | ---------- | ------------------------------------------------------------------ |
| CRUD Visitas                 | 95%        | Sin validación Zod, sin conflict detection                         |
| Calendar UI (Month/Week/Day) | 95%        | Navegación fluida, filtros, QR buttons                             |
| QR Check-in                  | 85%        | Generación + validación OK, sin geofencing, sin offline            |
| Recurring Visits             | 80%        | Rule engine funcional, sin exceptions UI, sin conflict detection   |
| Reminders (Cron)             | 75%        | Edge Function procesa, pero solo loggea (no envía email/push real) |
| Agent Availability           | 70%        | CRUD horarios, pero no valida conflictos al crear visita           |
| **Type Safety**              | **80%**    | `as VisitType` casts, `any` en recurrence calc                     |
| **Testing**                  | **10%**    | Solo 1 test (`visits.test.ts` para mappers), sin E2E               |
| **Observabilidad**           | **50%**    | Logs básicos, sin métricas check-in rate, no-show rate             |

---

## 🎯 Criterios de Aceptación — "100% Funcional"

### ✅ Calendar Core

- [ ] Conflict detection: agente no disponible, lead ya tiene visita, propiedad ocupada
- [ ] Timezone handling correcto (America/Argentina/Buenos_Aires)
- [ ] Recurring visits: exceptions UI, conflict detection en generación, end_date/count enforcement
- [ ] Drag-drop para mover visitas entre días/horarios (persistencia)

### ✅ QR Check-in Robusto

- [ ] Geofencing opcional (validar ubicación agente vs propiedad ±100m)
- [ ] Offline-first: QR generado client-side, sync cuando online
- [ ] Check-in foto opcional (selfie + GPS metadata)
- [ ] Audit trail completo: quién, cuándo, dónde, foto

### ✅ Reminders Automatizados (Real)

- [ ] Edge Function `visits-process-reminders` envía email/push/whastapp real (no solo log)
- [ ] Template system: reminder_24h, reminder_2h, reminder_30min
- [ ] Configurable por agente/visita (canal preferido)
- [ ] Delivery tracking + retry failed

### ✅ Agent Availability Enforcement

- [ ] Validar disponibilidad al crear/editar visita (horarios + recurrencias)
- [ ] Block double-booking (same agent, overlapping times)
- [ ] Visual indicators en calendar (slots disponibles/ocupados)

### ✅ Type Safety (Strict)

- [ ] **Cero `any`** en `visits.ts`, `VisitsPage.tsx`, edge functions
- [ ] **Cero casts** `as VisitType`, `as VisitStatus` — Zod schemas
- [ ] RecurrenceRule tipado estricto (discriminated union por frequency)

### ✅ Testing (Cobertura Mínima)

| Tipo        | Cobertura    | Archivos Objetivo                                                        |
| ----------- | ------------ | ------------------------------------------------------------------------ |
| Unit        | **80%**      | recurrence calc, conflict detection, QR gen/validation, reminders        |
| Integration | **50%**      | create→QR→check-in→complete, recurring generation, reminders flow        |
| E2E         | **3 flujos** | Create visit + QR check-in, Recurring with exceptions, Reminder delivery |

### ✅ Observabilidad

- [ ] Métricas: `visits_created`, `visits_completed`, `checkin_success_rate`, `no_show_rate`, `reminder_delivery_rate`
- [ ] Dashboard: Agent workload, upcoming visits, overdue reminders
- [ ] Alertas: reminders failed > 5%, check-in rate < 80%, conflicts detected

---

## 📋 Plan de Trabajo Priorizado

### FASE 1 — CRÍTICO (Fundamentos) — **~3 días**

#### 1.1 Zod Schemas + Conflict Detection

**Archivo nuevo:** `supabase/functions/_shared/visits-validation.ts`

```typescript
import { z } from 'zod';

export const VisitStatusSchema = z.enum([
    'programada',
    'confirmada',
    'en_curso',
    'completada',
    'cancelada',
    'no_show',
]);
export const VisitTypeSchema = z.enum(['presencial', 'virtual', 'telefonica']);

export const RecurrenceRuleSchema = z.discriminatedUnion('frequency', [
    z.object({ frequency: z.literal('daily'), interval: z.number().int().min(1).max(30) }),
    z.object({
        frequency: z.literal('weekly'),
        interval: z.number().int().min(1).max(12),
        days_of_week: z.array(z.number().int().min(0).max(6)).min(1),
        exceptions: z.array(z.string().date()).optional(),
    }),
    z.object({
        frequency: z.literal('monthly'),
        interval: z.number().int().min(1).max(12),
        day_of_month: z.number().int().min(1).max(31).optional(),
        exceptions: z.array(z.string().date()).optional(),
    }),
    z.object({
        frequency: z.literal('yearly'),
        interval: z.number().int().min(1).max(10),
        exceptions: z.array(z.string().date()).optional(),
    }),
]);

export const VisitFormSchema = z
    .object({
        lead_id: z.string().uuid().nullable(),
        property_id: z.string().uuid().nullable(),
        agent_id: z.string().uuid(),
        title: z.string().min(3).max(120),
        description: z.string().max(1000).optional(),
        starts_at: z.string().datetime(),
        ends_at: z.string().datetime(),
        status: VisitStatusSchema.default('programada'),
        location: z.string().max(200).nullable(),
        meeting_type: VisitTypeSchema.optional(),
        meeting_link: z.string().url().nullable(),
        notes: z.string().max(2000).optional(),
    })
    .refine((data) => new Date(data.ends_at) > new Date(data.starts_at), {
        message: 'Fin debe ser después de inicio',
        path: ['ends_at'],
    });

export const VisitPatchSchema = z
    .object({
        title: z.string().min(3).max(120).optional(),
        description: z.string().max(1000).optional(),
        starts_at: z.string().datetime().optional(),
        ends_at: z.string().datetime().optional(),
        status: VisitStatusSchema.optional(),
        location: z.string().max(200).nullable().optional(),
        meeting_type: VisitTypeSchema.optional().nullable(),
        meeting_link: z.string().url().nullable().optional(),
        notes: z.string().max(2000).optional(),
        lead_id: z.string().uuid().nullable().optional(),
        property_id: z.string().uuid().nullable().optional(),
        agent_id: z.string().uuid().optional(),
    })
    .refine(
        (data) =>
            !data.starts_at || !data.ends_at || new Date(data.ends_at) > new Date(data.starts_at),
        { message: 'Fin debe ser después de inicio', path: ['ends_at'] },
    );
```

**En `visits.ts` — `createVisit` / `updateVisit`:**

```typescript
// Antes de insert/update: validar conflictos
async function checkConflicts(values: VisitFormValues, excludeId?: string): Promise<string[]> {
    const errors: string[] = [];

    // 1. Agent availability
    const { data: avail } = await supabase
        .from('agent_availability')
        .select('*')
        .eq('agent_id', values.agent_id)
        .eq('is_active', true);

    const visitDay = new Date(values.starts_at).getDay();
    const visitStart = values.starts_at.split('T')[1].slice(0, 5);
    const visitEnd = values.ends_at.split('T')[1].slice(0, 5);

    const hasSlot = avail?.some(
        (a) => a.day_of_week === visitDay && a.start_time <= visitStart && a.end_time >= visitEnd,
    );
    if (!hasSlot) errors.push('Agente no disponible en ese horario');

    // 2. Double booking
    const { data: conflicts } = await supabase
        .from('visits')
        .select('id, title, starts_at, ends_at')
        .eq('agent_id', values.agent_id)
        .is('deleted_at', null)
        .neq('id', excludeId ?? '')
        .lt('starts_at', values.ends_at)
        .gt('ends_at', values.starts_at);

    if (conflicts?.length)
        errors.push(`Conflicto con: ${conflicts.map((c) => c.title).join(', ')}`);

    // 3. Lead double booking
    if (values.lead_id) {
        const { data: leadConflicts } = await supabase
            .from('visits')
            .select('id')
            .eq('lead_id', values.lead_id)
            .is('deleted_at', null)
            .neq('id', excludeId ?? '')
            .lt('starts_at', values.ends_at)
            .gt('ends_at', values.starts_at);
        if (leadConflicts?.length) errors.push('Lead ya tiene visita en ese horario');
    }

    return errors;
}
```

#### 1.2 QR Check-in con Geofencing + Foto

**Edge Function:** `supabase/functions/qr-checkin/index.ts` — extender

```typescript
// Request body: { visitId, agentLat?, agentLng?, photoBase64? }
interface QrCheckinPayload {
    visitId: string;
    agentLat?: number;
    agentLng?: number;
    photoBase64?: string; // selfie opcional
}

// Validar geofencing si property tiene coords
const { data: visit } = await supabase
    .from('visits')
    .select('property:properties(latitude, longitude, address)')
    .eq('id', visitId)
    .single();

if (visit.property?.latitude && payload.agentLat && payload.agentLng) {
    const distance = haversine(
        visit.property.latitude,
        visit.property.longitude,
        payload.agentLat,
        payload.agentLng,
    );
    if (distance > 100) {
        // 100 metros
        return respond(400, { error: 'Fuera de rango de la propiedad', distance });
    }
}

// Guardar foto si viene
let photoUrl = null;
if (payload.photoBase64) {
    const buffer = Uint8Array.from(atob(payload.photoBase64), (c) => c.charCodeAt(0));
    const path = `checkin-photos/${visitId}/${Date.now()}.jpg`;
    await supabase.storage.from('chat-files').upload(path, buffer, { contentType: 'image/jpeg' });
    photoUrl = supabase.storage.from('chat-files').getPublicUrl(path).data.publicUrl;
}

await supabase
    .from('qr_checkins')
    .update({
        checked_in: true,
        checked_in_at: now,
        checked_in_by: userId,
        checkin_lat: payload.agentLat,
        checkin_lng: payload.agentLng,
        checkin_photo: photoUrl,
    })
    .eq('code', code);
```

#### 1.3 Recurring Visits — Exceptions UI + Conflict Detection

**En `VisitsPage.tsx` — modal recurrencia:**

```tsx
// Agregar campo exceptions: string[] (fechas ISO)
const [exceptions, setExceptions] = useState<string[]>([]);

// En createRecurringVisit: validar conflictos ANTES de generar
const checkRecurringConflicts = async (rule: RecurrenceRule, baseVisit: VisitRow) => {
    const occurrences = generateOccurrences(rule, 10); // próximas 10
    for (const occ of occurrences) {
        const conflicts = await checkConflicts({
            ...baseVisit,
            starts_at: occ.start,
            ends_at: occ.end,
        });
        if (conflicts.length) return { ok: false, conflicts, date: occ.start };
    }
    return { ok: true };
};
```

---

### FASE 2 — ALTO (Automatización Real) — **~4 días**

#### 2.1 Reminders Edge Function — Envío Real

**Archivo:** `supabase/functions/visits-process-reminders/index.ts` — reescribir

```typescript
import { Resend } from 'npm:resend';
import { createClient } from 'npm:@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

// Templates
const TEMPLATES = {
    reminder_24h: (visit: VisitRow) => ({
        subject: `Recordatorio: Visita mañana - ${visit.title}`,
        html: `<p>Hola ${visit.lead_name},</p><p>Mañana tenés visita <strong>${visit.title}</strong> a las ${formatTime(visit.starts_at)}.</p><p>Dirección: ${visit.location}</p>`,
    }),
    reminder_2h: (visit: VisitRow) => ({
        subject: `En 2 horas: ${visit.title}`,
        html: `<p>Recordatorio: tu visita comienza en 2 horas.</p>`,
    }),
    reminder_30min: (visit: VisitRow) => ({
        subject: `¡Ya casi! ${visit.title}`,
        html: `<p>Tu visita comienza en 30 minutos.</p>`,
    }),
};

async function sendReminder(reminder: VisitReminderRow, visit: VisitRow) {
    const template = TEMPLATES[reminder.type as keyof typeof TEMPLATES];
    if (!template) return { sent: false, error: 'Template not found' };

    const content = template(visit);

    // Email
    if (visit.lead_email) {
        try {
            await resend.emails.send({
                from: 'no-reply@bienenhaus.com.ar',
                to: visit.lead_email,
                subject: content.subject,
                html: content.html,
            });
        } catch (e) {
            console.error('Email failed:', e);
        }
    }

    // Push/WhatsApp (si integrado)
    // ...

    return { sent: true };
}
```

#### 2.2 Agent Availability Visual en Calendar

**En `VisitsPage.tsx` — month/week view:**

```tsx
// Cargar availability del agente filtrado
const { data: availability } = useQuery({
    queryKey: ['agent-availability', agentFilter],
    queryFn: () => fetchAgentAvailability(agentFilter),
    enabled: agentFilter !== 'todos',
});

// En calendar day cell: mostrar slots libres
const getFreeSlots = (day: Date, agentAvail: AgentAvailability[]) => {
    const dayOfWeek = day.getDay();
    return agentAvail
        .filter((a) => a.day_of_week === dayOfWeek && a.is_active)
        .map((a) => ({ start: a.start_time, end: a.end_time }));
};
```

#### 2.3 Drag-Drop Mover Visitas

**Librería:** `@dnd-kit/core` (compat Preact) o HTML5 nativo mejorado

```typescript
// En VisitsPage: onDragEnd
const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const visitId = active.id as string;
    const newDate = over.id as string; // date ISO
    const newStart = `${newDate}T${visit.starts_at.split('T')[1]}`;
    const newEnd = addMinutes(newStart, durationMinutes);

    // Validar conflictos en nueva fecha/hora
    const errors = await checkConflicts(
        { ...visit, starts_at: newStart, ends_at: newEnd },
        visitId,
    );
    if (errors.length) {
        toast.error(errors[0]);
        return;
    }

    await updateVisit(visitId, { starts_at: newStart, ends_at: newEnd });
};
```

---

### FASE 3 — MEDIO (Polish) — **~2 días**

#### 3.1 Testing

- Unit: `calculateNextOccurrence`, `checkConflicts`, `haversine`, QR validation
- Integration: create→QR→checkin→complete, recurring gen with exceptions
- E2E: Create visit + QR check-in (mock GPS), Recurring with exceptions, Reminder email sent

#### 3.2 Observabilidad

- Structured logs en edge functions (visit_id, agent_id, action, duration_ms)
- Metrics: checkin_success_rate, no_show_rate, reminder_delivery_rate
- Dashboard admin: "Próximas 24h", "Visitas sin check-in", "Agentes sobrecargados"

---

## 📁 Archivos a Crear / Modificar

### Nuevos

- [ ] `supabase/functions/_shared/visits-validation.ts`
- [ ] `supabase/functions/visits-process-reminders/index.ts` (rewrite)
- [ ] `supabase/migrations/0045_visit_checkin_geofence.sql` (campos lat/lng/photo en qr_checkins)
- [ ] `apps/admin/src/lib/__tests__/visits.recurrence.test.ts`
- [ ] `apps/admin/src/lib/__tests__/visits.conflicts.test.ts`
- [ ] `apps/admin/src/lib/__tests__/visits.qr.test.ts`
- [ ] `apps/admin/e2e/visits-flows.spec.ts`

### Modificar

- [ ] `apps/admin/src/lib/visits.ts` — conflict detection, geofencing helpers, structured logging
- [ ] `apps/admin/src/components/VisitsPage.tsx` — drag-drop, availability visual, exceptions UI
- [ ] `supabase/functions/qr-checkin/index.ts` — geofencing, photo, structured logging
- [ ] `supabase/functions/visits-process-reminders/index.ts` — envío real email/push
- [ ] `apps/admin/src/lib/visits.api.ts` — hooks para infinite queries, conflict check

---

## 📊 Métricas de Éxito

| KPI                    | Baseline      | Target                |
| ---------------------- | ------------- | --------------------- |
| Check-in success rate  | ~85%          | **>95%**              |
| No-show rate           | ~15%          | **<5%**               |
| Reminder delivery rate | 0% (solo log) | **>98%**              |
| Conflict detection     | Manual        | **100% automatizado** |
| TypeScript errors      | ~8            | **0**                 |
| Test coverage          | 10%           | **≥80%**              |

---

## 📅 Cronograma (1 semana)

| Día | Entregables                                                |
| --- | ---------------------------------------------------------- |
| 1   | Zod schemas, conflict detection, QR geofencing             |
| 2   | Recurring exceptions UI, drag-drop mover visitas           |
| 3   | Reminders edge function real (Resend), availability visual |
| 4   | Unit tests, integration tests, E2E 3 flujos                |
| 5   | Observabilidad, performance, code review                   |

---

## ⚠️ Riesgos

| Riesgo                                   | Mitigación                                        |
| ---------------------------------------- | ------------------------------------------------- |
| Geofencing GPS inaccuracy en mobile      | Tolerancia 100m, fallback manual check-in         |
| Reminders spam si mal configurados       | Rate limit por lead (max 3/día), unsubscribe link |
| Drag-drop en mobile                      | Touch sensor + fallback click-to-move buttons     |
| Recurring conflicts en generación masiva | Validar antes de generar, batch size 10           |

---

**Documento vivo** — Actualizar conforme se completan tareas.
