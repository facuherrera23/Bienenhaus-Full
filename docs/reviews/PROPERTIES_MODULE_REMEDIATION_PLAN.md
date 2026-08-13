# Plan de Remediación Completa — Módulo Properties CRUD

**Objetivo:** Llevar el módulo Properties de **~95% funcional → 100% production-ready** con type safety estricta, tests completos, validación server-side, performance optimizada y accesibilidad.

---

## 📍 Estado Actual (Resumen)

| Área                | % Completo | Bloqueadores para 100%                                           |
| ------------------- | ---------- | ---------------------------------------------------------------- |
| CRUD Core           | 95%        | Validación mínima, reorder no transaccional                      |
| Gestión Imágenes    | 90%        | Upload secuencial, validación solo client-side, WebP client-only |
| Formulario Avanzado | 90%        | Sin validación price/location required, autosave solo local      |
| Landing Integration | 100%       | Realtime full refetch (no incremental)                           |
| **Type Safety**     | **80%**    | `as unknown as` en callRpc, `any` en WebP conversion             |
| **Testing**         | **5%**     | Solo 1 test unitario, sin integration/E2E                        |
| **Performance**     | **75%**    | Imágenes secuenciales, realtime ineficiente                      |
| **Accesibilidad**   | **70%**    | Gallery sin keyboard navigation                                  |
| **Seguridad**       | **80%**    | File validation solo client, storage policies básicas            |

---

## 🎯 Criterios de Aceptación — "100% Funcional"

El módulo se considera **100% funcional** cuando **TODOS** los siguientes criterios se cumplen:

### ✅ Funcionalidad Core

- [ ] CRUD completo con validación Zod server + client
- [ ] Soft-delete / restore / permanent-delete con cleanup storage atómico
- [ ] Duplicate crea propiedad independiente (slug único, status borrador, sin copiar imágenes)
- [ ] Reorder imágenes transaccional (RPC atómico)
- [ ] Cover selection enforced (solo una por propiedad)

### ✅ Gestión de Imágenes

- [ ] Upload paralelo (`Promise.allSettled`) — <3s para 5 imágenes
- [ ] Validación server-side: MIME type, tamaño (10MB), dimensiones (max 2000px para ML)
- [ ] Conversión WebP server-side (Edge Function Sharp) + fallback client
- [ ] Reorder accesible por teclado (arrow keys, enter, space)
- [ ] Cleanup storage automático en delete property/imagen

### ✅ Formulario

- [ ] Validación completa: price required si publicada, location_id required, area_covered ≤ area_total
- [ ] YouTube ID extraction + embed URL generation
- [ ] Draft sync server (`property_drafts` table) — multi-device
- [ ] Autosave debounced 30s + indicator visual

### ✅ Landing Integration

- [ ] Realtime incremental (parse `postgres_changes` payload vs full refetch)
- [ ] Cache 5min + stale-while-revalidate
- [ ] Tipos unificados admin/landing (eliminar duplicación `PropertyCardData`)

### ✅ Type Safety (Strict)

- [ ] **Cero `any`** en `properties.ts`, `PropertyImageGallery.tsx`, `supabase-data.ts`
- [ ] **Cero `as unknown as`** — `callRpc` type-safe, Zod validation runtime
- [ ] Tipos DB sincronizados con tipos manuales

### ✅ Testing (Cobertura Mínima)

| Tipo        | Cobertura Mínima      | Archivos Objetivo                                                   |
| ----------- | --------------------- | ------------------------------------------------------------------- |
| Unit        | **80%**               | `properties.ts` mappers, CRUD, images, helpers                      |
| Integration | **50%**               | Create→publish→ML, soft-delete→restore, permanent delete cleanup    |
| E2E         | **3 flujos críticos** | Create+images+reorder+publish, Soft-delete→trash→restore, Duplicate |
| Visual      | **Gallery + Form**    | Playwright screenshots PropertyImageGallery, PropertyFormPage       |

