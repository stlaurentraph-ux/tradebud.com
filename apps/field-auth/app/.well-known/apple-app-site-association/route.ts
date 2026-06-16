const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID?.trim() || '6RT8K5RM6Z';
const IOS_BUNDLE_ID = process.env.IOS_BUNDLE_ID?.trim() || 'com.tracebud.app';

export function GET() {
  const body = {
    applinks: {
      apps: [],
      details: [
        {
          appID: `${APPLE_TEAM_ID}.${IOS_BUNDLE_ID}`,
          paths: ['/auth/callback', '/auth/callback/*', '/auth/confirm', '/auth/confirm/*'],
        },
      ],
    },
  };

  return Response.json(body, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
