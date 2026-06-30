-- Google/Apple-first Supabase users stay is_sso_user=true, which excludes them from
-- password grant lookup even after a password hash exists. Clear the flag once email
-- password sign-in should be allowed.

UPDATE auth.users
SET is_sso_user = false
WHERE is_sso_user = true
  AND encrypted_password IS NOT NULL
  AND length(encrypted_password) > 0
  AND EXISTS (
    SELECT 1
    FROM auth.identities i
    WHERE i.user_id = auth.users.id
      AND i.provider = 'email'
  );
