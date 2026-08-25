import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { MapPin, Bike, Globe } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

export default function ShipmentsSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Shipments & Delivery</h1>
        <p className="text-sm text-secondary mt-1">Set up local delivery zones, dispatch riders, and shipping rates.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Local Delivery Zones</CardTitle>
              <CardDescription>Manage rates for specific cities or regions.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="rounded-md border border-separator overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-surface-elevated border-b border-separator/50">
              <div>
                <p className="text-sm font-medium text-primary">Greater Accra</p>
                <p className="text-xs text-secondary">Standard Delivery (1-2 Days)</p>
              </div>
              <div className="text-sm font-semibold text-primary">{formatCurrency(30)}</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-surface hover:bg-surface-elevated transition-colors border-b border-separator/50">
              <div>
                <p className="text-sm font-medium text-primary">Ashanti Region (Kumasi)</p>
                <p className="text-xs text-secondary">Inter-city Transport (2-3 Days)</p>
              </div>
              <div className="text-sm font-semibold text-primary">{formatCurrency(50)}</div>
            </div>
            <div className="p-3 bg-surface text-center">
              <Button variant="outline" size="sm" className="w-full text-xs" disabled>
                Add New Delivery Zone
                <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-surface-elevated text-muted">Soon</span>
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Bike className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Dispatch & Riders</CardTitle>
              <CardDescription>Manage your in-house or third-party delivery personnel.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Allow Customer Tracking</p>
              <p className="text-xs text-secondary max-w-lg">
                Send SMS notifications to customers with rider contact details when out for delivery.
              </p>
            </div>
            <Switch defaultChecked={true} aria-label="Allow customer delivery tracking" />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Globe className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Origin Address</CardTitle>
              <CardDescription>Where your products are shipped from.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <FormField
            label="Fulfillment Location"
            defaultValue="Main Warehouse - Accra, Ghana"
            disabled
            hint="To change this, update your primary address in the Business Profile settings."
          />
        </CardBody>
      </Card>
    </div>
  );
}
