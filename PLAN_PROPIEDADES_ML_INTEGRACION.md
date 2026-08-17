# Plan de Integración Total: Módulo Propiedades ↔ Mercado Libre

> **Estado**: Planificación - Listo para implementar
> **Fecha**: 2026-08-17
> **Objetivo**: Que **Propiedades sea la "fuente de verdad"** y ML sea un canal de publicación más, con sincronización bidireccional transparente y UX unificada.

---

## 🎯 Visión General

```
┌─────────────────┐     Property.save()      ┌──────────────────┐
│   Admin UI      │ ──────────────────────►  │   Property API   │
│  (Properties)   │   auto-enqueue ML        │  (ml_enqueue)    │
└─────────────────┘                          └────────┬─────────┘
                                                      │
                    ┌─────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    ml-sync (Edge Function)                   │
│  • claim job (RPC atómico)                                  │
│  • mlCreateItem / mlUpdateItem / mlCloseItem                │
│  • upload pictures → ML                                     │
│  • update property_ml_meta (ml_item_id, permalink, status)  │
│  • webhook ML → actualiza property_ml_meta en tiempo real   │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────┐     Property.refresh()      ┌──────────────────┐
│   Admin UI      │ ◄─────────────────────────  │  property_ml_meta│
│  (Properties)   │   realtime + query invalid  │  (ml_item_id,    │
└─────────────────┘                              │   status, url)   │
                                               └──────────────────┘
```

---

## 📋 FASES DE IMPLEMENTACIÓN

### FASE 1: UI Unificada en Propiedades (Prioridad ALTA - Semana 1)
*Impacto visual inmediato para el usuario*

| # | Task | Descripción Detallada | Esfuerzo | Dependencias |
|---|------|----------------------|----------|--------------|
| **1.1** | **Columna "Estado ML" en listado Properties** | Badge en tabla Properties: `publicada` 🟢 / `pendiente` 🟡 / `error` 🔴 / `sin sincronizar` ⚪. Leer de `property_ml_meta.status` + `ml_item_id` | Bajo | property_ml_meta existe |
| **1.2** | **Acciones ML en tabla Properties (por fila)** | Dropdown/menú contextual: `Publicar en ML` / `Actualizar en ML` / `Despublicar` / `Ver en ML` (link externo). Solo visible si `ml_enabled=true` | Medio | ml_enqueue RPC |
| **1.3** | **Bulk actions ML** | Checkbox múltiples en tabla → Botones: `Publicar seleccionadas en ML` / `Actualizar en ML` / `Despublicar`. Encolar en lote via `ml-bulk-enqueue` | Medio | ml-bulk-enqueue edge fn |
| **1.4** | **Panel ML en PropertyForm** | Panel lateral colapsable "Mercado Libre" con: status badge, ml_item_id, permalink, botones rápidos (Publicar/Actualizar/Despublicar), último sync, error si hay. Solo si cuenta ML conectada | Medio | PropertyForm.tsx |
| **1.5** | **Indicador visual en PropertyCard/Grid** | Badge pequeño en tarjeta de propiedad (vista grid): 🟢 Publicada / 🟡 Pendiente / 🔴 Error / ⚪ No sincronizada | Bajo | PropertyCard.tsx |

### FASE 2: Sincronización Automática (Prioridad ALTA - Semana 1-2)
*El "cerebro" que conecta todo sin intervención manual*

| # | Task | Descripción Detallada | Esfuerzo | Dependencias |
|---|------|----------------------|----------|--------------|
| **2.1** | **Auto-enqueue en Property update** | En `properties.api.ts` / mutation `updateProperty`: si `ml_enabled && property.ml_item_id` → `ml_enqueue(property_id, 'update')` post-save | Bajo | ml_enqueue RPC |
| **2.2** | **Auto-enqueue en Property create** | Checkbox "Publicar en ML al crear" en PropertyForm. Si checked + `ml_enabled` → post-create: `ml_enqueue(new_property_id, 'publish')` | Bajo | PropertyForm + ml_enqueue |
| **2.3** | **Auto-enqueue en Property delete (soft)** | En `deleteProperty` / soft delete: si `ml_item_id` existe → `ml_enqueue(property_id, 'delete')` | Bajo | ml_enqueue RPC |
| **2.4** | **Validación pre-publish automática** | Antes de encolar `publish`: validar campos requeridos ML: `category_id`, `listing_type_id`, `condition`, `price > 0`, `mínimo 1 foto`, `address` válido. Si falla → toast warning + no encolar | Medio | Property validation |
| **2.5** | **Auto-enqueue en Property restore** | Al restaurar de papelera: si tenía `ml_item_id` y estaba publicada → encolar `publish` | Bajo | Trash restore flow |

