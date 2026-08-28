import React from 'react';
import { getStorefrontConfig } from '@/app/actions/storefront';
import { StorefrontShareCard } from './components/StorefrontShareCard';
import { StorefrontSettingsForm } from './components/StorefrontSettingsForm';

export const metadata = {
  title: 'Online Store | Merchander',
  description: 'Manage your public Link-in-Bio catalog, self-serve WhatsApp ordering, and storefront branding.',
};

export default async function OnlineStorePage() {
  const config = await getStorefrontConfig();

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full space-y-6">
      <h1 className="sr-only">Online Store</h1>

      {/* Share / Live Status Bar */}
      <StorefrontShareCard config={config} />

      {/* Storefront Customizer & Preview Grid */}
      <StorefrontSettingsForm initialConfig={config} />
    </div>
  );
}
