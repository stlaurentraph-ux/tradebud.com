import { NextResponse } from 'next/server';
import { createMarket, listMarkets } from '@/lib/founder-os-gtm-service';

export async function GET() {
  try { return NextResponse.json({ markets: await listMarkets() }); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 }); }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, string>;
  if (!body.country_code || !body.country_name || !body.commodity || !body.segment) {
    return NextResponse.json({ error: 'country_code, country_name, commodity, segment required' }, { status: 400 });
  }
  try { return NextResponse.json({ market: await createMarket(body as Parameters<typeof createMarket>[0]) }); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 }); }
}
