'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  createPageUrl: (pageNumber: number) => string;
}

export function ProductsPagination({ currentPage, totalPages, totalCount, createPageUrl }: ProductsPaginationProps) {
  if (totalCount === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-separator bg-surface-elevated/20 text-body-sm mt-auto">
      <div className="flex items-center gap-2">
        <span>Showing</span>
        <span className="font-medium tabular-nums">
          {Math.min((currentPage - 1) * 12 + 1, totalCount)}-{Math.min(currentPage * 12, totalCount)}
        </span>
        <span>of</span>
        <span className="font-medium tabular-nums">{totalCount}</span>
        <span>products</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="tabular-nums">
          Page {currentPage} of {Math.max(1, totalPages)}
        </span>
        <div className="flex items-center gap-1">
          {currentPage > 1 ? (
            <Link
              href={createPageUrl(currentPage - 1)}
              className="p-1 rounded text-muted hover:text-brand-primary hover:bg-surface border border-transparent hover:border-separator transition-all"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </Link>
          ) : (
            <button
              className="p-1 rounded text-muted hover:text-brand-primary hover:bg-surface border border-transparent hover:border-separator transition-all"
              disabled
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          <span
            className="px-2 py-1 min-w-6 text-center rounded bg-surface border border-separator tabular-nums"
            aria-current="page"
          >
            {currentPage}
          </span>

          {currentPage < totalPages ? (
            <Link
              href={createPageUrl(currentPage + 1)}
              className="p-1 rounded text-muted hover:text-brand-primary hover:bg-surface border border-transparent hover:border-separator transition-all"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </Link>
          ) : (
            <button
              className="p-1 rounded text-muted hover:text-brand-primary hover:bg-surface border border-transparent hover:border-separator transition-all"
              disabled
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
