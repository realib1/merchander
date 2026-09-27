'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BadgeCheck, ShieldAlert, Clock, Building } from 'lucide-react';
import { BusinessVerificationInfo } from '@/types/settings';

interface BusinessVerificationCardProps {
  data: BusinessVerificationInfo;
  onChange: (field: keyof BusinessVerificationInfo, value: string) => void;
  disabled?: boolean;
}

export function BusinessVerificationCard({ data, onChange, disabled = false }: BusinessVerificationCardProps) {
  const getStatusBadge = () => {
    switch (data.status) {
      case 'verified':
        return (
          <Badge variant="success" size="md" dot>
            <span className="flex items-center gap-1 font-semibold text-[11px]">
              <BadgeCheck size={13} />
              <span>Verified</span>
            </span>
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" size="md" dot>
            <span className="flex items-center gap-1 font-semibold text-[11px]">
              <Clock size={13} />
              <span>Pending</span>
            </span>
          </Badge>
        );
      default:
        return (
          <Badge variant="default" size="md" dot>
            <span className="flex items-center gap-1 text-muted font-medium text-[11px]">
              <ShieldAlert size={13} />
              <span>Unverified</span>
            </span>
          </Badge>
        );
    }
  };

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary shrink-0">
              <BadgeCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base font-bold font-display">Business Verification</CardTitle>
              <CardDescription className="text-xs text-muted">
                Official business registration and tax identification details.
              </CardDescription>
            </div>
          </div>
          <div className="self-start sm:self-auto">{getStatusBadge()}</div>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="taxId" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Building size={13} className="text-muted" />
              <span>Tax ID / Registration Number (TIN / RGD)</span>
            </label>
            <input
              id="taxId"
              type="text"
              value={data.taxId}
              onChange={(e) => onChange('taxId', e.target.value)}
              disabled={disabled}
              placeholder="e.g. C0001234567 / TIN-P000987654"
              className="w-full rounded-xl border border-separator bg-surface px-3 py-2 text-xs font-mono transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="legalEntityName" className="text-xs font-semibold text-foreground">
              Official Registered Entity Name
            </label>
            <input
              id="legalEntityName"
              type="text"
              value={data.legalEntityName}
              onChange={(e) => onChange('legalEntityName', e.target.value)}
              disabled={disabled}
              placeholder="e.g. ACCRA APPAREL ENTERPRISE LTD"
              className="w-full rounded-xl border border-separator bg-surface px-3 py-2 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 disabled:opacity-50"
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
