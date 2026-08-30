'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Activity, Download, ShieldCheck } from 'lucide-react';
import { AuditLogEntry } from '@/types/settings';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
}

export function AuditLogView({ logs }: AuditLogViewProps) {
  const handleExportCsv = () => {
    const rows = [
      ['Timestamp', 'Actor', 'Email', 'Action', 'Resource'],
      ...logs.map((l) => [l.createdAt, l.actorName, l.actorEmail, l.action, l.resource]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Audit log exported to CSV');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <Activity className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Administrative Activity Trail</CardTitle>
              <CardDescription>
                Immutable audit trail of recent actions performed across your workspace.
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCsv} className="cursor-pointer">
            <Download className="w-4 h-4 mr-2" aria-hidden="true" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardBody className="space-y-0 p-0">
        <div className="rounded-xl border border-separator/80 overflow-hidden divide-y divide-separator/60 m-4 sm:m-6">
          {logs.length > 0 ? (
            logs.map((log) => {
              const initials = log.actorName
                ? log.actorName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : 'SYS';

              let timeFormatted = log.createdAt;
              try {
                timeFormatted = formatDistanceToNow(new Date(log.createdAt), { addSuffix: true });
              } catch {
                // fallback
              }

              return (
                <div
                  key={log.id}
                  className="p-4 bg-surface hover:bg-surface-elevated/40 transition-colors flex items-start gap-3.5"
                >
                  <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center shrink-0 border border-separator text-[11px] font-bold text-foreground">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-foreground truncate">
                        {log.actorName} <span className="text-muted font-normal">({log.actorEmail})</span>
                      </p>
                      <span className="text-[10px] text-muted shrink-0 tabular-nums">{timeFormatted}</span>
                    </div>
                    <p className="text-xs text-secondary mt-0.5">{log.action}</p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[9px] font-semibold bg-surface-elevated border border-separator text-muted">
                      {log.resource}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-muted text-xs">
              <ShieldCheck size={28} className="mx-auto mb-2 opacity-40 text-emerald-500" />
              <p>No recent administrative events recorded.</p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
