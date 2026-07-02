import { buildInsightBlogPostingJsonLd } from '@/lib/insight-seo';
import type { InsightPost } from '@/lib/insights';

type InsightArticleJsonLdProps = {
  post: InsightPost;
  locale: string;
};

export function InsightArticleJsonLd({ post, locale }: InsightArticleJsonLdProps) {
  const jsonLd = buildInsightBlogPostingJsonLd(post, locale);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
