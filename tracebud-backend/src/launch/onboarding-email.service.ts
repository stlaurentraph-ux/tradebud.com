import { Inject, Injectable, Logger } from '@nestjs/common';
import { createSupabaseServerClient } from '../auth/supabase-server.client';
import { SupabaseClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import { Resend } from 'resend';
import { PG_POOL } from '../db/db.module';
import {
  buildFarmerWelcomeTemplateVars,
  buildOnboardingTemplateVars,
  getResumeNudgeTemplateId,
  ONBOARDING_EMAIL_SUBJECTS,
  renderOnboardingEmailHtml,
  renderOnboardingEmailText,
} from './onboarding-email.templates';

type SignupPrimaryRole = 'importer' | 'exporter' | 'compliance_manager' | 'admin';

export interface SignupContactRow {
  tenant_id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  signup_completed_at: string;
  welcome_email_sent_at: string | null;
  resume_nudge_sent_at: string | null;
  resume_nudge_count: number;
}

export interface RemindIncompleteResult {
  scanned: number;
  sent: number;
  skipped: number;
  failures: string[];
}

@Injectable()
export class OnboardingEmailService {
  private readonly logger = new Logger(OnboardingEmailService.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async recordSignupContact(input: {
    tenantId: string;
    userId: string;
    email: string;
    fullName: string | null;
  }): Promise<void> {
    const normalizedEmail = input.email.trim().toLowerCase();
    await this.pool.query(
      `
        INSERT INTO tenant_signup_contacts (
          tenant_id,
          user_id,
          email,
          full_name,
          signup_completed_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (tenant_id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          email = EXCLUDED.email,
          full_name = COALESCE(EXCLUDED.full_name, tenant_signup_contacts.full_name),
          updated_at = NOW()
      `,
      [input.tenantId, input.userId, normalizedEmail, input.fullName?.trim() || null],
    );
  }

  isWorkspaceSetupComplete(profile: {
    organization_name: string | null;
    country: string | null;
    primary_role: string | null;
  } | null): boolean {
    if (!profile) return false;
    const organizationName = profile.organization_name?.trim() ?? '';
    const country = profile.country?.trim() ?? '';
    const primaryRole = profile.primary_role?.trim() ?? '';
    return organizationName.length > 0 && country.length > 0 && primaryRole.length > 0;
  }

  async sendWelcomeAfterWorkspaceSetup(input: {
    tenantId: string;
    userId: string | null;
    email: string;
    fullName: string | null;
    organizationName: string;
    country: string;
    primaryRole: SignupPrimaryRole;
  }): Promise<boolean> {
    const alreadySent = await this.pool.query<{ welcome_email_sent_at: string | null }>(
      `
        SELECT welcome_email_sent_at
        FROM tenant_signup_contacts
        WHERE tenant_id = $1
      `,
      [input.tenantId],
    );
    if (alreadySent.rows[0]?.welcome_email_sent_at) {
      return false;
    }

    if (!this.isResendConfigured()) {
      this.logger.warn('Skipping welcome email: Resend is not configured.');
      return false;
    }

    const recipient = input.email.trim().toLowerCase();
    const firstName = this.firstNameFrom(input.fullName, recipient);
    const dashboardUrl = this.getDashboardBaseUrl();
    const loginUrl = `${dashboardUrl}/login`;
    const roleLabel = this.formatPrimaryRole(input.primaryRole);
    const templateVars = buildOnboardingTemplateVars({
      firstName,
      organizationName: input.organizationName.trim(),
      country: input.country.trim(),
      roleLabel,
      loginUrl,
      dashboardBaseUrl: dashboardUrl,
    });

    try {
      const resend = this.getResendClient();
      const from = this.formatFromAddress();
      const result = await resend.emails.send({
        from,
        to: recipient,
        replyTo: this.getReplyTo(from),
        subject: ONBOARDING_EMAIL_SUBJECTS.welcome,
        html: renderOnboardingEmailHtml('welcome', templateVars),
        text: renderOnboardingEmailText('welcome', templateVars),
      });
      if (result.error) {
        this.logger.warn(`Welcome email failed for ${recipient}: ${result.error.message}`);
        return false;
      }

      await this.pool.query(
        `
          INSERT INTO tenant_signup_contacts (tenant_id, user_id, email, full_name, welcome_email_sent_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          ON CONFLICT (tenant_id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = COALESCE(EXCLUDED.full_name, tenant_signup_contacts.full_name),
            welcome_email_sent_at = NOW(),
            updated_at = NOW()
        `,
        [input.tenantId, input.userId ?? recipient, recipient, input.fullName?.trim() || null],
      );
      await this.emitAuditEvent('onboarding_welcome_email_sent', {
        tenantId: input.tenantId,
        email: recipient,
        sentAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Welcome email failed for ${recipient}: ${message}`);
      return false;
    }
  }

  async sendFarmerWelcomeAfterFieldSignup(input: {
    userId: string;
    farmerId: string;
    email: string;
    fullName: string | null;
  }): Promise<boolean> {
    const userId = input.userId.trim();
    const farmerId = input.farmerId.trim();
    const recipient = input.email.trim().toLowerCase();
    if (!userId || !farmerId || !recipient) {
      return false;
    }

    const alreadySent = await this.pool.query<{ welcome_email_sent_at: string | null }>(
      `
        SELECT welcome_email_sent_at
        FROM field_app_signup_contacts
        WHERE user_id = $1
      `,
      [userId],
    );
    if (alreadySent.rows[0]?.welcome_email_sent_at) {
      return false;
    }

    if (!this.isResendConfigured()) {
      this.logger.warn('Skipping farmer welcome email: Resend is not configured.');
      return false;
    }

    const firstName = this.firstNameFrom(input.fullName, recipient);
    const templateVars = buildFarmerWelcomeTemplateVars({ firstName });

    try {
      const resend = this.getResendClient();
      const from = this.formatFromAddress();
      const result = await resend.emails.send({
        from,
        to: recipient,
        replyTo: this.getReplyTo(from),
        subject: ONBOARDING_EMAIL_SUBJECTS['farmer-welcome'],
        html: renderOnboardingEmailHtml('farmer-welcome', templateVars),
        text: renderOnboardingEmailText('farmer-welcome', templateVars),
      });
      if (result.error) {
        this.logger.warn(`Farmer welcome email failed for ${recipient}: ${result.error.message}`);
        return false;
      }

      await this.pool.query(
        `
          INSERT INTO field_app_signup_contacts (
            user_id,
            farmer_id,
            email,
            full_name,
            welcome_email_sent_at,
            updated_at
          )
          VALUES ($1, $2::uuid, $3, $4, NOW(), NOW())
          ON CONFLICT (user_id) DO UPDATE SET
            farmer_id = COALESCE(EXCLUDED.farmer_id, field_app_signup_contacts.farmer_id),
            email = EXCLUDED.email,
            full_name = COALESCE(EXCLUDED.full_name, field_app_signup_contacts.full_name),
            welcome_email_sent_at = NOW(),
            updated_at = NOW()
        `,
        [userId, farmerId, recipient, input.fullName?.trim() || null],
      );
      await this.emitAuditEvent('farmer_welcome_email_sent', {
        userId,
        farmerId,
        email: recipient,
        sentAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Farmer welcome email failed for ${recipient}: ${message}`);
      return false;
    }
  }

  async remindIncompleteSignups(): Promise<RemindIncompleteResult> {
    const result: RemindIncompleteResult = {
      scanned: 0,
      sent: 0,
      skipped: 0,
      failures: [],
    };

    if (!this.isResendConfigured()) {
      this.logger.warn('Skipping resume nudges: Resend is not configured.');
      return result;
    }

    const candidates = await this.pool.query<SignupContactRow>(
      `
        SELECT
          c.tenant_id,
          c.user_id,
          c.email,
          c.full_name,
          c.signup_completed_at,
          c.welcome_email_sent_at,
          c.resume_nudge_sent_at,
          c.resume_nudge_count
        FROM tenant_signup_contacts c
        LEFT JOIN tenant_commercial_profiles p ON p.tenant_id = c.tenant_id
        WHERE c.welcome_email_sent_at IS NULL
          AND (
            p.tenant_id IS NULL
            OR COALESCE(TRIM(p.organization_name), '') = ''
            OR COALESCE(TRIM(p.country), '') = ''
            OR COALESCE(TRIM(p.primary_role), '') = ''
          )
          AND c.signup_completed_at <= NOW() - INTERVAL '24 hours'
          AND c.resume_nudge_count < 2
          AND (
            c.resume_nudge_sent_at IS NULL
            OR (
              c.resume_nudge_count >= 1
              AND c.resume_nudge_sent_at <= NOW() - INTERVAL '48 hours'
            )
          )
        ORDER BY c.signup_completed_at ASC
        LIMIT 50
      `,
    );

    result.scanned = candidates.rows.length;
    for (const row of candidates.rows) {
      const sent = await this.sendResumeNudge(row);
      if (sent === 'sent') {
        result.sent += 1;
      } else if (sent === 'skipped') {
        result.skipped += 1;
      } else {
        result.failures.push(`${row.email}: ${sent}`);
      }
    }
    return result;
  }

  private async sendResumeNudge(contact: SignupContactRow): Promise<'sent' | 'skipped' | string> {
    const profileCheck = await this.pool.query<{
      organization_name: string | null;
      country: string | null;
      primary_role: string | null;
    }>(
      `
        SELECT organization_name, country, primary_role
        FROM tenant_commercial_profiles
        WHERE tenant_id = $1
      `,
      [contact.tenant_id],
    );
    if (this.isWorkspaceSetupComplete(profileCheck.rows[0] ?? null)) {
      return 'skipped';
    }

    const resumeUrl = await this.buildResumeMagicLink(contact.email);
    if (!resumeUrl) {
      return 'magic link unavailable (configure SUPABASE_SERVICE_ROLE_KEY)';
    }

    const recipient = contact.email.trim().toLowerCase();
    const firstName = this.firstNameFrom(contact.full_name, recipient);
    const templateId = getResumeNudgeTemplateId(contact.resume_nudge_count);
    const templateVars = buildOnboardingTemplateVars({
      firstName,
      resumeUrl,
      dashboardBaseUrl: this.getDashboardBaseUrl(),
    });
    try {
      const resend = this.getResendClient();
      const from = this.formatFromAddress();
      const sendResult = await resend.emails.send({
        from,
        to: recipient,
        replyTo: this.getReplyTo(from),
        subject: ONBOARDING_EMAIL_SUBJECTS[templateId],
        html: renderOnboardingEmailHtml(templateId, templateVars),
        text: renderOnboardingEmailText(templateId, templateVars),
      });
      if (sendResult.error) {
        return sendResult.error.message;
      }

      await this.pool.query(
        `
          UPDATE tenant_signup_contacts
          SET
            resume_nudge_count = resume_nudge_count + 1,
            resume_nudge_sent_at = NOW(),
            updated_at = NOW()
          WHERE tenant_id = $1
        `,
        [contact.tenant_id],
      );
      await this.emitAuditEvent('onboarding_resume_nudge_sent', {
        tenantId: contact.tenant_id,
        email: recipient,
        templateId,
        nudgeCount: contact.resume_nudge_count + 1,
        sentAt: new Date().toISOString(),
      });
      return 'sent';
    } catch (error) {
      return error instanceof Error ? error.message : 'Unknown error';
    }
  }

  private async buildResumeMagicLink(email: string): Promise<string | null> {
    const supabase = this.getSupabaseAdminClient();
    if (!supabase) {
      const dashboardUrl = this.getDashboardBaseUrl();
      return `${dashboardUrl}/create-account?resume=workspace`;
    }

    const redirectTo = `${this.getDashboardBaseUrl()}/create-account?resume=workspace`;
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email.trim().toLowerCase(),
      options: { redirectTo },
    });
    if (error) {
      this.logger.warn(`Magic link generation failed for ${email}: ${error.message}`);
      return null;
    }
    const actionLink =
      (data as { properties?: { action_link?: string } })?.properties?.action_link ??
      (data as { action_link?: string })?.action_link;
    return typeof actionLink === 'string' && actionLink.length > 0 ? actionLink : null;
  }

  private getSupabaseAdminClient(): SupabaseClient | null {
    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!supabaseUrl || !serviceRoleKey) {
      return null;
    }
    return createSupabaseServerClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  private isResendConfigured(): boolean {
    return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim());
  }

  private getResendClient(): Resend {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured.');
    }
    return new Resend(apiKey);
  }

  private formatFromAddress(): string {
    const senderEmail = process.env.RESEND_FROM_EMAIL?.trim() ?? '';
    const senderName = process.env.RESEND_FROM_NAME?.trim() || 'Tracebud';
    return `${senderName} <${senderEmail}>`;
  }

  private getReplyTo(from: string): string {
    return process.env.RESEND_REPLY_TO_EMAIL?.trim() || from.match(/<([^>]+)>/)?.[1] || from;
  }

  private getDashboardBaseUrl(): string {
    const raw = process.env.TRACEBUD_DASHBOARD_PUBLIC_URL?.trim();
    return raw && raw.length > 0 ? raw.replace(/\/$/, '') : 'https://dashboard.tracebud.com';
  }

  private firstNameFrom(fullName: string | null, email: string): string {
    const trimmed = fullName?.trim() ?? '';
    if (trimmed.length > 0) {
      return trimmed.split(/\s+/)[0] ?? 'there';
    }
    const local = email.split('@')[0] ?? '';
    return local.length > 0 ? local : 'there';
  }

  private formatPrimaryRole(role: SignupPrimaryRole): string {
    if (role === 'importer') return 'Importer';
    if (role === 'compliance_manager') return 'Compliance manager';
    if (role === 'admin') return 'Administrator';
    return 'Exporter';
  }

  private async emitAuditEvent(eventType: string, payload: Record<string, unknown>): Promise<void> {
    try {
      await this.pool.query(
        `
          INSERT INTO audit_log (event_type, payload)
          VALUES ($1, $2::jsonb)
        `,
        [eventType, JSON.stringify(payload)],
      );
    } catch {
      // Non-blocking for email side effects.
    }
  }
}
