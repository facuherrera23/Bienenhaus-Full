#!/usr/bin/env bash
# deploy-production.sh
# Script completo de deploy a producción para Bienenhaus
# Uso: ./deploy-production.sh [staging|production]

set -euo pipefail

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ENVIRONMENT="${1:-production}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Bienenhaus Deploy - ${ENVIRONMENT^^}${NC}"
echo -e "${BLUE}========================================${NC}"

# ============================================================
# Validaciones previas
# ============================================================

echo -e "\n${YELLOW}🔍 Validando pre-requisitos...${NC}"

# Verificar Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI no instalado${NC}"
    echo "Instalar: npm i -g supabase"
    exit 1
fi

# Verificar que estamos en el directorio correcto
if [[ ! -f "$ROOT_DIR/supabase/config.toml" ]]; then
    echo -e "${RED}❌ No se encuentra supabase/config.toml. Ejecutar desde root del proyecto.${NC}"
    exit 1
fi

# Verificar git status limpio
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}⚠️  Hay cambios sin commitear. Commit antes de deploy.${NC}"
    git status --short
    read -p "Continuar de todas formas? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Verificar tests pasan
echo -e "\n${YELLOW}🧪 Ejecutando tests...${NC}"
cd "$ROOT_DIR/apps/admin"
if ! npx pnpm test 2>&1 | grep -q "passed"; then
    echo -e "${RED}❌ Tests fallaron${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Tests OK${NC}"

# Verificar build
echo -e "\n${YELLOW}🏗️  Verificando build...${NC}"
if ! npx pnpm build 2>&1 | grep -q "built in"; then
    echo -e "${RED}❌ Build falló${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build OK${NC}"

cd "$ROOT_DIR"

# ============================================================
# Configuración por ambiente
# ============================================================

if [[ "$ENVIRONMENT" == "production" ]]; then
    SUPABASE_PROJECT_REF="${SUPABASE_PROD_REF:-}"
    VERCEL_PROJECT="${VERCEL_PROD_PROJECT:-bienenhaus-admin}"
    ADMIN_BASE_URL="https://bienenhaus.com.ar/admin"
    SITE_DOMAIN="bienenhaus.com.ar"
elif [[ "$ENVIRONMENT" == "staging" ]]; then
    SUPABASE_PROJECT_REF="${SUPABASE_STAGING_REF:-}"
    VERCEL_PROJECT="${VERCEL_STAGING_PROJECT:-bienenhaus-admin-staging}"
    ADMIN_BASE_URL="https://staging.bienenhaus.com.ar/admin"
    SITE_DOMAIN="staging.bienenhaus.com.ar"
else
    echo -e "${RED}❌ Ambiente inválido: $ENVIRONMENT (usar staging|production)${NC}"
    exit 1
fi

if [[ -z "$SUPABASE_PROJECT_REF" ]]; then
    echo -e "${RED}❌ SUPABASE_PROJECT_REF no configurado${NC}"
    echo "Exportar: export SUPABASE_PROD_REF=xxx (o SUPABASE_STAGING_REF)"
    exit 1
fi

echo -e "\n${BLUE}📋 Configuración:${NC}"
echo -e "  Ambiente: ${ENVIRONMENT}"
echo -e "  Supabase Project: ${SUPABASE_PROJECT_REF}"
echo -e "  Admin URL: ${ADMIN_BASE_URL}"
echo -e "  Vercel Project: ${VERCEL_PROJECT}"

# ============================================================
# 1. Deploy Supabase (Migraciones + Edge Functions)
# ============================================================

echo -e "\n${YELLOW}📦 Deploy Supabase...${NC}"

# Link al proyecto
echo "Linking to Supabase project..."
supabase link --project-ref "$SUPABASE_PROJECT_REF"

# Push migraciones (incluye 0040_production_ready)
echo "Pushing migrations..."
supabase db push --project-ref "$SUPABASE_PROJECT_REF"

# Deploy Edge Functions
echo "Deploying Edge Functions..."
FUNCTIONS=(
    "ml-sync"
    "ml-webhook"
    "ml-oauth"
    "ml-categories"
    "ml-listing-types"
    "ml-metrics"
    "ml-answer-question"
    "ml-bulk-enqueue"
)

for fn in "${FUNCTIONS[@]}"; do
    echo "  Deploying $fn..."
    supabase functions deploy "$fn" --project-ref "$SUPABASE_PROJECT_REF"
done

echo -e "${GREEN}✅ Supabase deploy OK${NC}"

