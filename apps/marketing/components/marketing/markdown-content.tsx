import Link from 'next/link';
import type { ReactNode } from 'react';

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

export function MarkdownContent({ content }: MarkdownContentProps) {
  const blocks = content.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="prose-marketing space-y-5 text-lg leading-relaxed text-gray-700">
      {blocks.map((block, index) => {
        const trimmed = block.trim();

        if (trimmed.startsWith('### ')) {
          return (
            <h3
              key={index}
              className="text-xl font-semibold text-[var(--forest-canopy)] md:text-2xl"
            >
              {trimmed.slice(4)}
            </h3>
          );
        }

        if (trimmed.startsWith('## ')) {
          return (
            <h2
              key={index}
              className="text-2xl font-bold text-[var(--forest-canopy)] md:text-3xl"
            >
              {trimmed.slice(3)}
            </h2>
          );
        }

        if (trimmed.split('\n').every((line) => line.trim().startsWith('- '))) {
          return (
            <ul key={index} className="list-disc space-y-2 pl-6">
              {trimmed.split('\n').map((line, lineIndex) => (
                <li key={lineIndex}>{renderInline(line.trim().slice(2))}</li>
              ))}
            </ul>
          );
        }

        return <p key={index}>{renderInline(trimmed.replace(/\n/g, ' '))}</p>;
      })}
    </div>
  );
}
