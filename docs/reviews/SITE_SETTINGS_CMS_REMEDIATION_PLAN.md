# Plan de Remediación Completa — Módulo Site Settings (CMS Landing)

**Objetivo:** Llevar el CMS de configuración del sitio de **~80% funcional → 100% production-ready** con editor visual, versionado, preview, multi-idioma, validación estricta y sincronización landing↔admin.

---

## 📍 Estado Actual (Resumen)

| Área | % Completo | Bloqueadores para 100% |
|------|------------|------------------------|
| Configuración Básica | 90% | Social, Contact, Company, Stats en `site_settings` table |
| Editor Admin (`ConfigPage`) | 75% | Formulario básico, pero sin validación, sin preview, sin versionado |
| Landing Integration | 85% | `useSiteSettings` hook + realtime, pero dual source (mock + DB) |
| WhatsApp Alternating | 90% | `getNextWhatsAppUrl` con localStorage, pero sin analytics |
| **Type Safety** | **70%** | `SiteSettings` interface, pero `any` en `mapSettings`, `value.value` access |
| **Testing** | **0%** | Cero tests |
| **Observabilidad** | **30%** | Logs básicos, sin métricas config changes |
| **Multi-idioma** | **0%** | Solo español, sin i18n structure |
| **Visual Editor** | **10%** | Solo form fields, sin drag-drop sections, sin live preview |

---

## 🎯 Criterios de Aceptación — "100% Funcional"

### ✅ Configuración Unificada (Single Source of Truth)
- [ ] **Eliminar mock data** en `apps/landing/src/data/properties.ts` → 100% DB-driven
- [ ] Landing usa **solo** `useSiteSettings` + `useProperties` (Supabase realtime)
- [ ] Admin `ConfigPage` edita **todas** las keys de `site_settings`
- [ ] Validación: keys requeridas vs opcionales, tipos, formatos

### ✅ Editor Visual Avanzado (Admin)
- [ ] **Secciones colapsables**: Social, Contacto, Empresa, Stats, SEO, WhatsApp, Landing Content
- [ ] **Live Preview**: iframe o panel lateral con landing real actualizándose al escribir
- [ ] **Drag-drop reorder** de sections en landing (hero, catalog, services, team, stats, process, contact)
- [ ] **Content blocks**: Rich text editor (TipTap/ProseMirror) para descripciones largas
- [ ] **Image picker**: Subir/seleccionar de Storage para logos, hero images, favicons
- [ ] **Color picker**: Paleta de marca (primary, secondary, accent) con preview
- [ ] **Font selector**: Google Fonts para headings/body
- [ ] **Validación inline**: Errores en tiempo real (URL válida, email, phone format, required)

### ✅ Versionado + Rollback
- [ ] Tabla `site_settings_versions` (snapshot JSON + metadata)
- [ ] Auto-save cada 30s + manual "Guardar versión"
- [ ] Historial: lista versiones con diff visual (JSON diff + render diff)
- [ ] One-click rollback a versión anterior
- [ ] Comparar versión actual vs seleccionada

### ✅ Multi-idioma (i18n Ready)
- [ ] Estructura: `site_settings_translations` (key, locale, value, value_type)
- [ ] Locales soportados: `es-AR` (default), `en-US`, `pt-BR`
- [ ] Admin: Language tabs en editor, fallback a default si traducción vacía
- [ ] Landing: `useSiteSettings(locale?)` → detecta `navigator.language` o URL param
- [ ] SEO: `hreflang` tags, sitemap multi-idioma

### ✅ WhatsApp Analytics + Smart Routing
- [ ] Track: clicks por número (primary vs alt), conversion a chat
- [ ] Smart routing: horario comercial → primary, fuera de horario → alt
- [ ] Geo-routing: país/ciudad del visitante → número local si existe
- [ ] A/B test: mensajes de bienvenida rotativos

### ✅ SEO & Metadata Centralizado
- [ ] Keys: `seo_title`, `seo_description`, `seo_keywords`, `og_image`, `twitter_card`
- [ ] Structured data: `OrganizationSchema`, `WebSiteSchema`, `RealEstateAgencySchema` editables
- [ ] Robots.txt / sitemap.xml generados dinámicamente (Edge Function)
- [ ] Preview: Google Search Console / Facebook Debugger links