### FASE 3: Importación ML → Property Mejorada (Prioridad MEDIA - Semana 2)
*Hacer que traer datos de ML sea fluido y completo*

| # | Task | Descripción Detallada | Esfuerzo | Dependencias |
|---|------|----------------------|----------|--------------|
| **3.1** | **Matching inteligente al importar** | En preview modal: buscar property existente por `ml_item_id` en `property_ml_meta`. Si existe → mostrar "Actualizar property existente" con link; si no → "Crear nueva property". Badge visual indicando acción | Medio | property_ml_meta lookup |
| **3.2** | **Vinculación manual en preview** | Columna "Vincular a property" con autocomplete (buscar por título/código). Permitir override del matching automático | Medio | Properties search API |
| **3.3** | **Descargar fotos a Storage (CRÍTICO)** | Al importar/sync: descargar URLs ML → `convert-image` edge fn → bucket `property-images` → actualizar `property.images` con paths locales. Evita dependencia de CDN ML | Alto | convert-image edge fn, Storage bucket |
| **3.4** | **Video ML → property.video_url** | Mapear `video_id` / `video_url` de ML item → `property.video_url` (YouTube URL) | Bajo | ML item schema |
| **3.5** | **Importar atributos completos** | Mapear todos los attributes ML: `ANTIQUITY→year_built`, `OPERATION_TYPE→operation_type`, `PROPERTY_TYPE→property_type`, `PARKING_LOTS→garages`, `FLOORS→floors`, `TOTAL_AREA/COVERED_AREA`, `BEDROOMS/BATHROOMS`, `AMENITIES→amenities JSON` | Medio | Mapper ya existe en ml-import-listings |

### FASE 4: Configuración y Defaults Inteligentes (Prioridad MEDIA - Semana 2)
*Reducir fricción al configurar propiedades para ML*

| # | Task | Descripción Detallada | Esfuerzo | Dependencias |
|---|------|----------------------|----------|--------------|
| **4.1** | **Defaults por Property Type** | Config admin: `property_type (casa/depto/ph/terreno) → ML category_id + listing_type_id + condition` defaults. Guardar en `site_settings` | Medio | site_settings |
| **4.2** | **Mapeo atributos ML ↔ Property fields (UI)** | Admin UI: tabla de mapeo editable `ML attribute_id → Property field`. Ej: `OPERATION_TYPE → operation_type`, `PROPERTY_TYPE → property_type`, `ANTIQUITY → year_built`. Usado en import/sync | Medio | Custom admin page |
| **4.3** | **Location matching automático** | `city/state/neighborhood` de ML → lookup en tabla `locations` (fuzzy match) → set `property.location_id`. Si no match → crear location sugerida | Medio | locations table |
| **4.4** | **Defaults por Operation Type** | `operation_type (venta/alquiler/temporario) → ML listing_type_id + buying_mode` | Bajo | FASE 4.1 |

### FASE 5: Observabilidad y DX (Prioridad BAJA - Semana 3)
*Visibilidad total de qué pasa en segundo plano*

| # | Task | Descripción Detallada | Esfuerzo | Dependencias |
|---|------|----------------------|----------|--------------|
| **5.1** | **Sync Timeline en Property Detail** | Tab "Historial ML" en PropertyDetail: tabla con jobs de cola (publish/update/delete), webhooks recibidos, sync status, errores, timestamps. Query `ml_sync_queue` + `ml_sync_history` + `ml_webhook_events` filtrado por property | Medio | ml_sync_queue/history |
| **5.2** | **Alertas de sync fallido** | Si job ML entra a dead letter (3 fallos) → toast persistente en admin + opcional email a admins. Badge rojo en Property list | Bajo | ml_sync_dead_letter |
| **5.3** | **Métricas de performance ML** | Dashboard admin: tiempo avg sync, tasa éxito/fallo, items pendientes, items con error, últimos 100 jobs. Charts con Recharts | Bajo | ml_sync_history |
| **5.4** | **Debug panel en PropertyForm** | Panel colapsable "Debug ML": raw `property_ml_meta`, últimos webhook events, últimos sync history, botón "Re-sync now" (fuerza re-enqueue) | Bajo | Development only |

