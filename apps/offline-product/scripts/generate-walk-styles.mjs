import fs from 'fs';

const src = fs.readFileSync('features/mapping/WalkPerimeterScreen.tsx', 'utf8');
const m = src.match(/const styles = StyleSheet\.create\(\{([\s\S]*)\}\);\s*$/);
if (!m) {
  console.error('no match');
  process.exit(1);
}
let body = m[1];
const reps = [
  ['#111827', 'c.text'],
  ['#171717', 'c.text'],
  ['#121212', 'c.text'],
  ['#0F172A', 'c.text'],
  ['#3A3A3A', 'c.text'],
  ['#374151', 'c.text'],
  ['#1F2937', 'c.text'],
  ['#4B4B4B', 'c.textSecondary'],
  ['#4B5563', 'c.textSecondary'],
  ['#55514E', 'c.textSecondary'],
  ['#5F6670', 'c.textMuted'],
  ['#5D6672', 'c.textMuted'],
  ['#6B7280', 'c.textMuted'],
  ['#616161', 'c.textMuted'],
  ['#949494', 'c.textMuted'],
  ['#9CA3AF', 'c.textMuted'],
  ['#4A4340', 'c.textSecondary'],
  ['#6A6360', 'c.textMuted'],
  ['#FFFFFF', 'c.backgroundCard'],
  ['#FAFAFA', 'c.backgroundSecondary'],
  ['#F8F8F8', 'c.backgroundSecondary'],
  ['#F7F8FA', 'c.backgroundSecondary'],
  ['#E5E7EB', 'c.border'],
  ['#D5D9DD', 'c.border'],
  ['#DCDDDF', 'c.border'],
  ['#D4D8DD', 'c.border'],
  ['#D3D3D3', 'c.border'],
  ['#D2D2D2', 'c.border'],
  ['#D8DCE1', 'c.border'],
  ['#D1D5DB', 'c.chipBorder'],
  ['#0A7F59', 'c.link'],
  ['#0B4F3B', 'c.linkStrong'],
  ['#065F46', 'c.linkStrong'],
  ['#157E64', 'c.link'],
  ['#0B6E4F', 'c.link'],
  ['#0F8A64', 'c.link'],
  ['#0B5D48', 'c.link'],
  ['#0A8B63', 'c.link'],
  ['#ECF8F2', 'c.chipBackgroundActive'],
  ['#E6F7EF', 'c.chipBackgroundActive'],
  ['#DDEFE8', 'c.surfaceAccent'],
  ['#E9F5EE', 'c.surfaceAccent'],
  ['#F0FAF5', 'c.surfaceAccent'],
  ['#E8F7F0', 'c.surfaceAccent'],
  ['#F4FBF8', 'c.surfaceAccent'],
  ['#ECFDF5', 'c.surfaceAccent'],
  ['#AEE6D3', 'c.surfaceAccentBorder'],
  ['#B7E7D7', 'c.surfaceAccentBorder'],
  ['#A7F3D0', 'c.surfaceAccentBorder'],
  ['#D1FAE5', 'c.surfaceAccentBorder'],
  ['#7DDDC2', 'c.link'],
  ['#76D5B6', 'c.link'],
  ['#8FDCC2', 'c.dashedBorder'],
  ['#FFFBEB', 'c.surfaceWarning'],
  ['#FEF3C7', 'c.surfaceWarning'],
  ['#F7F3E6', 'c.surfaceAction'],
  ['#F7F2E6', 'c.surfaceAction'],
  ['#FDE68A', 'c.surfaceWarningBorder'],
  ['#FCD34D', 'c.surfaceWarningBorder'],
  ['#F2C94C', 'c.surfaceWarningBorder'],
  ['#EACB86', 'c.surfaceActionBorder'],
  ['#92400E', 'c.textWarning'],
  ['#B45309', 'c.textWarningStrong'],
  ['#78350F', 'c.textWarningStrong'],
  ['#7C2D12', 'c.textWarning'],
  ['#C05600', 'c.textWarningStrong'],
  ['#9A5F1A', 'c.textWarningStrong'],
  ['#7B4B12', 'c.textWarning'],
  ['#A35F00', 'c.textWarningStrong'],
  ['#A85900', 'c.textWarningStrong'],
  ['#ECECEE', 'c.storageTrack'],
  ['#DDF5EA', 'c.avatarBackground'],
  ['#DFF5EC', 'c.avatarBackground'],
  ['#CDEEDD', 'c.chipBackgroundActive'],
  ['#F7E7B7', 'c.surfaceWarning'],
  ['#F8EBC8', 'c.surfaceWarning'],
  ['#EFF6FF', 'c.backgroundSecondary'],
  ['#BFDBFE', 'c.border'],
  ['#F5F3FF', 'c.backgroundSecondary'],
  ['#DDD6FE', 'c.border'],
  ['#DCE7F7', 'c.backgroundSecondary'],
  ['#EADFF8', 'c.backgroundSecondary'],
  ['#EAF1FB', 'c.backgroundSecondary'],
  ['#C9D9EE', 'c.border'],
  ['#BDD1C8', 'c.storageTrack'],
  ['#B8CBC5', 'c.storageTrack'],
];
for (const [hex, token] of reps) {
  body = body.replaceAll(`'${hex}'`, token);
}
// Brand.primary references in stat labels
body = body.replaceAll('color: Brand.primary,', 'color: c.linkStrong,');
body = body.replaceAll('color: Brand.primaryDark,', 'color: c.linkStrong,');
const out = `import { StyleSheet } from 'react-native';

import { Brand } from '@/constants/theme';
import type { AppColors } from '@/features/theme/useThemedStyles';
import { scaleText } from '@/features/demo/storeUiScale';

export function createWalkPerimeterScreenStyles(c: AppColors) {
  return StyleSheet.create({${body}});
}
`;
fs.writeFileSync('features/mapping/walkPerimeterScreenStyles.ts', out);
console.log('written', out.length);
