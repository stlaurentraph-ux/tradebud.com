import Image from 'next/image';
import Link from 'next/link';

import { MarketingPageLayout } from '@/components/marketing/marketing-page-layout';
import type { DraftHubContent } from '@/lib/marketing-draft-content';

const HERO_IMAGES: Record<string, string> = {
  impact:     '/images/placeholders/hero-impact.png',
  compliance: '/images/placeholders/hero-supply-chain.png',
  platform:   '/images/placeholders/hero-home.png',
};

type DraftHubPageProps = {
  content: DraftHubContent;
  locale: string;
};

export function DraftHubPage({ content, locale }: DraftHubPageProps) {
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
              className="absolute inset-0 -z-10 object-cover opacity-25"
              sizes="100vw"
              priority
            />
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-gradient-to-br from-[var(--forest-canopy)]/80 via-[var(--forest-canopy)]/85 to-[var(--forest-canopy)]"
            />
          </>
        ) : null}

        <div className="mx-auto max-w-5xl px-6 pb-28 pt-36 md:pt-44">
          <div className="max-w-2xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--data-emerald)]/30 bg-[var(--data-emerald)]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[var(--data-emerald)]">
              {content.eyebrow}
            </p>
            <h1 className="mb-6 text-balance text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
              {content.title}
            </h1>
            <p className="text-lg leading-relaxed text-white/75 md:text-xl">
              {content.description}
            </p>
          </div>
        </div>

        <div aria-hidden className="h-16 bg-gradient-to-b from-[var(--forest-canopy)] to-[var(--warm-stone)]" />
      </section>

      {/* ── Image strip ──────────────────────────────────────────────── */}
      {heroSrc ? (
        <div className="relative h-56 w-full overflow-hidden bg-[var(--warm-stone)] md:h-72">
          <Image
            src={heroSrc}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/25" />
        </div>
      ) : null}

      {/* ── Hub links grid ───────────────────────────────────────────── */}
      <section className="bg-[var(--warm-stone)] px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--data-emerald)]">
            In this section
          </p>
          <h2 className="mb-10 text-2xl font-bold text-[var(--forest-canopy)]">Explore topics</h2>

          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {content.links.map((link, index) => (
              <li key={link.href}>
                <Link
                  href={`/${locale}${link.href}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--warm-stone-dark)] bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* Emerald top strip */}
                  <div
                    aria-hidden
                    className="h-1.5 w-full bg-[var(--data-emerald)] opacity-50 transition-all duration-300 group-hover:opacity-100"
                  />

                  <div className="flex flex-1 flex-col p-7">
                    {/* Index number */}
                    <span
                      aria-hidden
                      className="mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--warm-stone)] text-sm font-bold tabular-nums text-[var(--forest-canopy)] ring-1 ring-[var(--warm-stone-dark)]"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <h3 className="mb-2 text-lg font-bold text-[var(--forest-canopy)] transition-colors group-hover:text-[var(--forest-light)]">
                      {link.title}
                    </h3>
                    {link.description ? (
                      <p className="mb-6 flex-1 text-sm leading-relaxed text-gray-500">
                        {link.description}
                      </p>
                    ) : null}

                    <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--data-emerald)]">
                      Explore
                      <span
                        aria-hidden
                        className="transition-transform duration-200 group-hover:translate-x-0.5"
                      >
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

    </MarketingPageLayout>
  );
}
