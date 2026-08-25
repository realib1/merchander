import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Truck, Users, Send } from 'lucide-react';

export default function SuppliersSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Suppliers</h1>
        <p className="text-sm text-secondary mt-1">Manage procurement defaults and supplier communications.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <Users className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Procurement Contact</CardTitle>
              <CardDescription>The default email used when interacting with your suppliers.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <FormField
            label="Procurement Email"
            type="email"
            defaultValue="purchasing@merchander.com"
            hint="Purchase orders and supplier inquiries will be sent from this address."
          />
        </CardBody>
        <CardFooter className="justify-end">
          <Button variant="outline" size="sm" disabled>
            Save Contact Info
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-muted">Coming Soon</span>
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Send className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Automated Purchase Orders</CardTitle>
              <CardDescription>Configure automatic re-ordering when stock is low.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2 mb-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Enable Auto-POs</p>
              <p className="text-xs text-secondary max-w-md">
                Automatically draft purchase orders to the default supplier when a product hits its low stock threshold.
              </p>
            </div>
            <Switch defaultChecked={false} aria-label="Enable automated purchase orders" />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Truck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Supplier Deliveries</CardTitle>
              <CardDescription>Default receiving hours for your warehouse or store.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <FormField
            label="Receiving Instructions"
            isTextarea
            rows={3}
            defaultValue="Deliveries accepted Monday - Friday, 9:00 AM to 4:00 PM. Please use the back entrance."
            hint="These instructions will be attached to all purchase orders."
          />
        </CardBody>
        <CardFooter className="justify-end">
          <Button variant="outline" size="sm" disabled>
            Save Instructions
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-muted">Coming Soon</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
