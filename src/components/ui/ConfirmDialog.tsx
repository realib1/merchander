"use client";

import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export interface ConfirmDialogProps {
  /** Visibility state */
  isOpen: boolean;
  /** Fired when dialog is dismissed without confirming */
  onClose: () => void;
  /** Fired when confirmation action is confirmed */
  onConfirm: () => void;
  /** Dialog heading */
  title: string;
  /** Confirmation prompt message or explanation */
  description?: string;
  /** Label for confirmation button */
  confirmText?: string;
  /** Label for cancel button */
  cancelText?: string;
  /** Applies destructive styling (red button) for permanent actions */
  isDestructive?: boolean;
  /** Shows loading state on confirm button */
  isLoading?: boolean;
}

/**
 * Confirmation dialog for critical, destructive, or high-impact actions.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      closeOnBackdropClick={!isLoading}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? "destructive" : "primary"}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="text-sm text-secondary">
        {description || "Are you sure you want to proceed?"}
      </div>
    </Modal>
  );
};
