# Bienenhaus — Production Hardening + Tasaciones 2.0

Fecha: 2026-08-11

## 1. Qué se cambió

### Tasaciones / ACM

Se recreó el flujo de Tasar sin eliminar la lógica de cálculo ni los campos existentes.

- `/tasar` ahora es el centro de gestión de tasaciones.
- Al entrar se muestra el listado de tasaciones existentes.
- Incluye borradores y tasaciones finalizadas.
- Búsqueda por solicitante, dirección y barrio.
- Filtro por estado.
- Acción para crear una nueva tasación.
- Acción para editar una tasación existente.
- Acción de soft-delete hacia papelera.
- Las tasaciones finalizadas continúan protegidas por lock.
- Se conserva la opción de habilitar edición.
- `/tasar/nueva` inicia una tasación vacía; los borradores ya existentes se seleccionan desde el listado.
- `/tasar/:id` abre una tasación existente completa.
- Los 8 bloques originales del formulario se mantienen, pero ahora se renderizan en una sola página.
- Los campos se presentan verticalmente, uno debajo del otro.
- Se mantiene el auto-save de borradores.
- Se mantienen validaciones Zod, comparables, imágenes, cálculos, finalización y bloqueo.

### Correcciones de datos de Tasaciones

- `fetchAll()` tenía un error de paginación: para `page=1` comenzaba desde el offset de la segunda página. Se corrigió a `(page - 1) * pageSize`.
- `update()` podía borrar la imagen de fachada al actualizar únicamente comparables. Ahora conserva la URL anterior si no se envía una nueva.
- Se eliminó un archivo backup `VisitsPage.tsx.bak` del código fuente.
- Se corrigió un import relativo roto en `properties.mappers.test.ts`.

### Mercado Libre

Se integró la ronda de hardening preparada anteriormente:

- OAuth con state server-side y PKCE.
- Estado OAuth de un solo uso y expiración.
- Hardening de publicación/sincronización.
- Webhook idempotente.
- `orders_v2`.
- Protección frente a jobs duplicados.
- Índice de unicidad para trabajos ML activos.
- Endurecimiento de cliente ML y esquemas.

### Chat / archivos

- Reparación de `chat-validation.ts`.
- `chat-upload` ahora valida autenticación y participación en el canal.
- No confía en un `senderId` arbitrario del cliente.
- Bucket privado conservado.
- URLs firmadas temporales.
- Nombres de archivo sanitizados.
- Limpieza del objeto si falla la inserción del mensaje.

### Retención / seguridad Supabase

- La Edge Function de retención quedó restringida a tokens `service_role`.
- Se eliminó el uso de una tabla `notifications` inexistente.
- Se limitó el conjunto de entidades permitidas.
- Se agregaron políticas RLS para tablas creadas después de los grants iniciales.
- `0060_security_hardening_missing_rls.sql` limpia las entidades inválidas de la migración 0053 y agrega `property_valuations`.

## 2. Validaciones ejecutadas

### Parseo TypeScript/TSX

Se recorrieron 365 archivos `.ts`/`.tsx` del proyecto excluyendo dependencias, `.git`, `dist` y `.temp`.

Resultado:

- Diagnósticos sintácticos: **0 archivos con errores**.

### Imports relativos

Se encontró y corrigió un import relativo roto en:

`apps/admin/src/lib/__tests__/properties.mappers.test.ts`

Los imports `.js` dentro de `packages/bienenhaus-supabase` son imports de runtime de Supabase/Deno y no se trataron como imports TypeScript relativos tradicionales.

### Build/typecheck

No se pudo completar el `pnpm typecheck` desde este entorno porque Corepack intenta descargar `pnpm@11.20.0` desde npm y el entorno de ejecución no tiene conectividad con `registry.npmjs.org`.

El `node_modules` incluido en el ZIP de origen está incompleto para ejecutar un typecheck fiable: faltan definiciones de `vite/client`, `vitest/globals` y `@testing-library/jest-dom`.

Por eso no se declara que el build remoto haya pasado al 100% desde este entorno.

## 3. Deuda detectada que no se debe ocultar

Hay suites de tests actualmente marcadas con `describe.skip`, entre ellas partes de:

- leads
- properties
- visits
- chat
- Mercado Libre

Esto no significa necesariamente que la aplicación esté rota, pero sí significa que esas pruebas no constituyen una garantía de regresión mientras permanezcan skipped.

## 4. Orden de validación antes del deploy real

En un entorno con red y dependencias completas:

```bash
pnpm install --frozen-lockfile
pnpm -r typecheck
pnpm -r build
pnpm -r test
pnpm --filter @bienenhaus/admin test:e2e
```

Después:

1. aplicar migraciones 0059 y 0060;
2. comprobar RLS en Supabase remoto;
3. desplegar Edge Functions;
4. verificar OAuth de Mercado Libre;
5. probar publicación real de una propiedad;
6. probar actualización y cierre;
7. probar webhook y deduplicación;
8. probar preguntas/órdenes;
9. probar chat con archivo privado;
10. crear, editar, guardar, finalizar y reabrir una tasación;
11. verificar papelera y retención;
12. comprobar backups, monitoring y logs.

## 5. Resultado

El paquete contiene el código fuente corregido e integrado sobre el estado del proyecto entregado, con la nueva experiencia de Tasaciones y los hardenings críticos de Mercado Libre, Chat y Supabase.

No se incluyen `node_modules`, `.git`, secretos `.env`, `dist` ni `.temp` en el paquete de producción fuente.
