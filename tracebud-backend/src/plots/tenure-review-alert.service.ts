import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { Resend } from 'resend';
import { PG_POOL } from '../db/db.module';
import { PushNotificationService } from '../consent/push-notification.service';
import type { TenureParseStatus } from './tenure-parse.types';

@Injectable()
export class TenureReviewAlertService {
  private readonly logger = new Logger(TenureReviewAlertService.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly pushNotifications: PushNotificationService,
  ) {}

  async notifyTenureReviewRequired(params: {
    tenantId: string | null;
    plotId: string;
    verificationId: string;
    plotName?: string | null;
    farmerId?: string | null;
    parseStatus: TenureParseStatus;
  }): Promise<void> {
    if (params.parseStatus !== 'MANUAL_REQUIRED' && params.parseStatus !== 'FAILED') {
      return;
    }

    const alreadySent = await this.wasAlertSent(params.verificationId, params.parseStatus);
    if (alreadySent) {
      return;
    }

    const plotLabel = params.plotName?.trim() || `Plot ${params.plotId.slice(0, 8)}`;
    const isFailed = params.parseStatus === 'FAILED';
    const staffTitle = isFailed ? 'Tenure document parse failed' : 'Tenure review needed';
    const staffBody = isFailed
      ? `${plotLabel}: AI could not read a land document. Open tenure review to follow up.`
      : `${plotLabel}: A land document needs your confirmation in the tenure review queue.`;

    if (params.tenantId) {
      await this.pushNotifications.notifyTenureReviewRequired({
        tenantId: params.tenantId,
        plotId: params.plotId,
        verificationId: params.verificationId,
        title: staffTitle,
        body: staffBody,
      });
      await this.sendStaffEmail({
        tenantId: params.tenantId,
        subject: `[Tracebud] ${staffTitle} — ${plotLabel}`,
        headline: staffTitle,
        body: staffBody,
        plotId: params.plotId,
        verificationId: params.verificationId,
      });
    }

    if (params.farmerId) {
      await this.pushNotifications.notifyFarmerTenureReviewUpdate({
        farmerId: params.farmerId,
        plotId: params.plotId,
        title: isFailed ? 'Land document needs a clearer photo' : 'Cooperative reviewing your land document',
        body: isFailed
          ? `${plotLabel}: Upload a clearer tenure or title photo from Land Documents.`
          : `${plotLabel}: Your cooperative is reviewing your uploaded land document. You can keep working on other checklist items.`,
      });
    }

    await this.recordAlertSent(params);
  }

  private async wasAlertSent(
    verificationId: string,
    parseStatus: TenureParseStatus,
  ): Promise<boolean> {
    try {
      const res = await this.pool.query<{ exists: boolean }>(
        `
          SELECT EXISTS (
            SELECT 1
            FROM audit_log
            WHERE event_type = 'tenure_review_alert_sent'
              AND payload ->> 'verificationId' = $1
              AND payload ->> 'parseStatus' = $2
          ) AS exists
        `,
        [verificationId, parseStatus],
      );
      return res.rows[0]?.exists === true;
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === '42P01') {
        return false;
      }
      throw error;
    }
  }

  private async recordAlertSent(params: {
    verificationId: string;
    plotId: string;
    tenantId: string | null;
    parseStatus: TenureParseStatus;
  }): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO audit_log (event_type, payload)
        VALUES ('tenure_review_alert_sent', $1::jsonb)
      `,
      [
        JSON.stringify({
          verificationId: params.verificationId,
          plotId: params.plotId,
          tenantId: params.tenantId,
          parseStatus: params.parseStatus,
        }),
      ],
    );
  }

  private async sendStaffEmail(params: {
    tenantId: string;
    subject: string;
    headline: string;
    body: string;
    plotId: string;
    verificationId: string;
  }): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
    if (!apiKey || !fromEmail) {
      this.logger.debug('Resend not configured; skip tenure review email');
      return;
    }

    const recipients = await this.resolveTenantStaffEmails(params.tenantId);
    if (recipients.length === 0) {
      return;
    }

    const dashboardBase =
      process.env.DASHBOARD_BASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_DASHBOARD_URL?.trim() ||
      'https://app.tracebud.com';
    const reviewUrl = `${dashboardBase.replace(/\/$/, '')}/compliance/tenure-review`;
    const plotUrl = `${dashboardBase.replace(/\/$/, '')}/plots/${encodeURIComponent(params.plotId)}`;
    const fromName = process.env.RESEND_FROM_NAME?.trim() || 'Tracebud';

    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: recipients.slice(0, 5),
        subject: params.subject,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.5;max-width:640px">
            <h2 style="margin-bottom:8px;">${params.headline}</h2>
            <p style="margin:0 0 12px 0;">${params.body}</p>
            <p style="margin:0 0 16px 0;">
              <a href="${reviewUrl}">Open tenure review queue</a>
              &nbsp;·&nbsp;
              <a href="${plotUrl}">View plot</a>
            </p>
          </div>
        `,
        text: `${params.headline}\n\n${params.body}\n\nTenure queue: ${reviewUrl}\nPlot: ${plotUrl}`,
      });
    } catch (error) {
      this.logger.warn(`Tenure review email failed: ${(error as Error).message}`);
    }
  }

  private async resolveTenantStaffEmails(tenantId: string): Promise<string[]> {
    try {
      const res = await this.pool.query<{ email: string }>(
        `
          SELECT DISTINCT LOWER(TRIM(ua.email)) AS email
          FROM tenant_signup_contacts tsc
          JOIN user_account ua ON ua.id = NULLIF(tsc.user_id, '')::uuid
          WHERE tsc.tenant_id = $1
            AND NULLIF(TRIM(ua.email), '') IS NOT NULL
          UNION
          SELECT DISTINCT LOWER(TRIM(tsc.email)) AS email
          FROM tenant_signup_contacts tsc
          WHERE tsc.tenant_id = $1
            AND NULLIF(TRIM(tsc.email), '') IS NOT NULL
        `,
        [tenantId],
      );
      return res.rows.map((row) => row.email).filter(Boolean);
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === '42P01') {
        return [];
      }
      throw error;
    }
  }
}
