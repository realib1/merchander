import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Package, AlertTriangle, Barcode } from 'lucide-react';

export default function InventorySettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Products & Inventory</h1>
        <p className="text-sm  mt-1">Configure inventory tracking, low stock alerts, and product defaults.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <Package className="h-5 w-5" />
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
              <h4 className="text-sm font-medium">Stop selling when out of stock</h4>
              <p className="text-sm  max-w-lg">
                Automatically hide products or show them as &quot;Sold Out&quot; when their inventory level reaches
                zero.
              </p>
            </div>
            <Switch defaultChecked={true} />
          </div>

          <div className="w-full h-px bg-separator opacity-50" />

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Track Inventory by Default</h4>
              <p className="text-sm  max-w-lg">
                Enable inventory tracking automatically for all newly created products.
              </p>
            </div>
            <Switch defaultChecked={true} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <AlertTriangle className="h-5 w-5" />
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
              <h4 className="text-sm font-medium">Enable Low Stock Alerts</h4>
            </div>
            <Switch defaultChecked={true} />
          </div>

          <FormField
            label="Low Stock Threshold"
            type="number"
            defaultValue="5"
            hint="You will receive an alert when a product's inventory falls to this number or lower."
          />
        </CardBody>
        <CardFooter className="justify-end border-t border-separator/50 mt-4">
          <Button variant="primary">Save Preferences</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Barcode className="h-5 w-5" />
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
              <h4 className="text-sm font-medium">Auto-generate SKUs</h4>
              <p className="text-sm  max-w-lg">
                Automatically create a unique SKU for new products based on category and title.
              </p>
            </div>
            <Switch defaultChecked={false} />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