### ✅ Type Safety (Strict)
- [ ] **Cero `any`** en `site-settings.ts`, `ConfigPage.tsx`, `useSiteSettings`
- [ ] Zod schemas para cada `value_type`: `json`, `string`, `number`, `boolean`, `url`, `email`, `phone`, `color`, `richtext`
- [ ] `value` access tipado: `setting.value as SiteSettings['social']` → discriminated union

### ✅ Testing (Cobertura Mínima)
| Tipo | Cobertura | Archivos Objetivo |
|------|-----------|-------------------|
| Unit | **80%** | `mapSettings`, `getNextWhatsAppUrl`, `toWhatsAppUrl`, Zod schemas |
| Integration | **50%** | Admin save → realtime → landing `useSiteSettings` update → UI re-render |
| E2E | **3 flujos** | Edit config → preview → publish, Version rollback, Multi-lang switch |

### ✅ Observabilidad
- [ ] Métricas: `config_changes_total`, `config_rollback_count`, `landing_settings_fetch_latency`, `whatsapp_clicks_by_number`
- [ ] Dashboard: Config change audit trail, WhatsApp click analytics, Landing performance by config version
- [ ] Alertas: config validation errors > 5/min, realtime sync lag > 5s

---

## 📋 Plan de Trabajo Priorizado

### FASE 1 — CRÍTICO (Unificación + Type Safety) — **~3 días**

#### 1.1 Zod Schemas + Tipado Estricto
**Archivo nuevo:** `supabase/functions/_shared/site-validation.ts`
```typescript
import { z } from 'zod';

// Tipos base para value_type
export const SettingValueSchemas = {
    string: z.string(),
    number: z.number(),
    boolean: z.boolean(),
    json: z.record(z.unknown()),
    url: z.string().url(),
    email: z.string().email(),
    phone: z.string().regex(/^[\d\s\-\+\(\)]{10,}$/),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    richtext: z.string(), // HTML sanitizado
} as const;

export const SiteSettingKeySchema = z.enum([
    // Social
    'social', 'instagram', 'facebook', 'youtube', 'tiktok', 'linkedin', 'whatsapp',
    // Contact
    'contact_email', 'contact_whatsapp', 'contact_whatsapp_alt', 'contact_address', 'contact_hours',
    // Company
    'site_name', 'empresa', 'cri', 'matricula', 'ubicacion',
    // Stats
    'stats',
    // SEO
    'seo_title', 'seo_description', 'seo_keywords', 'og_image', 'twitter_card',
    // WhatsApp
    'whatsapp_welcome_messages', 'whatsapp_business_hours',
    // Landing Content (sections)
    'hero_title', 'hero_subtitle', 'hero_cta_text', 'hero_cta_link',
    'catalog_title', 'catalog_description',
    'services_title', 'services_items',
    'team_title', 'team_members',
    'stats_title', 'stats_items',
    'process_title', 'process_steps',
    'contact_title', 'contact_form_title',
]);

export const SiteSettingSchema = z.object({
    key: SiteSettingKeySchema,
    value: z.unknown(), // validado por value_type
    value_type: z.enum(['string', 'number', 'boolean', 'json', 'url', 'email', 'phone', 'color', 'richtext']),
    is_public: z.boolean().default(true),
    locale: z.string().default('es-AR'),
});

export const SiteSettingsSchema = z.object({
    social: z.record(z.string().url()).optional(),
    contact: z.object({
        email: z.string().email().optional(),
        whatsapp: z.string().regex(/^[\d\s\-\+\(\)]{10,}$/).optional(),
        whatsappAlt: z.string().regex(/^[\d\s\-\+\(\)]{10,}$/).optional(),
        address: z.string().max(200).optional(),
        hours: z.object({ weekdays: z.string(), saturdays: z.string() }).optional(),
    }).optional(),
    company: z.object({
        name: z.string().max(100).optional(),
        cri: z.string().max(50).optional(),
        matricula: z.string().max(50).optional(),
        ubicacion: z.string().max(100).optional(),
    }).optional(),
    stats: z.object({
        comercializadas: z.number().int().nonnegative(),
        clientes: z.number().int().nonnegative(),
        exito: z.number().int().nonnegative(),
        anios: z.number().int().positive(),
    }).optional(),
});

// Validación runtime en mapSettings
export function validateSetting(key: string, value: unknown, valueType: string): { valid: boolean; error?: string } {
    const schema = SettingValueSchemas[valueType as keyof typeof SettingValueSchemas];
    if (!schema) return { valid: false, error: `Unknown value_type: ${valueType}` };
    const result = schema.safeParse(value);
    return result.success ? { valid: true } : { valid: false, error: result.error.message };
}
```

