# Runbook: Design System Atoms Migration (Button, IconButton, Skeleton)

## Resumen
Canonización de atoms en `@bienenhaus/ui` y eliminación de legacy Button (ADR 005, 007).

## Cambios Realizados
1. `Button` atom: styles.* + variante `icon` + tests/stories
2. `IconButton` atom: variante `danger` (tipos + CSS + test + story)
3. `Skeleton` atom: story `ButtonSkeleton` (spec §71)
4. Eliminado: `packages/bienenhaus-ui/src/Button.tsx` + `src/Button.module.css`
5. `src/index.ts` exporta `Button` desde `./components/atoms/Button`
6. `Login.tsx` migrado a `@bienenhaus/ui` Button atom
7. Limpiadas clases globales muertas en `apps/admin/src/styles.css`

## Verificación Pre-Deploy
```bash
# Verificar exports
cat packages/bienenhaus-ui/src/index.ts | grep -E "Button|IconButton|Skeleton"

# Verificar que NO existe legacy
ls packages/bienenhaus-ui/src/Button.tsx 2>/dev/null && echo "LEGACY EXISTE" || echo "OK: legacy eliminado"

# Verificar Login.tsx usa atoms
grep -n "from '@bienenhaus/ui'" apps/admin/src/pages/Login.tsx
```

## Tests de Regresión
```bash
# UI package
pnpm --filter @bienenhaus/ui typecheck
pnpm --filter @bienenhaus/ui test

# Admin (Login.tsx usa Button atom)
pnpm --filter @bienenhaus/admin typecheck
pnpm --filter @bienenhaus/admin test
pnpm --filter @bienenhaus/admin build

# Landing
pnpm --filter @bienenhaus/landing build
```

## QA Visual (Fase 1c+)
### Login Page
- [ ] Button `variant="primary" fullWidth size="lg"` renderiza correctamente
- [ ] Loading state muestra spinner inline (no clase `.spin` legacy)
- [ ] Disabled state funciona
- [ ] Responsive: 480px breakpoint

### Dashboard
- [ ] KPI cards con animaciones count-up
- [ ] Hover effects en kpiCard
- [ ] Responsive: 768px / 480px breakpoints
- [ ] Reduced motion respetado

## Rollback
```bash
# Restaurar Button legacy
git checkout HEAD~1 -- packages/bienenhaus-ui/src/Button.tsx packages/bienenhaus-ui/src/Button.module.css
git checkout HEAD~1 -- packages/bienenhaus-ui/src/index.ts
git checkout HEAD~1 -- apps/admin/src/pages/Login.tsx
pnpm --filter @bienenhaus/ui typecheck && pnpm --filter @bienenhaus/ui test
```

## Checklist Post-Deploy
- [ ] `pnpm typecheck` pasa en ui, admin, landing
- [ ] `pnpm test` pasa en ui, admin
- [ ] `pnpm build` pasa en ui, admin, landing
- [ ] Login funcional (credenciales seed)
- [ ] Dashboard carga métricas y gráficos
- [ ] No hay errores de consola en dev/prod
- [ ] E2E tests pasan (login, admin-pages)

## Próximos Pasos (Fase 1c+)
1. Migrar batch A: MercadoLibrePage, ConfigPage, TasarPage, LeadsPage, PropertiesPage
2. Migrar batch B: AgentFormPage, LeadDetailPage, LeadFormPage, OwnerFormPage, VisitFormPage
3. Script codemod para `btn--` → `Button`, `icon-btn` → `IconButton`, `badge--` → `Badge`, `.spin` → `Spinner`

## Contactos
- Owner: Facundo Herrera
- Slack: #bienenhaus-frontend