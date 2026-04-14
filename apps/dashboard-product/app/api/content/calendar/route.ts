import { NextResponse } from 'next/server';
import { createContentCalendarItem, ensureWeeklyPostPlan, listContentCalendar } from '@/lib/content-service';

export async function GET() {
  try {
    const items = await listContentCalendar();
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load content calendar.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    channel?: string;
    pillar?: string;
    hook?: string;
    scheduled_at?: string;
    weekDate?: string;
    weeklyTarget?: number;
  };
  if (!body.channel && body.weekDate) {
    try {
      const items = await ensureWeeklyPostPlan(body.weekDate, body.weeklyTarget ?? 2);
      return NextResponse.json({ items });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to bootstrap weekly content plan.' },
        { status: 500 }
      );
    }
  }

  if (!body.channel) {
    return NextResponse.json({ error: 'channel is required.' }, { status: 400 });
  }

  try {
    const item = await createContentCalendarItem({
      channel: body.channel,
      pillar: body.pillar,
      hook: body.hook,
      scheduled_at: body.scheduled_at,
    });
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create content item.' },
      { status: 500 }
    );
  }
}
