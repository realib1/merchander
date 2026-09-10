export type MarkdownBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'paragraph'; text: string }
  | { type: 'codeblock'; code: string; language?: string };

export type InlineToken =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'italic'; text: string }
  | { type: 'code'; text: string };

/**
 * Parses inline markdown formatting (bold, italic, code spans).
 */
export function parseInlineMarkdown(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Check for inline code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      tokens.push({ type: 'code', text: codeMatch[1] });
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Check for bold: **bold**
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      tokens.push({ type: 'bold', text: boldMatch[1] });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Check for italic: *italic* or _italic_
    const italicMatch = remaining.match(/^\*([^*]+)\*/) || remaining.match(/^_([^_]+)_/);
    if (italicMatch) {
      tokens.push({ type: 'italic', text: italicMatch[1] });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Next special character index
    const nextSpecial = remaining.search(/[`*_]/);
    if (nextSpecial === -1) {
      tokens.push({ type: 'text', text: remaining });
      break;
    } else if (nextSpecial === 0) {
      // Single delimiter without closing pair
      tokens.push({ type: 'text', text: remaining[0] });
      remaining = remaining.slice(1);
    } else {
      tokens.push({ type: 'text', text: remaining.slice(0, nextSpecial) });
      remaining = remaining.slice(nextSpecial);
    }
  }

  return tokens;
}

/**
 * Parses markdown article text into structured blocks (headings, lists, paragraphs).
 */
export function parseMarkdown(content: string): MarkdownBlock[] {
  if (!content) return [];
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let currentList: { ordered: boolean; items: string[] } | null = null;
  let currentParagraphLines: string[] = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      blocks.push({
        type: 'paragraph',
        text: currentParagraphLines.join(' ').trim(),
      });
      currentParagraphLines = [];
    }
  };

  const flushList = () => {
    if (currentList) {
      blocks.push({
        type: 'list',
        ordered: currentList.ordered,
        items: currentList.items,
      });
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmedLine = rawLine.trim();

    if (!trimmedLine) {
      flushParagraph();
      flushList();
      continue;
    }

    // Headings: e.g. #, ##, ###, ####
    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      continue;
    }

    // If inside a list and line is indented, attach to the active list item
    const isIndented = rawLine.startsWith('  ') || rawLine.startsWith('\t');
    if (currentList && isIndented) {
      const lastIdx = currentList.items.length - 1;
      if (lastIdx >= 0) {
        currentList.items[lastIdx] += ' ' + trimmedLine;
      }
      continue;
    }

    // Ordered list: e.g. 1. Item
    const orderedMatch = trimmedLine.match(/^(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      flushParagraph();
      if (!currentList || !currentList.ordered) {
        flushList();
        currentList = { ordered: true, items: [] };
      }
      currentList.items.push(orderedMatch[2].trim());
      continue;
    }

    // Unordered list: e.g. - Item or * Item
    const unorderedMatch = trimmedLine.match(/^[-*]\s+(.*)$/);
    if (unorderedMatch) {
      flushParagraph();
      if (!currentList || currentList.ordered) {
        flushList();
        currentList = { ordered: false, items: [] };
      }
      currentList.items.push(unorderedMatch[1].trim());
      continue;
    }

    // Regular line -> accumulate paragraph
    flushList();
    currentParagraphLines.push(trimmedLine);
  }

  flushParagraph();
  flushList();
  return blocks;
}
