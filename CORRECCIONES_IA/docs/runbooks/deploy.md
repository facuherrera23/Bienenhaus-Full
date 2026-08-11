# Runbook: Deploy to Production (GitHub Pages)

## Objetivo

Desplegar landing + admin a GitHub Pages (landing en `/`, admin en `/admin/`).

## Prerrequisitos

- Acceso al repo GitHub (write)
- Secrets configurados en GitHub Actions:
    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_ANON_KEY`
    - `SITE_DOMAIN` (opcional, para dominio custom)
    - `VITE_SENTRY_DSN` (opcional)
    - `SUPABASE_ACCESS_TOKEN` (para backup workflow)

## Procedimiento

### 1. Verificar rama `main`/`master`

```bash
git checkout main
git pull origin main
git status  # debe estar limpio
```

### 2. Verificar build local

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

### 3. Push a main

```bash
git push origin main
```

### 4. Monitorear GitHub Actions

- Ir a `Actions` → `Deploy GitHub Pages`
- Verificar que `build` y `deploy` pasan (≈ 5-8 min)
- Verificar URL: `https://bienenhaus.com.ar/` y `https://bienenhaus.com.ar/admin/`

### 5. Verificación Post-Deploy

- [ ] Landing carga en `/`
- [ ] Admin carga en `/admin/`
- [ ] Login funciona
- [ ] Dashboard muestra datos
- [ ] No errores en consola JS

## Rollback

```bash
# Si deploy falla o hay bug crítico:
git revert HEAD
git push origin main
# O: Actions → Re-run failed job → Cancel deployment
```

## Troubleshooting

| Problema            | Solución                                                |
| ------------------- | ------------------------------------------------------- |
| Build fails         | Revisar logs TypeCheck/Build en Actions                 |
| 404 en /admin/      | Verificar `admin.html` y `admin/404.html` en `out/`     |
| Login redirect loop | Verificar `site_url` y `redirect_urls` en Supabase Auth |
| Assets 404          | Verificar `base` en `vite.config.ts` (`/admin/`)        |

## Contactos

- DevOps: Facundo Herrera
- Supabase: Dashboard project `rnldqiwwzhjnurkguihu`
