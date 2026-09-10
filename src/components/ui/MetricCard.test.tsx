import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MetricCard } from './MetricCard';
import { Users } from 'lucide-react';

describe('MetricCard Component', () => {
  it('renders value and title correctly', () => {
    const html = renderToStaticMarkup(
      <MetricCard
        title="Total Customers"
        value={120}
        icon={<Users size={16} />}
        iconBg="bg-blue-500/10 text-blue-500"
      />
    );

    expect(html).toContain('Total Customers');
    expect(html).toContain('120');
  });

  it('renders positive change percentage with plus sign', () => {
    const html = renderToStaticMarkup(
      <MetricCard
        title="Active Customers"
        value={45}
        change={12.5}
        periodText="last month"
        icon={<Users size={16} />}
        iconBg="bg-emerald-500/10 text-emerald-500"
      />
    );

    expect(html).toContain('+12.5%');
    expect(html).toContain('vs. last month');
  });

  it('renders negative change percentage without plus sign', () => {
    const html = renderToStaticMarkup(
      <MetricCard
        title="New Customers"
        value={5}
        change={-8.3}
        icon={<Users size={16} />}
        iconBg="bg-amber-500/10 text-amber-500"
      />
    );

    expect(html).toContain('-8.3%');
    expect(html).not.toContain('+-8.3%');
  });

  it('handles NaN gracefully by not rendering broken percentage badge', () => {
    const html = renderToStaticMarkup(
      <MetricCard
        title="Conversion Rate"
        value="0%"
        change={NaN}
        subtitle="No baseline data"
        icon={<Users size={16} />}
        iconBg="bg-purple-500/10 text-purple-500"
      />
    );

    expect(html).not.toContain('NaN%');
    expect(html).toContain('No baseline data');
  });

  it('renders 0% change gracefully with neutral styling', () => {
    const html = renderToStaticMarkup(
      <MetricCard
        title="Retention"
        value="100%"
        change={0}
        icon={<Users size={16} />}
        iconBg="bg-blue-500/10 text-blue-500"
      />
    );

    expect(html).toContain('0.0%');
  });
});
