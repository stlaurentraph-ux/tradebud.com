import {
  buildInsightsHubOgTemplateProps,
  INSIGHT_OG_SIZE,
  renderInsightOgImage,
} from '@/lib/insight-og-image';

export const size = INSIGHT_OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Tracebud Insights';
export const runtime = 'nodejs';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function InsightsHubOpenGraphImage({ params }: Props) {
  const { locale } = await params;

  return renderInsightOgImage(buildInsightsHubOgTemplateProps(locale));
}
