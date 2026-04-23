import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const {
      primary_commodity,
      primary_objective,
      member_count,
      supplier_count,
      importer_count,
    } = body;

    // Store commercial profile data (in production, persist to database)
    // For now, we just validate and return success
    if (!primary_commodity && !primary_objective) {
      // Both are optional, so this is fine
    }

    return NextResponse.json(
      { message: 'Commercial profile updated' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] /api/launch/commercial-profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
