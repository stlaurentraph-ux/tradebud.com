import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { Inject } from '@nestjs/common';
import { PG_POOL } from '../db/db.module';

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default' | null;
};

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async registerDevice(userId: string, pushToken: string, platform: string): Promise<void> {
    const token = pushToken?.trim();
    if (!token || !userId) {
      return;
    }
    const normalizedPlatform = ['ios', 'android', 'web'].includes(platform) ? platform : 'unknown';
    try {
      await this.pool.query(
        `
          INSERT INTO farmer_push_devices (user_id, push_token, platform, updated_at)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (user_id, push_token)
          DO UPDATE SET platform = EXCLUDED.platform, updated_at = NOW()
        `,
        [userId, token, normalizedPlatform],
      );
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === '42P01') {
        this.logger.warn('farmer_push_devices table missing; skip push registration');
        return;
      }
      throw error;
    }
  }

  async unregisterDevice(userId: string, pushToken: string): Promise<void> {
    const token = pushToken?.trim();
    if (!token || !userId) {
      return;
    }
    try {
      await this.pool.query(
        `DELETE FROM farmer_push_devices WHERE user_id = $1::uuid AND push_token = $2`,
        [userId, token],
      );
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === '42P01') {
        this.logger.warn('farmer_push_devices table missing; skip push unregister');
        return;
      }
      throw error;
    }
  }

  async notifyFarmerConsentRequest(params: {
    farmerId: string;
    granteeOrgName: string | null;
    grantId: string;
  }): Promise<void> {
    try {
      const userRes = await this.pool.query<{ user_id: string }>(
        `SELECT user_id::text FROM farmer_profile WHERE id = $1 LIMIT 1`,
        [params.farmerId],
      );
      const userId = userRes.rows[0]?.user_id;
      if (!userId) {
        return;
      }
      const tokensRes = await this.pool.query<{ push_token: string }>(
        `SELECT push_token FROM farmer_push_devices WHERE user_id = $1::uuid ORDER BY updated_at DESC LIMIT 5`,
        [userId],
      );
      const tokens = tokensRes.rows.map((row) => row.push_token).filter(Boolean);
      if (tokens.length === 0) {
        return;
      }
      const orgLabel = params.granteeOrgName?.trim() || 'An organisation';
      const messages: ExpoPushMessage[] = tokens.map((to) => ({
        to,
        title: 'Data access request',
        body: `${orgLabel} requested access to your Tracebud records. Open Data sharing to approve or decline.`,
        data: { grantId: params.grantId, screen: 'data-sharing' },
        sound: 'default',
      }));
      await this.sendExpoPush(messages);
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === '42P01') {
        return;
      }
      this.logger.warn(`Consent push failed: ${(error as Error).message}`);
    }
  }

  async notifyTenureReviewRequired(params: {
    tenantId: string;
    plotId: string;
    verificationId: string;
    title: string;
    body: string;
  }): Promise<void> {
    const staffUserIds = await this.resolveTenantStaffUserIds(params.tenantId);
    await this.notifyUsersWithTokens({
      userIds: staffUserIds,
      title: params.title,
      body: params.body,
      data: {
        screen: 'tenure-review',
        plotId: params.plotId,
        verificationId: params.verificationId,
      },
    });
  }

  async notifyFarmerTenureReviewUpdate(params: {
    farmerId: string;
    plotId: string;
    title: string;
    body: string;
  }): Promise<void> {
    await this.notifyUsersWithTokens({
      userIds: await this.resolveFarmerUserId(params.farmerId),
      title: params.title,
      body: params.body,
      data: {
        screen: 'plots',
        plotId: params.plotId,
      },
    });
  }

  async notifyGeometryQualityRejected(params: {
    farmerId: string;
    tenantId?: string | null;
    clientPlotId?: string | null;
    plotId?: string | null;
    code: string;
    message: string;
  }): Promise<void> {
    const plotLabel = params.clientPlotId?.trim() || params.plotId?.trim() || 'your plot';
    await this.notifyUsersWithTokens({
      userIds: await this.resolveFarmerUserId(params.farmerId),
      title: 'Boundary needs a fix',
      body: `${plotLabel}: ${params.message}`,
      data: {
        screen: 'plots',
        code: params.code,
        plotId: params.plotId ?? '',
        clientPlotId: params.clientPlotId ?? '',
      },
    });

    if (params.tenantId) {
      const staffUserIds = await this.resolveTenantStaffUserIds(params.tenantId);
      await this.notifyUsersWithTokens({
        userIds: staffUserIds,
        title: 'Member boundary rejected',
        body: `${plotLabel}: ${params.message}`,
        data: {
          screen: 'field-operations',
          code: params.code,
          farmerId: params.farmerId,
        },
      });
    }
  }

  private async resolveFarmerUserId(farmerId: string): Promise<string[]> {
    try {
      const userRes = await this.pool.query<{ user_id: string }>(
        `SELECT user_id::text FROM farmer_profile WHERE id = $1 LIMIT 1`,
        [farmerId],
      );
      const userId = userRes.rows[0]?.user_id;
      return userId ? [userId] : [];
    } catch {
      return [];
    }
  }

  private async resolveTenantStaffUserIds(tenantId: string): Promise<string[]> {
    try {
      const res = await this.pool.query<{ user_id: string }>(
        `
          SELECT DISTINCT NULLIF(tsc.user_id, '')::text AS user_id
          FROM tenant_signup_contacts tsc
          JOIN user_account ua ON ua.id = NULLIF(tsc.user_id, '')::uuid
          WHERE tsc.tenant_id = $1
            AND NULLIF(tsc.user_id, '') IS NOT NULL
            AND ua.role IN ('agent', 'cooperative', 'exporter', 'compliance_manager')
        `,
        [tenantId],
      );
      return res.rows.map((row) => row.user_id).filter(Boolean);
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === '42P01') {
        return [];
      }
      throw error;
    }
  }

  private async notifyUsersWithTokens(params: {
    userIds: string[];
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<void> {
    if (params.userIds.length === 0) {
      return;
    }
    try {
      const tokensRes = await this.pool.query<{ push_token: string }>(
        `
          SELECT push_token
          FROM farmer_push_devices
          WHERE user_id = ANY($1::uuid[])
          ORDER BY updated_at DESC
          LIMIT 20
        `,
        [params.userIds],
      );
      const tokens = [...new Set(tokensRes.rows.map((row) => row.push_token).filter(Boolean))];
      if (tokens.length === 0) {
        return;
      }
      const messages: ExpoPushMessage[] = tokens.map((to) => ({
        to,
        title: params.title,
        body: params.body,
        data: params.data,
        sound: 'default',
      }));
      await this.sendExpoPush(messages);
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === '42P01') {
        return;
      }
      this.logger.warn(`Push notify failed: ${(error as Error).message}`);
    }
  }

  private async sendExpoPush(messages: ExpoPushMessage[]): Promise<void> {
    if (messages.length === 0) {
      return;
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    const accessToken = process.env.EXPO_ACCESS_TOKEN?.trim();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers,
      body: JSON.stringify(messages.length === 1 ? messages[0] : messages),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.logger.warn(`Expo push HTTP ${response.status}: ${body}`);
    }
  }
}
