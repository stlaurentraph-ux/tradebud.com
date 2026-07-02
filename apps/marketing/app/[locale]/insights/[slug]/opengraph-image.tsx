import { notFound } from 'next/navigation';

import { type Locale } from '@/i18n.config';
import {
  buildInsightArticleOgTemplateProps,
  INSIGHT_OG_SIZE,
  renderInsightOgImage,
} from '@/lib/insight-og-image';
import { getInsightPostBySlug } from '@/lib/insights';

export const size = INSIGHT_OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Tracebud Insights article';
export const runtime = 'nodejs';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateImageMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const post = getInsightPostBySlug(slug, locale as Locale, { includeDrafts: true });

  if (!post) {
    return [];
  }

  return [
    {
      alt: post.title,
      size,
      contentType,
    },
  ];
}

export default async function InsightArticleOpenGraphImage({ params }: Props) {
  const { locale, slug } = await params;
  const post = getInsightPostBySlug(slug, locale as Locale, { includeDrafts: true });

  if (!post) {
    notFound();
  }

  return renderInsightOgImage(
    buildInsightArticleOgTemplateProps({
      title: post.title,
      description: post.description,
      category: post.category,
      slug: post.slug,
      locale,
    }),
  );
}
