/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-body space-y-3.5 text-foreground leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node: _node, ...props }) => (
            <h1
              className="text-xl font-bold font-display text-foreground mt-6 mb-2 border-b border-separator pb-1.5"
              {...props}
            />
          ),
          h2: ({ node: _node, ...props }) => (
            <h2
              className="text-lg font-bold font-display text-foreground mt-5 mb-2"
              {...props}
            />
          ),
          h3: ({ node: _node, ...props }) => (
            <h3
              className="text-sm sm:text-base font-bold font-display text-foreground mt-4 mb-1.5"
              {...props}
            />
          ),
          h4: ({ node: _node, ...props }) => (
            <h4
              className="text-xs sm:text-sm font-semibold text-foreground mt-3 mb-1"
              {...props}
            />
          ),
          p: ({ node: _node, ...props }) => (
            <p className="text-xs text-foreground/90 leading-relaxed my-2" {...props} />
          ),
          ul: ({ node: _node, ...props }) => (
            <ul className="list-disc list-outside pl-5 space-y-1 text-xs text-foreground/90 my-2" {...props} />
          ),
          ol: ({ node: _node, ...props }) => (
            <ol className="list-decimal list-outside pl-5 space-y-1 text-xs text-foreground/90 my-2" {...props} />
          ),
          li: ({ node: _node, ...props }) => (
            <li className="leading-relaxed pl-0.5" {...props} />
          ),
          code: ({ node: _node, className: codeClassName, children, ...props }) => {
            const isInline = !codeClassName?.includes('language-');
            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 mx-0.5 rounded-md bg-surface-elevated border border-separator text-brand-primary text-[11px] font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={codeClassName} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ node: _node, ...props }) => (
            <pre
              className="p-3.5 rounded-xl bg-surface-elevated border border-separator text-[11px] font-mono overflow-x-auto text-foreground/90 my-3 shadow-xs"
              {...props}
            />
          ),
          blockquote: ({ node: _node, ...props }) => (
            <blockquote
              className="border-l-3 border-brand-primary pl-3.5 py-1.5 my-2.5 text-xs text-muted bg-brand-primary/5 rounded-r-xl"
              {...props}
            />
          ),
          table: ({ node: _node, ...props }) => (
            <div className="overflow-x-auto my-3 border border-separator rounded-xl shadow-xs">
              <table className="w-full text-xs text-left text-foreground" {...props} />
            </div>
          ),
          thead: ({ node: _node, ...props }) => (
            <thead
              className="bg-surface-elevated border-b border-separator text-muted uppercase text-[10px] font-bold tracking-wider"
              {...props}
            />
          ),
          th: ({ node: _node, ...props }) => (
            <th className="px-3.5 py-2.5 font-semibold text-foreground" {...props} />
          ),
          td: ({ node: _node, ...props }) => (
            <td className="px-3.5 py-2 border-b border-separator/50" {...props} />
          ),
          a: ({ node: _node, ...props }) => (
            <a
              className="text-brand-primary hover:underline font-semibold"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          hr: ({ node: _node, ...props }) => (
            <hr className="my-5 border-separator" {...props} />
          ),
          strong: ({ node: _node, ...props }) => (
            <strong className="font-bold text-foreground" {...props} />
          ),
          em: ({ node: _node, ...props }) => (
            <em className="italic text-foreground/90" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
