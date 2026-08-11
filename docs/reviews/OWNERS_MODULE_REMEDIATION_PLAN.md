# Plan de Remediación Completa — Módulo Owners (Propietarios)

**Objetivo:** Llevar el módulo Owners de **~90% funcional → 100% production-ready** con property linking avanzado, communications tracking, reports automatizados, documents management y observabilidad.

---

## 📍 Estado Actual (Resumen)

| Área | % Completo | Bloqueadores para 100% |
|------|------------|------------------------|
| CRUD Propietarios | 95% | Persona física/jurídica, contacto preferido, soft-delete/restore |
| Property Linking | 85% | Many-to-many con % ownership, pero sin validación suma=100% |
| Owner Detail Page | 80% | Tabs: propiedades, planes, comunicaciones, reportes |
| Communications | 70% | CRUD básico, pero sin templates, sin tracking delivery, sin WhatsApp integration |
| Reports | 60% | Generación manual, sin templates, sin scheduled, sin PDF generation |
| Documents | 40% | Solo conceptos, sin upload real, sin OCR, sin versionado |
| **Type Safety** | **80%** | `OwnerFormValues` completo, pero `any` en CSV import |
| **Testing** | **5%** | Cero tests |
| **Observabilidad** | **40%** | Logs básicos, sin métricas engagement |

---

## 🎯 Criterios de Aceptación — "100% Funcional"

### ✅ Property Linking Avanzado
- [ ] Validación: suma % ownership = 100% por propiedad
- [ ] Historial de cambios de ownership (audit trail)
- [ ] Primary owner designation (uno por propiedad)
- [ ] Bulk link/unlink desde property detail

### ✅ Communications Tracking
- [ ] Templates con variables (owner_name, property_address, dates)
- [ ] Multi-canal: Email (Resend), WhatsApp (templates), SMS, In-app
- [ ] Delivery tracking + read receipts (email open, WhatsApp delivered)
- [ ] Scheduled communications (recordatorios de vencimiento, reportes mensuales)
- [ ] Communication preferences por owner (canal, frecuencia, idioma)

### ✅ Reports Automatizados
- [ ] Templates: Monthly performance, Quarterly valuation, Annual tax summary
- [ ] Scheduled generation (cron: 1ro de cada mes, trimestral, anual)
- [ ] PDF generation (Edge Function + Puppeteer/Playwright)
- [ ] Email delivery automático + archive en `owner_reports`
- [ ] Custom date ranges + property filters

### ✅ Documents Management
- [ ] Upload: DNI, Escrituras, Contratos, Comprobantes, Certificados
- [ ] OCR para extraer datos clave (DNI number, fechas, montos)
- [ ] Versionado + expiry alerts (ej. certificado vencimiento)
- [ ] Categorización automática por tipo de documento
- [ ] Shared access: owner portal (futuro) + agent access

### ✅ Owner Portal (Preparación)
- [ ] Read-only access: propiedades, reportes, documentos, comunicaciones
- [ ] Magic link login (sin password)
- [ ] Notification preferences

### ✅ Type Safety (Strict)
- [ ] **Cero `any`** en `owners.ts`, `owners.api.ts`, `OwnersPage.tsx`, `OwnerDetailPage.tsx`
- [ ] Zod schemas para `OwnerFormValues`, `CommunicationForm`, `ReportConfig`

### ✅ Testing (Cobertura Mínima)
| Tipo | Cobertura | Archivos Objetivo |
|------|-----------|-------------------|
| Unit | **80%** | ownership validation, communication templates, report generation |
| Integration | **50%** | create owner → link properties → schedule report → send communication |
| E2E | **3 flujos** | Owner lifecycle, Property linking validation, Report generation + PDF |

### ✅ Observabilidad
- [ ] Métricas: `owners_created`, `properties_linked`, `communications_sent`, `reports_generated`, `documents_uploaded`
- [ ] Dashboard: Owner engagement (last contact, report opens, doc uploads)
- [ ] Alertas: communications failed > 5%, reports not generated, documents expiring

---

## 📋 Plan de Trabajo Priorizado

### FASE 1 — CRÍTICO (Fundamentos) — **~3 días**

