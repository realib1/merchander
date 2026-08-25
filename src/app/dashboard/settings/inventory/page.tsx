import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Package, AlertTriangle, Barcode } from 'lucide-react';

export default function InventorySettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Products & Inventory</h1>
        <p className="text-sm text-secondary mt-1">
          Configure inventory tracking, low stock alerts, and product defaults.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <Package className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Inventory Policy</CardTitle>
              <CardDescription>Determine what happens when products run out of stock.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Stop selling when out of stock</p>
              <p className="text-xs text-secondary max-w-lg">
                Automatically hide products or show them as &quot;Sold Out&quot; when their inventory level reaches
                zero.
              </p>
            </div>
            <Switch defaultChecked={true} aria-label="Stop selling when out of stock" />
          </div>

          <div className="w-full h-px bg-separator/50" />

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Track Inventory by Default</p>
              <p className="text-xs text-secondary max-w-lg">
                Enable inventory tracking automatically for all newly created products.
              </p>
            </div>
            <Switch defaultChecked={true} aria-label="Track inventory by default for new products" />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Low Stock Alerts</CardTitle>
              <CardDescription>Get notified before you completely run out of products.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2 mb-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Enable Low Stock Alerts</p>
            </div>
            <Switch defaultChecked={true} aria-label="Enable low stock alerts" />
          </div>

          <FormField
            label="Low Stock Threshold"
            type="number"
            defaultValue="5"
            hint="You will receive an alert when a product's inventory falls to this number or lower."
          />
        </CardBody>
        <CardFooter className="justify-end">
          <Button variant="outline" size="sm" disabled>
            Save Preferences
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-muted">Coming Soon</span>
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Barcode className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>SKU Generation</CardTitle>
              <CardDescription>Rules for generating Stock Keeping Units.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Auto-generate SKUs</p>
              <p className="text-xs text-secondary max-w-lg">
                Automatically create a unique SKU for new products based on category and title.
              </p>
            </div>
            <Switch defaultChecked={false} aria-label="Auto-generate SKUs" />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
