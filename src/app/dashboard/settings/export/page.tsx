import { Metadata } from 'next';
import { ExportDataView } from './components/ExportDataView';

export const metadata: Metadata = {
  title: 'Export Data | Merchander',
  description: 'Download CSV reports and full JSON backups of your store catalog and orders.',
};

export default function ExportDataSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Export Data</h1>
        <p className="text-sm text-secondary mt-1">
          Download CSV reports or full JSON backups of your store&apos;s data.
        </p>
      </div>

      <ExportDataView />
    </div>
  );
}
