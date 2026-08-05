#!/usr/bin/env bash
DEMO_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
DEMO_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
E2E_TEST_PASSWORD="e2e-test-pass-2026x"

echo "Creating E2E test user..."

HTTP_CODE=$(curl -sS -o /tmp/signup.json -w "%{http_code}" -X POST "http://127.0.0.1:54321/auth/v1/admin/users" \
  -H "apikey: $DEMO_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $DEMO_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"e2e-test@bienenhaus.local\",\"password\":\"$E2E_TEST_PASSWORD\",\"email_confirm\":true,\"user_metadata\":{\"full_name\":\"E2E Test User\"}}")

echo "HTTP Code: $HTTP_CODE"
cat /tmp/signup.json

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo "admin create user ok (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "422" ] || [ "$HTTP_CODE" = "409" ]; then
  echo "user already existed (HTTP $HTTP_CODE) — continuing"
else
  echo "admin create user failed with HTTP $HTTP_CODE"
  cat /tmp/signup.json
  exit 1
fi

npx pnpm@11.20.0 dlx supabase db query "insert into public.admin_users (id, email, full_name, role) select id, 'e2e-test@bienenhaus.local', 'E2E Test User', 'admin' from auth.users where email = 'e2e-test@bienenhaus.local' on conflict (email) do nothing;"