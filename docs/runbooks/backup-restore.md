# Runbook: Backup & Restore

## Backup Strategy

### Automated (GitHub Actions - Daily 03:00 UTC)
- **Workflow:** `.github/workflows/backup.yml`
- **Comando:** `pg_dump --schema=public --no-owner --no-privileges`
- **Retención:** 90 días (artifacts GitHub)
- **Manual:** `workflow_dispatch` disponible

### Manual (Supabase Dashboard)
1. Dashboard → Database → Backups
2. "Create backup" → Download
3. Incluye: schema + data + roles

### Point-in-Time Recovery (PITR)
- Supabase Pro: 7 días PITR
- Dashboard → Database → Backups → "Point in time recovery"

## Restore Procedures

### Restore Completo (Supabase Dashboard)
1. Dashboard → Database → Backups
2. Seleccionar backup → "Restore"
3. Confirmar → Esperar completion (10-30 min)
4. Verificar: `SELECT count(*) FROM properties;`

### Point-in-Time Recovery (PITR)
1. Dashboard → Database → Backups → "Point in time recovery"
2. Seleccionar timestamp (antes del incidente)
3. Confirmar → Nueva branch temporal
4. Validar datos → Promover a main si OK

### Restore Parcial (pg_restore local)
```bash
# 1. Descargar backup .sql o .dump
# 2. Restaurar local
pg_restore --clean --if-exists --dbname=postgres://postgres:postgres@localhost:54322/postgres backup.dump

# 2b. Si es .sql
psql -h localhost -p 54322 -U postgres -d postgres -f backup.sql
```

### Restore Parcial (Solo Tabla)
```bash
# Solo tabla properties
pg_restore --table=properties --data-only --dbname=... backup.dump

# O via SQL
COPY properties FROM '/tmp/properties.csv' CSV HEADER;
```

## Verificación Post-Restore
```sql
-- Conteos básicos
SELECT 'properties' as t, count(*) FROM properties
UNION ALL SELECT 'leads', count(*) FROM leads
UNION ALL SELECT 'agents', count(*) FROM agents
UNION ALL SELECT 'admin_users', count(*) FROM admin_users;

-- Verificar RLS
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Verificar triggers
SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public';
```

## Backup de Edge Functions
```bash
# Descargar todas
supabase functions download --all

# O individual
supabase functions download admin-user-invite
```

## Restore Edge Functions
```bash
# Deploy todas
supabase functions deploy

# O individual
supabase functions deploy admin-user-invite
```

## Verificación Post-Restore
- [ ] Login admin funciona
- [ ] Dashboard carga datos
- [ ] CRUD operaciones OK
- [ ] ML sync funciona
- [ ] Edge functions responden
- [ ] RLS policies activas

## Retención
| Tipo | Retención | Ubicación |
|------|-----------|-----------|
| Daily pg_dump | 90 días | GitHub Actions Artifacts |
| Supabase Backups | 7 días (PITR) / 30 días (manual) | Supabase Dashboard |
| Edge Functions | Git history | GitHub Repo |

## Contactos
- Supabase Support: Dashboard → Support
- GitHub Artifacts: Actions → Backup workflow