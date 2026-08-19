# 📋 Bienenhaus - Análisis Completo de Producción

**Fecha:** 2026-08-17  
**Versión:** 1.0  
**Autor:** Análisis automatizado

---

## 🎯 Resumen Ejecutivo

El proyecto **Bienenhaus Propiedades** es una aplicación full-stack moderna (Preact + TypeScript + Supabase) con arquitectura monorepo (pnpm workspaces). El código base es sólido: **typecheck ✅, build ✅, unit tests ✅ (1061 tests passing)**. Sin embargo, hay **problemas críticos en E2E tests** y **vulnerabilidades de seguridad** que deben resolverse antes de producción.

---

## ✅ Lo que funciona correctamente

| Área | Estado | Detalles |
|------|--------|----------|
| **TypeScript** | ✅ | `pnpm typecheck` pasa en todos los 4 workspaces |
| **Build** | ✅ | `pnpm build` exitoso (landing + admin) |
| **Unit Tests** | ✅ | 1061 tests passing (549 UI + 512 admin) |
| **Coverage** | ✅ | 86.14% statements, 78.96% branches, 83.73% functions |
| **Type Safety** | ✅ | Strict mode en todos los `tsconfig.json` |
| **Database Migrations** | ✅ | 74 migraciones aplicadas limpiamente |
| **RLS Policies** | ✅ | 35+ tablas con RLS habilitado (migración 0074) |

---

## ❌ Problemas Críticos (Bloquean Producción)

### 1. 🔴 E2E Tests Fallando (Bloquea CI/CD)
**Archivo:** `apps/admin/e2e/auth.setup.ts`, `apps/admin/e2e/login.spec.ts`

**Síntoma:** Tests de autenticación fallan con timeout esperando redirect a `/admin/` o `/admin/#/`

```
TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
await page.waitForURL((url) => /\/admin\/?$|\/admin\/#\//.test(url.href), { timeout: 30_000 });
```

**Causa probable:**
- El login con `signInWithPassword` no redirige correctamente al dashboard
- El `initAuth()` en `main.tsx` puede estar en conflicto con la navegación
- La URL de redirect en Supabase Auth config: `site_url = "https://bienenhaus.com.ar/admin"` y `additional_redirect_urls = ["https://bienenhaus.com.ar/admin/**"]`

**Impacto:** Pipeline CI/CD falla en etapa `e2e` → no se puede hacer deploy automático.

### 2. 🟡 Advertencias de Duplicate Key en Tests
**Archivos afectados:** 4 archivos de test en `apps/admin/src/lib/__tests__/properties.*.test.ts`

```
warning: Duplicate key "location_id" in object literal
```

```typescript
// Ejemplo del problema:
{
  cover_url: 'https://img.com/cover.jpg',
  location: 'Villa Belgrano',
  location_id: '123e4567-e89b-12d3-a456-426614174000',
  location_id: 'loc-1',  // ← DUPLICADO
  images: [],
  ml_meta: null,
}
```

**Impacto:** Solo warning, pero indica tests frágiles que podrían fallar en futuras versiones de TypeScript/ESLint.

---

## 🔴 Vulnerabilidades de Seguridad (Alta Prioridad)

### 1. Configuración Auth Insegura (`supabase/config.toml`)

| Configuración | Valor Actual | Riesgo | Recomendación |
|--------------|--------------|--------|---------------|
| `enable_confirmations` | `false` | **ALTO** | Usuarios pueden registrarse sin confirmar email → spam, cuentas falsas |
| `secure_password_change` | `false` | **MEDIO** | Cambio de contraseña sin reautenticación → riesgo si sesión comprometida |
| `enable_signup` | `true` | **MEDIO** | Signup público habilitado → debería restringirse a staff/admin |
| `password_requirements` | `lower_upper_letters_digits` | **BAJO** | No requiere símbolos → bajar entropía |
| `jwt_secret` | Hardcoded en config.toml | **ALTO** | Secret en control de versiones → rotar y usar env var |

### 2. Edge Functions - Configuración JWT
En `supabase/config.toml`:
```toml
[functions.ml-oauth]
verify_jwt = false

[functions.ml-webhook]
verify_jwt = false

[functions.ml-sync]
verify_jwt = false
```
- **Correcto** para callbacks de ML (OAuth/webhooks no tienen JWT de Supabase)
- **Verificar** que `ml-oauth` valide el `state` parameter correctamente contra CSRF

### 3. Secrets Management
- ❌ `supabase/functions/.env` **no existe** (solo `.env.example`)
- ✅ No hay secrets hardcodeados en `.env` de apps (solo anon key pública)
- ⚠️ `supabase/config.toml` tiene `jwt_secret` hardcodeado (local only, pero debería usar `env(JWT_SECRET)`)