#### 1.2 Eliminar Mock Data + Landing 100% DB
**En `apps/landing/src/data/properties.ts` — ELIMINAR:**
```typescript
// BORRAR: export const properties: Property[] = [...];
// REEMPLAZAR con: export const properties: Property[] = []; // vacío, solo tipos
```

**En `apps/landing/src/lib/supabase-data.ts` — `useProperties`:**
```typescript
// Ya usa Supabase realtime ✅
// Agregar: fallback graceful si DB vacía → mostrar estado vacío bonito
```

**En `apps/landing/src/App.tsx` — quitar imports de mock:**
```typescript
// import { properties } from './data/properties'; // REMOVER
```

#### 1.3 ConfigPage — Form Validation + Live Preview
**En `apps/admin/src/pages/ConfigPage.tsx`:**
```tsx
// Zod validation en handleSubmit
const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const settings: Record<string, unknown> = {};
    
    for (const [key, value] of formData.entries()) {
        const [settingKey, valueType] = key.split('__'); // ej: "social__json"
        const validation = validateSetting(settingKey, value, valueType);
        if (!validation.valid) {
            pushToast({ type: 'error', title: `Error en ${settingKey}`, description: validation.error });
            return;
        }
        settings[settingKey] = valueType === 'json' ? JSON.parse(value as string) : value;
    }
    
    // Bulk upsert
    for (const [key, value] of Object.entries(settings)) {
        await upsertSetting(key, value, valueType, true);
    }
};

// Live Preview Panel
const [previewKey, setPreviewKey] = useState(0);
const PreviewPanel = () => (
    <iframe 
        key={previewKey} 
        src={`${import.meta.env.VITE_LANDING_URL}/?preview=true&ts=${Date.now()}`} 
        className="preview-iframe" 
        title="Vista previa en vivo"
    />
);
// Trigger refresh: setPreviewKey(k => k + 1) después de save exitoso
```

---

### FASE 2 — ALTO (Versionado + i18n + Visual Editor) — **~4 días**

#### 2.1 Versionado + Rollback
**Migración:** `supabase/migrations/0054_site_settings_versions.sql`
```sql
CREATE TABLE site_settings_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot jsonb NOT NULL, -- { key: { value, value_type, is_public, locale } }
    changed_keys text[] NOT NULL,
    changed_by uuid REFERENCES admin_users(id),
    change_summary text, -- "Updated hero_title, contact_whatsapp"
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_site_settings_versions_created ON site_settings_versions(created_at DESC);
```

**En `site.ts` — `upsertSetting` con versionado:**
```typescript
export async function upsertSetting(key: string, value: unknown, valueType: string, isPublic = true, locale = 'es-AR'): Promise<void> {
    // 1. Obtener settings actuales para snapshot
    const { data: current } = await supabase
        .from('site_settings')
        .select('key, value, value_type, is_public, locale')
        .eq('locale', locale);
    
    const snapshot = Object.fromEntries(
        (current ?? []).map(s => [s.key, { value: s.value, value_type: s.value_type, is_public: s.is_public, locale: s.locale }])
    );
    
    // 2. Upsert setting
    const { data: existing } = await supabase.from('site_settings').select('id').eq('key', key).eq('locale', locale).maybeSingle();
    if (existing) {
        await supabase.from('site_settings').update({ value: value as any, value_type: valueType, is_public: isPublic }).eq('id', existing.id);
    } else {
        await supabase.from('site_settings').insert({ key, value: value as any, value_type: valueType, is_public: isPublic, locale });
    }
    
    // 3. Crear versión (async, no bloquear)
    supabase.from('site_settings_versions').insert({
        snapshot,
        changed_keys: [key],
        changed_by: (await supabase.auth.getUser()).data.user?.id,
        change_summary: `Updated ${key}`,
    }).then(() => {});
}
```

