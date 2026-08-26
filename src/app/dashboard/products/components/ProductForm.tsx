'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createProductAction } from '@/app/actions/create-product';
import { updateProductAction } from '@/app/actions/update-product';
import { createCategoryAction } from '@/app/actions/create-category';
import { UploadCloud, Plus, Trash2, ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { saveFilesToDraft, getFilesFromDraft, clearFilesFromDraft } from '@/lib/draft';

interface Store {
  id: string;
  name: string;
  location: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface VariantState {
  id: string; // temporary local id
  sku: string;
  name: string;
  price: number | '';
  costPrice?: number | '';
  inventory: Record<string, number>; // storeId -> quantity
}

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
  preorderShippingMode: 'included' | 'tbd';
  variants: VariantState[];
}

interface ProductFormProps {
  stores: Store[];
  categories: Category[];
  initialData?: InitialProductData;
}

export function ProductForm({ stores, categories: initialCategories, initialData }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form State
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [availabilityStatus, setAvailabilityStatus] = useState<'AVAILABLE' | 'PRE_ORDER' | 'OUT_OF_STOCK'>(initialData?.availabilityStatus ?? 'AVAILABLE');
  const [preorderShippingMode, setPreorderShippingMode] = useState<'included' | 'tbd'>(initialData?.preorderShippingMode ?? 'included');
  const [categoryId, setCategoryId] = useState<string>(initialData?.categoryId ?? '');
  const [vendor, setVendor] = useState<string>(initialData?.vendor ?? '');
  const [stockUnit, setStockUnit] = useState<string>(initialData?.stockUnit ?? 'pcs');
  const [files, setFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(initialData?.imageUrls ?? []);

  // Category UI State
  const [categories, setCategories] = useState<Category[]>(initialCategories);

  // Sync with server on revalidate
  // Sync with server on revalidate
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCategories(initialCategories);
  }, [initialCategories]);

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Variants State - initialize with one default variant
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

  const [isLoaded, setIsLoaded] = useState(!!initialData);

  // Load draft on mount (only if NOT editing)
  useEffect(() => {
    if (initialData) return;
    const draft = sessionStorage.getItem('product-form-draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (parsed.name !== undefined) setName(parsed.name);
        if (parsed.description !== undefined) setDescription(parsed.description);
        if (parsed.isActive !== undefined) setIsActive(parsed.isActive);
        if (parsed.availabilityStatus !== undefined) setAvailabilityStatus(parsed.availabilityStatus);
        if (parsed.preorderShippingMode !== undefined) setPreorderShippingMode(parsed.preorderShippingMode);
        if (parsed.categoryId !== undefined) setCategoryId(parsed.categoryId);
        if (parsed.vendor !== undefined) setVendor(parsed.vendor);
        if (parsed.stockUnit !== undefined) setStockUnit(parsed.stockUnit);
        if (parsed.variants !== undefined) setVariants(parsed.variants);
        if (parsed.basePrice !== undefined) setBasePrice(parsed.basePrice);
        if (parsed.baseCostPrice !== undefined) setBaseCostPrice(parsed.baseCostPrice);
      } catch {
        // ignore parse errors
      }
    }

    // Load files from IndexedDB draft
    getFilesFromDraft('product-images')
      .then((draftFiles) => {
        if (draftFiles && draftFiles.length > 0) {
          setFiles(draftFiles);
        }
        setIsLoaded(true);
      })
      .catch((e) => {
        console.error('Failed to load drafted files', e);
        setIsLoaded(true);
      });
  }, [initialData]);

  useEffect(() => {
    if (!isLoaded || initialData) return;
    const draft = { name, description, isActive, availabilityStatus, preorderShippingMode, categoryId, vendor, stockUnit, variants, basePrice, baseCostPrice };
    sessionStorage.setItem('product-form-draft', JSON.stringify(draft));
    saveFilesToDraft('product-images', files).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, description, isActive, availabilityStatus, preorderShippingMode, categoryId, vendor, stockUnit, variants, basePrice, baseCostPrice, files, isLoaded]);

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        id: Math.random().toString(36).substr(2, 9),
        sku: '',
        name: '',
        price: '',
        costPrice: '',
        inventory: {},
      },
    ]);
  };

  const removeVariant = (id: string) => {
    if (variants.length === 1) return; // Prevent removing last variant
    setVariants(variants.filter((v) => v.id !== id));
  };

  const updateVariant = (id: string, field: keyof VariantState, value: VariantState[keyof VariantState]) => {
    setVariants(variants.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
    }
    // Reset input so the same files can be selected again if removed
    e.target.value = '';
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsSavingCategory(true);
    const fd = new FormData();
    fd.append('name', newCategoryName);
    const result = await createCategoryAction(fd);
    if (result.error) {
      toast.error(result.error);
    } else if (result.category) {
      setCategories([...categories, result.category].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryId(result.category.id);
      setNewCategoryName('');
      setIsCreatingCategory(false);
    }
    setIsSavingCategory(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const uploadedUrls: string[] = [];

      if (files.length > 0) {
        const supabase = createClient();
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
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
            uploadedUrls.push(publicUrl);
          }
        }
      }

      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('isActive', isActive.toString());
      formData.append('availabilityStatus', availabilityStatus);
      formData.append('preorderShippingMode', preorderShippingMode);
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
      if (categoryId) formData.append('categoryId', categoryId);
      if (vendor) formData.append('vendor', vendor);
      formData.append('stockUnit', stockUnit);
      if (initialData) formData.append('id', initialData.id);

      const allImageUrls = [...existingImages, ...uploadedUrls];
      if (allImageUrls.length > 0) formData.append('imageUrls', JSON.stringify(allImageUrls));

      let result;
      if (initialData) {
        result = await updateProductAction(formData);
      } else {
        result = await createProductAction(formData);
      }

      if (result?.error) {
        toast.error(result.error);
      } else {
        if (!initialData) {
          sessionStorage.removeItem('product-form-draft');
          clearFilesFromDraft('product-images').catch(console.error);
        }
        toast.success(initialData ? 'Product updated successfully!' : 'Product created successfully!');
      }
      // If success, the action handles the redirect
    });
  };

  const handleDiscard = async () => {
    if (!initialData) {
      sessionStorage.removeItem('product-form-draft');
      await clearFilesFromDraft('product-images').catch(console.error);
    }

    // Reset local state just in case
    setName('');
    setDescription('');
    setBasePrice('');
    setBaseCostPrice('');
    setCategoryId('');
    setVendor('');
    setStockUnit('pcs');
    setVariants([
      {
        id: 'default',
        sku: '',
        name: 'Default',
        price: '',
        costPrice: '',
        inventory: {},
      },
    ]);
    setFiles([]);

    router.push('/dashboard/products');
  };

  return (
    <form onSubmit={handleSubmit} className="min-h-full flex flex-col w-full max-w-6xl mx-auto animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href="/dashboard/products"
            className="inline-flex items-center text-sm font-medium text-muted hover:text-brand-primary transition-colors mb-2"
          >
            <ArrowLeft size={16} className="mr-1.5" />
            Back to Catalog
          </Link>
          <h1 className="text-3xl font-bold  tracking-tight">{initialData ? 'Edit Product' : 'Add New Product'}</h1>
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

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>Core information about your product.</CardDescription>
            </CardHeader>
            <CardBody className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="product-name" className="text-body-sm font-semibold">
                  Name{' '}
                  <span className="text-destructive" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  id="product-name"
                  type="text"
                  required
                  aria-required="true"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Authentic Kente Cloth"
                  className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm  focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-muted"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="product-description" className="text-body-sm font-semibold">
                  Description
                </label>
                <textarea
                  id="product-description"
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a detailed description..."
                  className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm  focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-muted resize-y"
                />
              </div>
            </CardBody>
          </Card>

          {/* Product Images Card */}
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
              <CardDescription>Upload up to 5 images. The first image will be used as the cover.</CardDescription>
            </CardHeader>
            <CardBody>
              {files.length === 0 && existingImages.length === 0 ? (
                <div className="border-2 border-dashed border-separator rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-surface-elevated transition-colors cursor-pointer relative overflow-hidden group">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleFileChange}
                  />
                  <div className="w-16 h-16 bg-surface border border-separator rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <UploadCloud className="w-8 h-8 text-brand-primary" />
                  </div>
                  <p className="text-sm font-semibold">Click or drag images to upload</p>
                  <p className="text-xs text-muted mt-2">SVG, PNG, JPG or GIF (max. 5MB)</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Existing Images */}
                  {existingImages.map((url, index) => (
                    <div
                      key={`existing-${index}`}
                      className={`relative group rounded-xl overflow-hidden border border-separator bg-surface-elevated ${index === 0 ? 'col-span-2 row-span-2 aspect-square sm:aspect-auto' : 'col-span-1 aspect-square'}`}
                    >
                      <Image
                        src={url}
                        alt="existing preview"
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transform hover:scale-110 transition-all"
                          title="Remove image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {index === 0 && (
                        <div className="absolute top-3 left-3 px-2.5 py-1 text-white text-caption font-bold rounded shadow-md uppercase tracking-wider backdrop-blur-sm bg-brand-primary/90">
                          Cover
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Newly Uploaded Files */}
                  {files.map((file, index) => {
                    const globalIndex = existingImages.length + index;
                    return (
                      <div
                        key={`new-${index}`}
                        className={`relative group rounded-xl overflow-hidden border border-separator bg-surface-elevated ${globalIndex === 0 ? 'col-span-2 row-span-2 aspect-square sm:aspect-auto' : 'col-span-1 aspect-square'}`}
                      >
                        <Image
                          src={URL.createObjectURL(file)}
                          alt="preview"
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transform hover:scale-110 transition-all"
                            title="Remove image"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {globalIndex === 0 && (
                          <div className="absolute top-3 left-3 px-2.5 py-1 text-white text-caption font-bold rounded shadow-md uppercase tracking-wider backdrop-blur-sm bg-brand-primary/90">
                            Cover
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {files.length + existingImages.length < 5 && (
                    <div className="col-span-1 aspect-square border-2 border-dashed border-separator rounded-xl flex flex-col items-center justify-center text-center hover:bg-surface-elevated transition-colors cursor-pointer relative group">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={handleFileChange}
                      />
                      <div className="w-10 h-10 bg-surface rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm border border-separator mb-2">
                        <Plus className="w-5 h-5 text-muted group-hover:text-brand-primary transition-colors" />
                      </div>
                      <span className="text-xs font-medium text-muted group-hover:text-brand-primary transition-colors">
                        Add Image
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Variants / Pricing & Inventory Card */}
          <Card>
            <CardHeader>
              <CardTitle>{variants.length === 1 ? 'Pricing & Inventory' : 'Variants'}</CardTitle>
              <CardDescription>
                {variants.length === 1
                  ? 'Set the base price, SKU, and available stock across your branches.'
                  : 'Manage pricing and inventory for each product variation.'}
              </CardDescription>
            </CardHeader>
            <CardBody>
              <div className="space-y-6">
                {variants.map((variant, index) => (
                  <div
                    key={variant.id}
                    className={`relative transition-all ${variants.length > 1 ? 'p-5 bg-surface-elevated border border-separator rounded-xl group hover:border-brand-primary' : ''}`}
                  >
                    {variants.length > 1 && (
                      <div className="flex justify-between items-center mb-5">
                        <h4 className="text-sm font-semibold">Variant {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeVariant(variant.id)}
                          className="text-muted hover:text-red-500 p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div
                      className={`grid grid-cols-1 md:grid-cols-2 ${variants.length > 1 ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-5 mb-6`}
                    >
                      {/* Name (Only show if multiple variants) */}
                      {variants.length > 1 && (
                        <div className="space-y-2 lg:col-span-1">
                          <label className="text-body-sm font-medium">Option Name</label>
                          <input
                            type="text"
                            required
                            value={variant.name}
                            onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                            placeholder="e.g. Large"
                            className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm  focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-muted"
                          />
                        </div>
                      )}

                      {/* Price (Only show if multiple variants, else base price is used) */}
                      {variants.length > 1 && (
                        <div className="space-y-2 lg:col-span-1">
                          <label className="text-body-sm font-medium">Price (GHS)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">
                              ₵
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={variant.price === '' ? '' : variant.price}
                              onChange={(e) =>
                                updateVariant(
                                  variant.id,
                                  'price',
                                  e.target.value === '' ? '' : parseFloat(e.target.value)
                                )
                              }
                              placeholder={basePrice === '' ? '0.00' : `Base: ₵${basePrice}`}
                              className="w-full pl-8 pr-3 py-2 bg-surface border border-separator rounded-lg text-sm  focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-muted"
                            />
                          </div>
                        </div>
                      )}

                      {/* Cost Price */}
                      {variants.length > 1 && (
                        <div className="space-y-2 lg:col-span-1">
                          <label className="text-body-sm font-medium">Cost Price</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">
                              ₵
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                variant.costPrice === '' || variant.costPrice === undefined ? '' : variant.costPrice
                              }
                              onChange={(e) =>
                                updateVariant(
                                  variant.id,
                                  'costPrice',
                                  e.target.value === '' ? '' : parseFloat(e.target.value)
                                )
                              }
                              placeholder={baseCostPrice === '' ? '0.00' : `Base: ₵${baseCostPrice}`}
                              className="w-full pl-8 pr-3 py-2 bg-surface border border-separator rounded-lg text-sm  focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-muted"
                            />
                          </div>
                        </div>
                      )}

                      {/* SKU */}
                      <div className={`space-y-2 lg:col-span-1`}>
                        <label className="text-body-sm font-medium">SKU (Stock Keeping Unit)</label>
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                          placeholder="e.g. KENTE-RED-L"
                          className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm  focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-muted uppercase"
                        />
                      </div>
                    </div>

                    <div className={`${variants.length > 1 ? 'border-t border-separator pt-5' : ''}`}>
                      <h5 className="text-body-sm font-medium  mb-3">Available Inventory</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stores.map((store) => (
                          <div
                            key={store.id}
                            className="flex items-center justify-between p-3 bg-surface-elevated border border-separator rounded-lg"
                          >
                            <span className="text-sm font-medium  truncate mr-3">{store.name}</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={variant.inventory[store.id] || ''}
                              onChange={(e) =>
                                updateVariantInventory(variant.id, store.id, parseInt(e.target.value) || 0)
                              }
                              className="w-20 px-2 py-1 bg-surface border border-separator rounded text-sm  text-center focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-muted"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddVariant}
                  className="w-full h-11 border-dashed border-2 hover:bg-surface-elevated transition-colors  hover:text-brand-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {variants.length === 1 ? 'Add Options like Size or Color' : 'Add Another Variant'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* RIGHT COLUMN - Sidebar */}
        <div className="space-y-8">
          {/* Base Pricing Card */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>Set the default base price for this product.</CardDescription>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-body-sm font-semibold">Selling Price (GHS)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">₵</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={basePrice === '' ? '' : basePrice}
                      onChange={(e) => setBasePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 bg-surface border border-separator rounded-lg text-sm  focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-body-sm font-semibold">Cost Price (GHS)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">₵</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={baseCostPrice === '' ? '' : baseCostPrice}
                      onChange={(e) => setBaseCostPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 bg-surface border border-separator rounded-lg text-sm  focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-muted"
                    />
                  </div>
                  <p className="text-xs text-muted">Used for profit calculation (not visible to customers).</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardBody>
              <label htmlFor="product-status" className="sr-only">
                Product Status
              </label>
              <select
                id="product-status"
                value={isActive ? 'active' : 'draft'}
                onChange={(e) => setIsActive(e.target.value === 'active')}
                className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm  focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all mb-4"
              >
                <option value="active">Active (Published)</option>
                <option value="draft">Draft (Hidden)</option>
              </select>

              <label htmlFor="availability-status" className="text-body-sm font-semibold mb-2 block">
                Availability
              </label>
              <select
                id="availability-status"
                value={availabilityStatus}
                onChange={(e) => setAvailabilityStatus(e.target.value as 'AVAILABLE' | 'PRE_ORDER' | 'OUT_OF_STOCK')}
                className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm  focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
              >
                <option value="AVAILABLE">Available</option>
                <option value="PRE_ORDER">Pre-Order</option>
              </select>

              {availabilityStatus === 'PRE_ORDER' && (
                <div className="mt-4">
                  <label htmlFor="preorder-shipping-mode" className="text-body-sm font-semibold mb-2 block">
                    Pre-Order Shipping
                  </label>
                  <select
                    id="preorder-shipping-mode"
                    value={preorderShippingMode}
                    onChange={(e) => setPreorderShippingMode(e.target.value as 'included' | 'tbd')}
                    className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                  >
                    <option value="included">Shipping Included in Price</option>
                    <option value="tbd">TBD (Calculated on Arrival)</option>
                  </select>
                  <p className="text-xs text-muted mt-1.5">
                    If TBD, customer pays shipping fee when goods arrive.
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Organization Card */}
          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="product-category" className="text-body-sm font-semibold">
                    Category
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                    className="text-xs font-medium text-brand-primary hover:text-brand-primary/80 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {isCreatingCategory ? <X size={12} /> : <Plus size={12} />}
                    {isCreatingCategory ? 'Cancel' : 'Add Category'}
                  </button>
                </div>

                {isCreatingCategory ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name"
                      className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm  focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-muted"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveCategory();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handleSaveCategory}
                      disabled={isSavingCategory || !newCategoryName.trim()}
                      className="text-xs px-3"
                    >
                      {isSavingCategory ? '...' : 'Save'}
                    </Button>
                  </div>
                ) : (
                  <select
                    id="product-category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm  focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="product-vendor" className="text-body-sm font-semibold">
                  Vendor
                </label>
                <input
                  id="product-vendor"
                  type="text"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="e.g. Merchander"
                  className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm  focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-muted"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="product-stock-unit" className="text-body-sm font-semibold">
                  Stock Unit
                </label>
                <div className="relative">
                  <select
                    id="product-stock-unit"
                    value={stockUnit}
                    onChange={(e) => setStockUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm  focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all appearance-none cursor-pointer"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="lbs">Pounds (lbs)</option>
                    <option value="oz">Ounces (oz)</option>
                    <option value="l">Liters (l)</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="box">Boxes</option>
                    <option value="carton">Cartons</option>
                    <option value="pack">Packs</option>
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </form>
  );
}
