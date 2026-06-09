import Image from 'next/image';
import Link from 'next/link';

import { MarketingPageLayout } from '@/components/marketing/marketing-page-layout';
import type { DraftPageContent } from '@/lib/marketing-draft-content';

// Hero image per routeId — extend as new content pages are added
const HERO_IMAGES: Record<string, string> = {
  'impact-smallholders':  '/images/placeholders/hero-farmer.png',
  'impact-forests':       '/images/placeholders/hero-forest.png',
  'impact-supply-chains': '/images/placeholders/hero-supply-chain.png',
};

type DraftContentPageProps = {
  content: DraftPageContent;
  locale: string;
};

export function DraftContentPage({ content, locale }: DraftContentPageProps) {
  const heroSrc = HERO_IMAGES[content.routeId] ?? null;

  return (
    <MarketingPageLayout routeId={content.routeId}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-[var(--forest-canopy)]">
        {heroSrc ? (
          <>
            <Image
              src={heroSrc}
              alt=""
              fill
              className="absolute inset-0 -z-10 object-cover opacity-30"
              sizes="100vw"
              priority
            />
            {/* Two-stop dark overlay so text is always legible */}
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-gradient-to-b from-[var(--forest-canopy)]/70 via-[var(--forest-canopy)]/85 to-[var(--forest-canopy)]"
            />
          </>
        ) : null}

        <div className="mx-auto max-w-5xl px-6 pb-24 pt-36 md:pt-44">
          <div className="max-w-2xl">
            {content.eyebrow ? (
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--data-emerald)]/30 bg-[var(--data-emerald)]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[var(--data-emerald)]">
                {content.eyebrow}
              </p>
            ) : null}

            <h1 className="mb-6 text-balance text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
              {content.title}
            </h1>
            <p className="text-lg leading-relaxed text-white/75 md:text-xl">
              {content.description}
            </p>
          </div>
        </div>

        {/* Wave / fade into warm-stone body */}
        <div aria-hidden className="h-16 bg-gradient-to-b from-[var(--forest-canopy)] to-[var(--warm-stone)]" />
      </section>

      {/* ── Full-width image strip (only when a hero image exists) ────── */}
      {heroSrc ? (
        <div className="relative h-64 w-full overflow-hidden bg-[var(--warm-stone)] md:h-80">
          <Image
            src={heroSrc}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
        </div>
      ) : null}

      {/* ── Body sections ────────────────────────────────────────────── */}
      <article className="bg-[var(--warm-stone)] px-6 py-16">
        <div className="mx-auto max-w-3xl space-y-8">
          {content.sections.map((section, i) => (
            <section
              key={section.heading}
              className="group rounded-2xl border border-[var(--warm-stone-dark)] bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Number + heading */}
              <div className="mb-5 flex items-start gap-4">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--data-emerald)]/10 text-xs font-bold tabular-nums text-[var(--data-emerald)] ring-1 ring-[var(--data-emerald)]/25"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2 className="text-xl font-bold leading-snug text-[var(--forest-canopy)]">
                  {section.heading}
                </h2>
              </div>

              <p className="mb-5 leading-relaxed text-gray-600">{section.body}</p>

              {section.bullets?.length ? (
                <ul className="space-y-3 border-t border-[var(--warm-stone-dark)] pt-5">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3 text-sm text-gray-700">
                      <span
                        aria-hidden
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--data-emerald)]"
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
                    {/* Colour bar */}
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
