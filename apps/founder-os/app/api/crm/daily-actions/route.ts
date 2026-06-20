import { NextResponse } from 'next/server';
import { ensureDailyOutreachActions, listDailyActions, listDailyActionsHistory, markDailyActionComplete } from '@/lib/crm-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const actionDate = searchParams.get('date') ?? undefined;
  const historyDaysRaw = searchParams.get('historyDays');
  const historyDays = historyDaysRaw ? Number(historyDaysRaw) : null;

  try {
    if (historyDays && Number.isFinite(historyDays) && historyDays > 0) {
      const actions = await listDailyActionsHistory(historyDays);
      return NextResponse.json({ actions });
    }
    const actions = await listDailyActions(actionDate);
    return NextResponse.json({ actions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load daily actions.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { id?: string; date?: string; target?: number };
  if (!body.id && !body.date) {
    return NextResponse.json({ error: 'id is required to update or date is required to bootstrap.' }, { status: 400 });
  }

  if (!body.id && body.date) {
    try {
      const actions = await ensureDailyOutreachActions(body.date, body.target ?? 3);
      return NextResponse.json({ actions });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to bootstrap daily actions.' },
        { status: 500 }
      );
    }
  }

  try {
    const action = await markDailyActionComplete(body.id as string);
    return NextResponse.json({ action });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update action.' },
      { status: 500 }
    );
  }
}
