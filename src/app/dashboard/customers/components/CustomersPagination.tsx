'use client';

import Link from 'next/link';

interface CustomersPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  createPageUrl: (pageNumber: number) => string;
}

export function CustomersPagination({ currentPage, totalPages, totalCount, createPageUrl }: CustomersPaginationProps) {
  if (totalCount === 0) return null;

  return (
    <div className="p-4 border-t border-separator bg-surface-elevated/30 flex items-center justify-between text-sm shrink-0">
      <div>
        Showing {Math.min((currentPage - 1) * 10 + 1, totalCount)}-{Math.min(currentPage * 10, totalCount)} of{' '}
        {totalCount} customers
      </div>
      <div className="flex gap-2">
        {currentPage > 1 ? (
          <Link
            href={createPageUrl(currentPage - 1)}
            className="px-3 py-1.5 border border-separator rounded-lg hover:bg-surface transition-colors"
          >
            Previous
          </Link>
        ) : (
          <button
            disabled
            className="px-3 py-1.5 border border-separator rounded-lg hover:bg-surface transition-colors disabled:opacity-50"
          >
            Previous
          </button>
        )}

        {currentPage < totalPages ? (
          <Link
            href={createPageUrl(currentPage + 1)}
            className="px-3 py-1.5 border border-separator rounded-lg hover:bg-surface transition-colors"
          >
            Next
          </Link>
        ) : (
          <button
            disabled
            className="px-3 py-1.5 border border-separator rounded-lg hover:bg-surface transition-colors disabled:opacity-50"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
