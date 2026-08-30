import { Metadata } from 'next';
import { getRecentAuditLogs } from '@/app/actions/settings-data';
import { AuditLogView } from './components/AuditLogView';

export const metadata: Metadata = {
  title: 'Audit Log | Merchander',
  description: 'Review security audit logs and recent staff activity across your store.',
};

export default async function AuditLogSettingsPage() {
  const logs = await getRecentAuditLogs();

  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Audit Log</h1>
        <p className="text-sm text-secondary mt-1">Review a secure trail of all actions performed by your team.</p>
      </div>

      <AuditLogView logs={logs} />
    </div>
  );
}
