import { NextResponse } from 'next/server';
import { createObjection, listObjections } from '@/lib/founder-os-gtm-service';

export async function GET() {
  try { return NextResponse.json({ objections: await listObjections() }); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 }); }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { category?: string; objection_text?: string; response_text?: string };
  if (!body.category || !body.objection_text) return NextResponse.json({ error: 'category and objection_text required' }, { status: 400 });
  try { return NextResponse.json({ objection: await createObjection(body as Parameters<typeof createObjection>[0]) }); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 }); }
}
