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
      <article className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          {content.eyebrow ? <p className="mb-2 text-sm uppercase">{content.eyebrow}</p> : null}
          <h1 className="mb-4 text-3xl font-bold">{content.title}</h1>
          <p className="mb-10 text-lg">{content.description}</p>

          <div className="space-y-8">
            {content.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="mb-2 text-xl font-semibold">{section.heading}</h2>
                <p className="mb-3">{section.body}</p>
                {section.bullets?.length ? (
                  <ul className="list-disc space-y-1 pl-6">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          {content.relatedLinks?.length ? (
            <aside className="mt-12 border-t pt-8">
              <h2 className="mb-4 text-lg font-semibold">Related</h2>
              <ul className="space-y-2">
                {content.relatedLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={`/${locale}${link.href}`} className="underline">
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      </article>
    </MarketingPageLayout>
  );
}
