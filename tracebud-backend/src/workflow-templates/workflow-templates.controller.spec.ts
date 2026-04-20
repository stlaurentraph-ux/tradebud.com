import { ForbiddenException } from '@nestjs/common';
import { WorkflowTemplatesController } from './workflow-templates.controller';

describe('WorkflowTemplatesController', () => {
  it('rejects create when tenant claim is missing', async () => {
    const pool = { query: jest.fn() };
    const controller = new WorkflowTemplatesController(pool as any);
    await expect(
      controller.createTemplate(
        { name: 'EUDR evidence gate', stages: ['collect_docs'], slaHours: 48 },
        { user: { id: 'user_1', email: 'exporter+ops@tracebud.com' } },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('creates template for exporter and appends audit telemetry', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const controller = new WorkflowTemplatesController(pool as any);
    const result = await controller.createTemplate(
      { name: 'EUDR evidence gate', stages: ['collect_docs', 'approve_docs'], slaHours: 48 },
      {
        user: {
          id: 'user_1',
          email: 'exporter+ops@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1' },
        },
      },
    );
    expect(result).toEqual({ id: expect.any(String), status: 'active' });
    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(pool.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['workflow_template_created']),
    );
  });

  it('rejects invalid stage transition edges', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const controller = new WorkflowTemplatesController(pool as any);
    await expect(
      controller.transitionStage(
        'template_1',
        'collect_docs',
        { toStatus: 'approved' },
        {
          user: {
            id: 'user_1',
            email: 'exporter+ops@tracebud.com',
            app_metadata: { tenant_id: 'tenant_1' },
          },
        },
      ),
    ).rejects.toThrow('Invalid stage transition: pending -> approved');
  });

  it('allows pending->in_progress->completed->approved transition sequence', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ payload: { toStatus: 'in_progress' } }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ payload: { toStatus: 'completed' } }] })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new WorkflowTemplatesController(pool as any);
    const req = {
      user: {
        id: 'user_1',
        email: 'exporter+ops@tracebud.com',
        app_metadata: { tenant_id: 'tenant_1' },
      },
    };
    await expect(controller.transitionStage('template_1', 'collect_docs', { toStatus: 'in_progress' }, req)).resolves.toEqual(
      expect.objectContaining({ fromStatus: 'pending', toStatus: 'in_progress' }),
    );
    await expect(controller.transitionStage('template_1', 'collect_docs', { toStatus: 'completed' }, req)).resolves.toEqual(
      expect.objectContaining({ fromStatus: 'in_progress', toStatus: 'completed' }),
    );
    await expect(controller.transitionStage('template_1', 'collect_docs', { toStatus: 'approved' }, req)).resolves.toEqual(
      expect.objectContaining({ fromStatus: 'completed', toStatus: 'approved' }),
    );
  });

  it('enforces deterministic SLA transition edges', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const controller = new WorkflowTemplatesController(pool as any);
    await expect(
      controller.transitionStageSla(
        'template_1',
        'collect_docs',
        { toState: 'breached' },
        {
          user: {
            id: 'user_1',
            email: 'exporter+ops@tracebud.com',
            app_metadata: { tenant_id: 'tenant_1' },
          },
        },
      ),
    ).rejects.toThrow('Invalid SLA transition: on_track -> breached');
  });

  it('allows warning->breached->escalated->on_track SLA sequence', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ payload: { toState: 'warning' } }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ payload: { toState: 'breached' } }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ payload: { toState: 'escalated' } }] })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new WorkflowTemplatesController(pool as any);
    const req = {
      user: {
        id: 'user_1',
        email: 'exporter+ops@tracebud.com',
        app_metadata: { tenant_id: 'tenant_1' },
      },
    };
    await expect(
      controller.transitionStageSla('template_1', 'collect_docs', { toState: 'warning' }, req),
    ).resolves.toEqual(expect.objectContaining({ fromState: 'on_track', toState: 'warning' }));
    await expect(
      controller.transitionStageSla('template_1', 'collect_docs', { toState: 'breached' }, req),
    ).resolves.toEqual(expect.objectContaining({ fromState: 'warning', toState: 'breached' }));
    await expect(
      controller.transitionStageSla('template_1', 'collect_docs', { toState: 'escalated' }, req),
    ).resolves.toEqual(expect.objectContaining({ fromState: 'breached', toState: 'escalated' }));
    await expect(
      controller.transitionStageSla('template_1', 'collect_docs', { toState: 'on_track' }, req),
    ).resolves.toEqual(expect.objectContaining({ fromState: 'escalated', toState: 'on_track' }));
  });
});

