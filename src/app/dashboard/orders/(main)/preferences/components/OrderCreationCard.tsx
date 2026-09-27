'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { PlusCircle, Bot } from 'lucide-react';
import { OrderCreationSettings } from '@/types/settings';

interface OrderCreationCardProps {
  creation: OrderCreationSettings;
  onChange: (updated: OrderCreationSettings) => void;
  disabled?: boolean;
}

export function OrderCreationCard({ creation, onChange, disabled = false }: OrderCreationCardProps) {
  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 shrink-0">
            <PlusCircle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base font-bold font-display">Order Creation</CardTitle>
            <CardDescription className="text-xs text-muted">
              Define authorized order intake channels and automated AI extraction policies.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-4 pt-0">
        {/* Creation Channels */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">Orders Can Be Created From:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div
              onClick={() => onChange({ ...creation, allowStorefront: !creation.allowStorefront })}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                creation.allowStorefront
                  ? 'border-brand-primary bg-brand-primary/5 text-foreground'
                  : 'border-separator bg-surface text-muted hover:text-foreground'
              }`}
            >
              <Checkbox
                checked={creation.allowStorefront}
                onCheckedChange={(c) => onChange({ ...creation, allowStorefront: c })}
                disabled={disabled}
                aria-label="Allow Storefront Orders"
              />
              <span>Online Storefront Checkout</span>
            </div>

            <div
              onClick={() => onChange({ ...creation, allowSocialConversations: !creation.allowSocialConversations })}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                creation.allowSocialConversations
                  ? 'border-brand-primary bg-brand-primary/5 text-foreground'
                  : 'border-separator bg-surface text-muted hover:text-foreground'
              }`}
            >
              <Checkbox
                checked={creation.allowSocialConversations}
                onCheckedChange={(c) => onChange({ ...creation, allowSocialConversations: c })}
                disabled={disabled}
                aria-label="Allow Social Conversations"
              />
              <span>Social Conversations (WhatsApp / IG)</span>
            </div>

            <div
              onClick={() => onChange({ ...creation, allowDashboard: !creation.allowDashboard })}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                creation.allowDashboard
                  ? 'border-brand-primary bg-brand-primary/5 text-foreground'
                  : 'border-separator bg-surface text-muted hover:text-foreground'
              }`}
            >
              <Checkbox
                checked={creation.allowDashboard}
                onCheckedChange={(c) => onChange({ ...creation, allowDashboard: c })}
                disabled={disabled}
                aria-label="Allow Dashboard Orders"
              />
              <span>Staff Merchant Dashboard</span>
            </div>

            <div
              onClick={() => onChange({ ...creation, allowManual: !creation.allowManual })}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                creation.allowManual
                  ? 'border-brand-primary bg-brand-primary/5 text-foreground'
                  : 'border-separator bg-surface text-muted hover:text-foreground'
              }`}
            >
              <Checkbox
                checked={creation.allowManual}
                onCheckedChange={(c) => onChange({ ...creation, allowManual: c })}
                disabled={disabled}
                aria-label="Allow Manual POS"
              />
              <span>Manual Direct / Walk-in POS</span>
            </div>
          </div>
        </div>

        {/* AI-Created Orders Policy */}
        <div className="p-3.5 rounded-xl border border-separator bg-surface-elevated/40 space-y-2.5">
          <div className="flex items-center gap-2">
            <Bot size={14} className="text-brand-primary" />
            <span className="text-xs font-bold text-foreground">AI-Extracted Orders Policy</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...creation, aiCreatedOrdersMode: 'require_confirmation' })}
              disabled={disabled}
              className={`p-3 rounded-xl border text-left transition cursor-pointer space-y-1 ${
                creation.aiCreatedOrdersMode === 'require_confirmation'
                  ? 'border-brand-primary bg-brand-primary/10 text-foreground ring-1 ring-brand-primary'
                  : 'border-separator bg-surface text-muted hover:text-foreground'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Require Merchant Approval</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-primary/20 text-brand-primary">
                  Recommended
                </span>
              </div>
              <p className="text-[11px] text-muted">
                AI extracts cart details from chats into draft orders for staff confirmation.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onChange({ ...creation, aiCreatedOrdersMode: 'auto_create' })}
              disabled={disabled}
              className={`p-3 rounded-xl border text-left transition cursor-pointer space-y-1 ${
                creation.aiCreatedOrdersMode === 'auto_create'
                  ? 'border-brand-primary bg-brand-primary/10 text-foreground ring-1 ring-brand-primary'
                  : 'border-separator bg-surface text-muted hover:text-foreground'
              }`}
            >
              <span className="text-xs font-bold text-foreground">Create Automatically</span>
              <p className="text-[11px] text-muted">
                AI immediately creates confirmed orders once customer intent is recognized.
              </p>
            </button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
