import Link from 'next/link';

import { MarketingPageLayout } from '@/components/marketing/marketing-page-layout';
import type { DraftPageContent } from '@/lib/marketing-draft-content';

type DraftContentPageProps = {
  content: DraftPageContent;
  locale: string;
};

export function DraftContentPage({ content, locale }: DraftContentPageProps) {
  return (
    <MarketingPageLayout routeId={content.routeId}>
      {/* Page hero */}
      <section className="bg-[var(--forest-canopy)] px-6 pb-20 pt-28 md:pt-36">
        <div className="mx-auto max-w-3xl">
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

      {/* Body sections */}
      <article className="bg-[var(--warm-stone)] px-6 py-16">
        <div className="mx-auto max-w-3xl space-y-8">
          {content.sections.map((section) => (
            <section
              key={section.heading}
              className="rounded-2xl border border-[var(--warm-stone-dark)] bg-white p-8 shadow-sm"
            >
              <h2 className="mb-3 text-xl font-bold text-[var(--forest-canopy)]">
                {section.heading}
              </h2>
              <p className="mb-4 leading-relaxed text-gray-600">{section.body}</p>
              {section.bullets?.length ? (
                <ul className="space-y-2">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3 text-gray-700">
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--data-emerald)]"
                        aria-hidden
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </article>

      {/* Related links */}
      {content.relatedLinks?.length ? (
        <aside className="border-t border-[var(--warm-stone-dark)] bg-white px-6 py-14">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-[var(--forest-canopy)]">
              Related
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.relatedLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={`/${locale}${link.href}`}
                    className="group flex flex-col rounded-xl border border-[var(--warm-stone-dark)] bg-[var(--warm-stone)] p-5 transition-shadow hover:shadow-md"
                  >
                    <span className="mb-1 font-semibold text-[var(--forest-canopy)] group-hover:text-[var(--forest-light)]">
                      {link.title}
                    </span>
                    {link.description ? (
                      <span className="text-sm text-gray-500">{link.description}</span>
                    ) : null}
                    <span
                      className="mt-3 text-sm font-medium text-[var(--data-emerald)]"
                      aria-hidden
                    >
                      Read more →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      ) : null}
    </MarketingPageLayout>
  );
}
