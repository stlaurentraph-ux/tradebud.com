import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';

export type TrialLifecycleStatus = 'trial_active' | 'trial_expired' | 'paid_active' | 'suspended';
export type LaunchFeatureKey =
  | 'dashboard_campaigns'
  | 'dashboard_compliance'
  | 'dashboard_reporting'
  | 'dashboard_exports';
export type OnboardingRole = 'admin' | 'field_operator' | 'compliance_manager';
export type FeatureEntitlementStatus = 'enabled' | 'disabled' | 'trial';
export type SignupPrimaryRole = 'importer' | 'exporter' | 'compliance_manager' | 'admin';
export type SignupPrimaryObjective =
  | 'prepare_first_due_diligence_package'
  | 'supplier_onboarding'
  | 'risk_screening'
  | 'audit_readiness';

interface TrialRow {
  tenant_id: string;
  lifecycle_status: TrialLifecycleStatus;
  trial_started_at: string | null;
  trial_expires_at: string | null;
  paid_activated_at: string | null;
  updated_at: string;
}

interface FeatureEntitlementRow {
  tenant_id: string;
  feature_key: LaunchFeatureKey;
  entitlement_status: FeatureEntitlementStatus;
  effective_from: string;
  effective_to: string | null;
  updated_at: string;
}

interface CommercialProfileRow {
  tenant_id: string;
  organization_name: string | null;
  country: string | null;
  primary_role: SignupPrimaryRole | null;
  team_size: string | null;
  main_commodity: string | null;
  primary_objective: SignupPrimaryObjective | null;
  profile_skipped: boolean;
  updated_at: string;
}

