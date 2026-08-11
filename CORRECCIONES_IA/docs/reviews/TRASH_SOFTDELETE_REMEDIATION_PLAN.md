# Plan de Remediación Completa — Trash / Soft Delete (Cross-Cutting)

**Objetivo:** Unificar y robustecer el patrón de **Soft Delete + Trash (Papelera)** en **TODAS las entidades** del sistema: Properties, Leads, Owners, Agents, Visits, Action Plans, Communications, Reports, Valuations, Price Analyses.

**Estado Actual:** Implementado inconsistente — cada módulo tiene su propia lógica, sin API unificada, sin UI consistente, sin bulk operations, sin retention policies.

---

## 📍 Estado Actual por Entidad

| Entidad | Soft Delete | Restore | Permanent Delete | Trash UI | Bulk Ops | Retention Policy |
|---------|-------------|---------|------------------|----------|----------|------------------|
| Properties | ✅ | ✅ | ✅ (con storage cleanup) | ✅ (TrashPage) | ❌ | ❌ |
| Leads | ✅ | ✅ | ✅ | ✅ (OwnersPage pattern) | ❌ | ❌ |
| Owners | ✅ | ✅ | ✅ | ✅ (OwnersPage) | ✅ (bulk trash) | ❌ |
| Agents | ✅ | ✅ | ✅ (con photo cleanup) | ❌ (solo en AgentsPage) | ❌ | ❌ |
| Visits | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Action Plans | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Communications | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Reports | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Valuations | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Price Analyses | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 🎯 Criterios de Aceptación — "100% Funcional"

### ✅ API Unificada (`apps/admin/src/lib/trash.ts`)
- [ ] `softDelete(entity, id)` — genérico, usa metadata de tabla
- [ ] `restore(entity, id)` — genérico
- [ ] `permanentDelete(entity, id)` — genérico + storage cleanup hooks
- [ ] `fetchTrash(entity, filters)` — paginado, filtros, search
- [ ] `bulkSoftDelete(entity, ids[])` — transaccional
- [ ] `bulkRestore(entity, ids[])` — transaccional
- [ ] `bulkPermanentDelete(entity, ids[])` — transaccional + cleanup

### ✅ Hooks TanStack Query Unificados (`apps/admin/src/lib/trash.api.ts`)
- [ ] `useSoftDelete(entity)`, `useRestore(entity)`, `usePermanentDelete(entity)`
- [ ] `useTrash(entity, filters)` — con paginación, search, sort
- [ ] `useBulkTrashActions(entity)` — bulk soft delete/restore/permanent

### ✅ UI Componente Reutilizable (`apps/admin/src/components/TrashTable.tsx`)
- [ ] Tabla genérica: columnas configurables, selección múltiple, bulk actions
- [ ] Filtros: search, date range (deleted_at), original status
- [ ] Acciones por fila: restore, permanent delete, view details
- [ ] Bulk actions bar: restore selected, delete permanently selected
- [ ] Empty state + loading skeletons
- [ ] Export CSV de papelera

### ✅ Integración en Cada Módulo
- [ ] Properties: Ya tiene TrashPage → migrar a componente unificado
- [ ] Leads: Agregar Trash tab en LeadsPage
- [ ] Owners: Ya tiene → migrar a componente unificado
- [ ] Agents: Agregar Trash tab en AgentsPage
- [ ] Visits: Agregar Trash tab en VisitsPage
- [ ] Action Plans: Agregar Trash tab
- [ ] Communications/Reports/Valuations: Trash tabs

### ✅ Storage Cleanup Automatizado
- [ ] Hook `onPermanentDelete(entity, id)` → limpiar storage buckets relacionados
- [ ] Property: `property-images` bucket
- [ ] Agent: `agent-photos` bucket
- [ ] Chat: `chat-files` bucket
- [ ] Valuation: `site-images` bucket (PDFs)
- [ ] Owner: `site-images` bucket (docs)

### ✅ Retention Policies (Configurables)
- [ ] Tabla `trash_retention_policies` por entidad
- [ ] Default: 90 días en papelera → auto permanent delete
- [ ] Cron job diario: `process-retention-policies` → ejecutar auto-delete
- [ ] Notificación 7 días antes de auto-delete (email a admins)

### ✅ Audit Trail Completo
- [ ] `activity_log` entries para: soft_delete, restore, permanent_delete, bulk_ops
- [ ] Campos: actor, entity, entity_id, action, metadata, timestamp
- [ ] UI: "Historial de papelera" por entidad

