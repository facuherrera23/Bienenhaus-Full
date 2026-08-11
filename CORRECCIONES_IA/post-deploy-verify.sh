#!/usr/bin/env bash
# post-deploy-verify.sh
# Script de verificación post-deploy para Bienenhaus
# Uso: ./post-deploy-verify.sh [staging|production]

set -euo pipefail

ENVIRONMENT="${1:-production}"

if [[ "$ENVIRONMENT" == "production" ]]; then
    ADMIN_URL="https://bienenhaus.com.ar/admin"
    SUPABASE_REF="${SUPABASE_PROD_REF:-}"
elif [[ "$ENVIRONMENT" == "staging" ]]; then
    ADMIN_URL="https://staging.bienenhaus.com.ar/admin"
    SUPABASE_REF="${SUPABASE_STAGING_REF:-}"
else
    echo "Uso: $0 [staging|production]"
    exit 1
fi

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0

check() {
    local name="$1"
    local cmd="$2"
    echo -ne "${YELLOW}Verificando: $name... ${NC}"
    if eval "$cmd" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASS++))
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((FAIL++))
    fi
}

check_output() {
    local name="$1"
    local cmd="$2"
    local expected="$3"
    echo -ne "${YELLOW}Verificando: $name... ${NC}"
    output=$(eval "$cmd" 2>&1)
    if echo "$output" | grep -q "$expected"; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASS++))
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "  Esperado: $expected"
        echo "  Obtenido: $output"
        ((FAIL++))
    fi
}

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Post-Deploy Verification - ${ENVIRONMENT^^}${NC}"
echo -e "${YELLOW}========================================${NC}"

# ============================================================
# 1. Frontend accesible
# ============================================================
echo -e "\n${BLUE}1. Frontend${NC}"
check "Admin URL accesible" "curl -sf -o /dev/null -w '%{http_code}' $ADMIN_URL | grep -q '^200$'"
check "Admin URL carga HTML" "curl -sf $ADMIN_URL | grep -q 'BIENENHAUS'"

# ============================================================
# 2. Supabase Edge Functions
# ============================================================
echo -e "\n${BLUE}2. Edge Functions${NC}"
FUNCTIONS=("ml-sync" "ml-webhook" "ml-oauth" "ml-categories" "ml-listing-types" "ml-metrics" "ml-answer-question" "ml-bulk-enqueue")
for fn in "${FUNCTIONS[@]}"; do
    check "Function $fn" "curl -sf -o /dev/null -w '%{http_code}' $ADMIN_URL%/../functions/v1/$fn -X POST -H 'Content-Type: application/json' -d '{}' | grep -qE '^(200|401|405)$'"
done

# ============================================================
# 3. Supabase Auth/DB
# ============================================================
echo -e "\n${BLUE}3. Supabase Auth/DB${NC}"
check "Auth endpoint" "curl -sf -o /dev/null -w '%{http_code}' $ADMIN_URL%/../auth/v1/health | grep -q '^200$'"
check "REST API" "curl -sf -o /dev/null -w '%{http_code}' $ADMIN_URL%/../rest/v1/ -H 'apikey: $VITE_SUPABASE_ANON_KEY' | grep -q '^200$'"

# ============================================================
# 4. Mercado Libre Webhook
# ============================================================
echo -e "\n${BLUE}4. Mercado Libre Webhook${NC}"
WEBHOOK_URL="$ADMIN_URL%/../functions/v1/ml-webhook"
check "Webhook endpoint existe" "curl -sf -o /dev/null -w '%{http_code}' $WEBHOOK_URL -X POST -H 'Content-Type: application/json' -d '{}' | grep -qE '^(400|401|405)$'"
check_output "Webhook rechaza sin signature" "curl -sf $WEBHOOK_URL -X POST -H 'Content-Type: application/json' -d '{}'" "Invalid signature"

# ============================================================
# 5. Base de datos limpia (migración 0040)
# ============================================================
echo -e "\n${BLUE}5. Database Clean (Migration 0040)${NC}"
# Nota: Requiere SERVICE_ROLE_KEY en env
if [[ -n "${SERVICE_ROLE_KEY:-}" ]]; then
    check "admin_users vacía" "curl -sf \"$ADMIN_URL%/../rest/v1/admin_users?select=count\" -H 'apikey: $SERVICE_ROLE_KEY' -H 'Authorization: Bearer $SERVICE_ROLE_KEY' | grep -q '\[\]'"
    check "ml_connection vacía" "curl -sf \"$ADMIN_URL%/../rest/v1/ml_connection?select=count\" -H 'apikey: $SERVICE_ROLE_KEY' -H 'Authorization: Bearer $SERVICE_ROLE_KEY' | grep -q '\[\]'"
    check "properties vacía" "curl -sf \"$ADMIN_URL%/../rest/v1/properties?select=count\" -H 'apikey: $SERVICE_ROLE_KEY' -H 'Authorization: Bearer $SERVICE_ROLE_KEY' | grep -q '\[\]'"
    check "leads vacía" "curl -sf \"$ADMIN_URL%/../rest/v1/leads?select=count\" -H 'apikey: $SERVICE_ROLE_KEY' -H 'Authorization: Bearer $SERVICE_ROLE_KEY' | grep -q '\[\]'"
    check "site_settings tiene production_mode" "curl -sf \"$ADMIN_URL%/../rest/v1/site_settings?key=eq.production_mode&select=value\" -H 'apikey: $SERVICE_ROLE_KEY' -H 'Authorization: Bearer $SERVICE_ROLE_KEY' | grep -q 'enabled.*true'"
else
    echo -e "${YELLOW}⚠️  Saltando checks DB (SERVICE_ROLE_KEY no seteado)${NC}"
fi

# ============================================================
# 6. OAuth ML Flow
# ============================================================
echo -e "\n${BLUE}6. OAuth ML Flow${NC}"
check "ml-oauth endpoint" "curl -sf -o /dev/null -w '%{http_code}' $ADMIN_URL%/../functions/v1/ml-oauth -X GET | grep -q '^200$'"
check "ml-oauth rechaza sin code" "curl -sf $ADMIN_URL%/../functions/v1/ml-oauth -X GET | grep -q 'Endpoint OAuth'"

# ============================================================
# 7. Resumen
# ============================================================
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Resultado: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"
echo -e "${YELLOW}========================================${NC}"

if [[ $FAIL -eq 0 ]]; then
    echo -e "${GREEN}🎉 TODAS LAS VERIFICACIONES PASARON${NC}"
    exit 0
else
    echo -e "${RED}❌ HAY FALLOS - REVISAR ANTES DE PROD${NC}"
    exit 1
fi