### 3. Rate Limiting
- ✅ Rate limiting implementado en `_shared/rate-limit.ts` con sliding window
- ✅ Configurado por función con límites apropiados
- ⚠️ Limpieza de logs antiguos comentada (línea 59) → tabla `rate_limit_logs` crecerá indefinidamente

---

## 🟡 Problemas de Calidad y Mantenibilidad

### 1. Build Warning - Dynamic Import
```
(!) C:/.../bienenhaus-supabase/src/index.ts is dynamically imported by .../supabase.ts but also statically imported by ...
dynamic import will not move module into another chunk.
```
**Causa:** `@bienenhaus/supabase` importado tanto estáticamente como dinámicamente
**Fix:** Usar solo import estático o configurar `manualChunks` en Vite

### 2. Chunks Grandes en Build Admin
| Chunk | Tamaño | gzip |
|-------|--------|------|
| vendor-recharts | 346.94 KB | 94.60 KB |
| vendor-supabase | 209.56 KB | 55.20 KB |
| vendor-misc | 158.37 KB | 49.63 KB |
| index | 84.77 KB | 25.11 KB |
| MercadoLibrePage | 47.85 KB | 11.20 KB |

**Optimización:** Code-splitting por rutas, lazy-loading de componentes pesados (Tasar, Chat, ML)

### 3. Cobertura de Tests - Áreas Críticas Sin Cubrir
| Archivo | % Stmts | % Branch | Crítico |
|---------|---------|----------|---------|
| `ml.schemas.ts` | 77.5% | 16.66% | ✅ ML core |
| `leads.ts` | 84.05% | 78.88% | ✅ CRM core |
| `ml.ts` (shared) | 76.88% | 62.85% | ✅ ML helpers |
| `supabase.ts` (shared) | 100% | 50% | ⚠️ solo 50% branches |

---

## 🗄️ Base de Datos - Estado y Problemas

### Tablas Principales (60 tablas)
| Tabla | RLS | Tamaño Estimado | Estado |
|-------|-----|-----------------|--------|
| `properties` | ✅ | 144 KB | ✅ |
| `leads` | ✅ | 152 KB | ✅ |
| `agents` | ✅ | 72 KB | ✅ |
| `admin_users` | ✅ | 48 KB | ✅ |
| `ml_sync_queue` | ✅ | 80 KB | ✅ |
| `ml_sync_history` | ✅ | 16 KB | ✅ |
| `property_ml_meta` | ✅ | 24 KB | ✅ |
| `visits` | ✅ | 120 KB | ✅ |
| `chat_messages` | ✅ | 88 KB | ✅ |
| `chat_channels` | ✅ | 88 KB | ✅ |
| `property_valuations` | ✅ | 80 KB | ✅ |
| `owners` | ✅ | 48 KB | ✅ |
| `property_owners` | ✅ | 40 KB | ✅ |
| `ml_sync_dead_letter` | ✅ | 80 KB | ✅ |
| `ml_sync_cooldown` | ✅ | 32 KB | ✅ |

### Tablas SIN RLS (Intencional - Vistas/Tablas Sombra)
- `agents_public` (vista pública)
- `agents_realtime` (tabla sombra para realtime)
- `ml_sync_dead_letter` (solo staff via RPC)
- `ml_sync_cooldown` (solo service_role via RPC)

### Índices Faltantes / Optimizables
```sql
-- En ml_sync_queue: índice compuesto para claim atómico
CREATE INDEX CONCURRENTLY idx_ml_sync_queue_claim 
  ON ml_sync_queue (status, next_attempt_at, priority DESC) 
  WHERE status IN ('pending', 'processing');

-- En leads: índice para búsqueda por email/phone
CREATE INDEX CONCURRENTLY idx_leads_email_phone 
  ON leads (email, phone) WHERE deleted_at IS NULL;
```

### Migraciones Problemáticas
| Migración | Problema |
|-----------|----------|
| `0071_trash_retention_cron.sql` | `cron.unschedule` falla si job no existe (fixed en 0074) |
| `0040_property_reorder_rpc.sql` | Referenciado en deploy script pero no existe |
| `0068_agent_property_assignments` | RLS policy `agents_staff_all` permite `for all` - revisar |

---

## 🔧 Plan de Remediación Priorizado

### 🔴 CRÍTICO - Esta Semana

