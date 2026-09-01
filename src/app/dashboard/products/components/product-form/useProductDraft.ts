'use client';

import { useState, useEffect, useCallback } from 'react';
import { saveFilesToDraft, getFilesFromDraft, clearFilesFromDraft } from '@/lib/draft';
import type { InitialProductData, VariantState } from '@/types/product-form';
import type { ProductSpecification } from '@/types/product';

interface DraftData {
  name: string;
  description: string;
  isActive: boolean;
  availabilityStatus: 'AVAILABLE' | 'PRE_ORDER' | 'OUT_OF_STOCK';
  preorderShippingMode: 'included' | 'tbd';
  categoryId: string;
  vendor: string;
  stockUnit: string;
  variants: VariantState[];
  basePrice: number | '';
  baseCostPrice: number | '';
  specifications: ProductSpecification[];
}

export function useProductDraft(initialData?: InitialProductData) {
  const [isLoaded, setIsLoaded] = useState(!!initialData);
  const [draftFiles, setDraftFiles] = useState<File[]>([]);
  const [savedDraft, setSavedDraft] = useState<Partial<DraftData> | null>(null);

  useEffect(() => {
    if (initialData) return;

    let parsed: Partial<DraftData> | null = null;
    try {
      const draft = sessionStorage.getItem('product-form-draft');
      if (draft) {
        parsed = JSON.parse(draft);
      }
    } catch {
      // ignore parse error
    }

    getFilesFromDraft('product-images')
      .then((files) => {
        if (parsed) {
          setSavedDraft(parsed);
        }
        if (files && files.length > 0) {
          setDraftFiles(files);
        }
        setIsLoaded(true);
      })
      .catch(() => {
        if (parsed) {
          setSavedDraft(parsed);
        }
        setIsLoaded(true);
      });
  }, [initialData]);

  const persistDraft = useCallback(
    (data: DraftData, files: File[]) => {
      if (!isLoaded || initialData) return;
      sessionStorage.setItem('product-form-draft', JSON.stringify(data));
      saveFilesToDraft('product-images', files).catch(console.error);
    },
    [isLoaded, initialData]
  );

  const clearDraft = useCallback(async () => {
    if (!initialData) {
      sessionStorage.removeItem('product-form-draft');
      await clearFilesFromDraft('product-images').catch(console.error);
    }
  }, [initialData]);

  return {
    isLoaded,
    draftFiles,
    savedDraft,
    persistDraft,
    clearDraft,
  };
}