### ✅ Type Safety (Strict)
- [ ] **Cero `any`** en `trash.ts`, `trash.api.ts`, `TrashTable.tsx`
- [ ] Genéricos tipados: `TrashRow<TEntity>`, `TrashFilters<TEntity>`
- [ ] Zod schemas para bulk operations input

### ✅ Testing (Cobertura Mínima)
| Tipo | Cobertura | Archivos Objetivo |
|------|-----------|-------------------|
| Unit | **80%** | `softDelete`, `restore`, `permanentDelete`, `bulkOps`, `fetchTrash` con filters, retention processor |
| Integration | **50%** | Property→trash→restore, bulk delete 10→storage cleaned |
| E2E | **2 flujos** | Single entity trash cycle, Bulk trash operations |

### ✅ Observabilidad
- [ ] Métricas: `trash_items_total`, `trash_restore_rate`, `trash_auto_delete_count`, `storage_cleaned_bytes`
- [ ] Dashboard: Trash size por entidad, oldest items, retention compliance
- [ ] Alertas: trash items > 1000, auto-delete failures, storage cleanup errors

---

## 📋 Plan de Trabajo Priorizado

### FASE 1 — CRÍTICO (Core Unificado) — **~3 días**

#### 1.1 API Unificada + Tipos
**Archivo nuevo:** `apps/admin/src/lib/trash.ts`
```typescript
import { supabase } from './supabase';
import type { Database } from '../types/database';

export type EntityName = 
    | 'properties' | 'leads' | 'owners' | 'agents' 
    | 'visits' | 'action_plans' | 'communications' 
    | 'reports' | 'valuations' | 'price_analyses';

export interface TrashRowBase {
    id: string;
    deleted_at: string;
    // Campos comunes para display
    display_title: string;
    display_subtitle?: string;
}

export interface TrashFilters {
    search?: string;
    deleted_from?: string;
    deleted_to?: string;
    page?: number;
    pageSize?: number;
    sortBy?: 'deleted_at' | 'display_title';
    sortOrder?: 'asc' | 'desc';
}

// Metadata por entidad para operaciones genéricas
const ENTITY_METADATA: Record<EntityName, {
    table: string;
    select: string;
    displayTitle: (row: any) => string;
    displaySubtitle?: (row: any) => string;
    storageCleanup?: (row: any) => Promise<void>;
}> = {
    properties: {
        table: 'properties',
        select: 'id, title, code, deleted_at, updated_at',
        displayTitle: r => r.title,
        displaySubtitle: r => `Cód. ${r.code}`,
        storageCleanup: async (row) => {
            const { data: images } = await supabase.from('property_images').select('url').eq('property_id', row.id);
            if (images?.length) {
                const paths = images.map(i => i.url.split('/property-images/')[1]).filter(Boolean);
                await supabase.storage.from('property-images').remove(paths);
            }
        },
    },
    leads: {
        table: 'leads',
        select: 'id, name, last_name, email, deleted_at',
        displayTitle: r => `${r.name} ${r.last_name}`,
        displaySubtitle: r => r.email,
    },
    owners: {
        table: 'owners',
        select: 'id, full_name, owner_type, deleted_at',
        displayTitle: r => r.full_name,
        displaySubtitle: r => OWNER_TYPE_LABEL[r.owner_type],
    },
    agents: {
        table: 'agents',
        select: 'id, name, email, photo_url, deleted_at',
        displayTitle: r => r.name,
        displaySubtitle: r => r.email,
        storageCleanup: async (row) => {
            if (row.photo_url?.includes('/agent-photos/')) {
                const path = row.photo_url.split('/agent-photos/')[1];
                await supabase.storage.from('agent-photos').remove([path]);
            }
        },
    },
    visits: {
        table: 'visits',
        select: 'id, title, starts_at, deleted_at',
        displayTitle: r => r.title,
        displaySubtitle: r => new Date(r.starts_at).toLocaleDateString('es-AR'),
    },
    // ... otras entidades
};

export async function softDelete(entity: EntityName, id: string): Promise<void> {
    const meta = ENTITY_METADATA[entity];
    const { error } = await supabase
        .from(meta.table)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
    if (error) throw new Error(error.message);
    await logActivity('soft_delete', entity, id);
}

export async function restore(entity: EntityName, id: string): Promise<void> {
    const meta = ENTITY_METADATA[entity];
    const { error } = await supabase
        .from(meta.table)
        .update({ deleted_at: null })
        .eq('id', id);
    if (error) throw new Error(error.message);
    await logActivity('restore', entity, id);
}

export async function permanentDelete(entity: EntityName, id: string): Promise<void> {
    const meta = ENTITY_METADATA[entity];
    // 1. Obtener row para cleanup
    const { data: row } = await supabase.from(meta.table).select(meta.select).eq('id', id).maybeSingle();
    // 2. Storage cleanup
    if (meta.storageCleanup && row) await meta.storageCleanup(row);
    // 3. Hard delete
    const { error } = await supabase.from(meta.table).delete().eq('id', id);
    if (error) throw new Error(error.message);
    await logActivity('permanent_delete', entity, id);
}

export async function fetchTrash(entity: EntityName, filters: TrashFilters = {}): Promise<{ data: TrashRowBase[]; count: number }> {
    const meta = ENTITY_METADATA[entity];
    let query = supabase
        .from(meta.table)
        .select(meta.select + ', count', { count: 'exact' })
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });
    
    if (filters.search) {
        const escaped = filters.search.replace(/[*%]/g, '');
        query = query.ilike('title', `%${escaped}%`); // ajustar por entidad
    }
    if (filters.deleted_from) query = query.gte('deleted_at', filters.deleted_from);
    if (filters.deleted_to) query = query.lte('deleted_at', filters.deleted_to);
    
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    query = query.range((page - 1) * pageSize, page * pageSize - 1);
    
    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    
    return {
        data: (data ?? []).map(row => ({
            id: row.id,
            deleted_at: row.deleted_at,
            display_title: meta.displayTitle(row),
            display_subtitle: meta.displaySubtitle?.(row),
        })),
        count: count ?? 0,
    };
}

export async function bulkSoftDelete(entity: EntityName, ids: string[]): Promise<void> {
    const meta = ENTITY_METADATA[entity];
    const { error } = await supabase
        .from(meta.table)
        .update({ deleted_at: new Date().toISOString() })
        .in('id', ids);
    if (error) throw new Error(error.message);
    await logActivity('bulk_soft_delete', entity, ids);
}

// ... bulkRestore, bulkPermanentDelete similares
```

