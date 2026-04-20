import { NextResponse } from 'next/server';

type DeferredGate = 'request_campaigns' | 'annual_reporting';
type GateFeature = 'mvp_gated';

interface GatedEntryTelemetryBody {
  feature?: GateFeature;
  gate?: DeferredGate;
  tenantId?: string;
  role?: string;
  redirectedPath?: string;
}

const ALLOWED_GATES: readonly DeferredGate[] = ['request_campaigns', 'annual_reporting'] as const;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    return NextResponse.json(
      { error: 'TRACEBUD_BACKEND_URL is required for gated-entry analytics reads.' },
      { status: 503 },
    );
  }

  try {
    const requestUrl = new URL(request.url);
    const format = requestUrl.searchParams.get('format');
    const eventKind = requestUrl.searchParams.get('eventKind');
    const wantsCsv = format === 'csv';
    const backendUrl = new URL(`${backendBase}/v1/audit/gated-entry`);
    if (eventKind === 'exports') {
      backendUrl.pathname = '/v1/audit/gated-entry/exports';
    }
    if (eventKind === 'assignment_exports') {
      backendUrl.pathname = '/v1/audit/gated-entry/assignment-exports';
    }
    if (eventKind === 'risk_scores') {
      backendUrl.pathname = '/v1/audit/gated-entry/risk-scores';
    }
    if (eventKind === 'filing_activity') {
      backendUrl.pathname = '/v1/audit/gated-entry/filing-activity';
    }
    if (eventKind === 'chat_threads') {
      backendUrl.pathname = '/v1/audit/gated-entry/chat-threads';
    }
    if (eventKind === 'workflow_activity') {
      backendUrl.pathname = '/v1/audit/gated-entry/workflow-activity';
    }
    if (eventKind === 'dashboard_summary') {
      backendUrl.pathname = '/v1/audit/gated-entry/dashboard-summary';
    }
    if (eventKind === 'actors') {
      backendUrl.pathname = '/v1/audit/gated-entry/actors';
    }
    if (eventKind === 'webhooks') {
      backendUrl.pathname = '/v1/webhooks';
    }
    if (eventKind === 'webhook_deliveries') {
      const webhookId = requestUrl.searchParams.get('webhookId');
      if (!webhookId) {
        return NextResponse.json({ error: 'webhookId is required for webhook delivery reads.' }, { status: 400 });
      }
      backendUrl.pathname = `/v1/webhooks/${encodeURIComponent(webhookId)}/deliveries`;
    }
    if (wantsCsv && eventKind === 'assignment_exports') {
      backendUrl.pathname = '/v1/audit/gated-entry/assignment-exports/export';
    } else if (wantsCsv && eventKind === 'risk_scores') {
      backendUrl.pathname = '/v1/audit/gated-entry/risk-scores/export';
    } else if (wantsCsv && eventKind === 'filing_activity') {
      backendUrl.pathname = '/v1/audit/gated-entry/filing-activity/export';
    } else if (wantsCsv) {
      backendUrl.pathname = '/v1/audit/gated-entry/export';
    }
    ['gate', 'fromHours', 'limit', 'offset', 'sort', 'ids', 'phase', 'status', 'band', 'slaState'].forEach((key) => {
      const value = requestUrl.searchParams.get(key);
      if (value) backendUrl.searchParams.set(key, value);
    });

    const backendResponse = await fetch(backendUrl.toString(), {
      cache: 'no-store',
      headers: authHeader ? { Authorization: authHeader } : undefined,
    });
    if (wantsCsv) {
      const payload = await backendResponse
        .text()
        .catch(() => 'captured_at,gate,role,feature,redirected_path');
      if (!backendResponse.ok) {
        return NextResponse.json(
          { error: payload || 'Backend telemetry CSV export failed.' },
          { status: backendResponse.status },
        );
      }
      return new NextResponse(payload, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'X-Export-Row-Limit': backendResponse.headers.get('x-export-row-limit') ?? '0',
          'X-Export-Row-Count': backendResponse.headers.get('x-export-row-count') ?? '0',
          'X-Export-Truncated': backendResponse.headers.get('x-export-truncated') ?? 'false',
        },
      });
    }

    const payload = await backendResponse.json().catch(() => ({ error: 'Backend telemetry request failed.' }));
    if (!backendResponse.ok) {
      return NextResponse.json(payload, { status: backendResponse.status });
    }
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load gated-entry telemetry.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as GatedEntryTelemetryBody;
  const authHeader = request.headers.get('authorization');
  if (body.feature !== 'mvp_gated') {
    return NextResponse.json({ error: 'feature must be mvp_gated.' }, { status: 400 });
  }
  if (!body.gate || !ALLOWED_GATES.includes(body.gate)) {
    return NextResponse.json({ error: 'gate must be a supported deferred gate.' }, { status: 400 });
  }
  if (!body.tenantId?.trim() || !body.role?.trim()) {
    return NextResponse.json({ error: 'tenantId and role are required.' }, { status: 400 });
  }

  const telemetryEvent = {
    eventType: 'dashboard_gated_entry_attempt',
    feature: body.feature,
    gate: body.gate,
    tenantId: body.tenantId.trim(),
    role: body.role.trim(),
    redirectedPath: body.redirectedPath ?? '/',
    capturedAt: new Date().toISOString(),
  };

  const backendBase = process.env.TRACEBUD_BACKEND_URL?.replace(/\/$/, '');
  if (!backendBase) {
    console.info('[telemetry] gated-entry', telemetryEvent);
    return NextResponse.json({ ok: true, sink: 'local' }, { status: 202 });
  }

  try {
    const backendResponse = await fetch(`${backendBase}/v1/audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({
        eventType: telemetryEvent.eventType,
        deviceId: 'dashboard-web',
        payload: telemetryEvent,
      }),
    });
    const payload = await backendResponse.json().catch(() => ({ error: 'Backend telemetry request failed.' }));
    if (!backendResponse.ok) {
      return NextResponse.json(payload, { status: backendResponse.status });
    }
    return NextResponse.json({ ok: true, sink: 'backend' }, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to emit gated-entry telemetry.' },
      { status: 500 },
    );
  }
}
