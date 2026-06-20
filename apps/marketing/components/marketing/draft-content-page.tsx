import Image from 'next/image';
import Link from 'next/link';

import { MarketingPageLayout } from '@/components/marketing/marketing-page-layout';
import type { DraftPageContent } from '@/lib/marketing-draft-content';

// Hero image per routeId — extend as new content pages are added
const HERO_IMAGES: Record<string, string> = {
  'impact-supply-chains':       '/images/placeholders/hero-supply-chain.png',
  'impact-farmer-livelihood':   '/images/placeholders/hero-farmer.png',
  'impact-climate-biodiversity':'/images/placeholders/hero-forest.png',
  'platform-field-app':     '/images/placeholders/platform-field-app.png',
  'platform-dashboard':     '/images/placeholders/platform-dashboard.png',
  'compliance-eudr':        '/images/placeholders/hero-supply-chain.png',
  'compliance-due-diligence': '/images/placeholders/section-paths.png',
  'compliance-guides':      '/images/placeholders/hero-insights.png',
  'compliance-security':    '/images/placeholders/hero-home.png',
};

type DraftContentPageProps = {
  content: DraftPageContent;
  locale: string;
  /** Optional override — takes precedence over the HERO_IMAGES lookup. */
  heroImage?: string;
  /** Optional breadcrumb back-link — hub href and label. */
  hubHref?: string;
  hubLabel?: string;
};

export function DraftContentPage({ content, locale, heroImage, hubHref, hubLabel }: DraftContentPageProps) {
  const heroSrc = heroImage ?? HERO_IMAGES[content.routeId] ?? null;

  return (
    <MarketingPageLayout routeId={content.routeId}>

      {/* ── Hero — split: text left, image right ──────────────────────── */}
      <section className="relative isolate overflow-hidden bg-[var(--forest-canopy)]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 px-6 pt-28 md:pt-36 lg:grid-cols-2">

          {/* Left: text */}
          <div className="flex flex-col justify-center pb-20 pr-0 pt-8 lg:pb-28 lg:pr-16">
            {/* Breadcrumb */}
            {hubHref && hubLabel ? (
              <Link
                href={hubHref}
                className="mb-5 inline-flex w-fit items-center gap-1.5 text-xs font-medium text-white/50 transition-colors hover:text-white/80"
              >
                <span aria-hidden className="text-[10px]">←</span>
                {hubLabel}
              </Link>
            ) : null}

            {content.eyebrow ? (
              <p className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--data-emerald)]/30 bg-[var(--data-emerald)]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[var(--data-emerald)]">
                {content.eyebrow}
              </p>
            ) : null}
            <h1 className="mb-6 text-balance text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
              {content.title}
            </h1>
            <p className="text-lg leading-relaxed text-white/70 md:text-xl">
              {content.description}
            </p>
          </div>

          {/* Right: hero image */}
          {heroSrc ? (
            <div className="relative -mx-6 mt-10 h-56 overflow-hidden lg:mx-0 lg:mt-0 lg:h-auto lg:rounded-tl-3xl">
              <Image
                src={heroSrc}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-r from-[var(--forest-canopy)] via-[var(--forest-canopy)]/10 to-transparent lg:bg-gradient-to-r"
              />
            </div>
          ) : null}
        </div>
      </section>

      {/* ── Body sections ────────────────────────────────────────────── */}
      <article className="bg-[var(--warm-stone)] px-6 py-20">
        <div className="mx-auto max-w-3xl">

          {content.sections.map((section, i) => (
            <div key={section.heading} className="group mb-0">
              {/* Numbered row */}
              <div className="flex gap-6">
                {/* Left gutter — number + connector line */}
                <div className="flex flex-col items-center">
                  <span
                    aria-hidden
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--data-emerald)]/10 text-xs font-bold tabular-nums text-[var(--data-emerald)] ring-1 ring-[var(--data-emerald)]/25"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {/* Connector line — not shown after last item */}
                  {i < content.sections.length - 1 ? (
                    <div aria-hidden className="mt-2 w-px flex-1 bg-[var(--warm-stone-dark)]" />
                  ) : null}
                </div>

                {/* Content */}
                <div className={`pb-10 pt-0.5 flex-1 ${i < content.sections.length - 1 ? 'mb-0' : ''}`}>
                  <h2 className="mb-3 text-xl font-bold leading-snug text-[var(--forest-canopy)]">
                    {section.heading}
                  </h2>
                  <p className="mb-5 leading-relaxed text-gray-600">{section.body}</p>

                  {section.bullets?.length ? (
                    <ul className="space-y-2.5">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-3 text-sm text-gray-700">
                          <span
                            aria-hidden
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--data-emerald)]"
                          />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </article>

      {/* ── Related links ────────────────────────────────────────────── */}
      {content.relatedLinks?.length ? (
        <aside className="bg-[var(--forest-canopy)] px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--data-emerald)]">
              Continue exploring
            </p>
            <h2 className="mb-10 text-2xl font-bold text-white">Related pages</h2>

            <ul className="grid gap-5 sm:grid-cols-2">
              {content.relatedLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={`/${locale}${link.href}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-white/20"
                  >
                    <div aria-hidden className="h-1 w-full bg-[var(--data-emerald)] opacity-60 transition-opacity group-hover:opacity-100" />
                    <div className="flex flex-1 flex-col p-6">
                      <span className="mb-2 font-bold text-white group-hover:text-[var(--data-emerald)]">
                        {link.title}
                      </span>
                      {link.description ? (
                        <span className="mb-5 flex-1 text-sm leading-relaxed text-white/60">
                          {link.description}
                        </span>
                      ) : null}
                      <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-[var(--data-emerald)]">
                        Read more <span aria-hidden>→</span>
                      </span>
                    </div>
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