#### 1.1 Zod Schemas + Ownership Validation
**Archivo nuevo:** `supabase/functions/_shared/owners-validation.ts`
```typescript
import { z } from 'zod';

export const OwnerTypeSchema = z.enum(['persona_fisica', 'persona_juridica']);
export const OwnerPreferredContactSchema = z.enum(['whatsapp', 'email', 'call']);

export const OwnerFormSchema = z.object({
    full_name: z.string().min(2).max(150),
    owner_type: OwnerTypeSchema,
    dni_cuit: z.string().regex(/^[\d\-\.]{8,13}$/, 'DNI/CUIT inválido').optional().nullable(),
    email: z.string().email().optional().nullable(),
    phone: z.string().regex(/^[\d\s\-\+\(\)]{10,}$/).optional().nullable(),
    address: z.string().max(300).optional().nullable(),
    company_name: z.string().max(150).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    preferred_contact: OwnerPreferredContactSchema.optional().nullable(),
}).refine(data => data.owner_type !== 'persona_juridica' || data.company_name, {
    message: 'Razón social obligatoria para persona jurídica',
    path: ['company_name'],
});

export const PropertyOwnerLinkSchema = z.object({
    property_id: z.string().uuid(),
    owner_id: z.string().uuid(),
    ownership_percentage: z.number().positive().max(100),
    is_primary: z.boolean().default(false),
});

// Validación cruzada: suma % = 100% por propiedad
export async function validateOwnershipSum(propertyId: string, excludeLinkId?: string): Promise<string[]> {
    const { data: links } = await supabase
        .from('property_owners')
        .select('ownership_percentage')
        .eq('property_id', propertyId)
        .neq('id', excludeLinkId ?? '');
    
    const sum = (links ?? []).reduce((acc, l) => acc + Number(l.ownership_percentage), 0);
    const errors: string[] = [];
    if (sum > 100) errors.push(`Suma ownership ${sum}% excede 100%`);
    if (sum < 100 && links.length > 0) errors.push(`Suma ownership ${sum}% < 100% (falta distribuir)`);
    const primaryCount = links.filter(l => l.is_primary).length;
    if (primaryCount > 1) errors.push('Múltiples primary owners');
    return errors;
}
```

**En `owners.ts` — `linkOwnerToProperty`:**
```typescript
const errors = await validateOwnershipSum(propertyId);
if (errors.length) throw new Error(errors.join('; '));
```

#### 1.2 Communications Templates + Multi-canal
**Migración:** `supabase/migrations/0048_owner_communications_templates.sql`
```sql
CREATE TABLE owner_communication_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    channel text NOT NULL CHECK (channel IN ('email', 'whatsapp', 'sms', 'in_app')),
    subject text,
    body text NOT NULL, -- con variables {{owner_name}}, {{property_address}}, etc.
    variables jsonb DEFAULT '[]', -- lista de variables requeridas
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE owner_communications ADD COLUMN template_id uuid REFERENCES owner_communication_templates(id);
ALTER TABLE owner_communications ADD COLUMN delivery_status text DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'read', 'failed'));
ALTER TABLE owner_communications ADD COLUMN delivery_metadata jsonb; -- message_id, opened_at, clicked_at
```

**Edge Function:** `supabase/functions/owner-communication-send/index.ts`
```typescript
// Render template con variables
function renderTemplate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? '');
}

// Envío multi-canal
async function sendCommunication(comm: OwnerCommunication) {
    const template = await getTemplate(comm.template_id);
    const rendered = renderTemplate(template.body, comm.variables);
    
    switch (template.channel) {
        case 'email':
            return await sendEmail(comm.owner_email, template.subject ?? 'BIENENHAUS', rendered);
        case 'whatsapp':
            return await sendWhatsAppTemplate(comm.owner_phone, template.name, comm.variables);
        case 'sms':
            return await sendSMS(comm.owner_phone, rendered);
        case 'in_app':
            return await createInAppNotification(comm.owner_id, rendered);
    }
}
```

