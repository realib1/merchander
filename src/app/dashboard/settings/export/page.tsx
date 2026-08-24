import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { DownloadCloud, Mail, Database } from 'lucide-react';

export default function ExportDataSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Export Data</h1>
        <p className="text-sm  mt-1">Automate backups or manually export your store&apos;s data.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <DownloadCloud className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Manual Export</CardTitle>
              <CardDescription>Download a CSV of your data right now.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="w-full justify-start text-left">
              <Database className="w-4 h-4 mr-2" />
              Export All Products
            </Button>
            <Button variant="outline" className="w-full justify-start text-left">
              <Database className="w-4 h-4 mr-2" />
              Export All Orders
            </Button>
            <Button variant="outline" className="w-full justify-start text-left">
              <Database className="w-4 h-4 mr-2" />
              Export Customer List
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-left text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20"
            >
              <Database className="w-4 h-4 mr-2" />
              Full Account Backup (JSON)
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Mail className="h-5 w-5" />
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
              <h4 className="text-sm font-medium">Weekly Email Backup</h4>
              <p className="text-sm  max-w-sm">
                Receive a zip file containing all your CSV exports every Sunday at midnight.
              </p>
            </div>
            <Switch defaultChecked={false} />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