**UI:** `ConfigPage` — pestaña "Historial" con lista versiones, diff viewer, botón "Restaurar".

#### 2.2 Multi-idioma (i18n)
**Migración:** `supabase/migrations/0055_site_settings_i18n.sql`
```sql
ALTER TABLE site_settings ADD COLUMN locale text NOT NULL DEFAULT 'es-AR';
CREATE UNIQUE INDEX uq_site_settings_key_locale ON site_settings(key, locale);

-- Datos semilla para en-US, pt-BR
INSERT INTO site_settings (key, value, value_type, is_public, locale) VALUES
('site_name', 'BIENENHAUS Properties', 'string', true, 'en-US'),
('site_name', 'BIENENHAUS Propriedades', 'string', true, 'pt-BR');
-- ... etc para keys públicas
```

**En `useSiteSettings`:**
```typescript
export function useSiteSettings(locale?: string) {
    const targetLocale = locale ?? (typeof navigator !== 'undefined' ? navigator.language : 'es-AR');
    const supportedLocales = ['es-AR', 'en-US', 'pt-BR'];
    const locale = supportedLocales.includes(targetLocale) ? targetLocale : 'es-AR';
    
    // Fetch con locale + fallback a es-AR
    const { data } = await supabase
        .from('site_settings')
        .select('key, value, value_type')
        .in('locale', [locale, 'es-AR'])
        .eq('is_public', true);
    
    // Merge: locale override sobre es-AR
    const merged = new Map();
    data?.filter(d => d.locale === 'es-AR').forEach(d => merged.set(d.key, d));
    data?.filter(d => d.locale === locale).forEach(d => merged.set(d.key, d));
    // ...
}
```

**Landing:** `html lang` dinámico, `hreflang` links, sitemap multi-idioma.

#### 2.3 Visual Editor — Drag-Drop Sections + Rich Text
**Librería:** `@dnd-kit/core` (compat Preact) + `tiptap` (rich text)
**En `ConfigPage` — Sección "Landing Content":**
```tsx
const LandingSectionsEditor = () => {
    const [sections, setSections] = useState<LandingSection[]>(defaultSections);
    
    // Drag-drop reorder
    const { sensor, useSensor, useSensors } = useSensors(useSensor(PointerSensor));
    
    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext items={sections.map(s => s.id)} strategy={rectSortingStrategy}>
                {sections.map(section => (
                    <SortableItem key={section.id} id={section.id}>
                        <SectionCard section={section} onUpdate={updateSection} />
                    </SortableItem>
                ))}
            </SortableContext>
        </DndContext>
    );
};

const SectionCard = ({ section, onUpdate }) => {
    // Rich text editor para description/content
    const editor = useEditor({ extensions: [StarterKit, Placeholder], content: section.content });
    return (
        <div className="section-card">
            <DragHandle /><SectionTypeBadge type={section.type} />
            <input value={section.title} onChange={e => onUpdate(section.id, { title: e.target.value })} />
            <EditorContent editor={editor} onChange={content => onUpdate(section.id, { content })} />
            <SectionTypeControls type={section.type} /> {/* Image picker, CTA config, etc */ }
        </div>
    );
};
```

---

### FASE 3 — MEDIO (WhatsApp Analytics + SEO + Testing) — **~2 días**

