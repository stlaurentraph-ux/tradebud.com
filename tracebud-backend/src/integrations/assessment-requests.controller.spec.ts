import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AssessmentRequestsController } from './assessment-requests.controller';

describe('AssessmentRequestsController', () => {
  const tenantId = 'tenant-1';
  const exporterReq = {
    user: {
      id: 'df9fce2f-f5ef-4bf8-b68e-7bc716aab5e8',
      app_metadata: { tenant_id: tenantId, role: 'exporter' },
      user_metadata: { role: 'exporter' },
    },
  };
  const farmerReq = {
    user: {
      id: 'dbf9fcf6-8734-4ed1-9cef-422323753d48',
      app_metadata: { tenant_id: tenantId, role: 'farmer' },
      user_metadata: { role: 'farmer' },
    },
  };

  it('creates an assessment request in sent status', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({ rows: [{ id: 'questionnaire-1' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ id: 'request-1', status: 'sent' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });
    const controller = new AssessmentRequestsController({ query } as any);
    const result = await controller.create(
      {
        pathway: 'rice',
        farmerUserId: farmerReq.user.id,
        title: 'SAI + CoolFarm Sprint 3',
        instructions: 'Complete all sections',
      },
      exporterReq,
    );
    expect(result.id).toBe('request-1');
    expect(result.status).toBe('sent');
  });

  it('rejects create for missing manager role', async () => {
    const controller = new AssessmentRequestsController({ query: jest.fn() } as any);
    await expect(
      controller.create(
        {
          pathway: 'annuals',
          farmerUserId: farmerReq.user.id,
          title: 'Assessment',
        },
        farmerReq,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lists assigned requests for farmer context', async () => {
    const query = jest.fn().mockResolvedValue({
      rows: [{ id: 'request-1', farmer_user_id: farmerReq.user.id, status: 'sent' }],
      rowCount: 1,
    });
    const controller = new AssessmentRequestsController({ query } as any);
    const result = await controller.list(undefined, farmerReq);
    expect(result.items).toHaveLength(1);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('updates status for dashboard manager role', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({ rows: [{ id: 'request-1', status: 'reviewed' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });
    const controller = new AssessmentRequestsController({ query } as any);
    const result = await controller.updateStatus('request-1', { status: 'reviewed' }, exporterReq);
    expect(result.status).toBe('reviewed');
  });

  it('rejects invalid status', async () => {
    const controller = new AssessmentRequestsController({ query: jest.fn() } as any);
    await expect(
      controller.updateStatus('request-1', { status: 'invalid' as any }, exporterReq),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks farmer submit when linked questionnaire is not submitted', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({ rows: [{ questionnaire_status: 'draft' }], rowCount: 1 });
    const controller = new AssessmentRequestsController({ query } as any);
    await expect(controller.markSubmitted('request-1', farmerReq)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

