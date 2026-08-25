import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';

export default function CheckoutSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Checkout</h1>
        <p className="text-sm text-secondary mt-1">Manage what information is required during customer checkout.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
          <CardDescription>Select what information you require from customers at checkout.</CardDescription>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Require phone number</p>
              <p className="text-xs text-secondary mt-0.5">
                Customers must enter a valid phone number for MoMo and delivery.
              </p>
            </div>
            <Switch defaultChecked aria-label="Require phone number at checkout" />
          </div>

          <div className="w-full h-px bg-separator/50" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Require email address</p>
              <p className="text-xs text-secondary mt-0.5">
                Customers must enter an email to receive order confirmation receipts.
              </p>
            </div>
            <Switch aria-label="Require email address at checkout" />
          </div>
        </CardBody>
        <CardFooter className="justify-end">
          <Button variant="outline" size="sm" disabled>
            Save Changes
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-muted">Soon</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