### ✅ Performance

- [ ] Image upload 5 archivos **<3s** (actual ~10s)
- [ ] Form load (edit) **<150ms** (actual ~400ms)
- [ ] Landing catalog fetch **<200ms** (actual ~600ms)
- [ ] Reorder 10 imágenes **<200ms** (actual ~800ms)

### ✅ Accesibilidad (WCAG AA)

- [ ] Gallery: keyboard navigation completa
- [ ] Form: labels, aria-describedby, error announcements
- [ ] Map picker: accessible alternative (input lat/lng manual)

---

## 📋 Plan de Trabajo Priorizado

### FASE 1 — CRÍTICO (Bloquean 100%) — **~3 días**

#### 1.1 Zod Schemas + Validación Server/Client

**Archivos nuevos:**

- `supabase/functions/_shared/validation.ts` — Zod schemas
- `apps/admin/src/lib/validation.ts` — Re-export para admin

**Schemas clave:**

```typescript
// validation.ts
import { z } from 'zod';

export const PropertyFormSchema = z
    .object({
        title: z.string().min(3, 'Mínimo 3 caracteres').max(120),
        status: z.enum([
            'borrador',
            'en_revision',
            'publicada',
            'pausada',
            'vendida',
            'alquilada',
            'archivada',
        ]),
        listing_type: z.enum(['venta', 'alquiler', 'venta_alquiler', 'emprendimiento']),
        price: z.number().positive().nullable(),
        currency: z.enum(['USD', 'ARS']),
        expenses: z.number().min(0).nullable(),
        description: z.string().max(5000).optional(),
        address: z.string().max(200).optional(),
        location_id: z.string().uuid().nullable(),
        area_total: z.number().positive().nullable(),
        area_covered: z.number().positive().nullable(),
        bedrooms: z.number().int().min(0).max(20).nullable(),
        bathrooms: z.number().int().min(0).max(20).nullable(),
        garages: z.number().int().min(0).max(10).nullable(),
        floors: z.number().int().min(0).max(50).nullable(),
        year_built: z
            .number()
            .int()
            .min(1800)
            .max(new Date().getFullYear() + 1)
            .nullable(),
        featured: z.boolean(),
        video_url: z.string().url().optional().or(z.literal('')),
        latitude: z.number().min(-90).max(90).nullable(),
        longitude: z.number().min(-180).max(180).nullable(),
    })
    .refine((data) => data.status !== 'publicada' || (data.price !== null && data.price > 0), {
        message: 'Precio obligatorio para publicar',
        path: ['price'],
    })
    .refine((data) => data.status !== 'publicada' || data.location_id !== null, {
        message: 'Zona obligatoria para publicar',
        path: ['location_id'],
    })
    .refine(
        (data) =>
            data.area_covered === null ||
            data.area_total === null ||
            data.area_covered <= data.area_total,
        { message: 'Superficie cubierta no puede exceder total', path: ['area_covered'] },
    );

export const PropertyImageSchema = z
    .object({
        property_id: z.string().uuid(),
        file: z.instanceof(File),
        alt: z.string().max(200).optional(),
    })
    .refine((data) => data.file.size <= 10 * 1024 * 1024, {
        message: 'Máximo 10 MB',
        path: ['file'],
    })
    .refine((data) => data.file.type.startsWith('image/'), {
        message: 'Debe ser una imagen',
        path: ['file'],
    });
```

**Uso en `properties.ts`:**

```typescript
// ANTES: sin validación
// DESPUÉS:
const validated = PropertyFormSchema.parse(values);
// En upload:
const validated = PropertyImageSchema.parse({ propertyId, file, alt });
```

#### 1.2 Parallel Image Upload

**En `properties.ts` — `uploadPropertyImages`:**

