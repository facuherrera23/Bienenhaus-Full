# Improvement Plan — Bienenhaus

> **Rol del agente**: Senior Backend & Security Engineer.
> Tu objetivo es mejorar la seguridad, corrección y eficiencia del codebase de
> Bienenhaus sin destruir nada que funcione. Cada cambio debe ser mínimo,
> preciso y justificable. No refactorizás por refactorizar — cada diff tiene
> un "por qué" claro y un "cómo" concreto.
>
> **Filosofía**: Si algo funciona y no es un problema, no lo toques. Los
> cambios se hacen solo donde hay un bug real, un riesgo de seguridad, o una
> ineficiencia medible. No hay churn por churn.
>
> **Order de ejecución**: Seguir el orden de la tabla (Impacto → Esfuerzo).
> Cada sección tiene: Contexto → Problema → Por qué importa → Cómo arreglar
> → Archivos afectados → Criterio de verificación.

---

## Resumen de cambios

| #  | Severidad | Esfuerzo | Archivos | Descripción |
|----|-----------|----------|----------|-------------|
| 01 | 🔴 Crítico | Bajo | `_shared/http.ts` | CORS wildcard → allowlist |
| 02 | 🔴 Crítico | Bajo | `site.ts` | Path extraction roto en `deleteSiteImage` |
| 03 | 🔴 Crítico | Medio | DB migration + TS | Valuation images base64 → Storage |
| 04 | 🟡 Importante | Bajo | `valuationService.ts` | Pagination off-by-one |
| 05 | 🟡 Importante | Bajo | `newsletter.ts` | CSV export sin escaping |
| 06 | 🟡 Importante | Bajo | `agents.ts` | `Math.random()` en agent assignment |
| 07 | 🟡 Importante | Medio | `newsletter.ts` | Bulk operations secuenciales → batch |
| 08 | 🟡 Importante | Bajo | `activity.ts` | Actor enrichment DRY refactor |
| 09 | 🟠 Bajo | Bajo | `.omo/run-continuation/` | Cleanup 201 sesiones viejas |
| 10 | 🟠 Bajo | Bajo | `activity.ts` | Re-export innecesario |

---

## 01 — CORS Wildcard → Allowlist

**Archivo**: `supabase/functions/_shared/http.ts`

### Contexto

Todas las 18 edge functions de Supabase usan `respond()` de `_shared/http.ts`
para setear headers CORS. Actualmente hardcodea `Access-Control-Allow-Origin: *`.

### Problema

`Allow-Origin: *` significa que **cualquier dominio** puede hacer requests
autenticados (con cookies o Authorization header) a tus edge functions. Un
atacante puede crear un sitio malicioso que haga llamadas a tu API usando las
credenciales del usuario que tenga sesión activa. Esto es un **CSRF sandwich**
— el atacante tiene el request, el usuario tiene las credenciales.

En desarrollo local es aceptable `*`, pero en producción (bienenhaus.com.ar)
debe ser un allowlist explícito.

### Por qué importa

- **Seguridad**: Cualquier sitio puede actuar como tu admin panel remotamente.
- **Compliance**: Si algún día vas a SOC2 o similar, CORS wildcard es un
  finding automático.
- **Realidad**: Solo existen 2 dominios que deben acceder: la landing y el admin.

### Cómo arreglar

1. Crear un `ALLOWED_ORIGINS` constante en `http.ts` que lea de
   `Deno.env.get('ALLOWED_ORIGINS')` con un fallback para dev:
   ```typescript
   const ALLOWED_ORIGINS = Deno.env.get('ALLOWED_ORIGINS')
       ?.split(',')
       .map((s) => s.trim())
       .filter(Boolean) ?? ['http://localhost:5173', 'http://localhost:5174'];
   ```

2. En `respond()`, reemplazar el header hardcodeado:
   ```typescript
   const origin = req.headers.get('origin') ?? '';
   const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
   // ...
   headers.set('Access-Control-Allow-Origin', allowedOrigin);
   ```

3. Para preflight OPTIONS, verificar el origin también.

4. En Supabase Cloud, setear el secret:
   ```
   supabase secrets set ALLOWED_ORIGINS=https://bienenhaus.com.ar,https://bienenhaus.com.ar/admin
   ```

