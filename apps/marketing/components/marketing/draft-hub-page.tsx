import Image from 'next/image';
import Link from 'next/link';

import { MarketingPageLayout } from '@/components/marketing/marketing-page-layout';
import type { DraftHubContent } from '@/lib/marketing-draft-content';

const HERO_IMAGES: Record<string, string> = {
  impact:     '/images/placeholders/hero-impact.png',
  compliance: '/images/placeholders/hero-supply-chain.png',
  platform:   '/images/placeholders/hero-home.png',
};

// Per-link image so every hub card has a distinct visual
const LINK_IMAGES: Record<string, string> = {
  'impact-smallholders':      '/images/placeholders/hero-farmer.png',
  'impact-forests':           '/images/placeholders/hero-forest.png',
  'impact-supply-chains':     '/images/placeholders/hero-supply-chain.png',
  'platform-offline-mapping': '/images/placeholders/section-resilience.png',
  'platform-ai-verification': '/images/placeholders/hero-forest.png',
  'platform-network':         '/images/placeholders/hero-home.png',
  'platform-integrations':    '/images/placeholders/hero-supply-chain.png',
  'compliance-eudr':          '/images/placeholders/hero-supply-chain.png',
  'compliance-due-diligence': '/images/placeholders/section-paths.png',
  'compliance-guides':        '/images/placeholders/hero-insights.png',
  'compliance-security':      '/images/placeholders/hero-home.png',
};

type DraftHubPageProps = {
  content: DraftHubContent;
  locale: string;
};

export function DraftHubPage({ content, locale }: DraftHubPageProps) {
  const heroSrc = HERO_IMAGES[content.routeId] ?? '/images/placeholders/hero-impact.png';

  return (
    <MarketingPageLayout routeId={content.routeId}>

      {/* ── Hero — split layout: text left, image right ───────────────── */}
      <section className="relative isolate overflow-hidden bg-[var(--forest-canopy)]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 px-6 pt-28 md:pt-36 lg:grid-cols-2">

          {/* Left: text */}
          <div className="flex flex-col justify-center pb-20 pr-0 pt-8 lg:pb-28 lg:pr-16">
            <p className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--data-emerald)]/30 bg-[var(--data-emerald)]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[var(--data-emerald)]">
              {content.eyebrow}
            </p>
            <h1 className="mb-6 text-balance text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
              {content.title}
            </h1>
            <p className="text-lg leading-relaxed text-white/70 md:text-xl">
              {content.description}
            </p>
          </div>

          {/* Right: hero image — bleeds to edge on desktop */}
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
        </div>
      </section>

      {/* ── Hub cards ────────────────────────────────────────────────── */}
      <section className="bg-[var(--warm-stone)] px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--data-emerald)]">
            In this section
          </p>
          <h2 className="mb-10 text-2xl font-bold text-[var(--forest-canopy)]">Explore topics</h2>

          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {content.links.map((link) => {
              const imgSrc = LINK_IMAGES[link.routeId];
              return (
                <li key={link.href}>
                  <Link
                    href={`/${locale}${link.href}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--warm-stone-dark)] bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                  >
                    {/* Card image */}
                    {imgSrc ? (
                      <div className="relative h-40 w-full overflow-hidden">
                        <Image
                          src={imgSrc}
                          alt=""
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      </div>
                    ) : (
                      <div className="h-1.5 w-full bg-[var(--data-emerald)]" aria-hidden />
                    )}

                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="mb-2 font-bold text-[var(--forest-canopy)] transition-colors group-hover:text-[var(--forest-light)]">
                        {link.title}
                      </h3>
                      {link.description ? (
                        <p className="mb-5 flex-1 text-sm leading-relaxed text-gray-500">
                          {link.description}
                        </p>
                      ) : null}

                      <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--data-emerald)]">
                        Explore
                        <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">
                          →
                        </span>
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

    </MarketingPageLayout>
  );
}
