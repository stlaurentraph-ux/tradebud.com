import { NextResponse } from 'next/server';

export async function GET() {
  const tokenConfigured = Boolean(process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN?.trim());
  return NextResponse.json({
    tokenConfigured,
    tokenVersion: process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN_VERSION?.trim() || null,
    defaultStaleMinutes: 60,
    defaultLimit: 100,
  });
}
