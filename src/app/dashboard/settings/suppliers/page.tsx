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
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Suppliers</h1>
        <p className="text-sm text-secondary mt-1">Manage procurement defaults and supplier communications.</p>
      </div>

      <SuppliersSettingsForm initialSettings={settings} />
    </div>
  );
}
