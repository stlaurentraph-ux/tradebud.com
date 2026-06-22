import fs from 'fs';

function generateThemedStyles(sourcePath, exportName, outPath) {
  const src = fs.readFileSync(sourcePath, 'utf8');
  const m = src.match(/const styles = StyleSheet\.create\(\{([\s\S]*)\}\);\s*$/);
  if (!m) {
    console.error('no match in', sourcePath);
    process.exit(1);
  }
  let body = m[1];
  const reps = [
    ['#111827', 'c.text'],
    ['#171717', 'c.text'],
    ['#1F2937', 'c.text'],
    ['#374151', 'c.text'],
    ['#4B5563', 'c.textSecondary'],
    ['#6B7280', 'c.textMuted'],
    ['#9CA3AF', 'c.textMuted'],
    ['#FFFFFF', 'c.backgroundCard'],
    ['#FAFAFA', 'c.backgroundSecondary'],
    ['#F3F4F6', 'c.backgroundSecondary'],
    ['#F7F7F7', 'c.backgroundSecondary'],
    ['#F9FAFB', 'c.backgroundSecondary'],
    ['#E5E7EB', 'c.border'],
    ['#D9D9D9', 'c.border'],
    ['#FDE68A', 'c.surfaceWarningBorder'],
    ['#FFFBEB', 'c.surfaceWarning'],
    ['#F59E0B', 'c.warning'],
    ['#92400E', 'c.textWarning'],
    ['#B45309', 'c.textWarningStrong'],
    ['#047857', 'c.link'],
    ['#ECFDF5', 'c.surfaceAccent'],
    ['#F0F9FF', 'c.backgroundSecondary'],
    ['#BAE6FD', 'c.border'],
    ['#0369A1', 'c.tint'],
    ['#F2FBF7', 'c.surfaceAccent'],
    ['#0A7F59', 'c.link'],
  ];
  for (const [hex, token] of reps) {
    body = body.replaceAll(`'${hex}'`, token);
  }
  body = body.replaceAll('color: Brand.primary,', 'color: c.link,');
  body = body.replaceAll('color: Brand.primary', 'color: c.link');
  const out = `import { StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import type { AppColors } from '@/features/theme/useThemedStyles';

export function ${exportName}(c: AppColors) {
  return StyleSheet.create({${body}});
}
`;
  fs.writeFileSync(outPath, out);
  console.log('written', outPath);
}

generateThemedStyles(
  'app/data-sharing.tsx',
  'createDataSharingScreenStyles',
  'app/dataSharingScreenStyles.ts',
);
generateThemedStyles(
  'app/documents.tsx',
  'createDocumentsScreenStyles',
  'app/documentsScreenStyles.ts',
);
generateThemedStyles(
  'components/plot-photo-vault/GroundTruthPhotoCapture.tsx',
  'createGroundTruthPhotoCaptureStyles',
  'components/plot-photo-vault/groundTruthPhotoCaptureStyles.ts',
);
