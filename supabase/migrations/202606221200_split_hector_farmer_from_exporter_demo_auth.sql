-- Split merged auth: Google hector@tracebud.com (field farmer) vs exporter+demo@tracebud.com (dashboard).
-- Canonical farmer profile with plots: dcdd88e5-13e6-45d6-8e09-e6f1968e7e17
-- Merged auth user to remove: cd80a540-b5a1-443e-9af3-0673b746a24b
-- Exporter-only auth user: 66b5dafa-30be-4acb-a9c5-4e5c1ea22455

DO $$
DECLARE
  v_merged_auth_id uuid := 'cd80a540-b5a1-443e-9af3-0673b746a24b';
  v_exporter_auth_id uuid := '66b5dafa-30be-4acb-a9c5-4e5c1ea22455';
  v_canonical_farmer_profile uuid := 'dcdd88e5-13e6-45d6-8e09-e6f1968e7e17';
  v_google_identity_id uuid := 'e28bb073-cf8f-44aa-a738-1a733f8d25ed';
  v_hector_auth_id uuid;
  v_google_meta jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = v_merged_auth_id
  ) THEN
    RAISE NOTICE 'Merged auth user already removed; skipping split.';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE id = v_google_identity_id AND provider = 'google'
  ) THEN
    RAISE EXCEPTION 'Expected Google identity for hector@tracebud.com not found; aborting split';
  END IF;

  SELECT id INTO v_hector_auth_id
  FROM auth.users
  WHERE lower(email) = 'hector@tracebud.com'
  LIMIT 1;

  SELECT identity_data INTO v_google_meta
  FROM auth.identities
  WHERE id = v_google_identity_id;

  IF v_hector_auth_id IS NULL THEN
    v_hector_auth_id := gen_random_uuid();

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
      updated_at,
      is_sso_user,
      is_anonymous
    ) VALUES (
      v_hector_auth_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'hector@tracebud.com',
      '',
      now(),
      jsonb_build_object(
        'provider', 'google',
        'providers', jsonb_build_array('google'),
        'role', 'farmer'
      ),
      COALESCE(v_google_meta, jsonb_build_object('full_name', 'Hector Hernandez')),
      now(),
      now(),
      true,
      false
    );
  END IF;

  INSERT INTO public.user_account (id, role, name)
  VALUES (v_hector_auth_id, 'farmer', 'Hector Hernandez')
  ON CONFLICT (id) DO UPDATE
  SET role = EXCLUDED.role,
      name = EXCLUDED.name;

  UPDATE auth.identities
  SET user_id = v_hector_auth_id,
      updated_at = now()
  WHERE id = v_google_identity_id;

  UPDATE public.farmer_profile
  SET user_id = v_hector_auth_id,
      updated_at = now()
  WHERE id = v_canonical_farmer_profile;

  DELETE FROM public.farmer_profile
  WHERE user_id = v_merged_auth_id
    AND id <> v_canonical_farmer_profile;

  DELETE FROM auth.refresh_tokens WHERE user_id = v_merged_auth_id::text;
  DELETE FROM auth.sessions WHERE user_id = v_merged_auth_id;
  DELETE FROM auth.identities WHERE user_id = v_merged_auth_id;
  DELETE FROM public.user_account WHERE id = v_merged_auth_id;
  DELETE FROM auth.users WHERE id = v_merged_auth_id;

  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(
        COALESCE(raw_app_meta_data, '{}'::jsonb),
        '{role}',
        '"compliance_manager"'::jsonb,
        true
      ),
      raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{full_name}',
        '"Rwanda Demo Exporter"'::jsonb,
        true
      ),
      updated_at = now()
  WHERE id = v_exporter_auth_id;

  UPDATE public.user_account
  SET role = 'compliance_manager',
      name = 'Rwanda Demo Exporter'
  WHERE id = v_exporter_auth_id;

  DELETE FROM auth.refresh_tokens WHERE user_id = v_hector_auth_id::text;
  DELETE FROM auth.sessions WHERE user_id = v_hector_auth_id;
  DELETE FROM auth.refresh_tokens WHERE user_id = v_exporter_auth_id::text;
  DELETE FROM auth.sessions WHERE user_id = v_exporter_auth_id;
END $$;
