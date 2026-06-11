-- TB-V16-040: link CRM farmer contacts to field-app farmer_profile

BEGIN;

ALTER TABLE crm_contacts
  ADD COLUMN IF NOT EXISTS farmer_profile_id UUID NULL REFERENCES farmer_profile(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crm_contacts_tenant_farmer_profile
  ON crm_contacts (tenant_id, farmer_profile_id)
  WHERE farmer_profile_id IS NOT NULL;

COMMIT;
