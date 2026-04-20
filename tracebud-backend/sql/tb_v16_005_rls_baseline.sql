-- TB-V16-005: baseline RLS for core compliance and audit tables
-- Purpose: enforce tenant/user isolation on public tables exposed through PostgREST.
-- Scope: own-data access for authenticated users; service role keeps privileged backend access.

BEGIN;

-- Turn on RLS for core tables flagged by advisors.
ALTER TABLE public.user_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvest_transaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dds_package ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dds_package_voucher ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Clean slate for idempotent reruns.
DROP POLICY IF EXISTS user_account_self_select ON public.user_account;
DROP POLICY IF EXISTS user_account_self_update ON public.user_account;

DROP POLICY IF EXISTS farmer_profile_owner_select ON public.farmer_profile;
DROP POLICY IF EXISTS farmer_profile_owner_update ON public.farmer_profile;

DROP POLICY IF EXISTS plot_owner_all ON public.plot;
DROP POLICY IF EXISTS harvest_transaction_owner_all ON public.harvest_transaction;
DROP POLICY IF EXISTS voucher_owner_all ON public.voucher;
DROP POLICY IF EXISTS dds_package_owner_all ON public.dds_package;
DROP POLICY IF EXISTS dds_package_voucher_owner_all ON public.dds_package_voucher;

DROP POLICY IF EXISTS audit_log_owner_select ON public.audit_log;
DROP POLICY IF EXISTS audit_log_owner_insert ON public.audit_log;

-- user_account: a user can read/update only their own account row.
CREATE POLICY user_account_self_select
ON public.user_account
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY user_account_self_update
ON public.user_account
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- farmer_profile: a user can read/update only profiles they own.
CREATE POLICY farmer_profile_owner_select
ON public.farmer_profile
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY farmer_profile_owner_update
ON public.farmer_profile
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- plot: own-data policy via farmer ownership.
CREATE POLICY plot_owner_all
ON public.plot
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.farmer_profile fp
    WHERE fp.id = plot.farmer_id
      AND fp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.farmer_profile fp
    WHERE fp.id = plot.farmer_id
      AND fp.user_id = auth.uid()
  )
);

-- harvest_transaction: own-data policy via farmer ownership.
CREATE POLICY harvest_transaction_owner_all
ON public.harvest_transaction
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.farmer_profile fp
    WHERE fp.id = harvest_transaction.farmer_id
      AND fp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.farmer_profile fp
    WHERE fp.id = harvest_transaction.farmer_id
      AND fp.user_id = auth.uid()
  )
);

-- voucher: own-data policy via farmer ownership.
CREATE POLICY voucher_owner_all
ON public.voucher
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.farmer_profile fp
    WHERE fp.id = voucher.farmer_id
      AND fp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.farmer_profile fp
    WHERE fp.id = voucher.farmer_id
      AND fp.user_id = auth.uid()
  )
);

-- dds_package: own-data policy via farmer ownership.
CREATE POLICY dds_package_owner_all
ON public.dds_package
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.farmer_profile fp
    WHERE fp.id = dds_package.farmer_id
      AND fp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.farmer_profile fp
    WHERE fp.id = dds_package.farmer_id
      AND fp.user_id = auth.uid()
  )
);

-- dds_package_voucher: own-data policy inherited through linked package ownership.
CREATE POLICY dds_package_voucher_owner_all
ON public.dds_package_voucher
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.dds_package dp
    JOIN public.farmer_profile fp
      ON fp.id = dp.farmer_id
    WHERE dp.id = dds_package_voucher.dds_package_id
      AND fp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.dds_package dp
    JOIN public.farmer_profile fp
      ON fp.id = dp.farmer_id
    WHERE dp.id = dds_package_voucher.dds_package_id
      AND fp.user_id = auth.uid()
  )
);

-- audit_log: users can insert and read only their own events.
CREATE POLICY audit_log_owner_select
ON public.audit_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY audit_log_owner_insert
ON public.audit_log
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

COMMIT;
