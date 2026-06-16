const ANDROID_PACKAGE = process.env.ANDROID_PACKAGE?.trim() || 'com.tracebud.app';

export function GET() {
  const fingerprints =
    process.env.ANDROID_APP_LINK_SHA256?.split(',')
      .map((entry) => entry.trim())
      .filter(Boolean) ?? [];

  const body = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: ANDROID_PACKAGE,
        sha256_cert_fingerprints:
          fingerprints.length > 0
            ? fingerprints
            : [
                '00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00',
              ],
      },
    },
  ];

  return Response.json(body, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
