'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

interface ReportProblemButtonProps {
  area?: string;
  errorCode?: string;
  errorMessage?: string;
  className?: string;
  label?: string;
}

export function ReportProblemButton({
  area,
  errorCode,
  errorMessage,
  className = '',
  label = 'Report a problem',
}: ReportProblemButtonProps) {
  const queryParams = new URLSearchParams();
  queryParams.set('tab', 'contact');
  if (area) queryParams.set('area', area);
  if (errorCode || errorMessage) queryParams.set('error', errorCode || errorMessage || '');

  return (
    <Link
      href={`/dashboard/help?${queryParams.toString()}`}
      className={`inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground font-semibold underline underline-offset-4 cursor-pointer transition ${className}`}
    >
      <AlertCircle size={13} className="text-amber-500 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