### Archivos afectados

- `supabase/functions/_shared/http.ts` (único archivo de código)

### Criterio de verificación

- Landing en `localhost:5173` sigue funcionando (dev).
- Admin en `localhost:5174` sigue funcionando (dev).
- Request desde un dominio no-listado recibe `Access-Control-Allow-Origin` con
  el primer allowed origin (fallback), no `*`.
- Edge functions deployadas en cloud funcionan con el secret seteado.

---

## 02 — Path Extraction Roto en `deleteSiteImage`

**Archivo**: `apps/admin/src/lib/site.ts`

### Contexto

`deleteSiteImage(url)` extrae el storage path de una URL pública para
eliminarla de Supabase Storage.

### Problema

```typescript
// Línea 528 — actual
const path = url.split('/').pop();
```

Si la URL es
`https://xxx.supabase.co/storage/v1/object/public/site-images/img.webp?token=abc123`,
`.pop()` retorna `img.webp?token=abc123` — el path está contaminado con query
params. Supabase Storage no encuentra el archivo, la eliminación falla
silenciosamente (catch vacío), y queda una imagen huérfana en storage.

Lo mismo ocurre con `deleteAgentPhoto` (línea 156 de `agents.ts`) que usa un
patrón diferente pero también frágil.

### Por qué importa

- Cada imagen huérfana en storage consume espacio y tiene costo real en
  Supabase (storage tier pricing).
- El catch vacío significa que nunca te enterás que falló.

### Cómo arreglar

En `deleteSiteImage`, extraer el path correctamente:

```typescript
export async function deleteSiteImage(url: string): Promise<void> {
    try {
        // La URL pública tiene formato:
        // https://xxx.supabase.co/storage/v1/object/public/site-images/<path>
        // El path es todo lo que está después de '/site-images/' y antes de '?'
        const match = url.match(/\/site-images\/([^?]+)/);
        if (match) {
            await supabase.storage.from('site-images').remove([decodeURIComponent(match[1])]);
        }
    } catch (err) {
        console.warn('[Site] No se pudo eliminar imagen del storage:', url, err);
    }
}
```

En `deleteAgentPhoto` (línea 156 de `agents.ts`), aplicar el mismo patrón
regex pero para `/agent-photos/`:

```typescript
export async function deleteAgentPhoto(url: string): Promise<void> {
    try {
        const match = url.match(/\/agent-photos\/([^?]+)/);
        if (match) {
            await supabase.storage.from('agent-photos').remove([decodeURIComponent(match[1])]);
        }
    } catch (err) {
        console.warn('[Agents] No se pudo eliminar foto del storage:', url, err);
    }
}
```

### Archivos afectados

- `apps/admin/src/lib/site.ts` (función `deleteSiteImage`)
- `apps/admin/src/lib/agents.ts` (función `deleteAgentPhoto`)

### Criterio de verificación

- Subir una imagen de sitio, copiar la URL pública, llamar `deleteSiteImage`
  con query params incluidos → el archivo se elimina correctamente de storage.
- El `console.warn` aparece solo cuando hay un error real, no cuando el path
  es inválido.

---

## 03 — Valuation Images: Base64 → Storage

**Archivos**: `supabase/migrations/` + `apps/admin/src/lib/valuationService.ts`

### Contexto

El módulo Tasar almacena fotos de fachadas y comparables como base64 en
columnas `jsonb` de la tabla `valuation_images` (y también inline en
`property_valuations.foto_fachada_url`). Cada foto típica de手机son ~1-5MB
en base64 (33% overhead vs binario).

### Problema

- **DB size**: Cada tasación con 6 fotos = ~12-30MB de base64 en la DB.
  Con 500 tasaciones = 6-15GB de datos blob en PostgreSQL, que es un motor
  relacional optimizado para datos tabulares, no para blobs.
- **Performance**: Leer/escribir filas con blobs grandes es lento. Las
  replicas, backups y migraciones se vuelven pesados.
- **Costo**: Supabase cobran por DB size. Los blobs inflados aumentan la
  factura innecesariamente.
- **No hay crispness**: Las imágenes base64 no se pueden servir con cache
  headers, CDN, ni procesamiento de imágenes (resize, WebP conversion).

