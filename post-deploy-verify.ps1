<# 
.SYNOPSIS
    Post-deploy verification script for Bienenhaus
.DESCRIPTION
    Verifies all critical endpoints and database state after deployment
.PARAMETER Environment
    Target environment: 'staging' or 'production'
.EXAMPLE
    .\post-deploy-verify.ps1 production
    .\post-deploy-verify.ps1 staging
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('staging', 'production')]
    [string]$Environment = 'production'
)

$ErrorActionPreference = 'Continue'

$Red = [ConsoleColor]::Red
$Green = [ConsoleColor]::Green
$Yellow = [ConsoleColor]::Yellow
$Blue = [ConsoleColor]::Cyan

function Write-Colored($message, $color) {
    Write-Host $message -ForegroundColor $color
}

$Pass = 0
$Fail = 0

function Check($name, $scriptBlock) {
    Write-Host -NoNewline "${Yellow}Verificando: $name... ${NC}"
    try {
        $result = & $scriptBlock
        if ($result) {
            Write-Colored "✅ PASS" $Green
            $global:Pass++
        } else {
            Write-Colored "❌ FAIL" $Red
            $global:Fail++
        }
    } catch {
        Write-Colored "❌ FAIL (exception)" $Red
        $global:Fail++
    }
}

function Check-Output($name, $scriptBlock, $expected) {
    Write-Host -NoNewline "${Yellow}Verificando: $name... ${NC}"
    try {
        $output = & $scriptBlock
        if ($output -match $expected) {
            Write-Colored "✅ PASS" $Green
            $global:Pass++
        } else {
            Write-Colored "❌ FAIL" $Red
            Write-Host "  Esperado: $expected"
            Write-Host "  Obtenido: $output"
            $global:Fail++
        }
    } catch {
        Write-Colored "❌ FAIL (exception)" $Red
        $global:Fail++
    }
}

if ($Environment -eq 'production') {
    $AdminUrl = "https://bienenhaus.com.ar/admin"
    $SupabaseRef = $env:SUPABASE_PROD_REF
} else {
    $AdminUrl = "https://staging.bienenhaus.com.ar/admin"
    $SupabaseRef = $env:SUPABASE_STAGING_REF
}

Write-Colored "========================================" $Blue
Write-Colored "  Post-Deploy Verification - $($Environment.ToUpper())" $Blue
Write-Colored "========================================" $Blue

$BaseUrl = $AdminUrl.TrimEnd('/')
$FunctionsBase = "$BaseUrl/../functions/v1"
$RestBase = "$BaseUrl/../rest/v1"
$AuthBase = "$BaseUrl/../auth/v1"

# ============================================================
# 1. Frontend
# ============================================================
Write-Colored "`n1. Frontend" $Blue
Check "Admin URL accesible" { (Invoke-WebRequest -Uri $AdminUrl -Method Head -UseBasicParsing).StatusCode -eq 200 }
Check "Admin URL carga HTML" { (Invoke-WebRequest -Uri $AdminUrl -UseBasicParsing).Content -match 'BIENENHAUS' }

# ============================================================
# 2. Edge Functions
# ============================================================
Write-Colored "`n2. Edge Functions" $Blue
$Functions = @("ml-sync", "ml-webhook", "ml-oauth", "ml-categories", "ml-listing-types", "ml-metrics", "ml-answer-question", "ml-bulk-enqueue")
foreach ($fn in $Functions) {
    Check "Function $fn" {
        $resp = Invoke-WebRequest -Uri "$FunctionsBase/$fn" -Method Post -Body '{}' -ContentType 'application/json' -UseBasicParsing
        $resp.StatusCode -in @(200, 401, 405)
    }
}

# ============================================================
# 3. Supabase Auth/DB
# ============================================================
Write-Colored "`n3. Supabase Auth/DB" $Blue
Check "Auth endpoint" { (Invoke-WebRequest -Uri "$AuthBase/health" -Method Head -UseBasicParsing).StatusCode -eq 200 }
Check "REST API" { 
    $resp = Invoke-WebRequest -Uri "$RestBase/" -Headers @{ apikey = $env:VITE_SUPABASE_ANON_KEY } -Method Head -UseBasicParsing
    $resp.StatusCode -eq 200 
}

# ============================================================
# 4. Webhook ML
# ============================================================
Write-Colored "`n4. Mercado Libre Webhook" $Blue
$WebhookUrl = "$FunctionsBase/ml-webhook"
Check "Webhook endpoint existe" {
    $resp = Invoke-WebRequest -Uri $WebhookUrl -Method Post -Body '{}' -ContentType 'application/json' -UseBasicParsing
    $resp.StatusCode -in @(200, 400, 401, 405)
}
Check-Output "Webhook rechaza sin signature" { 
    (Invoke-WebRequest -Uri $WebhookUrl -Method Post -Body '{}' -ContentType 'application/json' -UseBasicParsing).Content 
} 'Invalid signature'

# ============================================================
# 5. Database Clean (Migration 0040)
# ============================================================
Write-Colored "`n5. Database Clean (Migration 0040)" $Blue
if ($env:SERVICE_ROLE_KEY) {
    $Headers = @{ 
        apikey = $env:SERVICE_ROLE_KEY
        Authorization = "Bearer $env:SERVICE_ROLE_KEY"
    }
    Check "admin_users vacía" { 
        (Invoke-WebRequest -Uri "$RestBase/admin_users?select=count" -Headers $Headers -UseBasicParsing).Content -eq '[]' 
    }
    Check "ml_connection vacía" { 
        (Invoke-WebRequest -Uri "$RestBase/ml_connection?select=count" -Headers $Headers -UseBasicParsing).Content -eq '[]' 
    }
    Check "properties vacía" { 
        (Invoke-WebRequest -Uri "$RestBase/properties?select=count" -Headers $Headers -UseBasicParsing).Content -eq '[]' 
    }
    Check "leads vacía" { 
        (Invoke-WebRequest -Uri "$RestBase/leads?select=count" -Headers $Headers -UseBasicParsing).Content -eq '[]' 
    }
    Check "site_settings tiene production_mode" { 
        (Invoke-WebRequest -Uri "$RestBase/site_settings?key=eq.production_mode&select=value" -Headers $Headers -UseBasicParsing).Content -match 'enabled.*true' 
    }
} else {
    Write-Colored "⚠️  Saltando checks DB (SERVICE_ROLE_KEY no seteado)" $Yellow
}

# ============================================================
# 6. OAuth ML Flow
# ============================================================
Write-Colored "`n6. OAuth ML Flow" $Blue
Check "ml-oauth endpoint" { 
    (Invoke-WebRequest -Uri "$FunctionsBase/ml-oauth" -Method Get -UseBasicParsing).StatusCode -eq 200 
}
Check "ml-oauth rechaza sin code" { 
    (Invoke-WebRequest -Uri "$FunctionsBase/ml-oauth" -Method Get -UseBasicParsing).Content -match 'Endpoint OAuth' 
}

# ============================================================
# Resumen
# ============================================================
Write-Colored "`n========================================" $Yellow
Write-Colored "  Resultado: ${Green}$Pass passed${NC}, ${Red}$Fail failed${NC}" $Yellow
Write-Colored "========================================" $Yellow

if ($Fail -eq 0) {
    Write-Colored "🎉 TODAS LAS VERIFICACIONES PASARON" $Green
    exit 0
} else {
    Write-Colored "❌ HAY FALLOS - REVISAR ANTES DE PROD" $Red
    exit 1
}