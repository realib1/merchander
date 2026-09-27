'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { P2PAccount } from '@/types/settings';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

interface P2PAccountFormProps {
  onSave: (account: P2PAccount) => void;
  onCancel: () => void;
}

const PRESET_TYPES: Array<{
  type: P2PAccount['type'];
  label: string;
  defaultProvider: string;
}> = [
  { type: 'mtn_momo', label: 'MTN MoMo', defaultProvider: 'MTN Mobile Money' },
  { type: 'telecel_cash', label: 'Telecel Cash', defaultProvider: 'Telecel Cash' },
  { type: 'at_money', label: 'AT Money', defaultProvider: 'AT Money' },
  { type: 'bank', label: 'Bank Account', defaultProvider: 'Stanbic Bank' },
  { type: 'other', label: 'Custom / Other', defaultProvider: 'Custom Account' },
];

export function P2PAccountForm({ onSave, onCancel }: P2PAccountFormProps) {
  const [selectedType, setSelectedType] = useState<P2PAccount['type']>('mtn_momo');
  const [providerName, setProviderName] = useState('MTN Mobile Money');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankBranch, setBankBranch] = useState('');

  const handleSelectType = (type: P2PAccount['type']) => {
    setSelectedType(type);
    const preset = PRESET_TYPES.find((p) => p.type === type);
    if (preset) setProviderName(preset.defaultProvider);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim() || !accountName.trim()) {
      toast.error('Please enter both account number and account name');
      return;
    }

    onSave({
      id: `p2p-${Date.now()}`,
      type: selectedType,
      providerName: providerName.trim() || 'Payment Account',
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim(),
      bankBranch: bankBranch.trim() || undefined,
    });
  };

  return (
    <div className="p-4 rounded-xl border border-brand-primary/40 bg-surface-elevated space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between border-b border-separator pb-2">
        <span className="text-xs font-bold text-foreground">New Payment Account</span>
        <button type="button" onClick={onCancel} className="text-xs text-muted hover:text-foreground cursor-pointer">
          Cancel
        </button>
      </div>

      {/* Type Selector Dropdown */}
      <div className="space-y-1.5">
        <label htmlFor="accountTypeSelect" className="text-xs font-semibold text-foreground">
          Account Type
        </label>
        <select
          id="accountTypeSelect"
          value={selectedType}
          onChange={(e) => handleSelectType(e.target.value as P2PAccount['type'])}
          className="w-full rounded-xl border border-separator bg-surface px-3 py-2 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 cursor-pointer"
        >
          {PRESET_TYPES.map((p) => (
            <option key={p.type} value={p.type}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField
          name="providerName"
          label="Provider / Bank Name"
          value={providerName}
          onChange={(e) => setProviderName(e.target.value)}
          placeholder="e.g. MTN Mobile Money / Stanbic Bank"
          required
        />
        <FormField
          name="accountNumber"
          label="Account Number / Phone"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder="e.g. 024 123 4567"
          required
        />
        <FormField
          name="accountName"
          label="Account Holder Name"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          placeholder="e.g. Unique Fashion Ltd"
          required
        />
        {selectedType === 'bank' && (
          <FormField
            name="bankBranch"
            label="Branch / Sort Code (Optional)"
            value={bankBranch}
            onChange={(e) => setBankBranch(e.target.value)}
            placeholder="e.g. Accra Main Branch"
          />
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-separator">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" variant="primary" size="sm" onClick={handleSubmit} className="gap-1 cursor-pointer">
          <Check size={13} />
          <span>Save Account</span>
        </Button>
      </div>
    </div>
  );
}