@Injectable()
export class LaunchService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  private schemaReady = false;

  private async emitAuditEvent(eventType: string, payload: Record<string, unknown>): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO audit_log (event_type, payload)
        VALUES ($1, $2::jsonb)
      `,
      [eventType, JSON.stringify(payload)],
    );
  }

  private async ensureSchema() {
    if (this.schemaReady) return;
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_trial_state (
        tenant_id TEXT PRIMARY KEY,
        lifecycle_status TEXT NOT NULL CHECK (lifecycle_status IN ('trial_active', 'trial_expired', 'paid_active', 'suspended')),
        trial_started_at TIMESTAMPTZ NULL,
        trial_expires_at TIMESTAMPTZ NULL,
        paid_activated_at TIMESTAMPTZ NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_onboarding_progress (
        tenant_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'field_operator', 'compliance_manager')),
        step_key TEXT NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        completed_at TIMESTAMPTZ NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (tenant_id, role, step_key)
      )
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_feature_entitlements (
        tenant_id TEXT NOT NULL,
        feature_key TEXT NOT NULL CHECK (feature_key IN ('dashboard_campaigns', 'dashboard_compliance', 'dashboard_reporting', 'dashboard_exports')),
        entitlement_status TEXT NOT NULL CHECK (entitlement_status IN ('enabled', 'disabled', 'trial')),
        effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        effective_to TIMESTAMPTZ NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (tenant_id, feature_key)
      )
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_commercial_profiles (
        tenant_id TEXT PRIMARY KEY,
        organization_name TEXT NULL,
        country TEXT NULL,
        primary_role TEXT NULL CHECK (primary_role IN ('importer', 'exporter', 'compliance_manager', 'admin')),
        team_size TEXT NULL,
        main_commodity TEXT NULL,
        primary_objective TEXT NULL CHECK (primary_objective IN ('prepare_first_due_diligence_package', 'supplier_onboarding', 'risk_screening', 'audit_readiness')),
        profile_skipped BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    this.schemaReady = true;
  }

  private listAllFeatures(): LaunchFeatureKey[] {
    return ['dashboard_campaigns', 'dashboard_compliance', 'dashboard_reporting', 'dashboard_exports'];
  }

  private defaultEntitlementForState(
    feature: LaunchFeatureKey,
    lifecycleStatus: TrialLifecycleStatus,
  ): FeatureEntitlementStatus {
    if (lifecycleStatus === 'suspended' || lifecycleStatus === 'trial_expired') {
      return 'disabled';
    }
    if (lifecycleStatus === 'paid_active') {
      return 'enabled';
    }
    return feature === 'dashboard_reporting' ? 'disabled' : 'trial';
  }

  private async ensureFeatureEntitlements(
    tenantId: string,
    lifecycleStatus: TrialLifecycleStatus,
  ): Promise<void> {
    await this.ensureSchema();
    const features = this.listAllFeatures();
    for (const feature of features) {
      const defaultStatus = this.defaultEntitlementForState(feature, lifecycleStatus);
      await this.pool.query(
        `
          INSERT INTO tenant_feature_entitlements (
            tenant_id,
            feature_key,
            entitlement_status,
            effective_from,
            effective_to,
            updated_at
          )
          VALUES ($1, $2, $3, NOW(), NULL, NOW())
          ON CONFLICT (tenant_id, feature_key) DO NOTHING
        `,
        [tenantId, feature, defaultStatus],
      );
    }
  }

  private async getFeatureEntitlement(
    tenantId: string,
    feature: LaunchFeatureKey,
  ): Promise<FeatureEntitlementRow | null> {
    const result = await this.pool.query<FeatureEntitlementRow>(
      `
        SELECT tenant_id, feature_key, entitlement_status, effective_from, effective_to, updated_at
        FROM tenant_feature_entitlements
        WHERE tenant_id = $1
          AND feature_key = $2
          AND effective_from <= NOW()
          AND (effective_to IS NULL OR effective_to > NOW())
        LIMIT 1
      `,
      [tenantId, feature],
    );
    return result.rows[0] ?? null;
  }

  async getOrCreateTrialState(tenantId: string): Promise<TrialRow> {
    await this.ensureSchema();
    const nowIso = new Date().toISOString();
    const insertRes = await this.pool.query<TrialRow>(
      `
        INSERT INTO tenant_trial_state (
          tenant_id,
          lifecycle_status,
          trial_started_at,
          trial_expires_at,
          updated_at
        )
        VALUES (
          $1,
          'trial_active',
          NOW(),
          NOW() + INTERVAL '30 days',
          NOW()
        )
        ON CONFLICT (tenant_id) DO NOTHING
        RETURNING tenant_id, lifecycle_status, trial_started_at, trial_expires_at, paid_activated_at, updated_at
      `,
      [tenantId],
    );
    if (insertRes.rowCount && insertRes.rows[0]) {
      await this.emitAuditEvent('trial_started', {
        tenantId,
        source: 'auto_provision',
        startedAt: nowIso,
      }).catch(() => undefined);
      return insertRes.rows[0];
    }
    const existing = await this.pool.query<TrialRow>(
      `
        SELECT tenant_id, lifecycle_status, trial_started_at, trial_expires_at, paid_activated_at, updated_at
        FROM tenant_trial_state
        WHERE tenant_id = $1
      `,
      [tenantId],
    );
    return existing.rows[0];
  }

  async evaluateLifecycleState(tenantId: string): Promise<TrialRow> {
    const current = await this.getOrCreateTrialState(tenantId);
    if (
      current.lifecycle_status === 'trial_active' &&
      current.trial_expires_at &&
      new Date(current.trial_expires_at).getTime() <= Date.now()
    ) {
      const updated = await this.pool.query<TrialRow>(
        `
          UPDATE tenant_trial_state
          SET lifecycle_status = 'trial_expired', updated_at = NOW()
          WHERE tenant_id = $1
            AND lifecycle_status = 'trial_active'
          RETURNING tenant_id, lifecycle_status, trial_started_at, trial_expires_at, paid_activated_at, updated_at
        `,
        [tenantId],
      );
      if (updated.rowCount && updated.rows[0]) {
        await this.emitAuditEvent('trial_expired', {
          tenantId,
          expiredAt: new Date().toISOString(),
          source: 'lifecycle_check',
        }).catch(() => undefined);
        return updated.rows[0];
      }
    }
    return current;
  }

  async getLaunchState(tenantId: string): Promise<TrialRow> {
    return this.evaluateLifecycleState(tenantId);
  }

  async markPaidActive(tenantId: string): Promise<TrialRow> {
    await this.ensureSchema();
    const updated = await this.pool.query<TrialRow>(
      `
        INSERT INTO tenant_trial_state (
          tenant_id,
          lifecycle_status,
          trial_started_at,
          trial_expires_at,
          paid_activated_at,
          updated_at
        )
        VALUES (
          $1,
          'paid_active',
          NOW(),
          NOW() + INTERVAL '30 days',
          NOW(),
          NOW()
        )
        ON CONFLICT (tenant_id) DO UPDATE SET
          lifecycle_status = 'paid_active',
          paid_activated_at = NOW(),
          updated_at = NOW()
        RETURNING tenant_id, lifecycle_status, trial_started_at, trial_expires_at, paid_activated_at, updated_at
      `,
      [tenantId],
    );
    await this.emitAuditEvent('upgrade_completed', {
      tenantId,
      upgradedAt: new Date().toISOString(),
    }).catch(() => undefined);
    await this.ensureFeatureEntitlements(tenantId, 'paid_active');
    await this.pool.query(
      `
        UPDATE tenant_feature_entitlements
        SET entitlement_status = 'enabled', effective_to = NULL, updated_at = NOW()
        WHERE tenant_id = $1
      `,
      [tenantId],
    );
    return updated.rows[0];
  }

  async requireFeatureAccess(tenantId: string, feature: LaunchFeatureKey) {
    const state = await this.evaluateLifecycleState(tenantId);
    if (state.lifecycle_status === 'suspended') {
      throw new ForbiddenException('Workspace is suspended.');
    }
    if (state.lifecycle_status === 'trial_expired') {
      throw new ForbiddenException(`Trial expired. Upgrade required for feature: ${feature}`);
    }
    await this.ensureFeatureEntitlements(tenantId, state.lifecycle_status);
    const entitlement = await this.getFeatureEntitlement(tenantId, feature);
    if (!entitlement || entitlement.entitlement_status === 'disabled') {
      throw new ForbiddenException(`Feature is not enabled for this tenant: ${feature}`);
    }
  }

  async listFeatureEntitlements(tenantId: string): Promise<FeatureEntitlementRow[]> {
    const state = await this.evaluateLifecycleState(tenantId);
    await this.ensureFeatureEntitlements(tenantId, state.lifecycle_status);
    const result = await this.pool.query<FeatureEntitlementRow>(
      `
        SELECT tenant_id, feature_key, entitlement_status, effective_from, effective_to, updated_at
        FROM tenant_feature_entitlements
        WHERE tenant_id = $1
        ORDER BY feature_key ASC
      `,
      [tenantId],
    );
    return result.rows;
  }

  async setFeatureEntitlement(
    tenantId: string,
    feature: LaunchFeatureKey,
    entitlementStatus: FeatureEntitlementStatus,
    actorUserId: string | null,
  ): Promise<FeatureEntitlementRow> {
    await this.ensureSchema();
    const updated = await this.pool.query<FeatureEntitlementRow>(
      `
        INSERT INTO tenant_feature_entitlements (
          tenant_id,
          feature_key,
          entitlement_status,
          effective_from,
          effective_to,
          updated_at
        )
        VALUES ($1, $2, $3, NOW(), NULL, NOW())
        ON CONFLICT (tenant_id, feature_key) DO UPDATE SET
          entitlement_status = EXCLUDED.entitlement_status,
          effective_to = NULL,
          updated_at = NOW()
        RETURNING tenant_id, feature_key, entitlement_status, effective_from, effective_to, updated_at
      `,
      [tenantId, feature, entitlementStatus],
    );
    const row = updated.rows[0];
    await this.emitAuditEvent('feature_entitlement_updated', {
      tenantId,
      feature,
      entitlementStatus,
      actorUserId,
      updatedAt: new Date().toISOString(),
    }).catch(() => undefined);
    return row;
  }

  private roleDefaultSteps(role: OnboardingRole): string[] {
    if (role === 'field_operator') {
      return ['create_account', 'join_campaign', 'capture_first_plot', 'sync_first_submission'];
    }
    if (role === 'compliance_manager') {
      // Importer/compliance-manager journey starts with request creation before review actions.
      return ['create_account', 'create_first_campaign', 'review_first_submission', 'run_first_compliance_check'];
    }
    return ['create_account', 'create_first_campaign', 'upload_contacts', 'invite_field_team', 'generate_first_insight'];
  }

  async getOnboardingProgress(tenantId: string, role: OnboardingRole) {
    await this.ensureSchema();
    const stepKeys = this.roleDefaultSteps(role);
    await Promise.all(
      stepKeys.map((stepKey) =>
        this.pool.query(
          `
            INSERT INTO tenant_onboarding_progress (tenant_id, role, step_key, completed, updated_at)
            VALUES ($1, $2, $3, FALSE, NOW())
            ON CONFLICT (tenant_id, role, step_key) DO NOTHING
          `,
          [tenantId, role, stepKey],
        ),
      ),
    );
    const rows = await this.pool.query<{
      step_key: string;
      completed: boolean;
      completed_at: string | null;
    }>(
      `
        SELECT step_key, completed, completed_at
        FROM tenant_onboarding_progress
        WHERE tenant_id = $1
          AND role = $2
          AND step_key = ANY($3::TEXT[])
        ORDER BY array_position($3::TEXT[], step_key)
      `,
      [tenantId, role, stepKeys],
    );
    return rows.rows;
  }

  async completeOnboardingStep(tenantId: string, role: OnboardingRole, stepKey: string, actorUserId: string | null) {
    await this.ensureSchema();
    await this.pool.query(
      `
        INSERT INTO tenant_onboarding_progress (
          tenant_id,
          role,
          step_key,
          completed,
          completed_at,
          updated_at
        )
        VALUES ($1, $2, $3, TRUE, NOW(), NOW())
        ON CONFLICT (tenant_id, role, step_key) DO UPDATE SET
          completed = TRUE,
          completed_at = COALESCE(tenant_onboarding_progress.completed_at, NOW()),
          updated_at = NOW()
      `,
      [tenantId, role, stepKey],
    );
    await this.emitAuditEvent('onboarding_step_completed', {
      tenantId,
      role,
      stepKey,
      actorUserId,
      completedAt: new Date().toISOString(),
    }).catch(() => undefined);
    return this.getOnboardingProgress(tenantId, role);
  }

  async createAccount(input: {
    workEmail: string;
    password: string;
    fullName: string;
  }): Promise<{
    userId: string;
    tenantId: string;
    accessToken: string;
    refreshToken: string | null;
  }> {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new ForbiddenException('SUPABASE_URL and SUPABASE_ANON_KEY must be configured.');
    }
    const normalizedEmail = input.workEmail.trim().toLowerCase();
    const defaultTenantId = `tenant_${normalizedEmail.replace(/[^a-z0-9]/gi, '_')}`;
    const resolveErrorMessage = (payload: {
      message?: string;
      msg?: string;
      error?: string;
      error_description?: string;
    }): string =>
      payload.message ??
      payload.msg ??
      payload.error_description ??
      payload.error ??
      'Signup failed. Email may already exist, credentials may be invalid, or Supabase rate limits/network are blocking the request.';

    const signupResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: normalizedEmail,
        password: input.password,
        data: {
          tenant_id: defaultTenantId,
          role: 'admin',
          full_name: input.fullName.trim(),
        },
      }),
    });
    const signupPayload = (await signupResponse.json().catch(() => ({}))) as {
      user?: { id?: string };
      access_token?: string;
      refresh_token?: string;
      error?: string;
      msg?: string;
      message?: string;
      error_description?: string;
    };

    // Supabase can return 200 + user with no access token for existing/unconfirmed users.
    // In this case, attempt password sign-in so confirmed existing users can continue the flow.
    if (signupResponse.ok && signupPayload.user?.id && !signupPayload.access_token) {
      const signinResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          apikey: supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password: input.password,
        }),
      });
      const signinPayload = (await signinResponse.json().catch(() => ({}))) as {
        user?: {
          id?: string;
          app_metadata?: { tenant_id?: string };
          user_metadata?: { tenant_id?: string };
        };
        access_token?: string;
        refresh_token?: string;
        error?: string;
        msg?: string;
        message?: string;
        error_description?: string;
      };

      if (signinResponse.ok && signinPayload.user?.id && signinPayload.access_token) {
        const tenantId =
          signinPayload.user.app_metadata?.tenant_id ??
          signinPayload.user.user_metadata?.tenant_id ??
          defaultTenantId;
        await this.getOrCreateTrialState(tenantId);
        await this.emitAuditEvent('signup_completed', {
          tenantId,
          userId: signinPayload.user.id,
          source: 'launch_signup_existing_user_signin',
          completedAt: new Date().toISOString(),
        }).catch(() => undefined);

        return {
          userId: signinPayload.user.id,
          tenantId,
          accessToken: signinPayload.access_token,
          refreshToken: signinPayload.refresh_token ?? null,
        };
      }

      throw new ForbiddenException(resolveErrorMessage(signinPayload));
    }

    if (!signupResponse.ok || !signupPayload.user?.id || !signupPayload.access_token) {
      throw new ForbiddenException(resolveErrorMessage(signupPayload));
    }

    const tenantId = defaultTenantId;
    await this.getOrCreateTrialState(tenantId);
    await this.emitAuditEvent('signup_completed', {
      tenantId,
      userId: signupPayload.user.id,
      source: 'launch_signup',
      completedAt: new Date().toISOString(),
    }).catch(() => undefined);

    return {
      userId: signupPayload.user.id,
      tenantId,
      accessToken: signupPayload.access_token,
      refreshToken: signupPayload.refresh_token ?? null,
    };
  }

  async saveWorkspaceSetup(input: {
    tenantId: string;
    organizationName: string;
    country: string;
    primaryRole: SignupPrimaryRole;
    actorUserId: string | null;
  }): Promise<CommercialProfileRow> {
    await this.ensureSchema();
    const result = await this.pool.query<CommercialProfileRow>(
      `
        INSERT INTO tenant_commercial_profiles (
          tenant_id,
          organization_name,
          country,
          primary_role,
          profile_skipped,
          updated_at
        )
        VALUES ($1, $2, $3, $4, FALSE, NOW())
        ON CONFLICT (tenant_id) DO UPDATE SET
          organization_name = EXCLUDED.organization_name,
          country = EXCLUDED.country,
          primary_role = EXCLUDED.primary_role,
          profile_skipped = FALSE,
          updated_at = NOW()
        RETURNING tenant_id, organization_name, country, primary_role, team_size, main_commodity, primary_objective, profile_skipped, updated_at
      `,
      [input.tenantId, input.organizationName.trim(), input.country.trim(), input.primaryRole],
    );
    await this.emitAuditEvent('signup_workspace_setup_completed', {
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      primaryRole: input.primaryRole,
      updatedAt: new Date().toISOString(),
    }).catch(() => undefined);
    return result.rows[0];
  }

  async saveCommercialProfile(input: {
    tenantId: string;
    primaryRole: SignupPrimaryRole;
    skipped: boolean;
    teamSize: string | null;
    mainCommodity: string | null;
    primaryObjective: SignupPrimaryObjective | null;
    actorUserId: string | null;
  }): Promise<CommercialProfileRow> {
    await this.ensureSchema();
    const result = await this.pool.query<CommercialProfileRow>(
      `
        INSERT INTO tenant_commercial_profiles (
          tenant_id,
          primary_role,
          team_size,
          main_commodity,
          primary_objective,
          profile_skipped,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (tenant_id) DO UPDATE SET
          primary_role = EXCLUDED.primary_role,
          team_size = EXCLUDED.team_size,
          main_commodity = EXCLUDED.main_commodity,
          primary_objective = EXCLUDED.primary_objective,
          profile_skipped = EXCLUDED.profile_skipped,
          updated_at = NOW()
        RETURNING tenant_id, organization_name, country, primary_role, team_size, main_commodity, primary_objective, profile_skipped, updated_at
      `,
      [
        input.tenantId,
        input.primaryRole,
        input.teamSize,
        input.mainCommodity,
        input.primaryObjective,
        input.skipped,
      ],
    );
    await this.emitAuditEvent(input.skipped ? 'onboarding_skipped' : 'commercial_profile_saved', {
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      primaryRole: input.primaryRole,
      primaryObjective: input.primaryObjective,
      savedAt: new Date().toISOString(),
    }).catch(() => undefined);
    return result.rows[0];
  }
}
