'use client';

import React from 'react';
import { parseMarkdown, parseInlineMarkdown, MarkdownBlock, InlineToken } from '@/utils/markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function renderInlineTokens(tokens: InlineToken[]): React.ReactNode {
  return tokens.map((token, idx) => {
    switch (token.type) {
      case 'bold':
        return (
          <strong key={idx} className="font-bold text-foreground">
            {token.text}
          </strong>
        );
      case 'code':
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 mx-0.5 rounded-md bg-surface-elevated border border-separator text-brand-primary text-[11px] font-mono"
          >
            {token.text}
          </code>
        );
      case 'italic':
        return (
          <em key={idx} className="italic text-foreground/90">
            {token.text}
          </em>
        );
      case 'text':
      default:
        return <React.Fragment key={idx}>{token.text}</React.Fragment>;
    }
  });
}

function renderFormattedText(text: string): React.ReactNode {
  return renderInlineTokens(parseInlineMarkdown(text));
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const blocks: MarkdownBlock[] = parseMarkdown(content);

  return (
    <div className={`space-y-3.5 text-foreground leading-relaxed ${className}`}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'heading': {
            if (block.level === 1) {
              return (
                <h1 key={idx} className="text-xl font-bold font-display text-foreground mt-5 mb-2 border-b border-separator pb-1">
                  {renderFormattedText(block.text)}
                </h1>
              );
            }
            if (block.level === 2) {
              return (
                <h2 key={idx} className="text-lg font-bold font-display text-foreground mt-4 mb-2">
                  {renderFormattedText(block.text)}
                </h2>
              );
            }
            if (block.level === 3) {
              return (
                <h3 key={idx} className="text-sm sm:text-base font-bold font-display text-foreground mt-3 mb-1.5">
                  {renderFormattedText(block.text)}
                </h3>
              );
            }
            return (
              <h4 key={idx} className="text-xs sm:text-sm font-semibold text-foreground mt-2 mb-1">
                {renderFormattedText(block.text)}
              </h4>
            );
          }

          case 'list': {
            const ListTag = block.ordered ? 'ol' : 'ul';
            const listClasses = block.ordered
              ? 'list-decimal list-outside pl-5 space-y-1.5 text-xs text-foreground/90'
              : 'list-disc list-outside pl-5 space-y-1.5 text-xs text-foreground/90';

            return (
              <ListTag key={idx} className={listClasses}>
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="leading-relaxed">
                    {renderFormattedText(item)}
                  </li>
                ))}
              </ListTag>
            );
          }

          case 'codeblock':
            return (
              <pre
                key={idx}
                className="p-3 rounded-xl bg-surface-elevated border border-separator text-[11px] font-mono overflow-x-auto text-foreground/90 my-2"
              >
                <code>{block.code}</code>
              </pre>
            );

          case 'paragraph':
          default:
            return (
              <p key={idx} className="text-xs text-foreground/90 leading-relaxed">
                {renderFormattedText('text' in block ? block.text : '')}
              </p>
            );
        }
      })}
    </div>
  );
}
