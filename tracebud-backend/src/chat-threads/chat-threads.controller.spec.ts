import { ForbiddenException } from '@nestjs/common';
import { ChatThreadsController } from './chat-threads.controller';
import type { ChatThreadsService } from './chat-threads.service';

function makeServiceMock(): jest.Mocked<
  Pick<
    ChatThreadsService,
    'listThreads' | 'listMessages' | 'createThread' | 'postMessage' | 'resolveThread' | 'reopenThread' | 'archiveThread'
  >
> {
  return {
    listThreads: jest.fn(),
    listMessages: jest.fn(),
    createThread: jest.fn(),
    postMessage: jest.fn(),
    resolveThread: jest.fn(),
    reopenThread: jest.fn(),
    archiveThread: jest.fn(),
  };
}

describe('ChatThreadsController tenant enforcement and contracts', () => {
  it('rejects list when tenant claim is missing', async () => {
    const service = makeServiceMock();
    const controller = new ChatThreadsController(service as unknown as ChatThreadsService);
    await expect(controller.listThreads(undefined, { user: { id: 'user_1' } })).rejects.toThrow(ForbiddenException);
  });

  it('creates thread with tenant context', async () => {
    const service = makeServiceMock();
    service.createThread.mockResolvedValue({ threadId: 'thread_1', created: true, replayed: false } as any);
    const controller = new ChatThreadsController(service as unknown as ChatThreadsService);
    await expect(
      controller.createThread(
        { recordId: 'record_1', message: 'hello thread', idempotencyKey: 'idem-thread-1' } as any,
        {
          user: { id: 'user_1', email: 'exporter+demo@tracebud.com', app_metadata: { tenant_id: 'tenant_1' } },
        },
      ),
    ).resolves.toEqual(expect.objectContaining({ threadId: 'thread_1' }));
    expect(service.createThread).toHaveBeenCalledWith(
      expect.objectContaining({ recordId: 'record_1' }),
      expect.objectContaining({ tenantId: 'tenant_1', userId: 'user_1', actorRole: 'exporter' }),
    );
  });

  it('posts message with tenant context', async () => {
    const service = makeServiceMock();
    service.postMessage.mockResolvedValue({ threadId: 'thread_1', created: true, replayed: false } as any);
    const controller = new ChatThreadsController(service as unknown as ChatThreadsService);
    await expect(
      controller.postMessage(
        'thread_1',
        { message: 'follow-up', idempotencyKey: 'idem-msg-1' } as any,
        {
          user: { id: 'user_1', email: 'agent+demo@tracebud.com', app_metadata: { tenant_id: 'tenant_1' } },
        },
      ),
    ).resolves.toEqual(expect.objectContaining({ threadId: 'thread_1' }));
    expect(service.postMessage).toHaveBeenCalledWith(
      'thread_1',
      expect.objectContaining({ message: 'follow-up' }),
      expect.objectContaining({ tenantId: 'tenant_1', actorRole: 'agent' }),
    );
  });

  it('resolves thread with tenant context', async () => {
    const service = makeServiceMock();
    service.resolveThread.mockResolvedValue({ threadId: 'thread_1', status: 'resolved', changed: true } as any);
    const controller = new ChatThreadsController(service as unknown as ChatThreadsService);
    await expect(
      controller.resolveThread('thread_1', {
        user: { id: 'user_1', email: 'exporter+demo@tracebud.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).resolves.toEqual(expect.objectContaining({ status: 'resolved' }));
    expect(service.resolveThread).toHaveBeenCalledWith(
      'thread_1',
      expect.objectContaining({ tenantId: 'tenant_1', actorRole: 'exporter' }),
    );
  });
});