---

## 🔧 DETALLES TÉCNICOS POR IMPLEMENTAR

### 1. PropertyForm - Panel ML (FASE 1.4)

```tsx
// En PropertyForm.tsx - Panel lateral colapsable
<MLPropertyPanel
  propertyId={propertyId}
  mlMeta={property.ml_meta}
  mlEnabled={mlEnabled}
  onPublish={() => mlEnqueue(propertyId, 'publish')}
  onUpdate={() => mlEnqueue(propertyId, 'update')}
  onUnpublish={() => mlEnqueue(propertyId, 'delete')}
/>
```

**Props del panel:**
- `ml_item_id` (string | null)
- `status` ('active' | 'paused' | 'closed' | 'under_review' | null)
- `permalink` (string | null)
- `last_sync_at` (timestamp | null)
- `last_sync_status` ('success' | 'failed' | 'pending' | null)
- `last_error` (string | null)
- Botones: `Publicar` / `Actualizar` / `Despublicar` / `Ver en ML` (disabled según estado)

### 2. Auto-enqueue Logic (FASE 2)

```typescript
// En properties.api.ts - mutation updateProperty
export const updateProperty = async (id: string, data: PropertyFormValues) => {
  const result = await supabase.from('properties').update(data).eq('id', id).select().single();
  
  // Auto-enqueue ML si corresponde
  if (result.data && shouldAutoSyncML(result.data)) {
    await mlEnqueue(id, 'update').catch(err => {
      console.error('Auto-enqueue ML failed:', err);
      // No bloquear el save, solo log
    });
  }
  
  return result;
};

function shouldAutoSyncML(property: PropertyRow): boolean {
  return (
    property.ml_enabled === true &&
    property.ml_item_id &&
    ['publicada', 'borrador'].includes(property.status) &&
    property.price !== null &&
    property.price > 0
  );
}
```

### 3. Validación Pre-Publish (FASE 2.4)

```typescript
// En ml.ts - validación antes de encolar publish
export function validatePropertyForMLPublish(property: PropertyRow): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!property.category_id) errors.push('Falta categoría (category_id)');
  if (!property.listing_type_id) errors.push('Falta tipo de publicación (listing_type_id)');
  if (!property.condition) errors.push('Falta condición (new/used/not_specified)');
  if (!property.price || property.price <= 0) errors.push('Precio inválido');
  if (!property.address) errors.push('Falta dirección');
  if (!property.images || property.images.length === 0) errors.push('Mínimo 1 foto requerida');
  if (!property.bedrooms && !property.area_total) errors.push('Faltan datos básicos: dormitorios o superficie');
  
  return { valid: errors.length === 0, errors };
}
```

### 4. Descarga de Fotos a Storage (FASE 3.3)

```typescript
// En ml-import-listings / ml-sync - descargar y subir a Storage
async function downloadAndStoreMLImages(
  mlItemId: string,
  pictureUrls: string[],
  propertyId: string
): Promise<string[]> {
  const storedPaths: string[] = [];
  
  for (const [index, url] of pictureUrls.entries()) {
    try {
      // Descargar imagen
      const response = await fetch(url);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const fileName = `${propertyId}_${index}_${Date.now()}.webp`;
      
      // Subir a convert-image (convierte a WebP optimizado)
      const formData = new FormData();
      formData.append('file', new Blob([arrayBuffer]), fileName);
      formData.append('quality', '80');
      formData.append('maxWidth', '1920');
      
      const convertRes = await fetch(`${SUPABASE_URL}/functions/v1/convert-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${serviceRoleKey}` },
        body: formData,
      });
      
      const { path } = await convertRes.json();
      storedPaths.push(path);
    } catch (err) {
      console.error(`Error descargando foto ${url}:`, err);
      // Fallback: guardar URL original si falla
      storedPaths.push(url);
    }
  }
  
  return storedPaths;
}
```