# ============================================================
# 2. Configurar Secrets en Supabase
# ============================================================

echo -e "\n${YELLOW}🔐 Configurando secrets...${NC}"

# Verificar que las vars de entorno estén seteadas
REQUIRED_SECRETS=(
    "ML_CLIENT_ID"
    "ML_CLIENT_SECRET"
    "ML_WEBHOOK_SECRET"
    "ML_SYNC_SECRET"
    "CRYPTO_SECRET"
    "SERVICE_ROLE_KEY"
    "ADMIN_BASE_URL"
)

MISSING=()
for secret in "${REQUIRED_SECRETS[@]}"; do
    if [[ -z "${!secret:-}" ]]; then
        MISSING+=("$secret")
    fi
done

if [[ ${#MISSING[@]} -gt 0 ]]; then
    echo -e "${RED}❌ Secrets faltantes en environment:${NC}"
    for m in "${MISSING[@]}"; do
        echo "  - $m"
    done
    echo "Configurar en .env o exportar antes de correr el script."
    exit 1
fi

# Setear secrets en Supabase
for secret in "${REQUIRED_SECRETS[@]}"; do
    echo "  Setting $secret..."
    supabase secrets set "$secret=${!secret}" --project-ref "$SUPABASE_PROJECT_REF"
done

# ADMIN_BASE_URL especial
supabase secrets set ADMIN_BASE_URL="$ADMIN_BASE_URL" --project-ref "$SUPABASE_PROJECT_REF"

echo -e "${GREEN}✅ Secrets configurados${NC}"

# ============================================================
# 3. Deploy Frontend (Vercel)
# ============================================================

echo -e "\n${YELLOW}🌐 Deploy Frontend (Vercel)...${NC}"

cd "$ROOT_DIR/apps/admin"

# Build production
npx pnpm build

# Deploy
if [[ "$ENVIRONMENT" == "production" ]]; then
    npx vercel --prod --scope="$VERCEL_PROJECT"
else
    npx vercel --scope="$VERCEL_PROJECT"
fi

cd "$ROOT_DIR"

echo -e "${GREEN}✅ Frontend deploy OK${NC}"

# ============================================================
# 4. Configurar Webhooks en Mercado Libre
# ============================================================

echo -e "\n${YELLOW}🔗 Configurando webhooks en Mercado Libre...${NC}"

WEBHOOK_URL="${ADMIN_BASE_URL%/admin}/functions/v1/ml-webhook"
TOPICS=("questions" "orders" "items" "payments" "shipments")

echo "Webhook URL: $WEBHOOK_URL"
echo "Auth token (ML_WEBHOOK_SECRET): ${ML_WEBHOOK_SECRET:0:8}..."
echo ""
echo "Ejecutar manualmente para cada tópico:"
for topic in "${TOPICS[@]}"; do
    echo "curl -X POST \"https://api.mercadolibre.com/users/<USER_ID>/topics/$topic\" \\"
    echo "  -H \"Authorization: Bearer <ACCESS_TOKEN>\" \\"
    echo "  -H \"Content-Type: application/json\" \\"
    echo "  -d \"{\\\"callback_url\\\": \\\"$WEBHOOK_URL\\\", \\\"auth_token\\\": \\\"$ML_WEBHOOK_SECRET\\\"}\""
done

# ============================================================
# 5. Verificación post-deploy
# ============================================================

echo -e "\n${YELLOW}✅ Verificación post-deploy...${NC}"

echo "Ejecutar verificación manual:"
echo "  1. Abrir $ADMIN_BASE_URL"
echo "  2. Login con admin real"
echo "  3. Ir a Mercado Libre → Conectar cuenta"
echo "  4. Publicar propiedad de prueba"
echo "  5. Verificar en ML: atributos, título, channel"
echo "  6. Test webhook: hacer pregunta en ML → aparece en admin"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  🎉 DEPLOY ${ENVIRONMENT^^} COMPLETADO${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Próximos pasos manuales:${NC}"
echo "  1. Crear primer admin en Supabase Dashboard → SQL Editor:"
echo "     INSERT INTO admin_users (id, email, full_name, role, is_active, must_change_password)"
echo "     VALUES (gen_random_uuid(), 'tu@email.com', 'Admin', 'super_admin', true, false);"
echo "  2. Configurar site_settings via Admin UI"
echo "  3. Registrar webhooks en ML (ver comandos arriba)"
echo "  4. Test end-to-end completo"