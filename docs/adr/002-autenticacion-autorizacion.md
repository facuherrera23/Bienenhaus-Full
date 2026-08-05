# ADR 002: Autenticación y Autorización — Supabase Auth + RLS + Roles

## Status
Accepted

## Context
El panel admin requiere:
- Autenticación segura (email/password, MFA TOTP)
- Autorización granular por roles (super_admin, admin, staff, viewer)
- Sesiones persistentes con refresh automático
- Rate limiting en login
- Cambio obligatorio de contraseña en primer acceso
- Soft delete de usuarios (no borrado físico)

## Decision

### Autenticación: Supabase Auth (GoTrue)
- **Provider:** Email/password nativo (sin OAuth por ahora)
- **Flow:** PKCE + refresh token rotation (30 min access, 7 días refresh)
- **MFA:** TOTP opcional (configurado en `config.toml`)
- **Rate limiting:** Configurado en `config.toml` (email: 2/h, signin: 100/5min)
- **Client-side rate limit:** 5 intentos / 15 min lockout (localStorage)

### Autorización: RLS + Roles en `admin_users`
```sql
-- Tabla de roles
CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'staff', 'viewer');

CREATE TABLE admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  full_name text,
  role admin_role DEFAULT 'viewer',
  is_active boolean DEFAULT true,
  must_change_password boolean DEFAULT false,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS policies example
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_crud" ON properties
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_active AND role IN ('super_admin', 'admin', 'staff')
    )
  );
CREATE POLICY "public_select" ON properties
  FOR SELECT TO anon, authenticated
  USING (status = 'publicada' AND deleted_at IS NULL);
```

### Client-side Auth State (`store/app.ts`)
```typescript
export const authSession = signal<Session | null>(null);
export const authLoading = signal(true);
export const authUserRole = signal<AdminRole | null>(null);
export const authMustChangePassword = signal(false);
export const authSigningOut = signal(false);
```

### Password Change Flow
1. Login exitoso → `authMustChangePassword.value` = true
2. Redirect a `/cambiar-contrasena` (nueva página `ChangePassword`)
3. Validación: contraseña actual + nueva (min 8 chars, distinta a actual)
4. `supabase.auth.updateUser({ password })` + update `must_change_password = false`
5. Redirect a dashboard

### Rate Limiting (Client-side)
```typescript
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 min
// localStorage: { count, lastAttempt }
```

### Edge Function: `admin-user-invite`
- `action: 'invite'` → crea usuario en Auth + `admin_users` + genera recovery link
- `action: 'reset'` → genera recovery link para password reset
- `action: 'remove'` → soft delete en `admin_users` + hard delete en Auth

## Consequences

### Positivos
- Supabase Auth maneja todo: sessions, refresh, MFA, rate limits server-side
- RLS en DB → seguridad a nivel de fila, imposible de bypass desde cliente
- Roles simples pero suficientes para inmobiliaria
- Client-side rate limit evita brute force sin tocar servidor
- Password change flow obligatorio mejora seguridad

### Negativos
- RLS policies complejas de debuggear (requiere `supabase db diff`)
- No hay OAuth social (Google, Microsoft) configurado aún
- Rate limit client-side es bypassable (defensa en profundidad, no absoluta)
- No hay SSO / SAML para enterprise

### Riesgos
- RLS policy mal escrita → data leak o lockout
- Supabase Auth breaking changes (major version)
- Rate limit client-side bypassable (devtools)

## Alternatives Considered
| Opción | Por qué no |
|--------|------------|
| Auth0 / Clerk / Clerk | Costo alto, vendor lock-in adicional |
| Custom JWT + custom middleware | Reinventar rueda, más bugs, más mantenimiento |
| NextAuth.js | Requiere Next.js, no compatible con Preact + Vite puro |

## References
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [OWASP Auth Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)