import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

type WhyTracebudBlockProps = {
  locale: string;
};

export async function WhyTracebudBlock({ locale }: WhyTracebudBlockProps) {
  const t = await getTranslations('homeV2.whyTracebud');
  const items = ['captureOnce', 'offline', 'sovereignty', 'identity', 'network'] as const;

  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-5xl">

        {/* Two-column layout: text left, image right */}
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">

          {/* Left: heading + principles list */}
          <div className="flex-1">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--data-emerald)]">
              Principles
            </p>
            <h2 className="mb-4 text-balance text-3xl font-bold text-[var(--forest-canopy)] md:text-4xl">
              {t('title')}
            </h2>
            <p className="mb-10 text-lg leading-relaxed text-gray-500">{t('description')}</p>

            <ol className="space-y-5">
              {items.map((key, index) => (
                <li key={key} className="flex items-start gap-4">
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--warm-stone)] text-sm font-bold text-[var(--forest-canopy)] ring-1 ring-[var(--warm-stone-dark)]"
                  >
                    {index + 1}
                  </span>
                  <div className="pt-0.5">
                    <span className="font-semibold text-[var(--forest-canopy)]">
                      {t(`items.${key}.title`)}
                    </span>
                    <span className="text-gray-400"> — </span>
                    <span className="text-gray-600">{t(`items.${key}.description`)}</span>
                  </div>
                </li>
              ))}
            </ol>

            <Link
              href={`/${locale}/why-tracebud`}
              className="mt-10 inline-flex items-center gap-1.5 font-semibold text-[var(--data-emerald)] hover:underline"
            >
              {t('readMore')} →
            </Link>
          </div>

          {/* Right: placeholder image */}
          <div className="relative h-72 w-full overflow-hidden rounded-2xl shadow-md lg:h-auto lg:w-80 lg:min-h-[420px] flex-shrink-0">
            <Image
              src="/images/placeholders/section-resilience.png"
              alt="Farmer using Tracebud on a smartphone in the field"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 320px"
            />
            {/* Caption overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-5">
              <p className="text-xs font-medium text-white/80">
                Captured once — reused everywhere
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
