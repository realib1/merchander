import { Metadata } from 'next';
import { ExportDataView } from './components/ExportDataView';

export const metadata: Metadata = {
  title: 'Export Data | Merchander',
  description: 'Download CSV reports and full JSON backups of your store catalog and orders.',
};

export default function ExportDataSettingsPage() {
  return (
    <div className="max-w-4xl space-y-6 sm:space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">Export Data</h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Download CSV reports or full JSON backups of your store&apos;s products, orders, and customer records.
        </p>
      </div>

      <ExportDataView />
    </div>
  );
}