### Por qué importa

- Es el problema de scalability #1 del proyecto. A medida que se usen más
  tasaciones, la DB se degrada linealmente.
- Las imágenes en Storage se benefician de CDN, cache, y compression
  automáticamente.

### Cómo arreglar

**Fase 1 (Migración de datos existentes)**:

1. Crear edge function `migrate-valuation-images` que:
   - Lee todas las `property_valuations` con `foto_fachada_url` que sea base64
     (empieza con `data:image/` o es muy largo para ser URL).
   - Decodifica base64 → binary.
   - Sube a bucket `valuation-images` (nuevo bucket, o usar `property-images`).
   - Actualiza la columna con la URL pública de Storage.
   - Repite para `valuation_images.url` donde el valor sea base64.

2. Crear migración SQL que:
   - Crea bucket `valuation-images` (si no existe).
   - Agrega una columna temporal `foto_fachada_url_new text` para la transición.

**Fase 2 (Código nuevo)**:

3. En `valuationService.ts`, modificar `syncImages` y `toDbInsert` para que
   `f_fotoFachada` se suba a Storage en vez de guardarse inline.

4. Crear helper `uploadValuationImage(file: File): Promise<string>` similar a
   `uploadAgentPhoto`.

**Fase 3 (Cleanup)**:

5. Migración SQL que elimina las columnas viejas de base64 y renombra las nuevas.

### Archivos afectados

- `supabase/functions/migrate-valuation-images/index.ts` (nuevo, temporal)
- `supabase/migrations/NNNN_valuation_images_to_storage.sql`
- `apps/admin/src/lib/valuationService.ts` (upload helper + syncImages)

### Criterio de verificación

- Tasaciones existentes muestran imágenes correctamente después de la migración.
- Nuevas tasaciones suben fotos a Storage, no a DB.
- Tamaño de DB reducido mediblemente (`pg_size_pretty(pg_total_relation_size('property_valuations'))`).
- Las imágenes se cargan igual de rápido o más rápido (CDN).

---

## 04 — Pagination Off-by-One en Valuation Service

**Archivo**: `apps/admin/src/lib/valuationService.ts`

### Contexto

`fetchAll()`接受 pagination 参数 `page` y `pageSize`.

### Problema

```typescript
// Línea 387
if (page !== undefined && pageSize !== undefined && pageSize > 0) {
    const from = page * pageSize;  // ← BUG: page es 1-based
    query = query.range(from, from + pageSize - 1);
}
```

El parámetro `page` es 1-based (el default es `page: 1` desde los filtros),
pero el cálculo trata como 0-based. Cuando el usuario pide `page=1`, el
offset es `1 * 20 = 20`, saltándose los primeros 20 resultados.

Comparar con `activity.ts:242-243` donde sí lo hace bien:
```typescript
const from = (page - 1) * pageSize;
const to = from + pageSize - 1;
```

### Por qué importa

- La primera página de resultados nunca aparece en la UI de tasaciones.
- El usuario ve una página vacía o resultados incompletos.
- Es un bug real que afecta la usabilidad del módulo Tasar.

### Cómo arreglar

```typescript
// Línea 387 — corregir
if (page !== undefined && pageSize !== undefined && pageSize > 0) {
    const from = (page - 1) * pageSize;  // page es 1-based
    query = query.range(from, from + pageSize - 1);
}
```

### Archivos afectados

- `apps/admin/src/lib/valuationService.ts` (una línea)

### Criterio de verificación

- Abrir la lista de tasaciones, tener >20 items → la primera página muestra
  los primeros 20, la segunda los siguientes 20.
- `page=1, pageSize=20` retorna items 0-19 (no 20-39).

---

## 05 — CSV Export Sin Escaping

**Archivo**: `apps/admin/src/lib/newsletter.ts`

### Contexto

`exportSubscribersToCSV()` genera un CSV manualmente con `row.join(',')`.

### Problema

Si un email contiene una coma (válido en emails locales como `"foo,bar"@example.com`),
o si algún campo futuro tiene coma, el CSV se genera corrupto — las columnas
se desplazan.

RFC 4180 especifica que los campos con comillas, comas o saltos de línea
deben envolverse en comillas dobles y las comillas internas se escapan
duplicándolas.

