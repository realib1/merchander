import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { CreditCard, Smartphone, Banknote, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

export default function PaymentsSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Payments</h1>
        <p className="text-sm text-secondary mt-1">
          Manage how your store accepts payments from customers.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Mobile Money (MoMo)</CardTitle>
                <CardDescription>Accept payments via MTN MoMo, Telecel Cash, and AT Money.</CardDescription>
              </div>
            </div>
            <div className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-semibold">
              Active
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex gap-4">
            <div className="w-12 h-8 rounded bg-[#FFCC00] flex items-center justify-center font-bold text-xs text-black border border-separator/30">MTN</div>
            <div className="w-12 h-8 rounded bg-[#E31837] flex items-center justify-center font-bold text-caption text-white border border-separator/30">Telecel</div>
            <div className="w-12 h-8 rounded bg-[#000000] flex items-center justify-center font-bold text-xs text-white border border-separator/30">AT</div>
          </div>
          
          <div className="p-4 bg-surface-elevated rounded-md border border-separator flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-primary">Powered by Paystack</p>
              <p className="text-xs text-secondary mt-1">Funds are settled into your Paystack account within 24 hours. Transaction fee: 1.95%.</p>
            </div>
          </div>
        </CardBody>
        <CardFooter className="justify-end border-t border-separator/50 mt-4">
          <Button variant="outline">Manage Paystack Account</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Credit / Debit Cards</CardTitle>
                <CardDescription>Accept Visa, Mastercard, and Verve payments.</CardDescription>
              </div>
            </div>
            <Switch defaultChecked={true} />
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex gap-2">
            <div className="w-10 h-6 rounded bg-white flex items-center justify-center font-bold text-caption text-blue-900 border border-separator/30 italic">VISA</div>
            <div className="w-10 h-6 rounded bg-[#27303E] flex items-center justify-center font-bold text-[8px] text-white border border-separator/30">Mastercard</div>
          </div>
          <p className="text-xs text-secondary">Processed securely via your active Paystack integration.</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Cash on Delivery (COD)</CardTitle>
              <CardDescription>Allow customers to pay when their order arrives.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-primary">Enable COD</h4>
              <p className="text-sm text-secondary max-w-lg">
                High risk of fake orders. Recommended only for verified customers or specific delivery zones.
              </p>
            </div>
            <Switch defaultChecked={false} />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
