import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import { AppRole } from '../auth/roles';
import { CreateChatThreadDto } from './dto/create-chat-thread.dto';
import { PostChatMessageDto } from './dto/post-chat-message.dto';

interface ChatContext {
  tenantId: string;
  userId?: string | null;
  actorRole: AppRole;
}

type ChatLifecycleEvent =
  | 'chat_thread_created'
  | 'chat_thread_message_posted'
  | 'chat_thread_message_replayed'
  | 'chat_thread_resolved'
  | 'chat_thread_reopened'
  | 'chat_thread_archived';

@Injectable()
export class ChatThreadsService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  private schemaCheckInFlight: Promise<void> | null = null;

  private async ensureSchema(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS public.chat_threads (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        record_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('active', 'resolved', 'archived')),
        created_by TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        resolved_at TIMESTAMPTZ NULL
      )
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS public.chat_messages (
        id TEXT PRIMARY KEY,
        thread_id TEXT NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
        tenant_id TEXT NOT NULL,
        author_user_id TEXT NULL,
        author_role TEXT NOT NULL CHECK (author_role IN ('farmer', 'agent', 'exporter', 'admin', 'compliance_manager')),
        body TEXT NOT NULL,
        idempotency_key TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_messages_tenant_idempotency
      ON public.chat_messages (tenant_id, idempotency_key)
      WHERE idempotency_key IS NOT NULL
    `);
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_threads_tenant_record_created
      ON public.chat_threads (tenant_id, record_id, created_at DESC)
    `);
  }

  private async ensureSchemaVerified(): Promise<void> {
    if (this.schemaCheckInFlight) {
      await this.schemaCheckInFlight;
      return;
    }
    this.schemaCheckInFlight = this.ensureSchema();
    try {
      await this.schemaCheckInFlight;
    } finally {
      this.schemaCheckInFlight = null;
    }
  }

  private async appendChatAuditEvent(
    eventType: ChatLifecycleEvent,
    payload: {
      tenantId: string;
      threadId: string;
      recordId?: string | null;
      messageId: string;
      idempotencyKey?: string | null;
      actorRole: AppRole;
      actorUserId?: string | null;
    },
  ): Promise<void> {
    try {
      await this.pool.query(
        `
          INSERT INTO audit_log (user_id, event_type, payload)
          VALUES ($1, $2, $3::jsonb)
        `,
        [
          payload.actorUserId ?? null,
          eventType,
          JSON.stringify({
            tenantId: payload.tenantId,
            threadId: payload.threadId,
            recordId: payload.recordId ?? null,
            messageId: payload.messageId,
            idempotencyKey: payload.idempotencyKey ?? null,
            actorRole: payload.actorRole,
            actorUserId: payload.actorUserId ?? null,
            capturedAt: new Date().toISOString(),
          }),
        ],
      );
    } catch {
      // Thread operations should not fail if audit append fails.
    }
  }

  async listThreads(tenantId: string, recordId?: string) {
    await this.ensureSchemaVerified();
    const hasRecord = typeof recordId === 'string' && recordId.trim().length > 0;
    const params: Array<string> = [tenantId];
    let recordClause = '';
    if (hasRecord) {
      params.push(recordId!.trim());
      recordClause = 'AND t.record_id = $2';
    }
    const res = await this.pool.query(
      `
        SELECT
          t.id,
          t.tenant_id,
          t.record_id,
          t.status,
          t.created_by,
          t.created_at,
          t.resolved_at,
          COUNT(m.id)::int AS message_count,
          MAX(m.created_at) AS last_message_at
        FROM public.chat_threads t
        LEFT JOIN public.chat_messages m ON m.thread_id = t.id
        WHERE t.tenant_id = $1
          ${recordClause}
        GROUP BY t.id, t.tenant_id, t.record_id, t.status, t.created_by, t.created_at, t.resolved_at
        ORDER BY COALESCE(MAX(m.created_at), t.created_at) DESC
        LIMIT 200
      `,
      params,
    );
    return res.rows;
  }

  async listMessages(threadId: string, tenantId: string) {
    await this.ensureSchemaVerified();
    const res = await this.pool.query(
      `
        SELECT id, thread_id, tenant_id, author_user_id, author_role, body, idempotency_key, created_at
        FROM public.chat_messages
        WHERE thread_id = $1
          AND tenant_id = $2
        ORDER BY created_at ASC
        LIMIT 1000
      `,
      [threadId, tenantId],
    );
    return res.rows;
  }

  async createThread(dto: CreateChatThreadDto, context: ChatContext) {
    await this.ensureSchemaVerified();
    const recordId = dto.recordId.trim();
    const body = dto.message.trim();
    const idempotencyKey = dto.idempotencyKey?.trim() || null;
    if (!recordId || !body) {
      throw new BadRequestException('recordId and message are required');
    }
    if (idempotencyKey) {
      const replay = await this.lookupIdempotencyReplay(context.tenantId, idempotencyKey);
      if (replay) {
        await this.appendChatAuditEvent('chat_thread_message_replayed', {
          tenantId: context.tenantId,
          threadId: replay.threadId,
          recordId,
          messageId: replay.message.id,
          idempotencyKey: replay.message.idempotencyKey ?? null,
          actorRole: context.actorRole,
          actorUserId: context.userId ?? null,
        });
        return replay;
      }
    }

    const threadId = `thread_${randomUUID()}`;
    const messageId = `msg_${randomUUID()}`;
    await this.pool.query(
      `
        INSERT INTO public.chat_threads (id, tenant_id, record_id, status, created_by)
        VALUES ($1, $2, $3, 'active', $4)
      `,
      [threadId, context.tenantId, recordId, context.userId ?? null],
    );
    await this.pool.query(
      `
        INSERT INTO public.chat_messages (id, thread_id, tenant_id, author_user_id, author_role, body, idempotency_key)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [messageId, threadId, context.tenantId, context.userId ?? null, context.actorRole, body, idempotencyKey],
    );
    await this.appendChatAuditEvent('chat_thread_created', {
      tenantId: context.tenantId,
      threadId,
      recordId,
      messageId,
      idempotencyKey,
      actorRole: context.actorRole,
      actorUserId: context.userId ?? null,
    });
    return {
      threadId,
      recordId,
      created: true,
      replayed: false,
      message: {
        id: messageId,
        body,
        idempotencyKey,
      },
    };
  }

  async postMessage(threadId: string, dto: PostChatMessageDto, context: ChatContext) {
    await this.ensureSchemaVerified();
    const body = dto.message.trim();
    const idempotencyKey = dto.idempotencyKey?.trim() || null;
    if (!body) {
      throw new BadRequestException('message is required');
    }
    const threadRes = await this.pool.query<{ id: string; status: string }>(
      `
        SELECT id, status
        FROM public.chat_threads
        WHERE id = $1
          AND tenant_id = $2
        LIMIT 1
      `,
      [threadId, context.tenantId],
    );
    if (threadRes.rowCount === 0) {
      throw new BadRequestException('Chat thread not found');
    }
    if (threadRes.rows[0].status === 'archived') {
      throw new BadRequestException('Archived thread cannot accept new messages');
    }
    if (idempotencyKey) {
      const replay = await this.lookupIdempotencyReplay(context.tenantId, idempotencyKey);
      if (replay) {
        await this.appendChatAuditEvent('chat_thread_message_replayed', {
          tenantId: context.tenantId,
          threadId: replay.threadId,
          messageId: replay.message.id,
          idempotencyKey: replay.message.idempotencyKey ?? null,
          actorRole: context.actorRole,
          actorUserId: context.userId ?? null,
        });
        return replay;
      }
    }
    const messageId = `msg_${randomUUID()}`;
    await this.pool.query(
      `
        INSERT INTO public.chat_messages (id, thread_id, tenant_id, author_user_id, author_role, body, idempotency_key)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [messageId, threadId, context.tenantId, context.userId ?? null, context.actorRole, body, idempotencyKey],
    );
    await this.appendChatAuditEvent('chat_thread_message_posted', {
      tenantId: context.tenantId,
      threadId,
      messageId,
      idempotencyKey,
      actorRole: context.actorRole,
      actorUserId: context.userId ?? null,
    });
    return {
      threadId,
      created: true,
      replayed: false,
      message: {
        id: messageId,
        body,
        idempotencyKey,
      },
    };
  }

  async resolveThread(threadId: string, context: ChatContext) {
    await this.ensureSchemaVerified();
    const thread = await this.getThreadForTransition(threadId, context.tenantId);
    if (thread.status === 'archived') {
      throw new BadRequestException('Archived thread cannot be resolved');
    }
    if (thread.status === 'resolved') {
      return {
        threadId,
        status: 'resolved' as const,
        changed: false,
      };
    }
    await this.pool.query(
      `
        UPDATE public.chat_threads
        SET status = 'resolved', resolved_at = NOW()
        WHERE id = $1
          AND tenant_id = $2
      `,
      [threadId, context.tenantId],
    );
    await this.appendChatAuditEvent('chat_thread_resolved', {
      tenantId: context.tenantId,
      threadId,
      recordId: thread.record_id,
      messageId: `status_${randomUUID()}`,
      actorRole: context.actorRole,
      actorUserId: context.userId ?? null,
    });
    return {
      threadId,
      status: 'resolved' as const,
      changed: true,
    };
  }

  async reopenThread(threadId: string, context: ChatContext) {
    await this.ensureSchemaVerified();
    const thread = await this.getThreadForTransition(threadId, context.tenantId);
    if (thread.status === 'archived') {
      throw new BadRequestException('Archived thread cannot be reopened');
    }
    if (thread.status === 'active') {
      return {
        threadId,
        status: 'active' as const,
        changed: false,
      };
    }
    await this.pool.query(
      `
        UPDATE public.chat_threads
        SET status = 'active', resolved_at = NULL
        WHERE id = $1
          AND tenant_id = $2
      `,
      [threadId, context.tenantId],
    );
    await this.appendChatAuditEvent('chat_thread_reopened', {
      tenantId: context.tenantId,
      threadId,
      recordId: thread.record_id,
      messageId: `status_${randomUUID()}`,
      actorRole: context.actorRole,
      actorUserId: context.userId ?? null,
    });
    return {
      threadId,
      status: 'active' as const,
      changed: true,
    };
  }

  async archiveThread(threadId: string, context: ChatContext) {
    await this.ensureSchemaVerified();
    const thread = await this.getThreadForTransition(threadId, context.tenantId);
    if (thread.status === 'archived') {
      return {
        threadId,
        status: 'archived' as const,
        changed: false,
      };
    }
    await this.pool.query(
      `
        UPDATE public.chat_threads
        SET status = 'archived'
        WHERE id = $1
          AND tenant_id = $2
      `,
      [threadId, context.tenantId],
    );
    await this.appendChatAuditEvent('chat_thread_archived', {
      tenantId: context.tenantId,
      threadId,
      recordId: thread.record_id,
      messageId: `status_${randomUUID()}`,
      actorRole: context.actorRole,
      actorUserId: context.userId ?? null,
    });
    return {
      threadId,
      status: 'archived' as const,
      changed: true,
    };
  }

  private async lookupIdempotencyReplay(tenantId: string, idempotencyKey: string) {
    const replayRes = await this.pool.query<{ id: string; thread_id: string; body: string; idempotency_key: string }>(
      `
        SELECT id, thread_id, body, idempotency_key
        FROM public.chat_messages
        WHERE tenant_id = $1
          AND idempotency_key = $2
        LIMIT 1
      `,
      [tenantId, idempotencyKey],
    );
    if (!replayRes.rowCount) return null;
    const row = replayRes.rows[0];
    return {
      threadId: row.thread_id,
      created: false,
      replayed: true,
      message: {
        id: row.id,
        body: row.body,
        idempotencyKey: row.idempotency_key,
      },
    };
  }

  private async getThreadForTransition(threadId: string, tenantId: string) {
    const threadRes = await this.pool.query<{ id: string; status: 'active' | 'resolved' | 'archived'; record_id: string }>(
      `
        SELECT id, status, record_id
        FROM public.chat_threads
        WHERE id = $1
          AND tenant_id = $2
        LIMIT 1
      `,
      [threadId, tenantId],
    );
    if (!threadRes.rowCount) {
      throw new BadRequestException('Chat thread not found');
    }
    return threadRes.rows[0];
  }
}
