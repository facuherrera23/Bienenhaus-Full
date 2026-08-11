update auth.users 
set email_confirmed_at = now(), 
    raw_app_meta_data = '{"provider":"email","providers":["email"]}', 
    raw_user_meta_data = '{}' 
where email = 'e2e-test@bienenhaus.local';