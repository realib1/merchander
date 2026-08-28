'use client';

interface OrdersPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (newPage: number) => void;
}

export function OrdersPagination({ currentPage, totalPages, totalCount, onPageChange }: OrdersPaginationProps) {
  const startCount = totalCount === 0 ? 0 : (currentPage - 1) * 10 + 1;
  const endCount = Math.min(currentPage * 10, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-separator bg-surface text-sm text-muted">
      <div>
        Showing <span className="font-medium text-foreground">{startCount}</span> to{' '}
        <span className="font-medium text-foreground">{endCount}</span> of{' '}
        <span className="font-medium text-foreground">{totalCount}</span> orders
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-1.5 border border-separator rounded-lg hover:bg-surface-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-xs px-2">
          Page {currentPage} of {Math.max(1, totalPages)}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-1.5 border border-separator rounded-lg hover:bg-surface-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
