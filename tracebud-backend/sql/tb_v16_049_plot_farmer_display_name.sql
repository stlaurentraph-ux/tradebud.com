-- TB-V16-049: denormalized farmer label on plot (Supabase / CRM table browsing)

BEGIN;

ALTER TABLE crm_contacts
  ADD COLUMN IF NOT EXISTS farmer_profile_id UUID NULL REFERENCES farmer_profile(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crm_contacts_tenant_farmer_profile
  ON crm_contacts (tenant_id, farmer_profile_id)
  WHERE farmer_profile_id IS NOT NULL;

CREATE OR REPLACE FUNCTION resolve_farmer_display_name(p_farmer_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_name TEXT;
  v_has_crm_farmer_link BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'crm_contacts'
      AND column_name = 'farmer_profile_id'
  )
  INTO v_has_crm_farmer_link;

  IF v_has_crm_farmer_link THEN
    SELECT COALESCE(
      (
        SELECT cc.full_name
        FROM crm_contacts cc
        WHERE cc.farmer_profile_id = fp.id
        ORDER BY cc.updated_at DESC
        LIMIT 1
      ),
      ua.name,
      LEFT(fp.id::text, 8)
    )
    INTO v_name
    FROM farmer_profile fp
    LEFT JOIN user_account ua ON ua.id = fp.user_id
    WHERE fp.id = p_farmer_id;
  ELSE
    SELECT COALESCE(ua.name, LEFT(fp.id::text, 8))
    INTO v_name
    FROM farmer_profile fp
    LEFT JOIN user_account ua ON ua.id = fp.user_id
    WHERE fp.id = p_farmer_id;
  END IF;

  RETURN v_name;
END;
$$;

ALTER TABLE plot
  ADD COLUMN IF NOT EXISTS farmer_display_name TEXT;

COMMENT ON COLUMN plot.farmer_display_name IS
  'Denormalized farmer label for CRM/Supabase browsing. CRM contact full_name, else user_account.name, else farmer_profile id prefix. Refreshed on plot insert and when linked names change.';

UPDATE plot p
SET farmer_display_name = resolve_farmer_display_name(p.farmer_id)
WHERE p.farmer_display_name IS DISTINCT FROM resolve_farmer_display_name(p.farmer_id);

CREATE OR REPLACE FUNCTION plot_set_farmer_display_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.farmer_display_name := resolve_farmer_display_name(NEW.farmer_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS plot_set_farmer_display_name_trg ON plot;

CREATE TRIGGER plot_set_farmer_display_name_trg
  BEFORE INSERT OR UPDATE OF farmer_id
  ON plot
  FOR EACH ROW
  EXECUTE FUNCTION plot_set_farmer_display_name();

CREATE OR REPLACE FUNCTION user_account_refresh_plot_farmer_names()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.name IS NOT DISTINCT FROM NEW.name) THEN
    RETURN NEW;
  END IF;

  UPDATE plot p
  SET farmer_display_name = resolve_farmer_display_name(p.farmer_id)
  FROM farmer_profile fp
  WHERE fp.id = p.farmer_id
    AND fp.user_id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_account_refresh_plot_farmer_names_trg ON user_account;

CREATE TRIGGER user_account_refresh_plot_farmer_names_trg
  AFTER INSERT OR UPDATE OF name
  ON user_account
  FOR EACH ROW
  EXECUTE FUNCTION user_account_refresh_plot_farmer_names();

CREATE OR REPLACE FUNCTION crm_contacts_refresh_plot_farmer_names()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_farmer_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'crm_contacts'
      AND column_name = 'farmer_profile_id'
  ) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_farmer_id := COALESCE(NEW.farmer_profile_id, OLD.farmer_profile_id);
  IF v_farmer_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'UPDATE'
    AND (OLD.full_name IS NOT DISTINCT FROM NEW.full_name)
    AND (OLD.farmer_profile_id IS NOT DISTINCT FROM NEW.farmer_profile_id) THEN
    RETURN NEW;
  END IF;

  UPDATE plot
  SET farmer_display_name = resolve_farmer_display_name(v_farmer_id)
  WHERE farmer_id = v_farmer_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS crm_contacts_refresh_plot_farmer_names_trg ON crm_contacts;

CREATE TRIGGER crm_contacts_refresh_plot_farmer_names_trg
  AFTER INSERT OR UPDATE OF full_name, farmer_profile_id OR DELETE
  ON crm_contacts
  FOR EACH ROW
  EXECUTE FUNCTION crm_contacts_refresh_plot_farmer_names();

COMMIT;