| # | Tarea | Archivo/Ubicación | Esfuerzo |
|---|-------|-------------------|----------|
| 1 | **Fix E2E login timeout** | `apps/admin/e2e/auth.setup.ts`, `apps/admin/src/pages/Login.tsx` | 4h |
| 2 | **Habilitar `enable_confirmations = true`** | `supabase/config.toml` | 15min |
| 3 | **Habilitar `secure_password_change = true`** | `supabase/config.toml` | 15min |
| 4 | **Rotar JWT secret y usar env var** | `supabase/config.toml`, `.env` | 30min |
| 5 | **Fix duplicate keys en tests** | `apps/admin/src/lib/__tests__/properties.*.test.ts` | 30min |

### 🟡 ALTO - Próxima Semana

| # | Tarea | Archivo/Ubicación | Esfuerzo |
|---|-------|-------------------|----------|
| 6 | **Restringir `enable_signup = false`** + crear usuarios via admin UI/Edge Function | `supabase/config.toml` | 1h |
| 7 | **Crear `supabase/functions/.env`** con secrets reales para local dev | `supabase/functions/.env` | 30min |
| 8 | **Configurar `enable_confirmations = true` en email auth** | `supabase/config.toml` | 15min |
| 9 | **Implementar limpieza automática `rate_limit_logs`** | `supabase/functions/_shared/rate-limit.ts` | 1h |
| 10 | **Fix Vite dynamic import warning** | `vite.config.ts` (manualChunks) | 2h |
| 11 | **Code-splitting: lazy load Tasar, Chat, ML pages** | `apps/admin/src/App.tsx` | 4h |
| 12 | **Revisar `ml_sync_cooldown` usage en todas las Edge Functions** | `supabase/functions/ml.ts` | 2h |

### 🟢 MEDIO - Sprint Siguiente

| # | Tarea | Esfuerzo |
|---|-------|----------|
| 13 | Code-splitting por rutas (lazy load Tasar, Chat, ML, Reports) | 4h |
| 14 | Aumentar coverage en `ml.ts` (shared) y `leads.ts` | 4h |
| 15 | Implementar limpieza automática `rate_limit_logs` (pg_cron) | 2h |
| 16 | Configurar PITR (Point-in-Time Recovery) en Supabase Cloud | 1h |
| 17 | Configurar CSP headers en `config.toml` / `serve.mjs` | 2h |
| 18 | Documentar runbooks: rollback, incident response, backup restore | 4h |
| 19 | Agregar tests E2E para flujos críticos (ML sync, leads, visits) | 8h |
| 20 | Performance audit: Lighthouse CI budgets en CI | 2h |

---

## 📋 Checklist Pre-Producción

### Infraestructura
- [ ] Supabase project linked y migrations pushed (`supabase db push`)
- [ ] Edge Functions deployed (18 functions)
- [ ] Secrets configurados en Supabase Dashboard (14 secrets requeridos)
- [ ] SMTP configurado (Resend) para emails auth/contact
- [ ] Dominio `bienenhaus.com.ar` configurado en Supabase Auth URLs
- [ ] Webhooks ML registrados (questions, orders, items, payments, shipments)
- [ ] Cron jobs activos: `ml-sync`, `visits-process-reminders`, `process-retention-policies`, `trash-retention-weekly`

### Aplicación
- [ ] Build production exitoso (`pnpm build`)
- [ ] Typecheck limpio (`pnpm typecheck`)
- [ ] Tests unitarios passing (`pnpm test`)
- [ ] **E2E tests passing** ❌ **BLOQUEANTE**
- [ ] Coverage > 80% statements

### Seguridad
- [ ] `enable_confirmations = true`
- [ ] `secure_password_change = true`
- [ ] `enable_signup = false` (solo admin crea usuarios)
- [ ] JWT secret rotado y en env var
- [ ] `enable_refresh_token_rotation = true` ✅
- [ ] Rate limiting en todas las Edge Functions ✅
- [ ] RLS enabled en 35+ tablas ✅

### Monitoreo
- [ ] Sentry DSN configurado en repo vars
- [ ] Lighthouse CI configurado
- [ ] Backup diario automático (workflow `backup.yml`)
- [ ] Alertas de rate limit / errors en Sentry

---

## 📝 Conclusión

**Estado actual:** **Código listo para producción** excepto **E2E tests fallando** (bloquea CI/CD) y **configuraciones de auth inseguras**.

**Próximos pasos inmediatos:**
1. **Fix E2E login** → desbloquea pipeline CI/CD
2. **Endurecer auth config** → `enable_confirmations=true`, `secure_password_change=true`
2. **Rotar secrets** → JWT secret, ML credentials
3. **Deploy a staging** → validar E2E completo
4. **Deploy a producción** → con checklist completo

**Esfuerzo estimado total:** ~40 horas (1 semana full-time)

---

**Documento generado automáticamente** - Verificar manualmente cada item antes de producción.