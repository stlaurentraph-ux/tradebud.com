-- TB-V16-041: expand CRM contact activity types for exporter supplier networks
BEGIN;

ALTER TABLE crm_contacts DROP CONSTRAINT IF EXISTS crm_contacts_contact_type_check;

ALTER TABLE crm_contacts
  ADD CONSTRAINT crm_contacts_contact_type_check
  CHECK (
    contact_type IN (
      'exporter',
      'cooperative',
      'farmer',
      'washing_station',
      'processing_facility',
      'trader',
      'other'
    )
  );

COMMIT;
