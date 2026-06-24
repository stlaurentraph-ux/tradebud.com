-- ADR-012 P1: farmer CRM contacts — email optional when phone present; unique farmer phone per tenant.

ALTER TABLE crm.crm_contacts
  ALTER COLUMN email DROP NOT NULL;

ALTER TABLE crm.crm_contacts
  DROP CONSTRAINT IF EXISTS crm_contacts_tenant_id_email_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_contacts_tenant_email_unique
  ON crm.crm_contacts (tenant_id, lower(email))
  WHERE email IS NOT NULL AND btrim(email) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_contacts_tenant_farmer_phone_unique
  ON crm.crm_contacts (tenant_id, phone)
  WHERE contact_type = 'farmer' AND phone IS NOT NULL AND btrim(phone) <> '';

ALTER TABLE crm.crm_contacts
  DROP CONSTRAINT IF EXISTS crm_contacts_farmer_reachability_check;

ALTER TABLE crm.crm_contacts
  ADD CONSTRAINT crm_contacts_farmer_reachability_check
  CHECK (
    contact_type <> 'farmer'
    OR NULLIF(btrim(email), '') IS NOT NULL
    OR NULLIF(btrim(phone), '') IS NOT NULL
    OR farmer_profile_id IS NOT NULL
  );

ALTER TABLE crm.crm_contacts
  DROP CONSTRAINT IF EXISTS crm_contacts_non_farmer_email_check;

ALTER TABLE crm.crm_contacts
  ADD CONSTRAINT crm_contacts_non_farmer_email_check
  CHECK (
    contact_type = 'farmer'
    OR (
      email IS NOT NULL
      AND btrim(email) <> ''
      AND email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    )
  );
