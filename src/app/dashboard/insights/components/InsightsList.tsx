'use client';

import React, { useState, useMemo } from 'react';
import { BusinessInsight, InsightCategory } from '@/types/insights';
import { InsightCard } from './InsightCard';
import { InsightsEmptyState } from './InsightsEmptyState';
import { Search } from 'lucide-react';

interface InsightsListProps {
  insights: BusinessInsight[];
}

type FilterOption = 'all' | 'critical' | 'inventory' | 'margin' | 'credit' | 'opportunity';

export function InsightsList({ insights }: InsightsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');

  const filteredInsights = useMemo(() => {
    return insights.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.observation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.impact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.recommendation.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesFilter = true;
      if (activeFilter === 'critical') {
        matchesFilter = item.severity === 'critical';
      } else if (activeFilter === 'opportunity') {
        matchesFilter = item.severity === 'opportunity';
      } else if (activeFilter !== 'all') {
        matchesFilter = item.category === (activeFilter as InsightCategory);
      }

      return matchesSearch && matchesFilter;
    });
  }, [insights, searchTerm, activeFilter]);

  const filterButtons: Array<{ id: FilterOption; label: string; count?: number }> = [
    { id: 'all', label: 'All Insights', count: insights.length },
    { id: 'critical', label: 'Critical Risks', count: insights.filter((i) => i.severity === 'critical').length },
    { id: 'inventory', label: 'Inventory & Stock', count: insights.filter((i) => i.category === 'inventory').length },
    { id: 'margin', label: 'Margins & Pricing', count: insights.filter((i) => i.category === 'margin').length },
    { id: 'credit', label: 'Customer Debt', count: insights.filter((i) => i.category === 'credit').length },
    { id: 'opportunity', label: 'Opportunities', count: insights.filter((i) => i.severity === 'opportunity').length },
  ];

  return (
    <div>
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-surface border border-separator rounded-xl overflow-x-auto shadow-2xs">
          {filterButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setActiveFilter(btn.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeFilter === btn.id
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-muted hover:text-foreground hover:bg-surface-elevated'
              }`}
            >
              <span>{btn.label}</span>
              {typeof btn.count === 'number' && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeFilter === btn.id ? 'bg-white/20 text-white' : 'bg-surface-elevated text-muted'
                  }`}
                >
                  {btn.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search signals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-surface border border-separator rounded-xl text-foreground focus:ring-2 focus:ring-brand-primary/40 focus:outline-none placeholder:text-muted"
          />
        </div>
      </div>

      {/* Insights Cards Grid */}
      {filteredInsights.length === 0 ? (
        <InsightsEmptyState hasFilters={Boolean(searchTerm) || activeFilter !== 'all'} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredInsights.map((item) => (
            <InsightCard key={item.id} insight={item} />
          ))}
        </div>
      )}
    </div>
  );
}
