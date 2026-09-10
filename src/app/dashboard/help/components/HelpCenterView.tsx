'use client';

import React, { useState, useMemo } from 'react';
import { HelpArticle, TicketCategory } from '@/types/support';
import { Search, BookOpen, ChevronRight, MessageSquare, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

interface HelpCenterViewProps {
  articles: HelpArticle[];
  onOpenContact: (prefillSubject?: string, category?: TicketCategory) => void;
}

const CATEGORIES: Array<{ id: TicketCategory | 'all'; label: string }> = [
  { id: 'all', label: 'All Topics' },
  { id: 'orders', label: 'Pre-orders & Batches' },
  { id: 'payments', label: 'MoMo & Payments' },
  { id: 'channels', label: 'WhatsApp & Social' },
  { id: 'domain', label: 'Custom Domains' },
  { id: 'intelligence', label: 'Goals & Targets' },
  { id: 'storefront', label: 'Storefront & Products' },
  { id: 'billing', label: 'Landed Costs & Billing' },
];

export function HelpCenterView({ articles, onOpenContact }: HelpCenterViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | 'all'>('all');
  const [activeArticle, setActiveArticle] = useState<HelpArticle | null>(null);

  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      const matchesCategory = selectedCategory === 'all' || art.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        art.title.toLowerCase().includes(q) ||
        art.summary.toLowerCase().includes(q) ||
        art.tags.some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [articles, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Search Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-brand-primary/10 via-surface-elevated to-surface border border-separator/80 space-y-4 shadow-xs">
        <div className="max-w-2xl space-y-1.5">
          <span className="text-[11px] font-bold text-brand-primary uppercase tracking-wider">
            Merchant Knowledge Base
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-foreground tracking-tight">
            How can we help your business today?
          </h2>
          <p className="text-xs text-muted">
            Search operational answers for pre-orders, WhatsApp automation, Mobile Money reconciliation, and custom
            domains.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative max-w-xl">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for an answer (e.g. pre-order batch, WhatsApp webhook, MoMo SMS)..."
            className="w-full bg-surface border border-separator rounded-2xl pl-10 pr-4 py-3 text-xs placeholder:text-muted outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 shadow-xs transition"
          />
        </div>

        {/* Category Pills Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                selectedCategory === cat.id
                  ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                  : 'bg-surface border-separator text-muted hover:text-foreground'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Article List / Active Reader */}
      {activeArticle ? (
        <div className="rounded-2xl border border-separator bg-surface p-6 space-y-4 animate-fadeIn">
          <button
            type="button"
            onClick={() => setActiveArticle(null)}
            className="text-xs font-bold text-brand-primary hover:underline cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft size={13} aria-hidden="true" />
            <span>Back to all guides</span>
          </button>

          <div className="space-y-2 border-b border-separator pb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-brand-primary/10 text-brand-primary">
                {activeArticle.category}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-display text-foreground">{activeArticle.title}</h3>
            <p className="text-xs text-muted">{activeArticle.summary}</p>
          </div>

          <MarkdownRenderer content={activeArticle.content} className="py-1" />

          {/* Need help CTA below article */}
          <div className="p-4 rounded-xl bg-surface-elevated border border-separator/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6">
            <div>
              <h4 className="text-xs font-bold text-foreground">Did this solve your problem?</h4>
              <p className="text-[11px] text-muted">If you still need assistance, our support team can help.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenContact(`Help with: ${activeArticle.title}`, activeArticle.category)}
              className="gap-1.5 text-xs shrink-0 cursor-pointer"
            >
              <MessageSquare size={13} />
              <span>Contact Support</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredArticles.map((art) => (
              <button
                key={art.id}
                type="button"
                onClick={() => setActiveArticle(art)}
                className="p-4 rounded-2xl border border-separator bg-surface hover:border-brand-primary/50 hover:bg-surface-elevated transition-all text-left flex items-start justify-between gap-3 group cursor-pointer shadow-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded">
                      {art.category}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-foreground group-hover:text-brand-primary transition-colors leading-snug">
                    {art.title}
                  </h3>
                  <p className="text-[11px] text-muted line-clamp-2">{art.summary}</p>
                </div>
                <ChevronRight
                  size={16}
                  className="text-muted group-hover:text-brand-primary group-hover:translate-x-0.5 transition-transform shrink-0 mt-1"
                />
              </button>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <div className="p-10 rounded-2xl border border-dashed border-separator bg-surface text-center space-y-3">
              <BookOpen size={24} className="mx-auto text-muted" />
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-xs font-bold text-foreground">No matching guides found</h3>
                <p className="text-[11px] text-muted">
                  Can&apos;t find what you are looking for? Open a direct ticket with our support specialists.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => onOpenContact(searchQuery ? `Question about: ${searchQuery}` : undefined)}
                className="gap-1.5 text-xs cursor-pointer"
              >
                <MessageSquare size={13} />
                <span>Contact Support</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
