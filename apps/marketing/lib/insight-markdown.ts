export type InsightHeading = {
  level: 2 | 3;
  text: string;
  id: string;
};

export function slugifyInsightHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function extractInsightHeadings(content: string): InsightHeading[] {
  const headings: InsightHeading[] = [];
  const usedIds = new Map<string, number>();

  for (const block of splitInsightMarkdownBlocks(content)) {
    const trimmed = block.trim();
    let level: 2 | 3 | null = null;
    let text = '';

    if (trimmed.startsWith('## ')) {
      level = 2;
      text = trimmed.slice(3).trim();
    } else if (trimmed.startsWith('### ')) {
      level = 3;
      text = trimmed.slice(4).trim();
    }

    if (!level || !text) {
      continue;
    }

    const baseId = slugifyInsightHeading(text) || `section-${headings.length + 1}`;
    const count = usedIds.get(baseId) ?? 0;
    usedIds.set(baseId, count + 1);
    const id = count === 0 ? baseId : `${baseId}-${count + 1}`;

    headings.push({ level, text, id });
  }

  return headings;
}

export function splitInsightMarkdownBlocks(content: string): string[] {
  const blocks: string[] = [];
  let current = '';
  let inFence = false;

  for (const line of content.split('\n')) {
    const fence = line.trim().startsWith('```');

    if (fence) {
      if (!inFence) {
        if (current.trim()) {
          blocks.push(current.trim());
          current = '';
        }
        inFence = true;
        current = line;
        continue;
      }

      current += `\n${line}`;
      blocks.push(current.trim());
      current = '';
      inFence = false;
      continue;
    }

    if (inFence) {
      current += `${current ? '\n' : ''}${line}`;
      continue;
    }

    if (line.trim() === '---') {
      if (current.trim()) {
        blocks.push(current.trim());
      }
      blocks.push('---');
      current = '';
      continue;
    }

    if (line.trim() === '') {
      if (current.trim()) {
        blocks.push(current.trim());
        current = '';
      }
      continue;
    }

    current += `${current ? '\n' : ''}${line}`;
  }

  if (current.trim()) {
    blocks.push(current.trim());
  }

  return blocks;
}

export function resolveInsightHeadingId(
  headings: InsightHeading[],
  level: 2 | 3,
  text: string,
  occurrenceIndex: number,
): string {
  const matches = headings.filter((heading) => heading.level === level && heading.text === text);
  return matches[occurrenceIndex]?.id ?? slugifyInsightHeading(text);
}
