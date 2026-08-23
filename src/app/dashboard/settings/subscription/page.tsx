import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CreditCard, Zap, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

export default function SubscriptionSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Subscription</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your Merchander billing plan and payment methods.
        </p>
      </div>

      <Card className="border-brand-primary/20 bg-brand-primary/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-bl-[100px] -z-10" />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-primary/20 text-brand-primary">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-brand-primary">Merchander Pro Plan</CardTitle>
                <CardDescription>Billed annually. Next charge on Jan 1, 2027.</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-text-primary">{formatCurrency(250).replace('.00', '')}<span className="text-sm font-normal text-text-secondary">/mo</span></p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <ul className="grid grid-cols-2 gap-3 mt-4">
            <li className="flex items-center gap-2 text-sm text-text-primary">
              <CheckCircle2 className="w-4 h-4 text-brand-primary" /> Unlimited Products
            </li>
            <li className="flex items-center gap-2 text-sm text-text-primary">
              <CheckCircle2 className="w-4 h-4 text-brand-primary" /> 5 Staff Accounts
            </li>
            <li className="flex items-center gap-2 text-sm text-text-primary">
              <CheckCircle2 className="w-4 h-4 text-brand-primary" /> WhatsApp API Integration
            </li>
            <li className="flex items-center gap-2 text-sm text-text-primary">
              <CheckCircle2 className="w-4 h-4 text-brand-primary" /> Priority Support
            </li>
          </ul>
        </CardBody>
        <CardFooter className="justify-end border-t border-brand-primary/10 mt-6 gap-3">
          <Button variant="outline">Cancel Subscription</Button>
          <Button variant="primary">Upgrade Plan</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-surface-elevated text-text-primary border border-separator">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>The card used for your monthly billing.</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm">Update Card</Button>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-4 p-4 border border-separator rounded-md bg-surface-elevated">
            <div className="w-12 h-8 bg-white rounded border border-separator flex items-center justify-center font-bold text-[10px] text-blue-900 italic">VISA</div>
            <div>
              <p className="text-sm font-medium text-text-primary">Visa ending in 4242</p>
              <p className="text-xs text-text-secondary">Expires 12/2028</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
