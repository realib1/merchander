import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CreditCard, Zap, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

export default function SubscriptionSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Subscription</h1>
        <p className="text-sm text-secondary mt-1">Manage your Merchander billing plan and payment methods.</p>
      </div>

      <Card className="border-brand-primary/20 bg-brand-primary/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-bl-[100px] -z-10" />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-primary/20 text-brand-primary">
                <Zap className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-brand-primary">Merchander Pro Plan</CardTitle>
                <CardDescription>Active Subscription</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(250).replace('.00', '')}
                <span className="text-sm font-normal text-secondary">/mo</span>
              </p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <li className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" aria-hidden="true" /> Unlimited Products
            </li>
            <li className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" aria-hidden="true" /> 5 Staff Accounts
            </li>
            <li className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" aria-hidden="true" /> WhatsApp API
              Integration
            </li>
            <li className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" aria-hidden="true" /> Priority Support
            </li>
          </ul>
        </CardBody>
        <CardFooter className="justify-end gap-3">
          <Button variant="outline" size="sm" disabled>
            Manage Billing
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-muted">Soon</span>
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-surface-elevated border border-separator">
                <CreditCard className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>The card or mobile money account used for billing.</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-4 p-4 border border-separator rounded-md bg-surface-elevated">
            <div className="w-12 h-8 bg-white rounded border border-separator flex items-center justify-center font-bold text-xs text-blue-900 italic">
              VISA
            </div>
            <div>
              <p className="text-sm font-medium text-primary">Primary Card</p>
              <p className="text-xs text-secondary">Managed via billing portal</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
