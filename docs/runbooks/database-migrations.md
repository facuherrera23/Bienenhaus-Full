# Runbook: Database Migrations

## Resumen
Gestión de 61 migraciones PostgreSQL (0001_foundation → 0062_chat_ai_assistant) en Supabase.

## Estado Actual
```bash
# Ver migraciones aplicadas
supabase migration list

# Ver estado local vs remoto
supabase db diff --schema public
```

## Migraciones Clave por Módulo

| Rango | Módulo | Descripción |
|-------|--------|-------------|
| 0001-0008 | Foundation | Schema base, auth, taxonomías, properties, leads, ML, RLS, grants |
| 0009-0018 | Seguridad/Auditoría | Audit write policies, agent matrícula, fotos, site enhancements, contact, ML admin |
| 0019-0028 | Soft Delete + Features | Soft delete 4 tablas, visits, chat, ML webhook, audit log, visits enhancements, auto-reply |
| 0029-0038 | Leads/Agentes/Seguridad | Tags/scoring, permisos/comisiones, vista pública agentes, owners, ML fixes |
| 0039-0048 | Seguridad/Realtime | Rate limiting, security hardening, realtime, agents shadow, RPCs endurecidos |
| 0049-0058 | Auth/Valuaciones/ML | Admin users hardening, password change RPC, valuaciones (Tasar), ML auto-triggers |
| 0059-0062 | Hardening/Chat AI | ML production hardening, client credentials, security hardening, chat AI assistant |

## Crear Nueva Migración
```bash
# 1. Crear archivo
supabase migration new nombre_corto_descriptivo
# Ej: supabase migration new add_property_views_tracking

# 2. Editar SQL generado en supabase/migrations/YYYYMMDDHHMMSS_nombre_corto_descriptivo.sql

# 3. Aplicar local
supabase db push

# 4. Verificar
supabase db diff --schema public
```

## Aplicar Migraciones

### Local (Desarrollo)
```bash
# Reset completo (migraciones + seed)
supabase db reset

# Solo aplicar pendientes
supabase db push
```

### Producción (Supabase Cloud)
```bash
# Via Dashboard: Database → Migrations → Apply
# O via CLI:
supabase db push --project-ref rnldqiwwzhjnurkguihu
```

## Seed (Solo Local)
```bash
# seed.sql NO incluye datos demo (production-ready)
# Crea: taxonomías, site settings, admin user (si no existe)
supabase db reset
```

## Rollback
```bash
# Local: reset a versión específica
supabase db reset --migration-version 20240101000000

# Producción: NO hay rollback automático
# Requiere migración inversa manual (down migration)
# 1. Crear migración inversa
# 2. Aplicar en producción
# 3. Verificar datos
```

## Verificación Post-Migración
```bash
# 1. Typecheck (genera tipos actualizados)
pnpm --filter @bienenhaus/admin typecheck

# 2. Tests
pnpm --filter @bienenhaus/admin test

# 3. Verificar advisors (seguridad/performance)
supabase advisors --type security
supabase advisors --type performance

# 4. E2E tests críticos
pnpm --filter @bienenhaus/admin test:e2e
```

## Troubleshooting

| Error | Causa | Solución |
|-------|-------|----------|
| `relation "X" does not exist` | Migración no aplicada / orden incorrecto | Verificar `supabase migration list`, aplicar faltantes |
| `duplicate key value violates unique constraint` | Seed/datos duplicados | `supabase db reset` limpio o limpiar datos antes |
| `permission denied for table X` | RLS bloquea | Verificar policies en migración, grants en 0008 |
| `function X does not exist` | RPC no creada | Verificar migración que crea la función |
| `type X does not exist` | Enum/tipo faltante | Verificar migración 0001/0003 (taxonomías) |

## Convenciones de Naming
- Archivo: `NNNN_descripcion_corta.sql` (ej: `0063_add_property_views.sql`)
- Comentarios: `-- Description: ...` al inicio
- Transacciones: Una migración = una transacción (Supabase default)
- Índices: `CREATE INDEX CONCURRENTLY` para tablas grandes
- RLS: Siempre `ENABLE ROW LEVEL SECURITY` + policies

## Contactos
- Owner: Facundo Herrera
- Slack: #bienenhaus-infra
- Supabase Dashboard: https://supabase.com/dashboard/project/rnldqiwwzhjnurkguihu