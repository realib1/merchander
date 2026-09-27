'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { P2PAccount } from '@/types/settings';
import { Plus, Trash2, Smartphone, Building } from 'lucide-react';
import { P2PAccountForm } from './P2PAccountForm';
import { toast } from 'sonner';

interface ManualP2PAccountsListProps {
  accounts: P2PAccount[];
  onChangeAccounts: (accounts: P2PAccount[]) => void;
  disabled?: boolean;
}

export function ManualP2PAccountsList({ accounts, onChangeAccounts, disabled = false }: ManualP2PAccountsListProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = (newAcc: P2PAccount) => {
    onChangeAccounts([...accounts, newAcc]);
    toast.success(`${newAcc.providerName} added`);
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    onChangeAccounts(accounts.filter((a) => a.id !== id));
    toast.success('Payment account removed');
  };

  return (
    <div className="space-y-3.5 pt-2">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-foreground">Direct Peer-to-Peer Accounts</h4>
          <p className="text-[11px] text-muted">Add recipient accounts displayed for manual offline transfers.</p>
        </div>

        {!isAdding && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            disabled={disabled}
            className="text-xs gap-1.5 cursor-pointer shrink-0"
          >
            <Plus size={13} />
            <span>Add Account</span>
          </Button>
        )}
      </div>

      {/* Account List */}
      {accounts.length > 0 ? (
        <div className="space-y-2">
          {accounts.map((acc) => {
            const isBank = acc.type === 'bank';
            return (
              <div
                key={acc.id}
                className="flex items-center justify-between p-3 rounded-xl border border-separator bg-surface hover:bg-surface-elevated/60 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-surface-elevated border border-separator text-foreground shrink-0">
                    {isBank ? (
                      <Building className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Smartphone className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{acc.providerName}</span>
                      <span className="text-xs font-mono font-medium text-foreground">{acc.accountNumber}</span>
                    </div>
                    <p className="text-[11px] text-muted">
                      {acc.accountName} {acc.bankBranch ? `• ${acc.bankBranch}` : ''}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(acc.id)}
                  disabled={disabled}
                  className="text-muted hover:text-destructive p-1.5 h-auto cursor-pointer"
                  aria-label={`Remove ${acc.providerName}`}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        !isAdding && (
          <div className="p-4 rounded-xl border border-dashed border-separator bg-surface text-center space-y-1">
            <p className="text-xs font-medium text-foreground">No P2P accounts added yet</p>
            <p className="text-[11px] text-muted">
              Click &quot;Add Account&quot; to configure your MoMo or Bank details for direct transfers.
            </p>
          </div>
        )
      )}

      {/* Add Account Inline Form */}
      {isAdding && <P2PAccountForm onSave={handleAdd} onCancel={() => setIsAdding(false)} />}
    </div>
  );
}