#### 1.2 Hooks TanStack Query Unificados
**Archivo nuevo:** `apps/admin/src/lib/trash.api.ts`
```typescript
import { queryKeys, useMutation, useList } from './api';
import { trashKeys } from './query/client'; // extend queryKeys
import { 
    softDelete, restore, permanentDelete, fetchTrash, 
    bulkSoftDelete, bulkRestore, bulkPermanentDelete,
    type EntityName, type TrashFilters, type TrashRowBase
} from './trash';

export function useTrash(entity: EntityName, filters?: TrashFilters) {
    return useList<TrashRowBase, any>({
        queryKey: [...trashKeys.entity(entity), filters],
        path: '', // custom path handled in fetchTrash
        select: '',
        filters: {},
        page: filters?.page ?? 1,
        pageSize: filters?.pageSize ?? 20,
        orderBy: 'deleted_at',
        ascending: false,
        transform: (row) => row, // already transformed
        customFetch: () => fetchTrash(entity, filters),
    });
}

export function useSoftDelete(entity: EntityName) {
    return useMutation({
        mutationFn: (id: string) => softDelete(entity, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: trashKeys.entity(entity) });
            queryClient.invalidateQueries({ queryKey: entityKeys.lists() }); // refresh main list
        },
    });
}

export function useRestore(entity: EntityName) {
    return useMutation({
        mutationFn: (id: string) => restore(entity, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: trashKeys.entity(entity) });
            queryClient.invalidateQueries({ queryKey: entityKeys.lists() });
        },
    });
}

export function usePermanentDelete(entity: EntityName) {
    return useMutation({
        mutationFn: (id: string) => permanentDelete(entity, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: trashKeys.entity(entity) });
        },
    });
}

export function useBulkTrashActions(entity: EntityName) {
    const queryClient = useQueryClient();
    
    const bulkSoftDelete = useMutation({
        mutationFn: (ids: string[]) => bulkSoftDelete(entity, ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: trashKeys.entity(entity) });
            queryClient.invalidateQueries({ queryKey: entityKeys.lists() });
        },
    });
    
    const bulkRestore = useMutation({
        mutationFn: (ids: string[]) => bulkRestore(entity, ids),
        onSuccess: () => { /* ... */ },
    });
    
    const bulkPermanentDelete = useMutation({
        mutationFn: (ids: string[]) => bulkPermanentDelete(entity, ids),
        onSuccess: () => { /* ... */ },
    });
    
    return { bulkSoftDelete, bulkRestore, bulkPermanentDelete };
}
```