```typescript
export async function uploadPropertyImages(
    propertyId: string,
    files: File[],
): Promise<PropertyImage[]> {
    const uploadOne = async (file: File) => {
        try {
            return await uploadPropertyImage(propertyId, file, file.name);
        } catch (err) {
            console.warn(`[uploadPropertyImages] Failed ${file.name}:`, err);
            return null;
        }
    };

    const results = await Promise.allSettled(files.map(uploadOne));
    const images: PropertyImage[] = [];
    results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value) images.push(r.value);
        else
            console.error(
                `Upload failed for ${files[i].name}:`,
                r.status === 'rejected' ? r.reason : 'no result',
            );
    });
    return images;
}
```

#### 1.3 Server-Side Image Validation (Edge Function)

**Archivo nuevo:** `supabase/functions/validate-image/index.ts`

```typescript
import { createClient } from 'npm:@supabase/supabase-js@2';
import { jsonResponse, optionsResponse } from '../_shared/http.ts';

const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
);

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024;
const MAX_DIMENSION = 2000; // ML requirement

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return optionsResponse(req);
    if (req.method !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return jsonResponse(400, { error: 'No file provided' });

    // Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
        return jsonResponse(400, { error: `Tipo no permitido: ${file.type}` });
    }
    // Validar tamaño
    if (file.size > MAX_SIZE) {
        return jsonResponse(400, { error: `Archivo supera ${MAX_SIZE / 1024 / 1024} MB` });
    }
    // Validar dimensiones (leer header)
    const arrayBuffer = await file.arrayBuffer();
    const dimensions = await getImageDimensions(new Uint8Array(arrayBuffer), file.type);
    if (dimensions.width > MAX_DIMENSION || dimensions.height > MAX_DIMENSION) {
        return jsonResponse(400, {
            error: `Dimensiones máximas ${MAX_DIMENSION}x${MAX_DIMENSION}px`,
        });
    }

    return jsonResponse(200, { ok: true, width: dimensions.width, height: dimensions.height });
});

async function getImageDimensions(
    bytes: Uint8Array,
    type: string,
): Promise<{ width: number; height: number }> {
    // Parse JPEG/PNG/WebP headers (simplified)
    // ...
}
```

**En `PropertyImageGallery.tsx`:** Llamar `validate-image` antes de upload (opcional, defense in depth).

#### 1.4 Transaccional Reorder (RPC)

**Migración:** `supabase/migrations/0040_property_reorder_rpc.sql`

```sql
CREATE OR REPLACE FUNCTION reorder_property_images(p_property_id uuid, p_image_ids uuid[])
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    img_id uuid;
    pos int := 0;
BEGIN
    FOREACH img_id IN ARRAY p_image_ids LOOP
        UPDATE property_images
        SET position = pos
        WHERE id = img_id AND property_id = p_property_id;
        pos := pos + 1;
    END LOOP;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ninguna imagen actualizada';
    END IF;
END;
$$;
```

**En `properties.ts`:**

```typescript
export async function reorderPropertyImages(propertyId: string, imageIds: string[]): Promise<void> {
    const { error } = await supabase.rpc('reorder_property_images', {
        p_property_id: propertyId,
        p_image_ids: imageIds,
    });
    if (error) throw new Error(error.message);
}
```

---

### FASE 2 — ALTO (Calidad) — **~4 días**

#### 2.1 Unit Tests — Vitest (80% coverage)

**Archivos nuevos:**

```
apps/admin/src/lib/__tests__/
├── properties.mappers.test.ts      # toPropertyRow, toPropertyDetail, toFormValues, embedLocationName
├── properties.crud.test.ts         # createProperty, updateProperty, softDeleteProperty, restoreProperty, duplicateProperty
├── properties.images.test.ts       # uploadPropertyImage, deletePropertyImage, setPropertyCover, reorderPropertyImages
├── properties.helpers.test.ts      # slugify, toNumeric, convertToWebP (mock canvas)
└── validation.test.ts              # PropertyFormSchema, PropertyImageSchema
```