### Por qué importa

- El CSV exportado se importa en Google Sheets, Excel, CRMs. Un CSV corrupto
  causa pérdida de datos o import fallido.
- Es un fix de 5 minutos con impacto real en data portability.

### Cómo arreglar

Crear helper `csvEscape` y usarlo:

```typescript
function csvEscape(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}
```

En `exportSubscribersToCSV`, reemplazar:
```typescript
// Antes
const rows = subscribers.map((s) => [
    s.email,
    NEWSLETTER_STATUS_LABEL[s.status] ?? s.status,
    NEWSLETTER_SOURCE_LABEL[s.source] ?? s.source,
    new Date(s.created_at).toLocaleDateString('es-AR'),
]);

// Después
const rows = subscribers.map((s) => [
    csvEscape(s.email),
    csvEscape(NEWSLETTER_STATUS_LABEL[s.status] ?? s.status),
    csvEscape(NEWSLETTER_SOURCE_LABEL[s.source] ?? s.source),
    csvEscape(new Date(s.created_at).toLocaleDateString('es-AR')),
]);
```

### Archivos afectados

- `apps/admin/src/lib/newsletter.ts`

### Criterio de verificación

- Exportar CSV con un email que contenga coma → el CSV se abre correctamente
  en Google Sheets y Excel.
- Los campos sin comas siguen sin comillas (legibilidad).

---

## 06 — `Math.random()` en Agent Assignment

**Archivo**: `apps/admin/src/lib/agents.ts`

### Contexto

`findBestAgent()` asigna leads a agentes usando un scoring system:
+30 por especialidad, +30 por carga baja, +20 por disponibilidad horaria.
Pero en la línea 449 agrega:

```typescript
score += Math.round(Math.random() * 4 - 2);  // -2 a +2 aleatorio
```

### Problema

El componente aleatorio causa que:
- El **mismo lead** reintentado puede asignarse a un **agente diferente**.
- No hay reproducibilidad — no podés determinar por qué se asignó a X en vez
  de Y.
- El rango (-2 a +2) es pequeño pero suficiente para desempatar entre agentes
  con scores similares, haciendo la asignación no-determinista.

### Por qué importa

- Si un lead falla al asignarse y se reintentá, puede ir a otro agente,
  causando confusión.
- La trazabilidad del audit log pierde sentido: "¿por qué este lead fue
  asignado a Ana y no a Pedro?" → "porque random".

### Cómo arreglar

Eliminar la línea de `Math.random()` y usar un desempate determinístico:

```typescript
// Reemplazar la línea de Math.random() con:
// Desempate determinístico: primero por lead_count asc, luego por name asc
const agentLeads = Array.isArray(agent.leads) ? agent.leads.length : 0;
score -= agentLeads * 0.1;  // desempate sutil por carga

return { agent_id: agent.id, name: agent.name, score };
```

O simplemente eliminar la línea de random — el sorting por `score` ya es
estable (JavaScript sort es estable), así que agentes con el mismo score
mantienen su orden original (sort_order), que es intencional.

### Archivos afectados

- `apps/admin/src/lib/agents.ts` (una línea)

### Criterio de verificación

- Dos leads idénticos asignados al mismo grupo de agentes → siempre asignan
  al mismo agente.
- `findBestAgent` es idempotente para el mismo input.

---

## 07 — Bulk Operations Secuenciales → Batch

**Archivo**: `apps/admin/src/lib/newsletter.ts`

### Contexto

`bulkCreateSubscribers`, `bulkUpdateSubscribers`, `bulkDeleteSubscribers`
hacen loops con `await` uno por uno.

### Problema

Para N items, cada operación hace N requests secuenciales a Supabase.
- 100 suscriptores = 100 roundtrips (~10-30 segundos).
- 1000 suscriptores = 1000 roundtrips (~2-5 minutos).

Supabase (PostgREST) soporta batch operations nativamente:
- `insert([...])` acepta arrays de rows.
- `update().in('id', [...])` actualiza múltiples filas.
- `delete().in('id', [...])` elimina múltiples filas.

### Por qué importa

- El admin puede importar una lista de 500 emails desde un CSV. Con
  secuencial esto tarda minutos. Con batch, unos segundos.
