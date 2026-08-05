$env:DEMO_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
$env:DEMO_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
$env:E2E_TEST_PASSWORD = "e2e-test-pass-2026x"

$headers = @{
    "apikey" = $env:DEMO_SERVICE_ROLE_KEY
    "Authorization" = "Bearer $env:DEMO_SERVICE_ROLE_KEY"
    "Content-Type" = "application/json"
}

$body = @{
    email = "e2e-test@bienenhaus.local"
    password = $env:E2E_TEST_PASSWORD
    email_confirm = $true
    user_metadata = @{ full_name = "E2E Test User" }
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://127.0.0.1:54321/auth/v1/admin/users" -Method POST -Headers $headers -Body $body
Write-Host "Status: $($response.StatusCode)"
Write-Host "Body: $($response.Content)"

if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 201) {
    Write-Host "User created successfully"
    # Insert into admin_users
    npx pnpm@11.20.0 dlx supabase db query "insert into public.admin_users (id, email, full_name, role) select id, 'e2e-test@bienenhaus.local', 'E2E Test User', 'admin' from auth.users where email = 'e2e-test@bienenhaus.local' on conflict (email) do nothing;"
} elseif ($response.StatusCode -eq 422 -or $response.StatusCode -eq 409) {
    Write-Host "User already exists"
    npx pnpm@11.20.0 dlx supabase db query "insert into public.admin_users (id, email, full_name, role) select id, 'e2e-test@bienenhaus.local', 'E2E Test User', 'admin' from auth.users where email = 'e2e-test@bienenhaus.local' on conflict (email) do nothing;"
} else {
    Write-Host "Failed to create user"
    exit 1
}