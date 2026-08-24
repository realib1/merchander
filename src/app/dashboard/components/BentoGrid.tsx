import React from 'react';

interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function BentoGrid({ children, className = '', ...props }: BentoGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto w-full ${className}`} {...props}>
      {children}
    </div>
  );
}

interface BentoTileProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  colSpan?: 1 | 2 | 3;
}

export function BentoTile({ children, className = '', colSpan = 1, ...props }: BentoTileProps) {
  const spanClasses = {
    1: 'md:col-span-1',
    2: 'md:col-span-2',
    3: 'md:col-span-3',
  };

  return (
    <div
      className={`bg-surface border border-separator rounded-2xl shadow-sm shadow-brand-primary/5 p-6 flex flex-col relative overflow-hidden transition-all hover:shadow-md ${spanClasses[colSpan]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