#### 1.3 Componente UI Reutilizable
**Archivo nuevo:** `apps/admin/src/components/TrashTable.tsx`
```tsx
interface TrashTableProps<Entity extends EntityName> {
    entity: Entity;
    title: string;
    getDisplaySubtitle?: (row: TrashRowBase) => string;
    onRowClick?: (row: TrashRowBase) => void;
    customColumns?: Column<TrashRowBase>[];
}

export function TrashTable<Entity extends EntityName>({ 
    entity, title, getDisplaySubtitle, onRowClick, customColumns 
}: TrashTableProps<Entity>) {
    const [filters, setFilters] = useState<TrashFilters>({ page: 1, pageSize: 20, search: '' });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    
    const { data, isPending, isError } = useTrash(entity, filters);
    const trash = getListData<TrashRowBase>(data);
    const { bulkSoftDelete, bulkRestore, bulkPermanentDelete } = useBulkTrashActions(entity);
    
    const columns = useMemo(() => [
        { key: 'select', header: <Checkbox />, width: '44px' },
        { key: 'display_title', header: 'Elemento', width: '40%' },
        { key: 'display_subtitle', header: 'Detalle', width: '30%' },
        { key: 'deleted_at', header: 'Eliminado', width: '15%', format: v => formatDate(v) },
        { key: 'actions', header: '', width: '11%' },
    ], []);
    
    // Render similar a OwnersPage trash table pero genérico
    // - Selection checkboxes
    // - Row click → onRowClick (ver detalle antes de restaurar)
    // - Actions: restore, permanent delete
    // - Bulk bar con bulk actions
    // - Pagination / infinite scroll
}
```

---

### FASE 2 — ALTO (Retention + Audit) — **~2 días**

#### 2.1 Retention Policies + Cron
**Migración:** `supabase/migrations/0053_trash_retention.sql`
```sql
CREATE TABLE trash_retention_policies (
    entity text PRIMARY KEY,
    retention_days int NOT NULL DEFAULT 90,
    notify_before_days int DEFAULT 7,
    auto_delete_enabled boolean DEFAULT true,
    updated_at timestamptz DEFAULT now()
);

INSERT INTO trash_retention_policies (entity, retention_days) VALUES
('properties', 90), ('leads', 60), ('owners', 90), ('agents', 90),
('visits', 30), ('action_plans', 90), ('communications', 90),
('reports', 365), ('valuations', 365), ('price_analyses', 180);
```

**Edge Function:** `supabase/functions/process-retention-policies/index.ts` (Cron diario 03:00)
```typescript
async function processRetention() {
    const { data: policies } = await supabase.from('trash_retention_policies').select('*');
    const now = new Date();
    
    for (const policy of policies ?? []) {
        if (!policy.auto_delete_enabled) continue;
        
        const cutoff = new Date(now.getTime() - policy.retention_days * 24 * 60 * 60 * 1000);
        const notifyCutoff = new Date(now.getTime() - (policy.retention_days - policy.notify_before_days) * 24 * 60 * 60 * 1000);
        
        // 1. Notificar items próximos a auto-delete
        const { data: toNotify } = await supabase
            .from(policy.entity)
            .select('id, deleted_at')
            .not('deleted_at', 'is', null)
            .lte('deleted_at', notifyCutoff.toISOString())
            .gt('deleted_at', cutoff.toISOString());
        
        // Enviar notificación a admins
        
        // 2. Auto-delete items vencidos
        const { data: toDelete } = await supabase
            .from(policy.entity)
            .select('id')
            .not('deleted_at', 'is', null)
            .lte('deleted_at', cutoff.toISOString());
        
        if (toDelete?.length) {
            await bulkPermanentDelete(policy.entity, toDelete.map(d => d.id));
        }
    }
}
```

#### 2.2 Audit Trail Unificado
**En `trash.ts` — `logActivity`:**
```typescript
async function logActivity(
    action: 'soft_delete' | 'restore' | 'permanent_delete' | 'bulk_soft_delete' | 'bulk_restore' | 'bulk_permanent_delete',
    entity: EntityName,
    ids: string | string[],
    metadata?: Record<string, unknown>
): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    const actorId = user?.id ?? 'system';
    
    const idsArray = Array.isArray(ids) ? ids : [ids];
    
    for (const id of idsArray) {
        await supabase.from('activity_log').insert({
            action: action as any,
            actor_id: actorId,
            entity_type: entity,
            entity_id: id,
            metadata: { ...metadata, entity },
            created_at: new Date().toISOString(),
        });
    }
}
```

