import { describe, it, expect } from 'vitest';
import { parseMarkdown, parseInlineMarkdown } from './markdown';

describe('Markdown Parser & Tokenizer', () => {
  describe('Inline Markdown Parsing', () => {
    it('parses plain text without modification', () => {
      const tokens = parseInlineMarkdown('Plain text with no formatting');
      expect(tokens).toEqual([{ type: 'text', text: 'Plain text with no formatting' }]);
    });

    it('parses bold tokens accurately', () => {
      const tokens = parseInlineMarkdown('This is **bold text** right here');
      expect(tokens).toEqual([
        { type: 'text', text: 'This is ' },
        { type: 'bold', text: 'bold text' },
        { type: 'text', text: ' right here' },
      ]);
    });

    it('parses inline code tokens accurately', () => {
      const tokens = parseInlineMarkdown('Run `npm run test` now');
      expect(tokens).toEqual([
        { type: 'text', text: 'Run ' },
        { type: 'code', text: 'npm run test' },
        { type: 'text', text: ' now' },
      ]);
    });

    it('parses italic tokens accurately', () => {
      const tokens = parseInlineMarkdown('This is *italic* and _italic2_ text');
      expect(tokens).toEqual([
        { type: 'text', text: 'This is ' },
        { type: 'italic', text: 'italic' },
        { type: 'text', text: ' and ' },
        { type: 'italic', text: 'italic2' },
        { type: 'text', text: ' text' },
      ]);
    });
  });

  describe('Block Markdown Parsing', () => {
    it('parses headings with varying levels', () => {
      const input = `
# Main Header
### Sub Section Header
#### Minor Note
      `.trim();
      const blocks = parseMarkdown(input);

      expect(blocks).toEqual([
        { type: 'heading', level: 1, text: 'Main Header' },
        { type: 'heading', level: 3, text: 'Sub Section Header' },
        { type: 'heading', level: 4, text: 'Minor Note' },
      ]);
    });

    it('parses ordered and unordered lists', () => {
      const input = `
### Steps
1. Navigate to settings
2. Choose payment method

### Features
- Real-time stock
- Fast delivery
      `.trim();
      const blocks = parseMarkdown(input);

      expect(blocks).toHaveLength(4);
      expect(blocks[0]).toEqual({ type: 'heading', level: 3, text: 'Steps' });
      expect(blocks[1]).toEqual({
        type: 'list',
        ordered: true,
        items: ['Navigate to settings', 'Choose payment method'],
      });
      expect(blocks[2]).toEqual({ type: 'heading', level: 3, text: 'Features' });
      expect(blocks[3]).toEqual({
        type: 'list',
        ordered: false,
        items: ['Real-time stock', 'Fast delivery'],
      });
    });

    it('handles indented sub-list lines by joining them to parent item', () => {
      const input = `
1. **Verify Token Status**:
   - Confirm your system token is active.
2. Next step.
      `.trim();
      const blocks = parseMarkdown(input);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('list');
      if (blocks[0].type === 'list') {
        expect(blocks[0].items[0]).toContain('Verify Token Status');
        expect(blocks[0].items[0]).toContain('Confirm your system token is active');
      }
    });

    it('handles empty input gracefully', () => {
      expect(parseMarkdown('')).toEqual([]);
    });
  });
});
