-- ============================================================================
-- 0036_fix_owners_audit_trigger.sql
-- Fix audit trigger for owners table - the audit_property_change() function
-- expects a 'status' column which owners doesn't have.
-- ============================================================================

-- Drop the problematic trigger
drop trigger if exists audit_owners_change on public.owners;

-- Create a dedicated audit function for owners
create or replace function public.audit_owners_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.activity_log (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    (case when (TG_OP = 'INSERT') then 'create'
         when (TG_OP = 'UPDATE') then 'update'
         when (TG_OP = 'DELETE') then 'delete'
         else 'update' end)::public.audit_action,
    'owner',
    coalesce(new.id, old.id),
    jsonb_build_object(
      'full_name', coalesce(new.full_name, old.full_name),
      'email', coalesce(new.email, old.email)
    )
  );
  return coalesce(new, old);
end;
$$;

-- Recreate the trigger with the correct function
create trigger audit_owners_change
  after insert or update or delete on public.owners
  for each row execute function public.audit_owners_change();