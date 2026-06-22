-- Supabase Auth Go cannot scan NULL token columns into string (500 on POST /token after Google id_token).
-- Hector SSO user from auth split migration left confirmation_token etc. NULL.

UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  phone_change = COALESCE(phone_change, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE is_sso_user = true
  AND (
    confirmation_token IS NULL
    OR recovery_token IS NULL
    OR email_change_token_new IS NULL
    OR email_change IS NULL
  );
