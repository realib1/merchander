'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { createProductAction } from '@/app/actions/create-product';
import { updateProductAction } from '@/app/actions/update-product';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ProductImageUploader } from './product-form/ProductImageUploader';
import { ProductGeneralInfo } from './product-form/ProductGeneralInfo';
import { ProductVariantManager, Store, VariantState } from './product-form/ProductVariantManager';
import { ProductSpecificationsCard } from './product-form/ProductSpecificationsCard';
import { ProductPricingCard } from './product-form/ProductPricingCard';
import { ProductStatusCard } from './product-form/ProductStatusCard';
import { ProductOrganizationCard, Category } from './product-form/ProductOrganizationCard';
import { useProductDraft } from './product-form/useProductDraft';
import type { ProductSpecification } from '@/types/product';
import type { ProductImageItem } from '@/types/product-form';

import { PreorderBatch } from '@/types/preorder';
import { PreorderCustomBatchState } from './product-form/ProductPreorderConfigSection';
import { addDays, format } from 'date-fns';

export interface InitialProductData {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  availabilityStatus: 'AVAILABLE' | 'PRE_ORDER' | 'OUT_OF_STOCK';
  categoryId: string | null;
  vendor: string | null;
  stockUnit: string | null;
  imageUrls: string[];
  basePrice: number | '';
  baseCostPrice: number | '';
  variants: VariantState[];
  preorderShippingMode: 'included' | 'tbd';
  specifications?: ProductSpecification[];
  selectedBatchId?: string | null;
}

interface ProductFormProps {
  stores: Store[];
  categories: Category[];
  batches?: PreorderBatch[];
  initialBatchId?: string | null;
  initialData?: InitialProductData;
}

