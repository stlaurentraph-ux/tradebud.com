import type { Metadata } from 'next';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';

import { MarketingPageLayout } from '@/components/marketing/marketing-page-layout';
import type { Locale } from '@/i18n.config';
import { getInsightPosts } from '@/lib/insights';
import { assertMarketingRoutePublished } from '@/lib/marketing-publication';
import {
  getSiteMapSectionsWithEntries,
  siteMapStatusLabels,
  type SiteMapPageStatus,
} from '@/lib/marketing-site-map';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Site map for v0 | Tracebud',
    robots: { index: false, follow: false },
  };
}

function statusClass(status: SiteMapPageStatus): string {
  switch (status) {
    case 'live-styled':
      return 'bg-emerald-100 text-emerald-900';
    case 'draft-needs-style':
      return 'bg-amber-100 text-amber-900';
    case 'preview-assembly':
      return 'bg-sky-100 text-sky-900';
    case 'legal':
      return 'bg-gray-100 text-gray-700';
  }
}

export default async function DraftIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await assertMarketingRoutePublished('draft-index');

  const sections = getSiteMapSectionsWithEntries();
  const insights = getInsightPosts(locale as Locale, { includeDrafts: true });

  return (
    <MarketingPageLayout routeId="draft-index">
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-2 text-3xl font-bold">Marketing site map (v0 handoff)</h1>
          <p className="mb-4 text-lg">
            Full information architecture — live styled pages and new draft routes. Use this index
            while designing in v0. Public nav stays unchanged until Stage B.
          </p>
          <p className="mb-10 text-sm">
            <Link href={`/${locale}/preview`} className="underline">
              Homepage preview →
            </Link>
            {' · '}
            See <code className="text-xs">apps/marketing/V0_HANDOFF.md</code> for v0 instructions.
          </p>

          {sections.map((section) => (
            <div key={section.id} className="mb-10">
              <h2 className="mb-1 text-xl font-semibold">{section.label}</h2>
              <p className="mb-4 text-sm text-gray-600">{section.description}</p>
              <ul className="space-y-3">
                {section.entries.map((entry) => (
                  <li key={entry.id} className="border p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Link href={`/${locale}${entry.href}`} className="font-medium underline">
                        {entry.label}
                      </Link>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${statusClass(entry.status)}`}
                      >
                        {siteMapStatusLabels[entry.status]}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-gray-500">/{locale}{entry.href}</p>
                    {entry.v0Notes ? (
                      <p className="mt-2 text-sm text-gray-600">{entry.v0Notes}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="mb-4">
            <h2 className="mb-1 text-xl font-semibold">Insights articles</h2>
            <p className="mb-4 text-sm text-gray-600">
              Markdown in <code className="text-xs">content/insights/</code> — style hub + article
              template.
            </p>
            <ul className="space-y-2">
              {insights.map((post) => (
                <li key={post.slug}>
                  <Link href={`/${locale}/insights/${post.slug}`} className="underline">
                    {post.title}
                  </Link>
                  <span className="ml-2 text-xs text-gray-500">({post.category})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </MarketingPageLayout>
  );
}
