import Link from 'next/link';

import { MarketingPageLayout } from '@/components/marketing/marketing-page-layout';
import type { DraftHubContent } from '@/lib/marketing-draft-content';

type DraftHubPageProps = {
  content: DraftHubContent;
  locale: string;
};

export function DraftHubPage({ content, locale }: DraftHubPageProps) {
  return (
    <MarketingPageLayout routeId={content.routeId}>
      {/* Hub hero */}
      <section className="bg-[var(--forest-canopy)] px-6 pb-20 pt-28 md:pt-36">
        <div className="mx-auto max-w-4xl">
          {content.eyebrow ? (
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--data-emerald)]">
              {content.eyebrow}
            </p>
          ) : null}
          <h1 className="mb-5 text-4xl font-bold leading-tight text-white text-balance md:text-5xl">
            {content.title}
          </h1>
          <p className="text-lg leading-relaxed text-white/80 md:text-xl">{content.description}</p>
        </div>
      </section>

      {/* Hub links grid */}
      <section className="bg-[var(--warm-stone)] px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <ul className="grid gap-6 sm:grid-cols-2">
            {content.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={`/${locale}${link.href}`}
                  className="group flex h-full flex-col rounded-2xl border border-[var(--warm-stone-dark)] bg-white p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <h2 className="mb-2 text-xl font-bold text-[var(--forest-canopy)] group-hover:text-[var(--forest-light)]">
                    {link.title}
                  </h2>
                  <p className="mb-6 flex-1 leading-relaxed text-gray-600">{link.description}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--data-emerald)]">
                    Explore
                    <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </MarketingPageLayout>
  );
}