export function ProductForm({
  stores,
  categories: initialCategories,
  batches = [],
  initialBatchId,
  initialData,
}: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [availabilityStatus, setAvailabilityStatus] = useState<'AVAILABLE' | 'PRE_ORDER' | 'OUT_OF_STOCK'>(
    initialData?.availabilityStatus ?? 'AVAILABLE'
  );
  const [preorderShippingMode, setPreorderShippingMode] = useState<'included' | 'tbd'>(
    initialData?.preorderShippingMode ?? 'included'
  );
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(
    initialBatchId || (batches.length > 0 ? batches[0].id : null)
  );
  const [customBatch, setCustomBatch] = useState<PreorderCustomBatchState>({
    isNewBatch: !initialBatchId && batches.length === 0,
    name: initialData?.name ? `${initialData.name} Batch` : '',
    code: '',
    closesAt: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
    supplierOrderDate: format(addDays(new Date(), 15), 'yyyy-MM-dd'),
    expectedArrivalStart: format(addDays(new Date(), 60), 'yyyy-MM-dd'),
    expectedArrivalEnd: format(addDays(new Date(), 67), 'yyyy-MM-dd'),
    freightMode: 'sea',
    originCountry: 'China',
  });
  const [categoryId, setCategoryId] = useState<string>(initialData?.categoryId ?? '');
  const [vendor, setVendor] = useState<string>(initialData?.vendor ?? '');
  const [stockUnit, setStockUnit] = useState<string>(initialData?.stockUnit ?? 'pcs');
  const [imageItems, setImageItems] = useState<ProductImageItem[]>(() => {
    return (initialData?.imageUrls ?? []).map((url, idx) => ({
      id: `existing-${idx}-${url}`,
      type: 'existing',
      url,
    }));
  });
  const [categories, setCategories] = useState<Category[]>(initialCategories);

  const [specifications, setSpecifications] = useState<ProductSpecification[]>(initialData?.specifications ?? []);

  const [variants, setVariants] = useState<VariantState[]>(
    initialData?.variants ?? [
      {
        id: 'default',
        sku: '',
        name: 'Default',
        price: '',
        costPrice: '',
        inventory: {},
      },
    ]
  );
  const [basePrice, setBasePrice] = useState<number | ''>(initialData?.basePrice ?? '');
  const [baseCostPrice, setBaseCostPrice] = useState<number | ''>(initialData?.baseCostPrice ?? '');

  const { isLoaded, draftFiles, savedDraft, persistDraft, clearDraft } = useProductDraft(initialData);

  useEffect(() => {
    if (!savedDraft && draftFiles.length === 0) return;
    React.startTransition(() => {
      if (savedDraft) {
        if (savedDraft.name !== undefined) setName(savedDraft.name);
        if (savedDraft.description !== undefined) setDescription(savedDraft.description);
        if (savedDraft.isActive !== undefined) setIsActive(savedDraft.isActive);
        if (savedDraft.availabilityStatus !== undefined) setAvailabilityStatus(savedDraft.availabilityStatus);
        if (savedDraft.preorderShippingMode !== undefined) setPreorderShippingMode(savedDraft.preorderShippingMode);
        if (savedDraft.categoryId !== undefined) setCategoryId(savedDraft.categoryId);
        if (savedDraft.vendor !== undefined) setVendor(savedDraft.vendor);
        if (savedDraft.stockUnit !== undefined) setStockUnit(savedDraft.stockUnit);
        if (savedDraft.variants !== undefined) setVariants(savedDraft.variants);
        if (savedDraft.basePrice !== undefined) setBasePrice(savedDraft.basePrice);
        if (savedDraft.baseCostPrice !== undefined) setBaseCostPrice(savedDraft.baseCostPrice);
        if (savedDraft.specifications !== undefined) setSpecifications(savedDraft.specifications);
      }
      if (draftFiles.length > 0) {
        const fileItems: ProductImageItem[] = draftFiles.map((file, idx) => ({
          id: `file-draft-${idx}-${file.name}`,
          type: 'file',
          file,
          preview: URL.createObjectURL(file),
        }));
        setImageItems((prev) => [...prev, ...fileItems]);
      }
    });
  }, [savedDraft, draftFiles]);

  const draftFilesToPersist = imageItems
    .filter((i): i is { id: string; type: 'file'; file: File; preview: string } => i.type === 'file')
    .map((i) => i.file);

  useEffect(() => {
    persistDraft(
      {
        name,
        description,
        isActive,
        availabilityStatus,
        preorderShippingMode,
        categoryId,
        vendor,
        stockUnit,
        variants,
        basePrice,
        baseCostPrice,
        specifications,
      },
      draftFilesToPersist
    );
  }, [
    name,
    description,
    isActive,
    availabilityStatus,
    preorderShippingMode,
    categoryId,
    vendor,
    stockUnit,
    variants,
    basePrice,
    baseCostPrice,
    specifications,
    draftFilesToPersist,
    isLoaded,
    persistDraft,
  ]);

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        id: Math.random().toString(36).substr(2, 9),
        sku: '',
        name: `Variant ${variants.length + 1}`,
        price: basePrice !== '' ? basePrice : '',
        costPrice: baseCostPrice !== '' ? baseCostPrice : '',
        inventory: {},
      },
    ]);
  };

  const removeVariant = (id: string) => {
    if (variants.length <= 1) return;
    setVariants(variants.filter((v) => v.id !== id));
  };

  const updateVariant = (id: string, field: keyof VariantState, value: VariantState[keyof VariantState]) => {
    setVariants(
      variants.map((v) => {
        if (v.id === id) {
          return { ...v, [field]: value };
        }
        return v;
      })
    );
  };

  const updateVariantInventory = (variantId: string, storeId: string, quantity: number) => {
    setVariants(
      variants.map((v) => {
        if (v.id === variantId) {
          return {
            ...v,
            inventory: {
              ...v.inventory,
              [storeId]: quantity,
            },
          };
        }
        return v;
      })
    );
  };

  const handleAddFiles = (newFiles: File[]) => {
    const newItems: ProductImageItem[] = newFiles.map((file, idx) => ({
      id: `file-${Date.now()}-${idx}-${file.name}`,
      type: 'file',
      file,
      preview: URL.createObjectURL(file),
    }));
    setImageItems((prev) => [...prev, ...newItems]);
  };

  const handleRemoveImage = (index: number) => {
    setImageItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    setImageItems((prev) => {
      const copy = [...prev];
      const [promoted] = copy.splice(index, 1);
      return [promoted, ...copy];
    });
  };

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    startTransition(async () => {
      const finalUrls: string[] = [];
      const supabase = createClient();

      for (const item of imageItems) {
        if (item.type === 'existing') {
          finalUrls.push(item.url);
        } else {
          const file = item.file;
          const fileExt = file.name.split('.').pop() || 'png';
          const fileName = `${Math.random().toString(36).substr(2, 9)}_${Date.now()}.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, file, { cacheControl: '3600', upsert: false });

          if (uploadError) {
            toast.error(`Failed to upload ${file.name}`);
            return;
          }

          if (uploadData) {
            const {
              data: { publicUrl },
            } = supabase.storage.from('product-images').getPublicUrl(fileName);
            finalUrls.push(publicUrl);
          }
        }
      }

      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('isActive', isActive.toString());
      formData.append('availabilityStatus', availabilityStatus);
      formData.append('preorderShippingMode', preorderShippingMode);
      if (availabilityStatus === 'PRE_ORDER') {
        if (!customBatch.isNewBatch && selectedBatchId) {
          formData.append('batchId', selectedBatchId);
        } else if (customBatch.isNewBatch) {
          formData.append('customBatch', JSON.stringify(customBatch));
        }
      }
      const finalVariants = variants.map((v, idx) => {
        const parsedPrice = v.price === '' ? (basePrice === '' ? 0 : basePrice) : v.price;
        const parsedCostPrice =
          v.costPrice === '' || v.costPrice === undefined ? (baseCostPrice === '' ? null : baseCostPrice) : v.costPrice;
        return {
          ...v,
          name: v.name || (idx === 0 && variants.length === 1 ? 'Default' : `Variant ${idx + 1}`),
          price: parsedPrice,
          costPrice: parsedCostPrice,
        };
      });

      formData.append('variants', JSON.stringify(finalVariants));
      const validSpecs = specifications.filter((s) => s.key.trim() !== '' && s.value.trim() !== '');
      formData.append('specifications', JSON.stringify(validSpecs));
      if (categoryId) formData.append('categoryId', categoryId);
      if (vendor) formData.append('vendor', vendor);
      formData.append('stockUnit', stockUnit);
      if (initialData) formData.append('id', initialData.id);

      if (finalUrls.length > 0) formData.append('imageUrls', JSON.stringify(finalUrls));

      const result = initialData ? await updateProductAction(formData) : await createProductAction(formData);

      if (result?.error) {
        toast.error(result.error);
      } else {
        await clearDraft();
        toast.success(initialData ? 'Product updated successfully!' : 'Product created successfully!');
      }
    });
  };

  const handleDiscard = async () => {
    await clearDraft();
    router.push('/dashboard/products');
  };

  return (
    <form onSubmit={handleSubmit} className="min-h-full flex flex-col w-full max-w-6xl mx-auto animate-fadeIn pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href="/dashboard/products"
            className="inline-flex items-center text-sm font-medium text-muted hover:text-brand-primary transition-colors mb-2"
          >
            <ArrowLeft size={16} className="mr-1.5" />
            Back to Catalog
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{initialData ? 'Edit Product' : 'Add New Product'}</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" type="button" disabled={isPending} onClick={handleDiscard}>
            Discard
          </Button>
          <Button variant="primary" type="submit" disabled={isPending}>
            {isPending
              ? initialData
                ? 'Saving...'
                : 'Publishing...'
              : initialData
                ? 'Save Changes'
                : 'Publish Product'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <ProductGeneralInfo
            name={name}
            description={description}
            onNameChange={setName}
            onDescriptionChange={setDescription}
          />

          <ProductSpecificationsCard specifications={specifications} onChange={setSpecifications} />

          <ProductImageUploader
            images={imageItems}
            onAddFiles={handleAddFiles}
            onRemoveImage={handleRemoveImage}
            onSetPrimaryImage={handleSetPrimaryImage}
          />

          <ProductVariantManager
            variants={variants}
            stores={stores}
            basePrice={basePrice}
            baseCostPrice={baseCostPrice}
            onAddVariant={handleAddVariant}
            onRemoveVariant={removeVariant}
            onUpdateVariant={updateVariant}
            onUpdateVariantInventory={updateVariantInventory}
          />
        </div>

        <div className="space-y-8">
          <ProductPricingCard
            basePrice={basePrice}
            baseCostPrice={baseCostPrice}
            onBasePriceChange={setBasePrice}
            onBaseCostPriceChange={setBaseCostPrice}
          />

          <ProductStatusCard
            isActive={isActive}
            availabilityStatus={availabilityStatus}
            preorderShippingMode={preorderShippingMode}
            batches={batches}
            selectedBatchId={selectedBatchId}
            customBatch={customBatch}
            productName={name}
            onIsActiveChange={setIsActive}
            onAvailabilityStatusChange={setAvailabilityStatus}
            onPreorderShippingModeChange={setPreorderShippingMode}
            onSelectBatchId={setSelectedBatchId}
            onCustomBatchChange={setCustomBatch}
          />

          <ProductOrganizationCard
            categories={categories}
            categoryId={categoryId}
            vendor={vendor}
            stockUnit={stockUnit}
            onCategoryIdChange={setCategoryId}
            onVendorChange={setVendor}
            onStockUnitChange={setStockUnit}
            onCategoriesUpdate={setCategories}
          />
        </div>
      </div>
    </form>
  );
}