- El usuario ve un spinner durante todo el tiempo. Una UI de 5 minutos
  es inaceptable.

### Cómo arreglar

**`bulkCreateSubscribers`** → usar insert batch con upsert:
```typescript
export async function bulkCreateSubscribers(
    emails: string[],
    source: NewsletterSource = 'manual',
): Promise<{ created: number; skipped: number }> {
    const rows = emails.map((email) => ({
        email,
        source,
        status: 'active' as const,
    }));

    // PostgREST upsert: inserta los que no existen, ignora duplicados
    const { data, error } = await supabase
        .from('newsletter_subscribers')
        .upsert(rows, { onConflict: 'email', ignoreDuplicates: false })
        .select('id');

    if (error) throw new Error(error.message);
    // Los que ya existían con status activo no se cuentan como "created"
    return { created: data?.length ?? 0, skipped: emails.length - (data?.length ?? 0) };
}
```

**`bulkDeleteSubscribers`** → usar delete batch:
```typescript
export async function bulkDeleteSubscribers(
    ids: string[],
    permanent = false,
): Promise<number> {
    if (ids.length === 0) return 0;

    if (permanent) {
        const { error } = await supabase
            .from('newsletter_subscribers')
            .delete()
            .in('id', ids);
        if (error) throw new Error(error.message);
        return ids.length;
    }

    const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', ids);
    if (error) throw new Error(error.message);
    return ids.length;
}
```

**`bulkUpdateSubscribers`** → usar update batch:
```typescript
export async function bulkUpdateSubscribers(
    ids: string[],
    params: { status?: NewsletterStatus; source?: NewsletterSource },
): Promise<number> {
    if (ids.length === 0) return 0;

    const { error } = await supabase
        .from('newsletter_subscribers')
        .update(params)
        .in('id', ids);
    if (error) throw new Error(error.message);
    return ids.length;
}
```

### Archivos afectados

- `apps/admin/src/lib/newsletter.ts` (3 funciones)

### Criterio de verificación

- Importar 100 emails → completa en <2 segundos (vs ~10s antes).
- Duplicados no causan error ni duplican filas.
- Soft delete de 50 suscriptores → todas se marcan en una query.

---

## 08 — Actor Enrichment DRY Refactor

**Archivo**: `apps/admin/src/lib/activity.ts`

### Contexto

Tres funciones (`fetchRecentActivity`, `fetchActivity`, `fetchActivityByEntity`)
contienen el mismo bloque copy-paste de 20+ líneas que:
1. Extrae `actor_id` únicos de las activities.
2. Busca los users correspondientes en `admin_users`.
3. Mapea los datos de vuelta.

### Problema

- **DRY violation**: El mismo bloque 3 veces. Si cambiás la lógica (ej.
  agregar campos del actor, cambiar la query), tenés que cambiar 3 lugares.
- **Mantenibilidad**: Un bug fix en un bloque puede no aplicarse a los otros.
- **Readability**: Cada función tiene ~50% de código que no es de su dominio.

### Por qué importa

- Es mantenibilidad pura. No es un bug, pero es deuda técnica que causa bugs
  futuros cuando alguien cambia un bloque y olvida los otros.

### Cómo arreglar

Extraer una función privada:

```typescript
async function enrichWithActors<T extends { actor_id: string | null }>(
    rows: T[],
): Promise<Array<T & { actor_name: string | null; actor_email: string | null }>> {
    const actorIds = [
        ...new Set(
            rows
                .map((r) => r.actor_id)
                .filter((id): id is string => id !== null),
        ),
    ];

    const usersById = new Map<string, { full_name: string; email: string }>();

    if (actorIds.length > 0) {
        const { data: users, error } = await supabase
            .from('admin_users')
            .select('id, full_name, email')
            .in('id', actorIds);

        if (!error) {
            for (const u of users ?? []) {
                usersById.set(u.id, u);
            }
        }
    }

    return rows.map((r) => {
        const actor = r.actor_id ? usersById.get(r.actor_id) : undefined;
        return {
            ...r,
            actor_name: actor?.full_name ?? null,
            actor_email: actor?.email ?? null,
        };
    });
}
```

Luego reemplazar los bloques repetidos en cada función con:
```typescript
const enriched = await enrichWithActors(activities);
return enriched;
```

