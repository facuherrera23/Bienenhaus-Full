# Runbook: Supabase Client Migration

## Resumen
Migración de 3 instancias Supabase Client a `@bienenhaus/supabase` shared package (ADR 006).

## Verificación Pre-Migración
```bash
# Verificar instancias actuales
grep -r "createClient" apps/admin/src/lib/supabase.ts apps/landing/src/lib/supabase*.ts

# Verificar tipos en admin
grep -r "Database" apps/admin/src/types/database.ts | head -5
```

## Pasos de Migración

### 1. Actualizar @bienenhaus/supabase
```bash
cd packages/bienenhaus-supabase
# Verificar exports
cat src/index.ts | grep -E "export.*createTypedClient|export.*supabase"
# Typecheck
pnpm typecheck
```

### 2. Migrar apps/admin/src/lib/supabase.ts
```typescript
// Antes: cliente propio tipado
// Después: re-export desde shared + getAdminSupabase()

import type { Database } from '../types/database';
export type { SupabaseClient, User, AuthChangeEvent, Session } from '@bienenhaus/supabase';
export type { Database } from '../types/database';
export { supabase } from '@bienenhaus/supabase';
export { supabaseUrl } from '@bienenhaus/supabase';
export { createTypedClient } from '@bienenhaus/supabase';
export { getAuthUser, getSession, signOut, onAuthStateChange } from '@bienenhaus/supabase';

type AdminSupabaseClient = SupabaseClient<Database>;
let _adminSupabase: AdminSupabaseClient | null = null;

export async function getAdminSupabase(): Promise<AdminSupabaseClient> {
    if (!_adminSupabase) {
        const { createTypedClient } = await import('@bienenhaus/supabase');
        _adminSupabase = createTypedClient<Database>({ schema: 'public' });
    }
    return _adminSupabase!;
}
```

### 3. Verificar consumidores admin
```bash
# Buscar imports de supabase en admin
grep -r "from '../lib/supabase'" apps/admin/src/lib/*.ts apps/admin/src/lib/**/*.ts

# Verificar que usan getAdminSupabase() o supabase shared
grep -r "getAdminSupabase\|supabase\." apps/admin/src/lib/*.ts | head -20
```

### 4. Tests de Regresión
```bash
# Typecheck
pnpm --filter @bienenhaus/admin typecheck

# Tests unitarios
pnpm --filter @bienenhaus/admin test

# Build
pnpm --filter @bienenhaus/admin build
```

### 5. Verificar Landing (no breaking)
```bash
pnpm --filter @bienenhaus/landing typecheck
pnpm --filter @bienenhaus/landing build
```

## Rollback
```bash
# Revertir apps/admin/src/lib/supabase.ts a versión anterior
git checkout HEAD~1 -- apps/admin/src/lib/supabase.ts
pnpm --filter @bienenhaus/admin typecheck && pnpm --filter @bienenhaus/admin build
```

## Checklist Post-Migración
- [ ] `pnpm typecheck` pasa en admin, landing, ui
- [ ] `pnpm test` pasa en admin, ui
- [ ] `pnpm build` pasa en admin, landing
- [ ] E2E tests pasan (login, admin-pages, create-property)
- [ ] No hay imports rotos en admin
- [ ] `@bienenhaus/supabase` exporta `createTypedClient`, `supabase`, `supabaseUrl`, auth helpers

## Contactos
- Owner: Facundo Herrera
- Slack: #bienenhaus-infra