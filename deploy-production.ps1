<# 
.SYNOPSIS
    Deploy script for Bienenhaus production deployment
.DESCRIPTION
    Complete production deployment script for Bienenhaus (Supabase + Vercel + ML webhooks)
.PARAMETER Environment
    Target environment: 'staging' or 'production'
.EXAMPLE
    .\deploy-production.ps1 production
    .\deploy-production.ps1 staging
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('staging', 'production')]
    [string]$Environment = 'production'
)

$ErrorActionPreference = 'Stop'

# Colors
$Red = [ConsoleColor]::Red
$Green = [ConsoleColor]::Green
$Yellow = [ConsoleColor]::Yellow
$Blue = [ConsoleColor]::Cyan
$Gray = [ConsoleColor]::Gray

function Write-Colored($message, $color) {
    Write-Host $message -ForegroundColor $color
}

function Check-Command($cmd) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Colored "❌ $cmd no instalado" $Red
        return $false
    }
    return $true
}

Write-Colored "========================================" $Blue
Write-Colored "  Bienenhaus Deploy - $($Environment.ToUpper())" $Blue
Write-Colored "========================================" $Blue

# ============================================================
# Validaciones previas
# ============================================================

Write-Colored "`n🔍 Validando pre-requisitos..." $Yellow

# Supabase CLI
if (-not (Check-Command "supabase")) { exit 1 }
if (-not (Check-Command "vercel")) { Write-Colored "⚠️  Vercel CLI no instalado (opcional)" $Yellow }

# Git status
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Colored "⚠️  Hay cambios sin commitear:" $Yellow
    git status --short
    $confirm = Read-Host "Continuar de todas formas? (y/N)"
    if ($confirm -notmatch '^[yY]$') { exit 1 }
}

# Tests
Write-Colored "`n🧪 Ejecutando tests..." $Yellow
Set-Location "$PSScriptRoot\apps\admin"
$testResult = npx pnpm test 2>&1
if ($LASTEXITCODE -ne 0 -or $testResult -notmatch "passed") {
    Write-Colored "❌ Tests fallaron" $Red
    exit 1
}
Write-Colored "✅ Tests OK" $Green

# Build
Write-Colored "`n🏗️  Verificando build..." $Yellow
$buildResult = npx pnpm build 2>&1
if ($LASTEXITCODE -ne 0 -or $buildResult -notmatch "built in") {
    Write-Colored "❌ Build falló" $Red
    exit 1
}
Write-Colored "✅ Build OK" $Green

Set-Location $PSScriptRoot

# ============================================================
# Configuración por ambiente
# ============================================================

if ($Environment -eq 'production') {
    $SupabaseProjectRef = $env:SUPABASE_PROD_REF
    $VercelProject = $env:VERCEL_PROD_PROJECT ?? 'bienenhaus-admin'
    $AdminBaseUrl = "https://bienenhaus.com.ar/admin"
    $SiteDomain = "bienenhaus.com.ar"
} else {
    $SupabaseProjectRef = $env:SUPABASE_STAGING_REF
    $VercelProject = $env:VERCEL_STAGING_PROJECT ?? 'bienenhaus-admin-staging'
    $AdminBaseUrl = "https://staging.bienenhaus.com.ar/admin"
    $SiteDomain = "staging.bienenhaus.com.ar"
}

if (-not $SupabaseProjectRef) {
    Write-Colored "❌ SUPABASE_PROJECT_REF no configurado" $Red
    Write-Host "Setear: `$env:SUPABASE_PROD_REF=xxx (o SUPABASE_STAGING_REF)"
    exit 1
}

Write-Colored "`n📋 Configuración:" $Blue
Write-Host "  Ambiente: $Environment"
Write-Host "  Supabase Project: $SupabaseProjectRef"
Write-Host "  Admin URL: $AdminBaseUrl"
Write-Host "  Vercel Project: $VercelProject"

# ============================================================
# 1. Deploy Supabase
# ============================================================

Write-Colored "`n📦 Deploy Supabase..." $Yellow

Write-Host "Linking to Supabase project..."
supabase link --project-ref $SupabaseProjectRef