#### 1.3 Reports Templates + PDF Generation
**Migración:** `supabase/migrations/0049_owner_reports_templates.sql`
```sql
CREATE TABLE owner_report_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('monthly', 'quarterly', 'annual', 'custom')),
    properties_filter jsonb, -- { include_all: true } | { property_ids: [...] }
    sections jsonb NOT NULL, -- [{ type: 'portfolio_summary', config: {} }, { type: 'valuation_history', config: { months: 12 } }]
    schedule_cron text, -- '0 9 1 * *' para mensual
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE owner_reports ADD COLUMN template_id uuid REFERENCES owner_report_templates(id);
ALTER TABLE owner_reports ADD COLUMN generation_status text DEFAULT 'pending' CHECK (generation_status IN ('pending', 'generating', 'completed', 'failed'));
ALTER TABLE owner_reports ADD COLUMN pdf_url text;
```

**Edge Function:** `supabase/functions/owner-report-generate/index.ts` (Puppeteer)
```typescript
import puppeteer from 'npm:puppeteer';

async function generateReportPDF(report: OwnerReport, template: OwnerReportTemplate): Promise<string> {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    // Render HTML con datos
    const html = renderReportHTML(report, template);
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: '20mm' });
    await browser.close();
    
    // Upload a Storage
    const path = `owner-reports/${report.owner_id}/${report.id}.pdf`;
    await supabase.storage.from('site-images').upload(path, pdfBuffer, { contentType: 'application/pdf', upsert: true });
    
    return supabase.storage.from('site-images').getPublicUrl(path).data.publicUrl;
}
```

**Cron Job:** `supabase/functions/owner-reports-scheduled/index.ts` (diario 9AM)
```typescript
// Ejecutar templates con schedule_cron activo
const { data: templates } = await supabase
    .from('owner_report_templates')
    .select('*')
    .eq('is_active', true)
    .not('schedule_cron', 'is', null);

for (const template of templates ?? []) {
    if (cronMatches(template.schedule_cron)) {
        // Crear report para cada owner con propiedades
        // Generar PDF async
    }
}
```

---

### FASE 2 — ALTO (Documents + Portal Prep) — **~3 días**

#### 2.1 Documents Management
**Migración:** `supabase/migrations/0050_owner_documents.sql`
```sql
CREATE TABLE owner_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid REFERENCES owners(id),
    property_id uuid REFERENCES properties(id), -- opcional
    category text NOT NULL CHECK (category IN ('dni', 'escritura', 'contrato', 'comprobante', 'certificado', 'otro')),
    title text NOT NULL,
    file_url text NOT NULL,
    file_name text,
    file_size bigint,
    mime_type text,
    ocr_text text, -- texto extraído
    extracted_data jsonb, -- { dni_number: '12345678', expiry: '2025-12-31', amount: 50000 }
    expiry_date date,
    version int DEFAULT 1,
    previous_version_id uuid REFERENCES owner_documents(id),
    uploaded_by uuid REFERENCES admin_users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_owner_documents_owner ON owner_documents(owner_id);
CREATE INDEX idx_owner_documents_expiry ON owner_documents(expiry_date) WHERE expiry_date IS NOT NULL;
```

**Edge Function:** `supabase/functions/owner-document-process/index.ts` (OCR + extracción)
```typescript
// Usar Tesseract.js o cloud OCR
import { createWorker } from 'npm:tesseract.js';

async function processDocument(doc: OwnerDocument) {
    const worker = await createWorker('spa');
    const { data: { text } } = await worker.recognize(doc.file_url);
    await worker.terminate();
    
    // Extraer patrones comunes
    const extracted = {
        dni_number: text.match(/\b\d{7,8}\b/)?.[0],
        cuit: text.match(/\b\d{2}-\d{8}-\d{1}\b/)?.[0],
        expiry_date: text.match(/\b\d{2}\/\d{2}\/\d{4}\b/)?.[0],
        amounts: text.match(/\$\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?/g)?.map(s => parseFloat(s.replace(/[$,.]/g, ''))),
    };
    
    await supabase.from('owner_documents').update({
        ocr_text: text,
        extracted_data: extracted,
        expiry_date: extracted.expiry_date ? new Date(extracted.expiry_date).toISOString().split('T')[0] : null,
    }).eq('id', doc.id);
}
```

**UI:** `OwnerDetailPage` — tab "Documentos" con upload drag-drop, preview, OCR status, expiry alerts.

