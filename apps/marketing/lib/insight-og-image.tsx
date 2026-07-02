import { ImageResponse } from 'next/og';

import { getInsightCategoryLabel } from '@/lib/insights';
import { MARKETING_SITE_ORIGIN } from '@/lib/marketing-site-url';

export const INSIGHT_OG_SIZE = {
  width: 1200,
  height: 630,
} as const;

const FOREST_CANOPY = '#064E3B';
const FOREST_DARK = '#022c22';
const DATA_EMERALD = '#10B981';
const MINT_GLOW = '#D1FAE5';

type InsightOgTemplateProps = {
  title: string;
  description: string;
  categoryLabel: string;
  eyebrow?: string;
  footer?: string;
};

let interBoldPromise: Promise<ArrayBuffer> | null = null;
let interRegularPromise: Promise<ArrayBuffer> | null = null;

async function loadGoogleFont(weight: 400 | 700): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&display=swap`;
  const css = await (await fetch(url)).text();
  const match = css.match(/src: url\((.+)\) format\('(?:opentype|truetype)'\)/);

  if (!match?.[1]) {
    throw new Error(`Failed to load Inter ${weight} for insight OG image`);
  }

  const response = await fetch(match[1]);
  if (!response.ok) {
    throw new Error(`Failed to fetch Inter ${weight} for insight OG image`);
  }

  return response.arrayBuffer();
}

async function getOgFonts() {
  if (!interBoldPromise) {
    interBoldPromise = loadGoogleFont(700);
  }
  if (!interRegularPromise) {
    interRegularPromise = loadGoogleFont(400);
  }

  const [bold, regular] = await Promise.all([interBoldPromise, interRegularPromise]);
  return [
    { name: 'Inter', data: bold, weight: 700 as const, style: 'normal' as const },
    { name: 'Inter', data: regular, weight: 400 as const, style: 'normal' as const },
  ];
}

function truncateText(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

export function buildInsightArticleOgTemplateProps(post: {
  title: string;
  description: string;
  category: Parameters<typeof getInsightCategoryLabel>[0];
  slug: string;
  locale: string;
}): InsightOgTemplateProps {
  return {
    eyebrow: 'Tracebud Insights',
    categoryLabel: getInsightCategoryLabel(post.category),
    title: truncateText(post.title, 110),
    description: truncateText(post.description, 150),
    footer: `${MARKETING_SITE_ORIGIN.replace('https://', '')}/${post.locale}/insights/${post.slug}`,
  };
}

export function buildInsightsHubOgTemplateProps(locale: string): InsightOgTemplateProps {
  return {
    eyebrow: 'Tracebud Insights',
    categoryLabel: 'Guidance for the whole chain',
    title: 'Regulatory guidance, field notes, and practical playbooks',
    description:
      'EUDR traceability explainers for farmers, cooperatives, exporters, and compliance teams.',
    footer: `${MARKETING_SITE_ORIGIN.replace('https://', '')}/${locale}/insights`,
  };
}

export async function renderInsightOgImage(props: InsightOgTemplateProps) {
  const fonts = await getOgFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px',
          background: `linear-gradient(135deg, ${FOREST_DARK} 0%, ${FOREST_CANOPY} 52%, #047857 100%)`,
          color: '#ffffff',
          fontFamily: 'Inter',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '420px',
            height: '420px',
            borderRadius: '9999px',
            background: `radial-gradient(circle, ${DATA_EMERALD}55 0%, transparent 72%)`,
            transform: 'translate(120px, -120px)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          {/* OG ImageResponse requires a plain img for remote logo fetch */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${MARKETING_SITE_ORIGIN}/tracebud-logo-v6.png`}
            alt=""
            width={72}
            height={72}
            style={{ borderRadius: '16px' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: MINT_GLOW,
              }}
            >
              {props.eyebrow ?? 'Tracebud Insights'}
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignSelf: 'flex-start',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.18)',
                border: `1px solid ${DATA_EMERALD}`,
                color: MINT_GLOW,
                fontSize: 20,
                fontWeight: 700,
                padding: '8px 18px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {props.categoryLabel}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '980px' }}>
          <div
            style={{
              fontSize: 58,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
            }}
          >
            {props.title}
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.35,
              color: 'rgba(255, 255, 255, 0.82)',
              maxWidth: '920px',
            }}
          >
            {props.description}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 22,
            color: MINT_GLOW,
          }}
        >
          <div style={{ fontWeight: 700 }}>{props.footer ?? 'tracebud.com/insights'}</div>
          <div
            style={{
              width: '120px',
              height: '6px',
              borderRadius: '9999px',
              background: DATA_EMERALD,
            }}
          />
        </div>
      </div>
    ),
    {
      ...INSIGHT_OG_SIZE,
      fonts,
    },
  );
}
