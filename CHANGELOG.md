# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Edge function `chat-upload`: Upload de adjuntos del chat interno con autenticación requireAdmin, rate limiting por usuario, y URLs firmadas para bucket `chat-files` privado (migración 0047)
- Edge function `convert-image`: Conversión/optimización de imágenes a WebP con rate limiting por IP (protección DoS)
- Edge function `ml-revoke-tokens`: Revocación de tokens de conexión Mercado Libre con verificación de administrador interno
- Edge function `process-retention-policies`: Procesado de políticas de retención de papelera con auth staff/admin y deletes en batches

### Changed
- Edge function `process-retention-policies`: Eliminado insert a tabla `notifications` (no existe en schema); ahora usa `console.log` con conteos; agregado requireAdmin auth
- Edge function `chat-upload`: Creado cliente supabase, definido MESSAGE_SELECT local, auth `requireAdmin` + `senderId === userId`, rate limit `checkRateLimit('chat-upload', userId)`, validación tipo/tamaño, `safeFileName()`, `createSignedUrl` (bucket privado), sin thumbnail
- Edge function `convert-image`: Añadido `rateLimitMiddleware('convert-image', req)` (IP-based) antes del bloque try
- Config `_shared/rate-limit.ts`: Añadidas entradas `'chat-upload'` y `'convert-image'` al `RATE_LIMIT_CONFIG`
- Vista `public.agents_public`: Recreada con `security_invoker = true` (fijado error SECURITY DEFINER)
- Auth leaked password protection: Habilitado en dashboard Supabase

### Fixed
- Tabla `notifications` no existe en Supabase cloud — process-retention-policies ahora registra conteos vía console.log
- Acceso directo de anon a tabla `agents` revocado; acceso ahora únicamente por vista `agents_public`
- Edge function `ml-revoke-tokens`: patrón verificado (createClient + isAdmin + _shared/crypto + _shared/ml + _shared/http + _shared/auth)
- Edge function `chat-upload`: cliente supabase creado correctamente (antes no se instanciaba → crash)

### Security
- Vista `agents_public` cambiada de SECURITY DEFINER a SECURITY INVOKER (security_invoker = true)
- Auth leaked password protection habilitado en Supabase dashboard
- Rate limiting configurado para funciones chat-upload (10 requests/min) y convert-image (30 requests/min)

## [X.Y.Z] - YYYY-MM-DD

_(Próximos releases se documentarán aquí)_