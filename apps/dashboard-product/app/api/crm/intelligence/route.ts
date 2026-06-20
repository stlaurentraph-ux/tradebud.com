import { NextResponse } from 'next/server';
import { getPenetrationMetrics, refreshIcpScores } from '@/lib/founder-os-gtm-service';

export async function GET() {
  try { return NextResponse.json({ metrics: await getPenetrationMetrics() }); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 }); }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { action?: string };
  if (body.action !== 'refresh_icp') return NextResponse.json({ error: 'action must be refresh_icp' }, { status: 400 });
  try {
    const updated = await refreshIcpScores();
    return NextResponse.json({ updated, metrics: await getPenetrationMetrics() });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 });
  }
}
