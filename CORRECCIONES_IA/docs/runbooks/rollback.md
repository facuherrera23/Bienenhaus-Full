# Runbook: Rollback de Deploy

## Objetivo

Revertir un deploy problemático a versión anterior funcional.

## Cuándo Usar

- Bug crítico en producción (login roto, data loss, UI rota)
- Deploy fallido parcial
- Performance regression severa

## Procedimiento

### Opción 1: Git Revert (Recomendado)

```bash
# 1. Identificar commit problemático
git log --oneline -10

# 2. Revertir commit específico
git revert <commit-sha>

# 3. Push
git push origin main

# 4. Monitorear deploy en GitHub Actions
```

### Opción 2: Revertir a Tag Anterior

```bash
# Ver tags disponibles
git tag -l "v*" --sort=-v:refname

# Checkout tag anterior
git checkout v1.2.3

# Crear branch de hotfix
git checkout -b hotfix/rollback-v1.2.3

# Push y crear PR
git push origin hotfix/rollback-v1.2.3
# Crear PR → merge → deploy
```

### Opción 3: GitHub Pages - Re-deploy Anterior

```bash
# En GitHub Actions → Deployments
# Seleccionar deployment anterior exitoso
# "Re-deploy" (si disponible)
```

## Verificación Post-Rollback

- [ ] Login funciona
- [ ] Dashboard carga
- [ ] CRUD operaciones básicas
- [ ] No errores en consola
- [ ] Supabase conexiones OK

## Comunicación

- [ ] Notificar al equipo en Slack/Email
- [ ] Documentar incidente en issue tracker
- [ ] Programar post-mortem si fue incidente severo

## Contactos

- Deploy Owner: Facundo Herrera
- Supabase: Dashboard project `rnldqiwwzhjnurkguihu`