#### 3.1 WhatsApp Smart Routing + Analytics
**En `site-settings.ts` — `getNextWhatsAppUrl` extendido:**
```typescript
interface WhatsAppRoutingRule {
    type: 'schedule' | 'geo' | 'ab_test';
    config: {
        schedule?: { primary_hours: string; alt_hours: string; timezone: string };
        geo?: { country_primary: Record<string, string> }; // country_code -> phone
        ab_test?: { primary_weight: number; messages: string[] };
    };
    primary_phone: string;
    alt_phone?: string;
}

export function getNextWhatsAppUrl(settings: SiteSettings, context?: { visitorCountry?: string; visitorCity?: string }): string {
    const routing = settings.whatsapp_routing as WhatsAppRoutingRule;
    if (!routing) return toWhatsAppUrl(settings.contact.whatsapp ?? '');
    
    const now = new Date();
    
    // 1. Schedule routing
    if (routing.type === 'schedule' && routing.config.schedule) {
        const { primary_hours, alt_hours, timezone } = routing.config.schedule;
        const isPrimaryTime = isTimeInRange(now, primary_hours, timezone);
        return isPrimaryTime ? toWhatsAppUrl(routing.primary_phone) : toWhatsAppUrl(routing.alt_phone ?? routing.primary_phone);
    }
    
    // 2. Geo routing
    if (routing.type === 'geo' && routing.config.geo && context?.visitorCountry) {
        const countryPhone = routing.config.geo.country_primary[context.visitorCountry];
        if (countryPhone) return toWhatsAppUrl(countryPhone);
    }
    
    // 3. A/B test
    if (routing.type === 'ab_test' && routing.config.ab_test) {
        const { primary_weight, messages } = routing.config.ab_test;
        const usePrimary = Math.random() < primary_weight;
        trackWhatsAppClick(usePrimary ? 'primary' : 'alt', messages[0]);
        return usePrimary ? toWhatsAppUrl(routing.primary_phone) : toWhatsAppUrl(routing.alt_phone ?? routing.primary_phone);
    }
    
    return toWhatsAppUrl(routing.primary_phone);
}
```

**Analytics Edge Function:** `supabase/functions/whatsapp-analytics/index.ts`
```typescript
// POST { number_type: 'primary'|'alt', message_template?: string, visitor_country?: string }
async function trackClick(data: ClickData) {
    await supabase.from('whatsapp_clicks').insert({
        number_type: data.number_type,
        message_template: data.message_template,
        visitor_country: data.visitor_country,
        visitor_city: data.visitor_city,
        referrer: data.referrer,
        user_agent: data.user_agent,
        clicked_at: new Date().toISOString(),
    });
}
```

#### 3.2 SEO Centralizado + Dynamic Sitemap/Robots
**Edge Functions:**
- `supabase/functions/sitemap-generate/index.ts` — XML dinámico con URLs de properties + static pages
- `supabase/functions/robots-txt/index.ts` — Dinámico según `robots_txt` setting

**En `ConfigPage` — SEO Section:**
```tsx
<SectionCard title="SEO & Metadata">
    <RichTextEditor key="seo_title" label="Title Tag" maxLength={60} />
    <RichTextEditor key="seo_description" label="Meta Description" maxLength={160} />
    <RichTextEditor key="seo_keywords" label="Keywords (comma separated)" />
    <ImagePicker key="og_image" label="Open Graph Image" />
    <Select key="twitter_card" options={['summary', 'summary_large_image']} />
    <RichTextEditor key="structured_data" label="Custom JSON-LD" valueType="json" />
    <Button onClick={() => openGooglePreview()}>Probar en Google Rich Results</Button>
</SectionCard>
```

#### 3.2 i18n Landing Integration
- `html lang` dinámico, `hreflang` links dinámicos
- `navigator.language` detection + URL param override
- Sitemap multi-idioma

---

### FASE 4 — TESTING + OBSERVABILIDAD — **~2 días**

#### 4.1 Testing
- Unit: `mapSettings`, `getNextWhatsAppUrl`, `toWhatsAppUrl`, `validateSetting`, version diff
- Integration: Admin save → realtime broadcast → landing `useSiteSettings` update → UI re-render
- E2E: Edit hero title → preview updates → publish → landing shows new title; Version rollback restores previous

#### 4.2 Observabilidad
**Structured Logs en `site.ts`:**
```typescript
function logConfigChange(action: 'create' | 'update' | 'delete' | 'rollback', key: string, metadata?: any) {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        action: `config_${action}`,
        key,
        ...metadata,
    }));
}
```

