import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Bot, MessageSquareReply, ShieldAlert } from 'lucide-react';

export default function AutomationSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Automation & Bots</h1>
        <p className="text-sm text-secondary mt-1">Configure automated replies, greeting messages, and AI responses.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle>Welcome & Away Messages</CardTitle>
                <CardDescription>Automated greetings based on your business hours.</CardDescription>
              </div>
            </div>
            <Switch defaultChecked={true} aria-label="Enable welcome and away messages" />
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <FormField
            label="Welcome Greeting"
            isTextarea
            rows={3}
            defaultValue="Hi there! Welcome to our store. How can we help you today?"
            hint="Sent automatically when a customer messages you for the first time."
          />

          <div className="w-full h-px bg-separator/50" />

          <FormField
            label="Away Message"
            isTextarea
            rows={3}
            defaultValue="Thanks for reaching out! We're currently closed. We'll reply as soon as we reopen."
            hint="Sent automatically when customers message you outside of your configured Business Hours."
          />
        </CardBody>
        <CardFooter className="justify-end">
          <Button variant="outline" size="sm" disabled>
            Save Messages
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-muted">Soon</span>
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <MessageSquareReply className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Keyword Auto-replies</CardTitle>
              <CardDescription>Instantly answer common questions.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="rounded-md border border-separator overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-surface-elevated border-b border-separator/50">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-primary">Store Location</p>
                  <span className="px-1.5 py-0.5 rounded bg-surface border border-separator text-[11px] text-muted">
                    location, where are you
                  </span>
                </div>
                <p className="text-xs text-secondary mt-1 line-clamp-1">Accra, Ghana.</p>
              </div>
              <Switch defaultChecked={true} aria-label="Enable store location keyword rule" />
            </div>
            <div className="p-3 bg-surface text-center">
              <Button variant="outline" size="sm" className="w-full text-xs" disabled>
                Add New Keyword Rule
                <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-surface-elevated text-muted">Soon</span>
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Anti-Ban Safeguards</CardTitle>
              <CardDescription>Rules to protect your WhatsApp Business number from being blocked.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="p-4 bg-surface-elevated rounded-md border border-separator text-xs text-secondary leading-relaxed">
            Merchander automatically enforces messaging rate limits, applies human-like typing delays for bots, and
            implements session recovery to protect your account. These safeguards are permanently active.
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
