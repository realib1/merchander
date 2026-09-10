import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MarkdownRenderer } from './MarkdownRenderer';

describe('MarkdownRenderer Component', () => {
  it('renders headings with correct HTML tags and styles', () => {
    const content = '# Main Title\n## Section Title\n### Subsection Title';
    const html = renderToStaticMarkup(<MarkdownRenderer content={content} />);

    expect(html).toContain('<h1');
    expect(html).toContain('Main Title</h1>');
    expect(html).toContain('<h2');
    expect(html).toContain('Section Title</h2>');
    expect(html).toContain('<h3');
    expect(html).toContain('Subsection Title</h3>');
  });

  it('renders bold, italic, and inline code formatting', () => {
    const content = 'This is **bold**, *italic*, and `inline code`.';
    const html = renderToStaticMarkup(<MarkdownRenderer content={content} />);

    expect(html).toContain('<strong');
    expect(html).toContain('bold</strong>');
    expect(html).toContain('<em');
    expect(html).toContain('italic</em>');
    expect(html).toContain('<code');
    expect(html).toContain('inline code</code>');
  });

  it('renders ordered and unordered lists', () => {
    const content = `
- Item A
- Item B

1. First
2. Second
`.trim();
    const html = renderToStaticMarkup(<MarkdownRenderer content={content} />);

    expect(html).toContain('<ul');
    expect(html).toContain('>Item A</li>');
    expect(html).toContain('>Item B</li>');
    expect(html).toContain('<ol');
    expect(html).toContain('>First</li>');
    expect(html).toContain('>Second</li>');
  });

  it('renders blockquotes properly', () => {
    const content = '> This is an important note or callout';
    const html = renderToStaticMarkup(<MarkdownRenderer content={content} />);

    expect(html).toContain('<blockquote');
    expect(html).toContain('This is an important note or callout');
  });

  it('renders GFM tables with table, thead, tbody, th, and td elements', () => {
    const content = `
| Header 1 | Header 2 |
| --- | --- |
| Row 1 Col 1 | Row 1 Col 2 |
| Row 2 Col 1 | Row 2 Col 2 |
`.trim();
    const html = renderToStaticMarkup(<MarkdownRenderer content={content} />);

    expect(html).toContain('<table');
    expect(html).toContain('<thead');
    expect(html).toContain('<th');
    expect(html).toContain('Header 1</th>');
    expect(html).toContain('<tbody');
    expect(html).toContain('<td');
    expect(html).toContain('Row 1 Col 1</td>');
  });

  it('renders links with secure attributes', () => {
    const content = '[Merchander Docs](https://merchander.com/docs)';
    const html = renderToStaticMarkup(<MarkdownRenderer content={content} />);

    expect(html).toContain('<a');
    expect(html).toContain('href="https://merchander.com/docs"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('Merchander Docs</a>');
  });

  it('applies custom className to wrapper', () => {
    const html = renderToStaticMarkup(<MarkdownRenderer content="Sample text" className="custom-test-class" />);

    expect(html).toContain('custom-test-class');
    expect(html).toContain('markdown-body');
  });
});
