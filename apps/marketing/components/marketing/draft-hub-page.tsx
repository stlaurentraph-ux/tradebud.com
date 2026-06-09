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
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          {content.eyebrow ? <p className="mb-2 text-sm uppercase">{content.eyebrow}</p> : null}
          <h1 className="mb-4 text-3xl font-bold">{content.title}</h1>
          <p className="mb-10 text-lg">{content.description}</p>

          <ul className="space-y-4">
            {content.links.map((link) => (
              <li key={link.href} className="border p-4">
                <h2 className="mb-1 text-xl font-semibold">
                  <Link href={`/${locale}${link.href}`}>{link.title}</Link>
                </h2>
                <p className="mb-2 text-sm">{link.description}</p>
                <Link href={`/${locale}${link.href}`} className="text-sm underline">
                  Read more →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </MarketingPageLayout>
  );
}