### Archivos afectados

- `apps/admin/src/lib/activity.ts`

### Criterio de verificación

- Las 3 funciones siguen retornando los mismos datos (mismos campos
  `actor_name`, `actor_email`).
- `pnpm typecheck` pasa sin errores.
- Los tests existentes (si los hay) pasan.

---

## 09 — Cleanup de Sesiones `.omo/run-continuation/`

**Directorio**: `.omo/run-continuation/`

### Contexto

Hay 201 archivos JSON de sesiones viejas de OpenCode en este directorio.

### Problema

- **Repo size**: Cada archivo JSON es ~1-10KB. 201 archivos = ~200KB-2MB de
  basura en el repo.
- **Confusión**: Un desarrollador que clone el repo ve 200+ archivos de
  "mystery data".
- **Git history**: Si algún día se borran, el bloat ya quedó en el history
  (pero al menos dejan de crecer).

### Por qué importa

- Es limpieza mínima. No es un bug ni un security risk, pero es una mejora de
  calidad de vida para el repo.

### Cómo arreglar

```bash
# Eliminar todas las sesiones viejas
rm -rf .omo/run-continuation/

# Agregar a .gitignore para que no se vuelvan a commitear
echo ".omo/run-continuation/" >> .gitignore
```

### Archivos afectados

- `.omo/run-continuation/` (eliminados)
- `.gitignore` (agregado)

### Criterio de verificación

- `ls .omo/run-continuation/` retorna vacío o directorio inexistente.
- `.gitignore` contiene la línea.
- Siguientes sesiones de OpenCode no se commitean.

---

## 10 — Re-export Innecesario en `activity.ts`

**Archivo**: `apps/admin/src/lib/activity.ts`

### Contexto

Línea 433:
```typescript
export { STATUS_LABEL as PROPERTY_STATUS_LABEL } from '../types/properties';
```

### Problema

Un módulo de `activity.ts` (log de auditoría) re-exporta un label de
propiedades. Esto crea un acoplamiento cruzado innecesario. Si alguien
busca `PROPERTY_STATUS_LABEL` en `activity.ts`, no espera encontrarlo ahí.

### Por qué importa

- Es confuso para navigate (dev tools, LSP). Un import de `activity` que
  trae un label de properties es sorprendente.
- Es probablemente un leftover de cuando el módulo de activity se creó
  copiando de properties.

### Cómo arreglar

Verificar que ningún archivo importe `PROPERTY_STATUS_LABEL` desde
`activity.ts`. Si nadie lo importa desde ahí, eliminar la línea.

Si alguien lo importa, mover el import a la fuente correcta:
```typescript
import { STATUS_LABEL as PROPERTY_STATUS_LABEL } from '../types/properties';
```

### Archivos afectados

- `apps/admin/src/lib/activity.ts` (posible eliminación de 1 línea)
- Archivos que importen este re-export (si existen, cambiar import source)

### Criterio de verificación

- `pnpm typecheck` pasa sin errores.
- Ningún archivo importa `PROPERTY_STATUS_LABEL` desde `activity`.

---

## Notas Generales para el Agente

### Antes de cada cambio

1. **Leer el archivo completo** antes de editar. No edits de contexto parcial.
2. **Correr `pnpm typecheck`** después de cada cambio para verificar tipos.
3. **Correr `pnpm test`** si hay tests relacionados.
4. **No suponer schema** — verificar columnas/tipos con LSP o codegraph.

### Orden de ejecución

Seguir el orden de la tabla: Impacto → Esfuerzo. Los cambios 01-02 son
seguridad y bugs críticos — hacerlos primero. Los 03 es el más complejo
(migración + código) — hacerlo después de que los fixes críticos estén verificados.

### Lo que NO hacer

- No refactorizar módulos que no están en esta lista.
- No cambiar nombres de funciones ni reorganizar archivos.
- No agregar dependencias nuevas.
- No cambiar la arquitectura de componentes.
- No tocar tests existentes (solo agregar nuevos si el cambio lo requiere).
- No cambiar el schema de DB salvo el cambio 03 (valuation images).
- No tocar la landing (apps/landing) — los cambios son solo admin + edge functions.
