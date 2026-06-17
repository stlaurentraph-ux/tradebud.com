-- TB-V16-047: processing_facility as main type; washing/dry mill/etc. as subtypes
BEGIN;

ALTER TABLE crm_contacts
  ADD COLUMN IF NOT EXISTS processing_subtype TEXT;

UPDATE crm_contacts
SET
  contact_type = 'processing_facility',
  processing_subtype = COALESCE(processing_subtype, 'washing_station')
WHERE contact_type = 'washing_station';

ALTER TABLE crm_contacts DROP CONSTRAINT IF EXISTS crm_contacts_contact_type_check;

ALTER TABLE crm_contacts
  ADD CONSTRAINT crm_contacts_contact_type_check
  CHECK (
    contact_type IN (
      'exporter',
      'cooperative',
      'farmer',
      'processing_facility',
      'trader',
      'other'
    )
  );

ALTER TABLE crm_contacts DROP CONSTRAINT IF EXISTS crm_contacts_processing_subtype_check;

ALTER TABLE crm_contacts
  ADD CONSTRAINT crm_contacts_processing_subtype_check
  CHECK (
    (
      contact_type = 'processing_facility'
      AND (
        processing_subtype IS NULL
        OR processing_subtype IN (
          'washing_station',
          'dry_mill',
          'hulling_sorting',
          'transformation_plant',
          'other'
        )
      )
    )
    OR (
      contact_type <> 'processing_facility'
      AND processing_subtype IS NULL
    )
  );

COMMIT;