**Ejemplo `properties.mappers.test.ts`:**

```typescript
import { describe, it, expect } from 'vitest';
import { toPropertyRow, toPropertyDetail, toFormValues, embedLocationName } from '../properties';

describe('properties mappers', () => {
    it('toPropertyRow handles null location', () => {
        const row = {
            id: '1',
            code: 1,
            title: 'Test',
            status: 'publicada',
            listing_type: 'venta',
            price: 100,
            currency: 'USD',
            area_total: 100,
            bedrooms: 2,
            bathrooms: 1,
            featured: false,
            published_at: null,
            updated_at: '2024-01-01',
            location: null,
            images: [],
        };
        const mapped = toPropertyRow(row);
        expect(mapped.location).toBe('Sin zona');
    });

    it('toPropertyRow handles array location', () => {
        const row = { ...baseRow, location: [{ name: 'Villa Belgrano' }] };
        const mapped = toPropertyRow(row);
        expect(mapped.location).toBe('Villa Belgrano');
    });

    it('toFormValues preserves all fields', () => {
        const detail = { ...baseDetail, title: 'Casa', price: 200000 };
        const form = toFormValues(detail);
        expect(form.title).toBe('Casa');
        expect(form.price).toBe(200000);
    });
});
```

#### 2.2 Integration Tests

**Archivo:** `apps/admin/src/test/integration/property-crud.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Property CRUD Integration (local supabase)', () => {
    let supabase: SupabaseClient;
    let testPropertyId: string;

    beforeAll(async () => {
        supabase = createClient(localUrl, localAnonKey);
    });

    it('Create → Publish → ML enqueue', async () => {
        // 1. createProperty con price > 0, status=publicada
        // 2. Verify property_ml_meta created with status=pending
        // 3. Verify ml_sync_queue job enqueued (operation=publish)
    });

    it('Soft delete → Trash → Restore', async () => {
        // 1. softDeleteProperty
        // 2. Verify deleted_at set, not in useProperties list
        // 3. Verify appears in fetchDeletedProperties
        // 4. restoreProperty
        // 5. Verify deleted_at null, back in list
    });

    it('Permanent delete → Storage cleanup', async () => {
        // 1. Create property with images
        // 2. permanentDeleteProperty
        // 3. Verify property gone from DB
        // 4. Verify images removed from storage bucket
    });

    it('Duplicate → Independent property', async () => {
        // 1. duplicateProperty
        // 2. Verify new ID, title ends with "(Copia)"
        // 3. Verify status=borrador
        // 4. Verify images NOT copied (new property has 0 images)
        // 5. Modify original → duplicate unaffected
    });
});
```

#### 2.3 E2E Tests (Playwright) — 3 Flujos Críticos

**Archivo:** `apps/admin/e2e/property-flows.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Property Critical Flows', () => {
    test('Create property with images → reorder → set cover → publish', async ({ page }) => {
        await page.goto('/propiedades/nueva');
        // Fill basic tab
        await page.fill('[name="title"]', 'E2E Test Property');
        await page.fill('[name="price"]', '250000');
        await page.selectOption('[name="listing_type"]', 'venta');
        await page.selectOption('[name="currency"]', 'USD');

        // Upload images
        await page.setInputFiles('input[type="file"]', [
            'test/fixtures/img1.jpg',
            'test/fixtures/img2.jpg',
            'test/fixtures/img3.jpg',
        ]);
        await expect(page.locator('.image-gallery-item')).toHaveCount(3);

        // Reorder: drag 3rd to 1st
        const items = page.locator('.image-gallery-item');
        await items.nth(2).dragTo(items.nth(0));
        await expect(items.nth(0)).toContainText('3'); // position badge

        // Set cover on 2nd (now 1st after reorder)
        await items.nth(0).locator('button:has(.lucide-star)').click();
        await expect(items.nth(0)).toHaveClass(/is-cover/);

        // Publish
        await page.click('button:has-text("Guardar")');
        await expect(page.locator('.toast-success')).toBeVisible();

        // Verify landing
        await page.goto('/');
        await expect(page.locator('.property-card:has-text("E2E Test Property")')).toBeVisible();
    });

    test('Soft delete → Trash → Restore', async ({ page }) => {
        // 1. Go to property page
        // 2. Click delete → confirm
        // 3. Go to /papelera → verify listed
        // 4. Click restore → verify back in /propiedades
    });

    test('Duplicate property', async ({ page }) => {
        // 1. Property page → click duplicate
        // 2. Verify redirected to new property
        // 3. Verify title ends with "(Copia)"
        // 4. Verify status=borrador
        // 5. Verify 0 images in gallery
    });
});
```

