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

function statusVariant(status: SiteMapPageStatus): { pill: string; dot: string } {
  switch (status) {
    case 'live-styled':
      return {
        pill: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200',
        dot: 'bg-[var(--data-emerald)]',
      };
    case 'draft-needs-style':
      return {
        pill: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
        dot: 'bg-amber-400',
      };
    case 'preview-assembly':
      return {
        pill: 'bg-sky-50 text-sky-800 ring-1 ring-sky-200',
        dot: 'bg-sky-400',
      };
    case 'legal':
      return {
        pill: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
        dot: 'bg-gray-400',
      };
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
      {/* Header */}
      <section className="bg-[var(--forest-canopy)] px-6 pb-16 pt-28 md:pt-36">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--data-emerald)]">
            v0 handoff
          </p>
          <h1 className="mb-4 text-4xl font-bold text-white text-balance md:text-5xl">
            Marketing site map
          </h1>
          <p className="mb-6 text-lg leading-relaxed text-white/80">
            Full information architecture — live styled pages and new draft routes. Use this index
            while designing in v0. Public nav stays unchanged until Stage B.
          </p>
          <Link
            href={`/${locale}/preview`}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 transition-colors hover:bg-white/20"
          >
            Homepage preview →
          </Link>
        </div>
      </section>

      {/* Legend */}
      <div className="border-b border-[var(--warm-stone-dark)] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-4">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Legend</span>
          {(['live-styled', 'draft-needs-style', 'preview-assembly', 'legal'] as SiteMapPageStatus[]).map(
            (s) => {
              const v = statusVariant(s);
              return (
                <span key={s} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${v.pill}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${v.dot}`} aria-hidden />
                  {siteMapStatusLabels[s]}
                </span>
              );
            },
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="bg-[var(--warm-stone)] px-6 py-12">
        <div className="mx-auto max-w-4xl space-y-12">
          {sections.map((section) => (
            <div key={section.id}>
              <div className="mb-5">
                <h2 className="text-xl font-bold text-[var(--forest-canopy)]">{section.label}</h2>
                <p className="mt-1 text-sm text-gray-500">{section.description}</p>
              </div>
              <ul className="space-y-3">
                {section.entries.map((entry) => {
                  const v = statusVariant(entry.status);
                  return (
                    <li
                      key={entry.id}
                      className="flex flex-col gap-2 rounded-xl border border-[var(--warm-stone-dark)] bg-white p-5 sm:flex-row sm:items-start"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/${locale}${entry.href}`}
                            className="font-semibold text-[var(--forest-canopy)] hover:text-[var(--forest-light)] hover:underline"
                          >
                            {entry.label}
                          </Link>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${v.pill}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${v.dot}`} aria-hidden />
                            {siteMapStatusLabels[entry.status]}
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-xs text-gray-400">
                          /{locale}{entry.href}
                        </p>
                        {entry.v0Notes ? (
                          <p className="mt-2 text-sm text-gray-500">{entry.v0Notes}</p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Insights articles */}
          <div>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-[var(--forest-canopy)]">Insights articles</h2>
              <p className="mt-1 text-sm text-gray-500">
                Markdown in{' '}
                <code className="rounded bg-[var(--warm-stone-dark)] px-1 py-0.5 text-xs font-mono">
                  content/insights/
                </code>{' '}
                — style hub + article template.
              </p>
            </div>
            <ul className="space-y-2">
              {insights.map((post) => (
                <li key={post.slug} className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--data-emerald)] shrink-0" aria-hidden />
                  <Link
                    href={`/${locale}/insights/${post.slug}`}
                    className="font-medium text-[var(--forest-canopy)] hover:text-[var(--forest-light)] hover:underline"
                  >
                    {post.title}
                  </Link>
                  <span className="text-xs text-gray-400">({post.category})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </MarketingPageLayout>
  );
}
