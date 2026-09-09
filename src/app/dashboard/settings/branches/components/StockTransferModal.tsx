'use client';

// Re-export StockTransferDrawer as StockTransferModal for backward compatibility
export { StockTransferDrawer as StockTransferModal } from './StockTransferDrawer';
export type {
  StockTransferDrawerProps as StockTransferModalProps,
  TransferableVariant,
} from './StockTransferDrawer';