**Metrics Edge Function:** `supabase/functions/site-settings-metrics/index.ts`
```typescript
// Agregar clicks WhatsApp, config changes, rollback count, realtime sync latency
```

**Dashboard Admin:** `ConfigPage` — pestaña "Analytics" con charts.

---

## 📁 Archivos a Crear / Modificar

### Nuevos Archivos
- [ ] `supabase/functions/_shared/site-validation.ts`
- [ ] `supabase/functions/whatsapp-analytics/index.ts`
- [ ] `supabase/functions/sitemap-generate/index.ts`
- [ ] `supabase/functions/robots-txt/index.ts`
- [ ] `supabase/migrations/0054_site_settings_versions.sql`
- [ ] `supabase/migrations/0055_site_settings_i18n.sql`
- [ ] `apps/admin/src/lib/__tests__/site-settings.validation.test.ts`
- [ ] `apps/admin/src/lib/__tests__/site-settings.versioning.test.ts`
- [ ] `apps/admin/src/lib/__tests__/site-settings.whatsapp.test.ts`
- [ ] `apps/admin/e2e/site-settings-flows.spec.ts`
- [ ] `apps/admin/src/components/SectionCard.tsx` (drag-drop, rich text)
- [ ] `apps/admin/src/components/DiffViewer.tsx` (version diff)

### Modificar
- [ ] `apps/admin/src/lib/site.ts` — Zod validation, versionado, i18n, WhatsApp routing
- [ ] `apps/admin/src/lib/site-settings.ts` — `getNextWhatsAppUrl` extendido, analytics track
- [ ] `apps/admin/src/pages/ConfigPage.tsx` — Visual editor, live preview, version history, i18n tabs
- [ ] `apps/landing/src/lib/supabase-data.ts` — `useSiteSettings(locale)`, eliminar mock fallback
- [ ] `apps/landing/src/lib/site-settings.ts` — `getNextWhatsAppUrl` con analytics track
- [ ] `apps/landing/src/App.tsx` — eliminar mock imports, `html lang` dinámico, hreflang
- [ ] `apps/landing/index.html` — `hreflang` links dinámicos (via script)

---

## 📊 Métricas de Éxito

| KPI | Baseline | Target |
|-----|----------|--------|
| Config change → landing update latency | ~2s (realtime) | **<500ms** |
| Config validation errors | Manual | **0 (inline)** |
| WhatsApp click tracking | 0% | **100% (primary/alt)** |
| Multi-lang support | 1 (es) | **3 (es/en/pt)** |
| Version rollback time | Manual (dev) | **<10s (admin UI)** |
| TypeScript errors | ~10 | **0** |
| Test coverage | 0% | **≥80%** |

---

## 📅 Cronograma (2 semanas)

| Semana | Días | Entregables |
|--------|------|-------------|
| 1 | 1-2 | Zod schemas, eliminar mock, type safety, validation inline |
| 1 | 3-4 | Versionado + rollback UI, i18n structure + locale fallback |
| 1 | 5 | Visual editor: drag-drop sections, rich text, live preview iframe |
| 2 | 1-2 | WhatsApp smart routing + analytics, SEO centralizado + sitemap/robots |
| 2 | 3 | i18n landing integration (hreflang, locale detection) |
| 2 | 4 | Unit tests, integration tests, E2E 3 flujos |
| 2 | 5 | Observabilidad, analytics dashboard, code review |

---

## ⚠️ Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Live preview iframe CSP/CORS | `sandbox="allow-scripts allow-same-origin"` + `Content-Security-Policy` header en landing |
| Rich text XSS | TipTap `dangerouslyPasteHTML` desactivado, sanitize output con DOMPurify |
| i18n fallback loops | Memoize locale resolution, max 1 fallback hop |
| Drag-drop en mobile | Touch sensor + fallback click-to-move buttons |
| Sitemap generation timeout | Stream XML response, cache 1h, batch property URLs |
| Realtime sync lag | Monitor `realtime_sync_lag_ms`, alert > 5s |

---

**Documento vivo** — El CMS es el "cerebro" de la landing; cambios aquí impactan TODO el sitio público.