#### 2.4 Landing Incremental Realtime

**En `supabase-data.ts` — `useProperties`:**

```typescript
// ANTES: fetchData() completo en cualquier cambio
// DESPUÉS: Parsear payload postgres_changes

const channel = supabase
    .channel('properties_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, (payload) => {
        if (payload.eventType === 'INSERT') {
            setData((prev) => [mapProperty(payload.new), ...prev]);
        } else if (payload.eventType === 'UPDATE') {
            setData((prev) =>
                prev.map((p) => (p.id === payload.new.id ? mapProperty(payload.new) : p)),
            );
        } else if (payload.eventType === 'DELETE') {
            setData((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
    })
    .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'property_images' },
        (payload) => {
            // Solo actualizar cover_url de la propiedad afectada
            const propertyId = payload.new?.property_id ?? payload.old?.property_id;
            if (propertyId) {
                setData((prev) =>
                    prev.map((p) => {
                        if (p.id !== propertyId) return p;
                        // Recalcular cover_url desde images array actualizado
                        return { ...p, cover_url: computeCoverUrl(payload) };
                    }),
                );
            }
        },
    )
    .subscribe();
```

---

### FASE 3 — MEDIO (Nice to have) — **~2 días**

#### 3.1 Server-Side WebP Conversion (Edge Function)

**Archivo nuevo:** `supabase/functions/convert-image/index.ts`

```typescript
// Sharp-based conversion + resize to max 2000px
import sharp from 'npm:sharp@0.33';

Deno.serve(async (req) => {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const maxWidth = Number(formData.get('maxWidth') ?? '2000');
    const quality = Number(formData.get('quality') ?? '85');

    const input = new Uint8Array(await file.arrayBuffer());
    const output = await sharp(input)
        .resize({ width: maxWidth, withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();

    return new Response(output, {
        headers: { 'content-type': 'image/webp' },
    });
});
```

**En `properties.ts` — `convertToWebP`:**

```typescript
async function convertToWebP(file: File, quality = 0.85): Promise<File> {
    // Try server first
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('quality', String(quality * 100));
        const res = await fetch(`${supabaseUrl}/functions/v1/convert-image`, {
            method: 'POST',
            body: formData,
        });
        if (res.ok) {
            const blob = await res.blob();
            return new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' });
        }
    } catch {
        // Fall through to client
    }
    // ... existing client-side canvas fallback
}
```

#### 3.2 Draft Sync Server

**Migración:** `supabase/migrations/0041_property_drafts.sql`

```sql
CREATE TABLE property_drafts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id uuid REFERENCES admin_users(id),
    property_id uuid REFERENCES properties(id), -- null para nuevo
    form_values jsonb NOT NULL,
    updated_at timestamptz DEFAULT now(),
    UNIQUE (admin_user_id, property_id)
);
CREATE INDEX idx_property_drafts_user ON property_drafts(admin_user_id);
```

**Hook:** `apps/admin/src/hooks/usePropertyDraft.ts`

