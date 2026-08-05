# Runbook: Incident Response

## Clasificación de Severidad

| Severidad | Descripción | SLA Respuesta | SLA Resolución |
|-----------|-------------|---------------|----------------|
| **SEV-1** | Sistema caído, data loss, security breach | 15 min | 2 horas |
| **SEV-2** | Funcionalidad crítica rota (login, pagos) | 30 min | 4 horas |
| **SEV-3** | Bug menor, UI rota, performance degradada | 2 horas | 24 horas |
| **SEV-4** | Bug cosmético, feature request | Next sprint | Next release |

## Proceso de Respuesta

### 1. Detección
- Alertas: GitHub Actions failure, Supabase alerts, User reports
- Logs: Supabase logs, Vercel/GitHub Actions logs, Browser console

### 2. Triage (≤ 15 min)
```
1. Confirmar severidad
2. Asignar Incident Commander
3. Crear issue en GitHub: "INC-YYYYMMDD-XXX: [SEV-X] Descripción"
4. Notificar equipo (Slack/Email)
```

### 3. Investigación
| Fuente | Qué Buscar |
|--------|------------|
| Supabase Logs | Auth errors, DB errors, Edge Function errors |
| GitHub Actions | Build/E2E failures |
| Browser Console | JS errors, network failures |
| Supabase Dashboard | DB CPU, connections, storage |

### 4. Mitigación / Fix
| Tipo | Acción |
|------|--------|
| Bug crítico | Hotfix branch → PR → merge → deploy |
| Config error | Supabase Dashboard → Config → Save |
| DB issue | `supabase db reset` (local) / Point-in-time recovery (prod) |
| Edge Function | Fix code → `supabase functions deploy` |

### 4. Verificación
- [ ] Tests pasan local
- [ ] E2E tests pasan
- [ ] Deploy staging/prod
- [ ] Smoke test producción

### 5. Post-Mortem (SEV-1/2)
```markdown
# Post-Mortem INC-YYYYMMDD-XXX

## Resumen
- Qué pasó:
- Impacto:
- Duración:

## Timeline
- HH:MM - Detección
- HH:MM - Triage
- HH:MM - Fix deployado
- HH:MM - Resuelto

## Root Cause
- 5 Whys analysis

## Action Items
- [ ] Fix preventivo
- [ ] Mejorar monitoring/alerting
- [ ] Actualizar runbook

## Lecciones Aprendidas
```

## Escalation
| Nivel | Contacto | Cuándo |
|-------|----------|--------|
| Nivel 1 | Dev On-Call | Inmediato |
| Nivel 2 | Tech Lead | SEV-1/2 no resuelto en 30 min |
| Nivel 3 | CTO / Management | SEV-1 > 1 hora |

## Contactos
- Dev On-Call: Facundo Herrera
- Supabase Support: Dashboard → Support
- GitHub: Settings → Actions → Support