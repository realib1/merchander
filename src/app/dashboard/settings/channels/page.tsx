import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MessageCircle, Camera, MessageSquare } from 'lucide-react';

export default function ChannelsSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Connected Channels</h1>
        <p className="text-sm text-secondary mt-1">
          Connect your social media accounts to sync messages and orders into Merchander.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle>WhatsApp Business API</CardTitle>
                <CardDescription>Official Cloud API integration for high-volume customer messaging.</CardDescription>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-elevated text-muted border border-separator">
              Coming Soon
            </span>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="p-4 bg-surface-elevated rounded-md border border-separator flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary">WhatsApp Integration</p>
              <p className="text-xs text-secondary mt-0.5">Automated order confirmations and anti-ban safeguards.</p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Connect Number
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
                <Camera className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle>Instagram Direct</CardTitle>
                <CardDescription>Reply to DMs and story mentions directly from your shared inbox.</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              Connect
              <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-surface-elevated text-muted">Soon</span>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <MessageSquare className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle>Facebook Messenger</CardTitle>
                <CardDescription>Sync customer inquiries directly from your Facebook Page.</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              Connect
              <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-surface-elevated text-muted">Soon</span>
            </Button>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
