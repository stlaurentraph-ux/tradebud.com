import { NextRequest, NextResponse } from 'next/server';

// Mock user storage (in production, use a real database)
const mockUsers: Record<string, { email: string; password: string; fullName: string; token: string }> = {};
const tokenMap: Record<string, string> = {};

function generateToken(): string {
  return `token_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stage, email, password, full_name, organization_name, country, primary_role } = body;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';

    // Stage 1: Create account
    if (stage === 'create_account') {
      if (!email || !password || !full_name) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      if (password.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 }
        );
      }

      if (mockUsers[email]) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        );
      }

      const newToken = generateToken();
      mockUsers[email] = {
        email,
        password,
        fullName: full_name,
        token: newToken,
      };
      tokenMap[newToken] = email;

      return NextResponse.json(
        { access_token: newToken },
        { status: 201 }
      );
    }

    // Stage 2: Workspace setup
    if (stage === 'workspace_setup') {
      if (!token || !tokenMap[token]) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      if (!organization_name || !country || !primary_role) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Store workspace data with the user
      const email = tokenMap[token];
      const user = mockUsers[email];
      if (user) {
        (user as any).organizationName = organization_name;
        (user as any).country = country;
        (user as any).primaryRole = primary_role;
      }

      return NextResponse.json(
        { message: 'Workspace setup completed' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid stage' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API] /api/auth/signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