---

### FASE 3 — MEDIO (Migración Módulos) — **~2 días**

#### 3.1 Migrar Cada Módulo a TrashTable
| Módulo | Archivo a Modificar | Cambios |
|--------|---------------------|---------|
| Properties | `TrashPage.tsx` | Reemplazar tabla custom por `<TrashTable entity="properties" />` |
| Leads | `LeadsPage.tsx` | Agregar tab "Papelera" con `<TrashTable entity="leads" />` |
| Owners | `OwnersPage.tsx` | Reemplazar tabla trash por componente unificado |
| Agents | `AgentsPage.tsx` | Agregar tab "Papelera" |
| Visits | `VisitsPage.tsx` | Agregar tab "Papelera" |
| Action Plans | `ActionPlansDashboard.tsx` | Agregar tab |
| Communications/Reports | Sus páginas | Agregar tabs |

#### 3.2 Testing
- Unit: `softDelete`, `restore`, `permanentDelete`, `bulkOps`, `fetchTrash` con filters, retention processor
- Integration: Property→trash→restore→verify main list, bulk delete 10→storage cleaned
- E2E: Single entity trash cycle, Bulk trash operations

---

## 📁 Archivos a Crear / Modificar

### Nuevos Archivos
- [ ] `apps/admin/src/lib/trash.ts`
- [ ] `apps/admin/src/lib/trash.api.ts`
- [ ] `apps/admin/src/components/TrashTable.tsx`
- [ ] `supabase/migrations/0053_trash_retention.sql`
- [ ] `supabase/functions/process-retention-policies/index.ts`
- [ ] `apps/admin/src/lib/__tests__/trash.core.test.ts`
- [ ] `apps/admin/src/lib/__tests__/trash.retention.test.ts`
- [ ] `apps/admin/e2e/trash-flows.spec.ts`

### Modificar
- [ ] `apps/admin/src/lib/query/client.ts` — agregar `trashKeys`
- [ ] `apps/admin/src/pages/TrashPage.tsx` — migrar a TrashTable
- [ ] `apps/admin/src/pages/LeadsPage.tsx` — agregar Trash tab
- [ ] `apps/admin/src/pages/OwnersPage.tsx` — migrar a TrashTable
- [ ] `apps/admin/src/pages/AgentsPage.tsx` — agregar Trash tab
- [ ] `apps/admin/src/pages/VisitsPage.tsx` — agregar Trash tab
- [ ] `apps/admin/src/pages/ActionPlansDashboard.tsx` — agregar Trash tab

---

## 📊 Métricas de Éxito

| KPI | Baseline | Target |
|-----|----------|--------|
| Código duplicado (trash logic) | ~500 líneas x 10 módulos | **~200 líneas unificadas** |
| Bulk operations support | 1/10 módulos | **10/10 módulos** |
| Retention policy compliance | 0% | **100% (auto)** |
| Storage cleanup on delete | Manual/parcial | **100% auto** |
| TypeScript errors | ~15 | **0** |
| Test coverage | 0% | **≥80%** |

---

## 📅 Cronograma (1 semana)

| Día | Entregables |
|-----|-------------|
| 1 | API unificada `trash.ts` + tipos, hooks `trash.api.ts` |
| 2 | Componente `TrashTable.tsx` genérico + tests unitarios |
| 3 | Retention policies + cron Edge Function + audit trail |
| 4-5 | Migrar 6 módulos (Properties, Leads, Owners, Agents, Visits, Action Plans) |
| 6 | Integration tests, E2E 2 flujos, observabilidad |
| 7 | Code review, documentar patrón para futuras entidades |

---

## ⚠️ Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Entidades con campos display diferentes | `ENTITY_METADATA` con funciones `displayTitle`/`displaySubtitle` personalizadas |
| Storage cleanup falla en bulk | Try-catch por item, log errors, continuar con resto |
| Retention policy conflict con legal | Configurable por entidad, default conservador (90d), override manual |
| Migración rompe UI existente | Feature flag por módulo, migración gradual, rollback fácil |

---

**Documento vivo** — Patrón base para TODAS las entidades presentes y futuras.