### 5. Property List - Columna Estado ML (FASE 1.1)

```tsx
// En PropertiesPage.tsx - nueva columna en tabla
const MLStatusCell = ({ property }: { property: PropertyRow }) => {
  const mlMeta = property.ml_meta; // joined from property_ml_meta
  
  if (!mlMeta) return <Badge variant="neutral">Sin sincronizar</Badge>;
  
  const statusMap = {
    active: { label: 'Publicada', variant: 'success' as const, icon: <CheckCircle2 size={12} /> },
    paused: { label: 'Pausada', variant: 'warning' as const, icon: <Pause size={12} /> },
    closed: { label: 'Despublicada', variant: 'neutral' as const, icon: <XCircle size={12} /> },
    under_review: { label: 'En revisión', variant: 'info' as const, icon: <Clock size={12} /> },
    payment_required: { label: 'Pago requerido', variant: 'danger' as const, icon: <AlertCircle size={12} /> },
  };
  
  const config = statusMap[mlMeta.status as keyof typeof statusMap] || { 
    label: mlMeta.status, variant: 'neutral' as const, icon: <HelpCircle size={12} /> 
  };
  
  return (
    <Badge variant={config.variant}>
      {config.icon} {config.label}
    </Badge>
  );
};
```

### 6. Bulk Actions ML (FASE 1.3)

```tsx
// En PropertiesPage.tsx - handler bulk
const handleBulkMLAction = async (action: 'publish' | 'update' | 'delete') => {
  const selectedIds = selectedRows.map(r => r.id);
  
  if (selectedIds.length === 0) return;
  
  try {
    const result = await bulkEnqueueML(selectedIds, action);
    pushToast({
      type: 'success',
      title: `${action === 'publish' ? 'Publicando' : action === 'update' ? 'Actualizando' : 'Despublicando'} ${result.enqueued} propiedades`,
    });
    queryClient.invalidateQueries({ queryKey: ['ml-queue'] });
  } catch (err) {
    pushToast({ type: 'error', title: 'Error en acción masiva', description: err.message });
  }
};
```

---

## 📦 MIGRACIONES NECESARIAS

| # | Migración | Descripción |
|---|-----------|-------------|
| **0068** | `add_ml_auto_sync_flags_to_properties.sql` | Agregar `ml_auto_publish_on_create`, `ml_auto_update_on_edit`, `ml_auto_delete_on_soft_delete` a `properties` (o a `site_settings` global) |
| **0069** | `add_ml_sync_timeline_view.sql` | Vista `ml_sync_timeline` unificando `ml_sync_queue` + `ml_sync_history` + `ml_webhook_events` por property |
| **0070** | `add_ml_attribute_mapping.sql` | Tabla `ml_attribute_mapping` (ml_attr_id, property_field, transform_fn) para FASE 4.2 |

---

## 🧪 TESTING POR FASE

| Fase | Tests Unitarios | Tests E2E |
|------|-----------------|-----------|
| **1** | - PropertyForm ML panel render<br>- Badge status rendering | - Ver columna Estado ML en listado<br>- Click "Publicar en ML" en fila → toast + queue<br>- Bulk publish 3 propiedades |
| **2** | - validatePropertyForMLPublish<br>- shouldAutoSyncML logic<br>- Auto-enqueue en update/create/delete | - Crear property con checkbox "Publicar en ML" → aparece en queue<br>- Editar property publicada → auto-update encola<br>- Soft delete → auto-delete encola |
| **3** | - downloadAndStoreMLImages<br>- matchMLItemToProperty<br>- Mapper atributos completos | - Importar 5 items ML → fotos en Storage<br>- Importar item con ml_item_id existente → actualiza property<br>- Video ML aparece en property.video_url |
| **4** | - Defaults por property_type<br>- Location matching | - Configurar defaults → crear property usa defaults<br>- Importar ML → location_id se setea automáticamente |
| **5** | - Sync timeline query<br>- Metrics aggregation | - Ver tab "Historial ML" en PropertyDetail<br>- Dashboard métricas ML |

---

## 📅 CRONOGRAMA ESTIMADO

