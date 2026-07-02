import Link from 'next/link';
import type { ReactNode } from 'react';

import {
  extractInsightHeadings,
  resolveInsightHeadingId,
  splitInsightMarkdownBlocks,
  type InsightHeading,
} from '@/lib/insight-markdown';

type MarkdownContentProps = {
  content: string;
};

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**')) {
      nodes.push(<strong key={`${match.index}-bold`}>{token.slice(2, -2)}</strong>);
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        const isExternal = href.startsWith('http');
        nodes.push(
          isExternal ? (
            <a
              key={`${match.index}-link`}
              href={href}
              className="font-medium text-[var(--data-emerald)] underline-offset-2 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {label}
            </a>
          ) : (
            <Link
              key={`${match.index}-link`}
              href={href}
              className="font-medium text-[var(--data-emerald)] underline-offset-2 hover:underline"
            >
              {label}
            </Link>
          ),
        );
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function renderListBlock(trimmed: string, ordered: boolean) {
  const marker = ordered ? /^\d+\.\s+/ : /^- /;

  return (
    <ol
      className={
        ordered
          ? 'list-decimal space-y-2 pl-6 marker:font-semibold marker:text-[var(--forest-canopy)]'
          : 'list-disc space-y-2 pl-6 marker:text-[var(--data-emerald)]'
      }
    >
      {trimmed.split('\n').map((line, lineIndex) => (
        <li key={lineIndex} className="pl-1">
          {renderInline(line.trim().replace(marker, ''))}
        </li>
      ))}
    </ol>
  );
}

function renderBlock(block: string, index: number, headings: InsightHeading[], headingCounts: Map<string, number>) {
  const trimmed = block.trim();

  if (trimmed === '---') {
    return <hr key={index} className="border-[var(--warm-stone-dark)]" />;
  }

  if (trimmed.startsWith('```')) {
    const lines = trimmed.split('\n');
    const language = lines[0].replace(/```/, '').trim();
    const code = lines.slice(1, -1).join('\n');
    return (
      <pre
        key={index}
        className="overflow-x-auto rounded-xl border border-[var(--warm-stone-dark)] bg-[var(--warm-stone)] p-4 text-sm leading-relaxed text-[var(--forest-canopy)]"
      >
        <code className={language ? `language-${language}` : undefined}>{code}</code>
      </pre>
    );
  }

  if (trimmed.startsWith('> ')) {
    return (
      <blockquote
        key={index}
        className="border-l-4 border-[var(--data-emerald)] bg-[var(--warm-stone)] px-5 py-4 text-base italic text-gray-700 md:text-lg"
      >
        {renderInline(trimmed.replace(/^>\s?/gm, '').replace(/\n/g, ' '))}
      </blockquote>
    );
  }

  if (trimmed.startsWith('### ')) {
    const text = trimmed.slice(4).trim();
    const key = `h3:${text}`;
    const occurrence = headingCounts.get(key) ?? 0;
    headingCounts.set(key, occurrence + 1);
    const id = resolveInsightHeadingId(headings, 3, text, occurrence);

    return (
      <h3
        key={index}
        id={id}
        className="scroll-mt-28 text-xl font-semibold text-[var(--forest-canopy)] md:text-2xl"
      >
        {text}
      </h3>
    );
  }

  if (trimmed.startsWith('## ')) {
    const text = trimmed.slice(3).trim();
    const key = `h2:${text}`;
    const occurrence = headingCounts.get(key) ?? 0;
    headingCounts.set(key, occurrence + 1);
    const id = resolveInsightHeadingId(headings, 2, text, occurrence);

    return (
      <h2
        key={index}
        id={id}
        className="scroll-mt-28 text-2xl font-bold text-[var(--forest-canopy)] md:text-3xl"
      >
        {text}
      </h2>
    );
  }

  if (trimmed.split('\n').every((line) => /^\d+\.\s+/.test(line.trim()))) {
    return renderListBlock(trimmed, true);
  }

  if (trimmed.split('\n').every((line) => line.trim().startsWith('- '))) {
    return renderListBlock(trimmed, false);
  }

  return <p key={index}>{renderInline(trimmed.replace(/\n/g, ' '))}</p>;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const headings = extractInsightHeadings(content);
  const blocks = splitInsightMarkdownBlocks(content);
  const headingCounts = new Map<string, number>();

  return (
    <div className="prose-marketing space-y-5 text-lg leading-relaxed text-gray-700">
      {blocks.map((block, index) => renderBlock(block, index, headings, headingCounts))}
    </div>
  );
}
