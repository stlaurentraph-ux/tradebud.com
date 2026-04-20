import { BadRequestException } from '@nestjs/common';
import { ChatThreadsService } from './chat-threads.service';

describe('ChatThreadsService idempotent message semantics', () => {
  it('replays create-thread response for existing idempotency key', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({}) // ensureSchema chat_threads
        .mockResolvedValueOnce({}) // ensureSchema chat_messages
        .mockResolvedValueOnce({}) // ensureSchema idx unique
        .mockResolvedValueOnce({}) // ensureSchema idx threads
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ id: 'msg_1', thread_id: 'thread_1', body: 'hello', idempotency_key: 'idem-thread-1' }],
        }),
    };
    const service = new ChatThreadsService(pool as any);
    const result = await service.createThread(
      { recordId: 'record_1', message: 'hello', idempotencyKey: 'idem-thread-1' },
      { tenantId: 'tenant_1', userId: 'user_1', actorRole: 'exporter' },
    );
    expect(result.replayed).toBe(true);
    expect(result.threadId).toBe('thread_1');
  });

  it('rejects posting to archived thread', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'thread_1', status: 'archived' }] }),
    };
    const service = new ChatThreadsService(pool as any);
    await expect(
      service.postMessage(
        'thread_1',
        { message: 'cannot post', idempotencyKey: 'idem-msg-1' },
        { tenantId: 'tenant_1', userId: 'user_1', actorRole: 'agent' },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('resolves active thread and returns transition metadata', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'thread_1', status: 'active', record_id: 'record_1' }] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({}),
    };
    const service = new ChatThreadsService(pool as any);
    const result = await service.resolveThread('thread_1', {
      tenantId: 'tenant_1',
      userId: 'user_1',
      actorRole: 'exporter',
    });
    expect(result).toEqual({ threadId: 'thread_1', status: 'resolved', changed: true });
  });

  it('rejects reopening archived thread', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'thread_1', status: 'archived', record_id: 'record_1' }] }),
    };
    const service = new ChatThreadsService(pool as any);
    await expect(
      service.reopenThread('thread_1', {
        tenantId: 'tenant_1',
        userId: 'user_1',
        actorRole: 'agent',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