| Semana | Fases | Entregable |
|--------|-------|------------|
| **1** | FASE 1 + 2 | UI Properties con estado ML + Auto-sync básico funcionando |
| **2** | FASE 3 + 4 | Import completo con fotos + Configuración defaults |
| **3** | FASE 5 | Observabilidad completa + Testing E2E |

---

## ✅ DEFINICIÓN DE "DONE" POR FASE

### FASE 1 (UI)
- [ ] Columna "Estado ML" visible en PropertiesPage con badges correctos
- [ ] Dropdown acciones ML por fila funciona (Publish/Update/Delete/View)
- [ ] Bulk actions ML en toolbar funciona
- [ ] Panel ML en PropertyForm muestra status + botones + link
- [ ] Tests E2E: listado, fila, bulk, form panel

### FASE 2 (Auto-sync)
- [ ] Crear property con checkbox → encola publish
- [ ] Editar property publicada → encola update
- [ ] Soft delete property publicada → encola delete
- [ ] Validación pre-publish bloquea si faltan datos
- [ ] Restaurar de papelera → encola publish si corresponde

### FASE 3 (Import)
- [ ] Preview modal muestra matching automático (existente vs nuevo)
- [ ] Vinculación manual con autocomplete funciona
- [ ] Fotos se descargan a Storage y property.images se actualiza
- [ ] Video ML se guarda en property.video_url
- [ ] Atributos completos mapeados correctamente

### FASE 4 (Config)
- [ ] Defaults por property_type configurables en admin
- [ ] Mapeo atributos ML ↔ Property editable en admin
- [ ] Location matching automático funciona >80% casos

### FASE 5 (Observabilidad)
- [ ] Tab "Historial ML" en PropertyDetail con timeline completo
- [ ] Alertas dead letter visibles en admin
- [ ] Dashboard métricas ML con charts

---

## 🚀 ORDEN DE EJECUCIÓN RECOMENDADO PARA MAÑANA

1. **Empezar FASE 1.1** → Columna Estado ML en listado (rápido, alto impacto visual)
2. **Paralelo FASE 1.4** → Panel ML en PropertyForm (donde el usuario gestiona)
3. **Luego FASE 2.1-2.3** → Auto-enqueue en save/update/delete (backend, bajo riesgo)
4. **FASE 1.2-1.3** → Acciones por fila + bulk (completa UX de listado)
5. **FASE 3.3** → Descarga fotos a Storage (crítico para producción)

---

## 📝 NOTAS PARA EL EQUIPO

- **Prioridad absoluta**: No romper flujo actual de Properties. Todo ML es *additive*.
- **Feature flag**: `ml_enabled` en site_settings controla todo. Si false → cero código ML ejecuta.
- **Idempotencia**: Todas las operaciones ML usan `ml_item_id` como clave única.
- **Error handling**: Fallos ML nunca bloquean save de property → solo toast warning + log.
- **Testing**: Cada fase debe tener al menos 1 test E2E crítico antes de mergear.

---

## 🔗 ARCHIVOS CLAVE A MODIFICAR

| Archivo | Fases |
|---------|-------|
| `apps/admin/src/pages/PropertiesPage.tsx` | 1.1, 1.2, 1.3, 1.5 |
| `apps/admin/src/pages/PropertyFormPage.tsx` | 1.4, 2.2 |
| `apps/admin/src/pages/PropertyDetailPage.tsx` | 5.1 |
| `apps/admin/src/lib/properties.api.ts` | 2.1, 2.2, 2.3 |
| `apps/admin/src/lib/properties.ts` | 2.4, validation |
| `apps/admin/src/lib/ml.ts` | 2.x, 3.x, 4.x |
| `apps/admin/src/components/PropertiesTable.tsx` (nuevo) | 1.1, 1.2 |
| `apps/admin/src/components/MLPropertyPanel.tsx` (nuevo) | 1.4 |
| `supabase/functions/ml-sync/index.ts` | 2.x, 3.3 |
| `supabase/functions/ml-import-listings/index.ts` | 3.x |
| `supabase/migrations/0068_*.sql` | DB flags |
| `supabase/migrations/0069_*.sql` | Sync timeline view |

---

*Documento vivo - actualizar conforme se implemente cada fase*