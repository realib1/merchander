"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/utils/cn";
import { Skeleton } from "./Skeleton";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  selectable?: boolean;
  selectedKeys?: (string | number)[];
  onSelectionChange?: (selectedKeys: (string | number)[]) => void;
  className?: string;
}

type SortOrder = "asc" | "desc";

/**
 * Type-safe DataTable component supporting sortable headers, pagination, row selection, and empty/loading states.
 */
export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = "No records found.",
  pageSize = 10,
  selectable = false,
  selectedKeys: controlledSelectedKeys,
  onSelectionChange,
  className,
}: DataTableProps<T>): React.JSX.Element {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<Set<string | number>>(new Set());

  const selectedKeysSet = useMemo(() => {
    if (controlledSelectedKeys !== undefined) {
      return new Set(controlledSelectedKeys);
    }
    return internalSelectedKeys;
  }, [controlledSelectedKeys, internalSelectedKeys]);

  const updateSelection = (newSet: Set<string | number>): void => {
    if (controlledSelectedKeys === undefined) {
      setInternalSelectedKeys(newSet);
    }
    onSelectionChange?.(Array.from(newSet));
  };

  const handleSort = (key: string): void => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      return sortOrder === "asc" ? 1 : -1;
    });
  }, [data, sortKey, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const pageKeys = useMemo(() => {
    return paginatedData.map((item, idx) => keyExtractor(item, idx));
  }, [paginatedData, keyExtractor]);

  const isAllPageSelected = pageKeys.length > 0 && pageKeys.every((k) => selectedKeysSet.has(k));

  const handleSelectAll = (): void => {
    const newSet = new Set(selectedKeysSet);
    if (isAllPageSelected) {
      pageKeys.forEach((k) => newSet.delete(k));
    } else {
      pageKeys.forEach((k) => newSet.add(k));
    }
    updateSelection(newSet);
  };

  const handleSelectRow = (key: string | number): void => {
    const newSet = new Set(selectedKeysSet);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    updateSelection(newSet);
  };

  const totalColCount = selectable ? columns.length + 1 : columns.length;

  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-lg border border-separator bg-surface",
        className
      )}
    >
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-separator bg-surface-elevated text-text-secondary">
              {selectable && (
                <th className="w-10 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    onChange={handleSelectAll}
                    aria-label="Select all rows"
                    className="h-4 w-4 cursor-pointer rounded border-separator accent-brand-primary"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold select-none",
                    col.sortable && "cursor-pointer hover:text-brand-primary",
                    col.className
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-caption opacity-70">
                        {sortKey === col.key ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-separator/50 text-text-primary">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, rIndex) => (
                <tr key={`skel-${rIndex}`}>
                  {selectable && (
                    <td className="px-4 py-3 text-center">
                      <Skeleton variant="rect" width={16} height={16} />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <Skeleton variant="text" width="80%" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={totalColCount}
                  className="px-4 py-8 text-center text-sm text-text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => {
                const rowKey = keyExtractor(item, index);
                const isSelected = selectedKeysSet.has(rowKey);

                return (
                  <tr
                    key={rowKey}
                    className={cn(
                      "transition-colors hover:bg-surface-elevated/50",
                      isSelected && "bg-brand-primary/5"
                    )}
                  >
                    {selectable && (
                      <td className="w-10 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(rowKey)}
                          aria-label={`Select row ${rowKey}`}
                          className="h-4 w-4 cursor-pointer rounded border-separator accent-brand-primary"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className={cn("px-4 py-3", col.className)}>
                        {col.render ? col.render(item, index) : String(item[col.key] ?? "")}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && !isLoading && (
        <div className="flex items-center justify-between border-t border-separator px-4 py-3 text-xs text-text-secondary">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded border border-separator bg-surface px-2.5 py-1 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="rounded border border-separator bg-surface px-2.5 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