```typescript
export function usePropertyDraft(propertyId: string | null) {
    const saveDraft = useCallback(
        async (values: Partial<PropertyFormValues>) => {
            await supabase.from('property_drafts').upsert({
                admin_user_id: user.id,
                property_id: propertyId,
                form_values: values,
            });
        },
        [propertyId],
    );

    const loadDraft = useCallback(async () => {
        const { data } = await supabase
            .from('property_drafts')
            .select('form_values')
            .eq('admin_user_id', user.id)
            .eq('property_id', propertyId)
            .maybeSingle();
        return data?.form_values ?? null;
    }, [propertyId]);

    return { saveDraft, loadDraft };
}
```

#### 3.3 Form Validation Completa

**En `PropertyFormPage.tsx` — `handleSubmit`:**

```typescript
const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const result = PropertyFormSchema.safeParse(values);
    if (!result.success) {
        const firstError = result.error.errors[0];
        pushToast({
            type: 'error',
            title: 'Validación falló',
            description: `${firstError.path.join('.')}: ${firstError.message}`,
        });
        // Scroll to field
        const field = document.querySelector(`[name="${firstError.path[0]}"]`);
        field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    // ... existing submit logic
};
```

#### 3.4 Gallery Keyboard Accessibility

**En `PropertyImageGallery.tsx`:**

```tsx
// En cada image-gallery-item:
<div
    key={img.id}
    className={...}
    draggable={true}
    onDragStart={(e) => handleDragStart(e, img.id)}
    onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            moveImage(img.id, 'next');
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            moveImage(img.id, 'prev');
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSetCover(img.id);
        } else if (e.key === 'Delete') {
            e.preventDefault();
            handleDelete(img.id);
        }
    }}
    tabIndex={0}
    role="button"
    aria-label={`Imagen ${index + 1}${img.is_cover ? ' (portada)' : ''}`}
>
```

---

## 📁 Archivos a Crear / Modificar (Checklist)

### Nuevos Archivos

- [ ] `supabase/functions/_shared/validation.ts`
- [ ] `supabase/functions/validate-image/index.ts`
- [ ] `supabase/functions/convert-image/index.ts`
- [ ] `supabase/migrations/0040_property_reorder_rpc.sql`
- [ ] `supabase/migrations/0041_property_drafts.sql`
- [ ] `apps/admin/src/lib/__tests__/properties.mappers.test.ts`
- [ ] `apps/admin/src/lib/__tests__/properties.crud.test.ts`
- [ ] `apps/admin/src/lib/__tests__/properties.images.test.ts`
- [ ] `apps/admin/src/lib/__tests__/properties.helpers.test.ts`
- [ ] `apps/admin/src/lib/__tests__/validation.test.ts`
- [ ] `apps/admin/src/test/integration/property-crud.test.ts`
- [ ] `apps/admin/e2e/property-flows.spec.ts`
- [ ] `apps/admin/src/hooks/usePropertyDraft.ts`

### Archivos a Modificar

- [ ] `apps/admin/src/lib/properties.ts` — parallel upload, Zod validation, RPC reorder, server WebP fallback
- [ ] `apps/admin/src/components/PropertyImageGallery.tsx` — keyboard accessibility, parallel upload hook
- [ ] `apps/admin/src/pages/PropertyFormPage.tsx` — Zod validation, draft sync, YouTube ID extraction
- [ ] `apps/landing/src/lib/supabase-data.ts` — incremental realtime parsing
- [ ] `apps/admin/src/lib/supabase.ts` — `callRpc` type-safe
- [ ] `apps/admin/src/lib/validation.ts` — re-export Zod schemas
- [ ] `apps/admin/vitest.config.ts` — test config
- [ ] `apps/admin/src/test/setup.ts` — mocks

---

## 🚀 Comandos de Validación

```bash
# TypeCheck
pnpm typecheck

# Unit tests coverage ≥ 80%
pnpm test -- --coverage

# Integration tests
pnpm dlx supabase start
pnpm test:integration -- --filter=property-crud

# E2E tests
pnpm build
pnpm test:e2e -- --project=chromium --grep="Property Critical"

# Visual regression (gallery + form)
pnpm test:visual -- --filter="PropertyImageGallery,PropertyFormPage"
```

