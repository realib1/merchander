import { Metadata } from 'next';
import { getSupplierSettings } from '@/app/actions/settings-operations';
import { SuppliersSettingsForm } from './components/SuppliersSettingsForm';

export const metadata: Metadata = {
  title: 'Suppliers Settings | Merchander',
  description: 'Manage procurement defaults, automated PO rules, and receiving guidelines.',
};

export default async function SuppliersSettingsPage() {
  const settings = await getSupplierSettings();

  return (
    <div className="max-w-4xl space-y-6 sm:space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-display">
          Suppliers Settings
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Manage procurement defaults, purchase order formats, and supplier receiving guidelines.
        </p>
      </div>

      <SuppliersSettingsForm initialSettings={settings} />
    </div>
  );
}
