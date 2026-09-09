'use client';

import React, { useState, useTransition } from 'react';
import { BranchData, BranchInput, BulkInterBranchTransferInput } from '@/types/branches';
import {
  createBranch,
  updateBranch,
  deleteBranch,
  setPrimaryBranch,
  transferBulkBranchStock,
} from '@/app/actions/branches';
import { BranchCard } from './BranchCard';
import { BranchFormDrawer } from './BranchFormDrawer';
import { StockTransferDrawer, TransferableVariant } from './StockTransferDrawer';
import { Plus, ArrowLeftRight, Store } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface BranchManagementClientProps {
  initialBranches: BranchData[];
  variants: TransferableVariant[];
}

export function BranchManagementClient({ initialBranches, variants }: BranchManagementClientProps) {
  const router = useRouter();
  const [branches, setBranches] = useState<BranchData[]>(initialBranches);
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchData | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferSourceBranch, setTransferSourceBranch] = useState<BranchData | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<BranchData | null>(null);

  const handleOpenAdd = () => {
    setEditingBranch(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (branch: BranchData) => {
    setEditingBranch(branch);
    setIsFormModalOpen(true);
  };

  const handleOpenTransfer = (branch?: BranchData) => {
    setTransferSourceBranch(branch || branches[0] || null);
    setIsTransferModalOpen(true);
  };

  const handleSaveBranch = async (input: BranchInput) => {
    startTransition(async () => {
      if (editingBranch) {
        const res = await updateBranch(editingBranch.id, input);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success('Branch details updated successfully');
          setIsFormModalOpen(false);
          router.refresh();
        }
      } else {
        const res = await createBranch(input);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success('New branch created successfully');
          setIsFormModalOpen(false);
          router.refresh();
        }
      }
    });
  };

  const handleDelete = (branchId: string) => {
    const branch = branches.find((b) => b.id === branchId);
    if (branch) setBranchToDelete(branch);
  };

  const confirmDeleteBranch = () => {
    if (!branchToDelete) return;
    const branchId = branchToDelete.id;

    startTransition(async () => {
      const res = await deleteBranch(branchId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Branch deleted successfully');
        setBranches((prev) => prev.filter((b) => b.id !== branchId));
        setBranchToDelete(null);
        router.refresh();
      }
    });
  };

  const handleSetPrimary = async (branchId: string) => {
    startTransition(async () => {
      const res = await setPrimaryBranch(branchId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Primary Headquarters branch updated');
        setBranches((prev) =>
          prev.map((b) => ({
            ...b,
            is_primary: b.id === branchId,
          }))
        );
        router.refresh();
      }
    });
  };

  const handleExecuteTransfer = async (input: BulkInterBranchTransferInput) => {
    startTransition(async () => {
      const res = await transferBulkBranchStock(input);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Stock units transferred successfully between branches');
        setIsTransferModalOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground font-display flex items-center gap-2">
            <Store className="text-brand-primary" size={20} />
            <span>Branches &amp; Pickup Locations</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Manage your physical shop locations, digital addresses, customer pickup desks, and stock distribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {branches.length > 1 && variants.length > 0 && (
            <button
              type="button"
              onClick={() => handleOpenTransfer()}
              className="px-3.5 py-2 rounded-xl bg-surface-elevated border border-separator text-xs font-semibold text-foreground hover:bg-surface-elevated/80 cursor-pointer transition flex items-center gap-1.5 shadow-xs"
            >
              <ArrowLeftRight size={13} className="text-amber-500" />
              <span>Transfer Stock</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary/90 cursor-pointer transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={14} />
            <span>Add Branch</span>
          </button>
        </div>
      </div>

      {/* Branches Grid */}
      {branches.length === 0 ? (
        <div className="p-8 text-center bg-surface border border-dashed border-separator rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-surface-elevated text-muted mx-auto flex items-center justify-center">
            <Store size={24} />
          </div>
          <h3 className="text-sm font-bold text-foreground">No branches found</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Add your primary shop or warehouse to start tracking multi-branch inventory and customer pickup locations.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary/90 cursor-pointer transition inline-flex items-center gap-1.5"
          >
            <Plus size={13} />
            <span>Add First Branch</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branches.map((branch) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
              onSetPrimary={handleSetPrimary}
              onTransfer={handleOpenTransfer}
              isPending={isPending}
            />
          ))}
        </div>
      )}

      {/* Drawers */}
      <BranchFormDrawer
        branch={editingBranch}
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveBranch}
        isPending={isPending}
      />

      <StockTransferDrawer
        branches={branches}
        initialSourceBranch={transferSourceBranch}
        variants={variants}
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onTransfer={handleExecuteTransfer}
        isPending={isPending}
      />

      <ConfirmDialog
        isOpen={!!branchToDelete}
        onClose={() => setBranchToDelete(null)}
        onConfirm={confirmDeleteBranch}
        title="Delete Branch"
        description={`Are you sure you want to delete "${branchToDelete?.name || 'this branch'}"? This action cannot be undone.`}
        confirmText="Delete Branch"
        isDestructive
        isLoading={isPending}
      />
    </div>
  );
}
