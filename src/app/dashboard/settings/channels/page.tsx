import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MessageCircle, Camera, MessageSquare } from 'lucide-react';

export default function ChannelsSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Connected Channels</h1>
        <p className="text-sm text-text-secondary mt-1">
          Connect your social media accounts to sync messages and orders into Merchander.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#25D366]/10 text-[#25D366]">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>WhatsApp Business API</CardTitle>
                <CardDescription>Official Cloud API integration for high-volume messaging.</CardDescription>
              </div>
            </div>
            <div className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-semibold">
              Connected
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="p-4 bg-surface-elevated rounded-md border border-separator flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Official WhatsApp Number</p>
              <p className="text-xs text-text-secondary mt-1">+233 24 123 4567</p>
            </div>
            <Button variant="outline" size="sm">Manage Number</Button>
          </div>
          <p className="text-xs text-text-secondary">
            Your WhatsApp Business account is active. Auto-replies and anti-ban safeguards are automatically enforced.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#E1306C]/10 text-[#E1306C]">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Instagram Direct</CardTitle>
                <CardDescription>Reply to DMs and story replies directly from your inbox.</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm">Connect Account</Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#1877F2]/10 text-[#1877F2]">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Facebook Messenger</CardTitle>
                <CardDescription>Sync messages from your Facebook Page.</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm">Connect Page</Button>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
