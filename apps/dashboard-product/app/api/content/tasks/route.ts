import { NextResponse } from 'next/server';
import { createContentTask, listContentTasks, updateContentTaskStatus } from '@/lib/content-service';

type TaskStatus = 'open' | 'in_progress' | 'done' | 'missed';

export async function GET() {
  try {
    const tasks = await listContentTasks();
    return NextResponse.json({ tasks });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load content tasks.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    id?: string;
    status?: TaskStatus;
    task_type?: string;
    due_date?: string;
    notes?: string;
  };

  if (body.id && body.status) {
    try {
      const task = await updateContentTaskStatus(body.id, body.status);
      return NextResponse.json({ task });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to update content task.' },
        { status: 500 }
      );
    }
  }

  if (!body.task_type) {
    return NextResponse.json({ error: 'task_type is required to create a task.' }, { status: 400 });
  }

  try {
    const task = await createContentTask({
      task_type: body.task_type,
      due_date: body.due_date,
      notes: body.notes,
      status: body.status,
    });
    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update content task.' },
      { status: 500 }
    );
  }
}
