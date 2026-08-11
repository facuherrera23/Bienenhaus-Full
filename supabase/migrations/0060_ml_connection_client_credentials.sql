-- ============================================================================
-- 0060_ml_connection_client_credentials.sql
-- BIENENHAUS — Credenciales de la app ML (client_id / client_secret) en BD encriptadas.
-- Permite configurarlas desde el panel admin sin tocar código ni secrets de Supabase.
-- ============================================================================

-- Agregar columnas para credenciales de la app (encriptadas con AES-256-GCM)
alter table public.ml_connection
  add column if not exists client_id_encrypted text,
  add column if not exists client_id_iv text,
  add column if not exists client_secret_encrypted text,
  add column if not exists client_secret_iv text;

-- Comentario para documentación
comment on column public.ml_connection.client_id_encrypted is 'Client ID de la app ML, encriptado AES-256-GCM';
comment on column public.ml_connection.client_id_iv is 'IV para desencriptar client_id';
comment on column public.ml_connection.client_secret_encrypted is 'Client Secret de la app ML, encriptado AES-256-GCM';
comment on column public.ml_connection.client_secret_iv is 'IV para desencriptar client_secret';

-- RLS: solo staff puede leer/actualizar (ya existe policy is_staff en 0037/0042)
-- No se necesita policy adicional, hereda RLS de la tabla.

-- Helper: función para obtener credenciales desencriptadas (usada por Edge Functions)
create or replace function public.get_ml_credentials()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_conn record;
  v_client_id text;
  v_client_secret text;
begin
  -- Solo staff puede llamar
  if not public.is_staff() then
    raise exception 'No autorizado';
  end if;

  select id, client_id_encrypted, client_id_iv, client_secret_encrypted, client_secret_iv
    into v_conn
    from public.ml_connection
    where is_active = true
    order by updated_at desc
    limit 1;

  if v_conn is null or v_conn.client_id_encrypted is null or v_conn.client_secret_encrypted is null then
    return null;
  end if;

  -- Desencriptar usando la misma lógica que crypto.ts (PBKDF2 + AES-256-GCM)
  -- NOTA: Esta función se llama desde Edge Functions vía RPC, la desencriptación
  -- real se hace en Deno (crypto.ts). Aquí solo devolvemos los datos encriptados.
  return jsonb_build_object(
    'client_id_encrypted', v_conn.client_id_encrypted,
    'client_id_iv', v_conn.client_id_iv,
    'client_secret_encrypted', v_conn.client_secret_encrypted,
    'client_secret_iv', v_conn.client_secret_iv
  );
end;
$$;

-- Revocar execute a anon/authenticated (solo staff via is_staff check interno)
revoke execute on function public.get_ml_credentials() from anon, authenticated;

-- ============================================================================
-- Trigger para actualizar updated_at
-- ============================================================================
-- Ya existe trigger ml_connection_set_updated_at de 0006