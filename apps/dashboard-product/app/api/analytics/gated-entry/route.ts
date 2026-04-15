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
    const backendResponse = await fetch(`${backendBase}/v1/audit/gated-entry`, {
      cache: 'no-store',
      headers: authHeader ? { Authorization: authHeader } : undefined,
    });
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