Write-Host "Pushing migrations (incluye 0040_production_ready)..."
supabase db push --project-ref $SupabaseProjectRef

$Functions = @(
    "ml-sync", "ml-webhook", "ml-oauth", "ml-categories",
    "ml-listing-types", "ml-metrics", "ml-answer-question", "ml-bulk-enqueue"
)

foreach ($fn in $Functions) {
    Write-Host "  Deploying $fn..."
    supabase functions deploy $fn --project-ref $SupabaseProjectRef
}

Write-Colored "✅ Supabase deploy OK" $Green

# ============================================================
# 2. Secrets
# ============================================================

Write-Colored "`n🔐 Configurando secrets..." $Yellow

$RequiredSecrets = @(
    "ML_CLIENT_ID", "ML_CLIENT_SECRET", "ML_WEBHOOK_SECRET",
    "ML_SYNC_SECRET", "CRYPTO_SECRET", "SERVICE_ROLE_KEY", "ADMIN_BASE_URL"
)

$Missing = @()
foreach ($secret in $RequiredSecrets) {
    if (-not (Get-Variable -Name $secret -ValueOnly -ErrorAction SilentlyContinue)) {
        $Missing += $secret
    }
}

if ($Missing.Count -gt 0) {
    Write-Colored "❌ Secrets faltantes:" $Red
    $Missing | ForEach-Object { Write-Host "  - $_" }
    Write-Host "Configurar en .env o `$env:SECRET_NAME=value antes de correr."
    exit 1
}

foreach ($secret in $RequiredSecrets) {
    $value = Get-Variable -Name $secret -ValueOnly
    Write-Host "  Setting $secret..."
    supabase secrets set "$secret=$value" --project-ref $SupabaseProjectRef
}

supabase secrets set "ADMIN_BASE_URL=$AdminBaseUrl" --project-ref $SupabaseProjectRef

Write-Colored "✅ Secrets configurados" $Green

# ============================================================
# 3. Deploy Frontend
# ============================================================

Write-Colored "`n🌐 Deploy Frontend (Vercel)..." $Yellow

Set-Location "$PSScriptRoot\apps\admin"
npx pnpm build

if ($Environment -eq 'production') {
    npx vercel --prod --scope=$VercelProject
} else {
    npx vercel --scope=$VercelProject
}

Set-Location $PSScriptRoot

Write-Colored "✅ Frontend deploy OK" $Green

# ============================================================
# 4. Webhooks ML
# ============================================================

Write-Colored "`n🔗 Webhooks Mercado Libre..." $Yellow

$WebhookUrl = "$AdminBaseUrl/functions/v1/ml-webhook"
$Topics = @("questions", "orders", "items", "payments", "shipments")

Write-Host "Webhook URL: $WebhookUrl"
Write-Host "Auth token: $($env:ML_WEBHOOK_SECRET.Substring(0,8))..."
Write-Host "`nEjecutar manualmente para cada tópico:"
foreach ($topic in $Topics) {
    @"
curl -X POST "https://api.mercadolibre.com/users/<USER_ID>/topics/$topic" `
  -H "Authorization: Bearer <ACCESS_TOKEN>" `
  -H "Content-Type: application/json" `
  -d "{\"callback_url\": \"$WebhookUrl\", \"auth_token\": \"$env:ML_WEBHOOK_SECRET\"}"
"@
}

# ============================================================
# 5. Resumen
# ============================================================

Write-Colored "`n========================================" $Green
Write-Colored "  🎉 DEPLOY $($Environment.ToUpper()) COMPLETADO" $Green
Write-Colored "========================================" $Green
Write-Host ""
Write-Colored "Pasos manuales restantes:" $Yellow
Write-Host "  1. Crear primer admin en Supabase SQL Editor:"
Write-Host "     INSERT INTO admin_users (id, email, full_name, role, is_active, must_change_password)"
Write-Host "     VALUES (gen_random_uuid(), 'tu@email.com', 'Admin', 'super_admin', true, false);"
Write-Host "  2. Configurar site_settings via Admin UI"
Write-Host "  3. Registrar webhooks en ML (ver comandos arriba)"
Write-Host "  4. Test end-to-end completo"