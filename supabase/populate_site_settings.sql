-- Ejecutar completo en Supabase Dashboard → SQL Editor

-- Redes sociales
update public.site_settings
set value = '{"instagram": "https://instagram.com/bienenhaus.prop", "facebook": "https://facebook.com/Bienenhaus.prop", "youtube": "https://www.youtube.com/@BienenhausPropiedades", "tiktok": "https://www.tiktok.com/@bienenhaus.prop", "whatsapp": "https://wa.me/5493876000000"}'::jsonb,
    updated_at = now()
where key = 'social';

-- Email contacto
update public.site_settings
set value = '{"value": "bienenhaus.propiedades@gmail.com"}'::jsonb,
    updated_at = now()
where key = 'contact_email';

-- Teléfono
update public.site_settings
set value = '{"value": "+54 387 400-0000"}'::jsonb,
    updated_at = now()
where key = 'contact_phone';

-- WhatsApp
update public.site_settings
set value = '{"value": "+54 9 387 600-0000"}'::jsonb,
    updated_at = now()
where key = 'contact_whatsapp';

-- Empresa
update public.site_settings
set value = '{"value": "BIENENHAUS PROPIEDADES"}'::jsonb,
    updated_at = now()
where key = 'site_name';

-- Matrícula
update public.site_settings
set value = '{"value": "CPI 1834"}'::jsonb,
    updated_at = now()
where key = 'cri';

-- Ubicación
update public.site_settings
set value = '{"value": "Córdoba, Argentina"}'::jsonb,
    updated_at = now()
where key = 'contact_address';

-- Horarios
update public.site_settings
set value = '{"weekdays": "09:00 - 18:00", "saturdays": "09:00 - 13:00"}'::jsonb,
    updated_at = now()
where key = 'contact_hours';

-- Extras
insert into public.site_settings (key, value, value_type, is_public, description) values
  ('empresa', '{"value": "BIENENHAUS PROPIEDADES"}'::jsonb, 'json', true, 'Nombre de la empresa'),
  ('matricula', '{"value": "CPI 1834"}'::jsonb, 'json', true, 'Matrícula profesional'),
  ('ubicacion', '{"value": "Córdoba, Argentina"}'::jsonb, 'json', true, 'Ubicación de la oficina')
on conflict (key) do update set value = excluded.value, updated_at = now();

-- Verificar
select key, value from public.site_settings where is_public = true order by key;