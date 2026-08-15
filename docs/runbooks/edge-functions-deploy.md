# Runbook: Edge Functions Deploy

## Resumen
Despliegue de 18 Edge Functions (Deno 2) a Supabase Cloud.

## Funciones
| Función | Descripción | Auth | Secrets Requeridos |
|---------|-------------|------|-------------------|
| admin-user-invite | Invite/reset/remove admin users | service_role | - |
| audit-log | Log acciones staff | service_role | - |
| chat-ai | Asistente IA chat (Gemini Flash) | user | GEMINI_API_KEY |
| chat-upload | Upload adjuntos chat | user | - |
| contact-submit | Formulario contacto landing | anon | RESEND_API_KEY |
| convert-image | Conversión imágenes (WebP) | user | - |
| ml-answer-question | Auto-respuesta preguntas ML | service_role | CRYPTO_SECRET, ML_* |
| ml-bulk-enqueue | Encola sync masivo | service_role | ML_SYNC_SECRET |
| ml-categories | Sync categorías ML | service_role | CRYPTO_SECRET, ML_* |
| ml-listing-types | Sync listing types ML | service_role | CRYPTO_SECRET, ML_* |
| ml-metrics | Métricas publicación ML | service_role | CRYPTO_SECRET, ML_* |
| ml-oauth | OAuth callback ML | user | CRYPTO_SECRET, ML_* |
| ml-revoke-tokens | Revoca tokens ML | service_role | CRYPTO_SECRET, ML_* |
| ml-sync | Procesa cola sync | service_role/ML_SYNC_SECRET | CRYPTO_SECRET, ML_* |
| ml-webhook | Webhook ML (preguntas/órdenes) | público | CRYPTO_SECRET, ML_* |
| process-retention-policies | Procesa retención papelera | cron | - |
| qr-checkin | Check-in QR visitas | user | - |
| visits-process-reminders | Genera recordatorios visitas | cron | - |

## Secrets Requeridos (Supabase Dashboard → Edge Functions → Secrets)
```bash
# Configurar via CLI
supabase secrets set CRYPTO_SECRET=<aes-256-gcm-key>
supabase secrets set ML_CLIENT_ID=<ml-client-id>
supabase secrets set ML_CLIENT_SECRET=<ml-client-secret>
supabase secrets set ML_SYNC_SECRET=<shared-secret>
supabase secrets set RESEND_API_KEY=<resend-api-key>
supabase secrets set GEMINI_API_KEY=<google-ai-key>
supabase secrets set ADMIN_BASE_URL=https://tudominio.com/admin
```

## Deploy Manual
```bash
# Deploy todas
supabase functions deploy

# Deploy individual
supabase functions deploy ml-sync

# Deploy con verify_jwt=false (solo si necesario)
supabase functions deploy contact-submit --no-verify-jwt
```

## Deploy via CI (GitHub Actions)
```yaml
# .github/workflows/deploy-functions.yml
- name: Deploy Edge Functions
  run: |
    supabase functions deploy --project-ref rnldqiwwzhjnurkguihu
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

## Verificación Post-Deploy
```bash
# Listar funciones deployadas
supabase functions list

# Ver logs función
supabase functions logs ml-sync --project-ref rnldqiwwzhjnurkguihu

# Test invocación manual
curl -X POST https://rnldqiwwzhjnurkguihu.supabase.co/functions/v1/ml-sync \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Rollback
```bash
# Ver versiones
supabase functions versions ml-sync

# Rollback a versión anterior
supabase functions deploy ml-sync --version <version-number>
```

## Troubleshooting
| Error | Causa | Solución |
|-------|-------|----------|
| `verify_jwt` failed | Token inválido/expirado | Verificar `Authorization: Bearer <service_role>` |
| `CRYPTO_SECRET` not set | Secret faltante | `supabase secrets set CRYPTO_SECRET=...` |
| `ML_CLIENT_ID` not set | Secret faltante | Configurar en Dashboard ML + Supabase secrets |
| CORS error | Origen no permitido | Verificar `_shared/http.ts` CORS config |
| Timeout > 30s | Función muy lenta | Optimizar query / dividir en chunks |

## Contactos
- Owner: Facundo Herrera
- Slack: #bienenhaus-infra
- Supabase Dashboard: https://supabase.com/dashboard/project/rnldqiwwzhjnurkguihu