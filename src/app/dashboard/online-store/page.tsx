import React from 'react';
import { getStorefrontConfig } from '@/app/actions/storefront';
import { getCustomDomainConfig } from '@/app/actions/storefront-domain';
import { getStorefrontOverview } from '@/app/actions/storefront-dashboard';
import { StorefrontSettingsForm } from './components/StorefrontSettingsForm';

export const metadata = {
  title: 'Online Store | Merchander',
  description: 'Manage your public e-commerce catalog, self-serve WhatsApp ordering, and storefront branding.',
};

export default async function OnlineStorePage() {
  const [config, domainConfig, overviewData] = await Promise.all([
    getStorefrontConfig(),
    getCustomDomainConfig(),
    getStorefrontOverview(),
  ]);

  return (
    <div className="flex flex-col animate-fadeIn max-w-7xl mx-auto w-full space-y-6 pb-12">
      <h1 className="sr-only">Online Store</h1>

      {/* Unified Online Store Hub */}
      <StorefrontSettingsForm
        initialConfig={config}
        domainConfig={domainConfig}
        products={overviewData?.allProducts || []}
        featuredProductIds={overviewData?.featuredProductIds || []}
      />
    </div>
  );
}