#### 2.2 Owner Portal — Magic Link Auth
**Edge Function:** `supabase/functions/owner-portal-auth/index.ts`
```typescript
// Generar magic link (JWT corto, 15 min)
async function createOwnerMagicLink(ownerId: string): Promise<string> {
    const { data: owner } = await supabase.from('owners').select('email, name').eq('id', ownerId).single();
    const { data: link } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: ownerEmail,
        options: { redirectTo: `${ADMIN_BASE_URL}/owner-portal` }
    });
    // Enviar email + WhatsApp
    return link.properties?.action_link ?? '';
}

// Middleware en portal: validar JWT → set session cookie → redirect
```

**Portal Pages:** `/owner-portal` (read-only: propiedades, reportes, documentos, comunicaciones)

---

### FASE 3 — MEDIO (Polish) — **~2 días**

#### 3.1 Testing
- Unit: ownership validation, template rendering, report PDF generation, OCR extraction
- Integration: create owner → link properties (sum=100%) → schedule report → send comm
- E2E: Owner lifecycle, Property linking validation, Report PDF generation

#### 3.2 Observabilidad
- Metrics: `owners_created`, `properties_linked`, `comm_sent/delivered/read`, `reports_generated`, `docs_uploaded/ocr_processed`
- Dashboard: Owner engagement score (last contact, report opens, doc uploads)
- Alertas: comm failed > 5%, report generation failed, doc expiry < 30 days

---

## 📁 Archivos a Crear / Modificar

### Nuevos Archivos
- [ ] `supabase/functions/_shared/owners-validation.ts`
- [ ] `supabase/functions/owner-communication-send/index.ts`
- [ ] `supabase/functions/owner-report-generate/index.ts`
- [ ] `supabase/functions/owner-reports-scheduled/index.ts`
- [ ] `supabase/functions/owner-document-process/index.ts`
- [ ] `supabase/functions/owner-portal-auth/index.ts`
- [ ] `supabase/migrations/0048_owner_communications_templates.sql`
- [ ] `supabase/migrations/0049_owner_reports_templates.sql`
- [ ] `supabase/migrations/0050_owner_documents.sql`
- [ ] `apps/admin/src/lib/__tests__/owners.validation.test.ts`
- [ ] `apps/admin/src/lib/__tests__/owners.templates.test.ts`
- [ ] `apps/admin/src/lib/__tests__/owners.reports.test.ts`
- [ ] `apps/admin/e2e/owners-flows.spec.ts`

### Modificar
- [ ] `apps/admin/src/lib/owners.ts` — ownership validation, templates, reports
- [ ] `apps/admin/src/lib/owners.api.ts` — hooks para templates, reports, documents
- [ ] `apps/admin/src/pages/OwnerDetailPage.tsx` — tabs: communications (templates), reports (schedule), documents (OCR)
- [ ] `apps/admin/src/pages/OwnersPage.tsx` — bulk link properties, export mejorado

---

## 📊 Métricas de Éxito

| KPI | Baseline | Target |
|-----|----------|--------|
| Ownership validation errors | Manual | **0 (auto-prevent)** |
| Communication delivery rate | ~80% | **>98%** |
| Report generation time | Manual 30min | **<2min (auto)** |
| Document OCR accuracy | N/A | **>90%** |
| TypeScript errors | ~8 | **0** |
| Test coverage | 5% | **≥80%** |

---

## 📅 Cronograma (1 semana)

| Día | Entregables |
|-----|-------------|
| 1 | Zod schemas, ownership validation, communication templates |
| 2 | Report templates + PDF generation (Puppeteer), scheduled cron |
| 3 | Documents OCR + extraction, expiry alerts, Owner Portal magic link |
| 4 | Unit tests, integration tests, E2E 3 flujos |
| 5 | Observabilidad, analytics dashboard, code review |

---

## ⚠️ Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Puppeteer en Edge Functions (memory) | Usar `puppeteer-core` + `@sparticuz/chromium` optimizado para serverless |
| OCR accuracy en docs argentinos | Entrenar patrones regex específicos (DNI, CUIT, formatos AR) |
| Magic link security | JWT 15min expiry, one-time use, rate limit 3/hora |
| PDF generation timeout | Async queue + status polling, timeout 60s |

---

**Documento vivo** — Actualizar conforme se completan tareas. Cada fase PR separado con tests pasando.