---

## 📊 Métricas de Éxito (KPIs)

| KPI                            | Baseline | Target              | Medición              |
| ------------------------------ | -------- | ------------------- | --------------------- |
| Image upload 5 files           | ~10s     | **<3s**             | Browser DevTools      |
| Form load (edit)               | ~400ms   | **<150ms**          | React Query devtools  |
| Landing catalog fetch          | ~600ms   | **<200ms**          | Lighthouse            |
| Reorder 10 images              | ~800ms   | **<200ms**          | RPC duration log      |
| TypeScript errors              | ~8       | **0**               | `pnpm typecheck`      |
| Test coverage (properties lib) | 5%       | **≥80%**            | Vitest coverage       |
| E2E pass rate                  | N/A      | **100% (3 flujos)** | Playwright report     |
| Accessibility (axe)            | N/A      | **0 violations**    | Playwright + axe-core |

---

## 📅 Cronograma (1 semana / 1 ingeniero)

| Día | Enfoque                                                  | Entregables                    |
| --- | -------------------------------------------------------- | ------------------------------ |
| 1   | Zod schemas + validation + parallel upload               | Type safety, 3x upload speed   |
| 2   | Server image validation + transactional reorder          | Seguridad, data integrity      |
| 3   | Unit tests (80% coverage)                                | Regression prevention          |
| 4   | Integration + E2E tests (3 flujos)                       | Confianza deploy               |
| 5   | Landing incremental realtime + server WebP Edge Function | Performance + fallback robusto |

---

## ⚠️ Riesgos y Mitigaciones

| Riesgo                                         | Probabilidad | Impacto | Mitigación                                           |
| ---------------------------------------------- | ------------ | ------- | ---------------------------------------------------- |
| Leaflet SSR issues en build                    | Media        | Bajo    | Dynamic import ya implementado, testear `pnpm build` |
| WebP conversion falla en mobile Safari         | Media        | Medio   | Fallback server-side Edge Function                   |
| Realtime full refetch rompe landing UX         | Alta         | Medio   | Incremental parsing prioritario día 4                |
| Storage policies complejas para validate-image | Baja         | Alto    | Revisar con Supabase advisor antes de deploy         |

---

## ✅ Definition of Done

### Fase 1 Done When:

- [ ] Zod schemas validan form + images en runtime
- [ ] Upload paralelo funcionando (<3s para 5 imgs)
- [ ] Edge Function `validate-image` rechaza archivos inválidos
- [ ] RPC `reorder_property_images` atómico
- [ ] Cero `as unknown as` / `any` en properties lib

### Fase 2 Done When:

- [ ] Unit tests ≥80% coverage en mappers, CRUD, images, helpers
- [ ] Integration tests pasan: create→publish→ML, soft-delete→restore, permanent delete cleanup, duplicate
- [ ] E2E 3 flujos pasan en CI
- [ ] Landing realtime incremental (no full refetch)

### Fase 3 Done When:

- [ ] Edge Function `convert-image` operational + fallback client
- [ ] Draft sync server funcionando (multi-device)
- [ ] Form validation completa (price/location required, area logic, YouTube)
- [ ] Gallery keyboard accessible (axe 0 violations)
- [ ] Code review aprobado + merge a main

---

## 📚 Referencias

- **Zod:** https://zod.dev/
- **Sharp:** https://sharp.pixelplumbing.com/
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Vitest:** https://vitest.dev/
- **Playwright:** https://playwright.dev/
- **axe-core:** https://github.com/dequelabs/axe-core
- **AGENTS.md** — Known Weak Points, Critical Modules > Properties CRUD

---

**Documento vivo** — Actualizar conforme se completan tareas. Cada fase PR separado con tests pasando.
