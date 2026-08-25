import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { DownloadCloud, Mail, Database } from 'lucide-react';

export default function ExportDataSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Export Data</h1>
        <p className="text-sm text-secondary mt-1">Automate backups or manually export your store&apos;s data.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <DownloadCloud className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Manual Export</CardTitle>
              <CardDescription>Download a CSV of your store data.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button variant="outline" className="w-full justify-start text-left" disabled>
              <Database className="w-4 h-4 mr-2" aria-hidden="true" />
              Export All Products
              <span className="ml-auto text-[9px] px-1 py-0.2 rounded bg-surface-elevated text-muted">Soon</span>
            </Button>
            <Button variant="outline" className="w-full justify-start text-left" disabled>
              <Database className="w-4 h-4 mr-2" aria-hidden="true" />
              Export All Orders
              <span className="ml-auto text-[9px] px-1 py-0.2 rounded bg-surface-elevated text-muted">Soon</span>
            </Button>
            <Button variant="outline" className="w-full justify-start text-left" disabled>
              <Database className="w-4 h-4 mr-2" aria-hidden="true" />
              Export Customer List
              <span className="ml-auto text-[9px] px-1 py-0.2 rounded bg-surface-elevated text-muted">Soon</span>
            </Button>
            <Button variant="outline" disabled className="w-full justify-start text-left text-muted border-separator">
              <Database className="w-4 h-4 mr-2" aria-hidden="true" />
              Full Account Backup (JSON)
              <span className="ml-auto text-[9px] px-1 py-0.2 rounded bg-surface-elevated text-muted">Soon</span>
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Mail className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Automated Backups</CardTitle>
              <CardDescription>Get your store&apos;s data sent to you regularly.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-between py-2 mb-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Weekly Email Backup</p>
              <p className="text-xs text-secondary max-w-sm">
                Receive a zip file containing all your CSV exports every Sunday at midnight.
              </p>
            </div>
            <Switch defaultChecked={false} aria-label="Enable weekly email backup" />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
