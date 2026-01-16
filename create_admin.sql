-- 🔒 SQL to Create Default Admin User (Advanced)
-- Using pgcrypto to generate correct Bcrypt hash for Supabase Auth

-- 1. Enable Encryption Extension
create extension if not exists "pgcrypto";

-- 2. Create User Function 
-- We use a DO block to define variables easily
DO $$
DECLARE
  -- 🛠 CONFIGURATION: Change these!
  target_email text := 'admin@empresa.com.br';
  target_password text := 'admin123';
  
  -- Internal variables
  new_uid uuid := uuid_generate_v4();
  hashed_pw text;
BEGIN
  -- Check if user exists to avoid errors
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = target_email) THEN
    RAISE NOTICE 'User % already exists. Promoting to ADMIN instead.', target_email;
    
    UPDATE public.profiles 
    SET role = 'ADMIN' 
    WHERE email = target_email;
    
  ELSE
    -- Generate Bcrypt Hash (Supabase standard)
    hashed_pw := crypt(target_password, gen_salt('bf'));

    -- Insert into auth.users
    -- NOTE: This creates a confirmated user
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      new_uid,
      '00000000-0000-0000-0000-000000000000', -- Default Supabase Instance ID
      'authenticated',
      'authenticated',
      target_email,
      hashed_pw,
      now(), -- Confirmed immediately
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now()
    );

    -- The 'handle_new_user' trigger in public.profiles SHOULD fire automatically.
    -- However, we can manually ensure the role is ADMIN just in case:
    
    -- Wait a ms for trigger (optional in SQL transaction, usually immediate)
    -- But since we are inside a block, the trigger fires after.
    -- Let's just create the profile manually or rely on trigger? 
    -- Trigger is best. But let's Update the role ensuring it's ADMIN.
    -- The Trigger logic sets ADMIN if table is empty. If not empty, it sets USER.
    -- So we need an update here to FORCE Admin.
    
    -- We need to wait for trigger? Triggers fire synchronously.
    -- So profile should exist now.
    
    UPDATE public.profiles 
    SET role = 'ADMIN' 
    WHERE id = new_uid;
    
    RAISE NOTICE 'Admin user created successfully: %', target_email;
  END IF;
END $$;
