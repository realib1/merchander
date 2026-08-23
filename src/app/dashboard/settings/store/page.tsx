import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Store, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

export default function StoreSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Store Settings</h1>
        <p className="text-sm text-secondary mt-1">
          Customize how your store appears to customers on the storefront.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Storefront Identity</CardTitle>
              <CardDescription>Basic details about your public store.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-elevated border border-separator flex items-center justify-center">
              <Store className="h-6 w-6 text-muted" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-primary">Store Logo</h4>
              <p className="text-xs text-secondary">Recommended size: 512x512px. Max 2MB.</p>
              <div className="flex gap-3 mt-2">
                <Button variant="outline" size="sm">Upload Logo</Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <FormField label="Store Name" defaultValue="Merchander Official Store" />
            
            <div className="space-y-1.5">
              <label htmlFor="storeUrl" className="text-sm font-medium text-primary">Store URL</label>
              <div className="flex shadow-sm rounded-md overflow-hidden">
                <span className="inline-flex items-center px-3 border border-r-0 border-separator bg-surface-elevated text-muted text-sm rounded-l-md">
                  merchander.com/
                </span>
                <input
                  id="storeUrl"
                  type="text"
                  defaultValue="official"
                  className="flex-1 w-full border border-separator bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary rounded-r-md"
                />
              </div>
              <p className="text-xs text-secondary mt-1">Your unique store link for customers.</p>
            </div>

            <FormField
              label="Store Description / Bio"
              isTextarea
              rows={4}
              defaultValue="Welcome to the official Merchander store. Find the best quality products for your everyday needs."
              hint="Keep it brief and engaging. This appears on your store's homepage."
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Localization & Formatting</CardTitle>
          <CardDescription>Default settings for products and checkout.</CardDescription>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="currency" className="text-sm font-medium text-primary">Default Currency</label>
              <select id="currency" className="w-full rounded-md border border-separator bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary">
                <option>GHS (Ghana Cedi)</option>
                <option>NGN (Nigerian Naira)</option>
                <option>USD (US Dollar)</option>
                <option>KES (Kenyan Shilling)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="weight" className="text-sm font-medium text-primary">Weight Unit</label>
              <select id="weight" className="w-full rounded-md border border-separator bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary">
                <option>Kilograms (kg)</option>
                <option>Grams (g)</option>
                <option>Pounds (lb)</option>
                <option>Ounces (oz)</option>
              </select>
            </div>
          </div>
        </CardBody>
        <CardFooter className="justify-end">
          <Button variant="primary">Save Store Settings</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
