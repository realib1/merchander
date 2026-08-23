'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createProductAction } from '@/app/actions/create-product';
import { createCategoryAction } from '@/app/actions/create-category';
import { UploadCloud, Plus, Trash2, Settings, ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

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
  price: number;
  inventory: Record<string, number>; // storeId -> quantity
}

export function ProductForm({ stores, categories: initialCategories }: { stores: Store[], categories: Category[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [categoryId, setCategoryId] = useState('');
  const [vendor, setVendor] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  
  // Category UI State
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Variants State - initialize with one default variant
  const [variants, setVariants] = useState<VariantState[]>([{
    id: 'default',
    sku: '',
    name: 'Default',
    price: 0,
    inventory: {}
  }]);

  const handleAddVariant = () => {
    setVariants([...variants, {
      id: Math.random().toString(36).substr(2, 9),
      sku: '',
      name: '',
      price: variants[0]?.price || 0,
      inventory: {}
    }]);
  };

  const handleRemoveVariant = (id: string) => {
    if (variants.length === 1) return; // Prevent removing last variant
    setVariants(variants.filter(v => v.id !== id));
  };

  const updateVariant = (id: string, field: keyof VariantState, value: VariantState[keyof VariantState]) => {
    setVariants(variants.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  const updateVariantInventory = (variantId: string, storeId: string, quantity: number) => {
    setVariants(variants.map(v => {
      if (v.id === variantId) {
        return {
          ...v,
          inventory: {
            ...v.inventory,
            [storeId]: quantity
          }
        };
      }
      return v;
    }));
  };

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsSavingCategory(true);
    const fd = new FormData();
    fd.append('name', newCategoryName);
    const result = await createCategoryAction(fd);
    if (result.error) {
      setError(result.error);
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
    setError(null);
    
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
            setError(`Failed to upload ${file.name}`);
            return;
          }
          
          if (uploadData) {
            const { data: { publicUrl } } = supabase.storage
              .from('product-images')
              .getPublicUrl(fileName);
            uploadedUrls.push(publicUrl);
          }
        }
      }

      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('isActive', isActive.toString());
      formData.append('variants', JSON.stringify(variants));
      if (categoryId) formData.append('categoryId', categoryId);
      if (vendor) formData.append('vendor', vendor);
      if (uploadedUrls.length > 0) formData.append('imageUrls', JSON.stringify(uploadedUrls));

      const result = await createProductAction(formData);
      if (result?.error) {
        setError(result.error);
      }
      // If success, the action handles the redirect
    });
  };

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col w-full max-w-6xl mx-auto animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link 
            href="/dashboard/products" 
            className="inline-flex items-center text-sm font-medium text-text-muted hover:text-text-primary transition-colors mb-2"
          >
            <ArrowLeft size={16} className="mr-1.5" />
            Back to Catalog
          </Link>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Add New Product</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/dashboard/products">
            <Button variant="outline" type="button" disabled={isPending}>Discard</Button>
          </Link>
          <Button variant="primary" type="submit" disabled={isPending}>
            {isPending ? 'Publishing...' : 'Publish Product'}
          </Button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-sm font-medium">
          {error}
        </div>
      )}

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
                <label htmlFor="product-name" className="text-[13px] font-semibold text-text-primary">Name <span className="text-destructive" aria-hidden="true">*</span></label>
                <input 
                  id="product-name"
                  type="text"
                  required
                  aria-required="true"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Authentic Kente Cloth"
                  className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-text-muted"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="product-description" className="text-[13px] font-semibold text-text-primary">Description</label>
                <textarea 
                  id="product-description"
                  rows={5}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Provide a detailed description..."
                  className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-text-muted resize-y"
                />
              </div>
            </CardBody>
          </Card>

          {/* Images Card */}
          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
              <CardDescription>Upload product images.</CardDescription>
            </CardHeader>
            <CardBody>
              <div className="border-2 border-dashed border-separator rounded-xl p-10 flex flex-col items-center justify-center text-center bg-surface-elevated/10 relative transition-colors hover:bg-surface-elevated/30">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                  title="Choose images"
                />
                {files.length > 0 ? (
                  <div className="flex flex-wrap gap-3 z-10 w-full justify-center">
                    {files.map((file, i) => (
                      <div key={i} className="relative group bg-surface border border-separator rounded-lg p-2 text-xs flex items-center gap-2 max-w-[150px]">
                        <span className="truncate">{file.name}</span>
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.preventDefault();
                            setFiles(files.filter((_, idx) => idx !== i));
                          }}
                          className="absolute -top-2 -right-2 bg-surface border border-separator rounded-full p-0.5 text-text-muted hover:text-red-500 z-30 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <div className="w-full mt-4 flex justify-center">
                      <Button variant="outline" type="button" className="text-xs h-8 relative z-30 pointer-events-none">
                        Add More
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-surface border border-separator rounded-full shadow-sm mb-4">
                      <UploadCloud size={24} className="text-text-muted" />
                    </div>
                    <h4 className="text-sm font-semibold text-text-primary mb-1">Drag and drop your images</h4>
                    <p className="text-xs text-text-secondary mb-4">Supports JPG, PNG, WEBP. Max size 5MB.</p>
                    <Button variant="outline" type="button" className="text-xs h-8 pointer-events-none">
                      Browse Files
                    </Button>
                  </>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Variants Card */}
          <Card>
            <CardHeader className="flex flex-row items-start justify-between pb-4 border-b border-separator/30">
              <div>
                <CardTitle>Variants & Inventory</CardTitle>
                <CardDescription>Manage SKUs, pricing, and stock for different product options.</CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={handleAddVariant} className="text-xs h-8 gap-1">
                <Plus size={14} /> Add Variant
              </Button>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-separator/30">
                {variants.map((variant, index) => (
                  <div key={variant.id} className="p-5 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 font-medium text-sm text-text-primary">
                        <div className="h-6 w-6 rounded bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs">
                          {index + 1}
                        </div>
                        Variant Details
                      </div>
                      {variants.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveVariant(variant.id)}
                          className="text-text-muted hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor={`variant-name-${variant.id}`} className="text-xs font-semibold text-text-secondary">Variant Name</label>
                        <input 
                          id={`variant-name-${variant.id}`}
                          type="text" 
                          required
                          aria-required="true"
                          value={variant.name}
                          onChange={e => updateVariant(variant.id, 'name', e.target.value)}
                          placeholder="e.g. Red / Large"
                          className="w-full px-2.5 py-1.5 bg-surface border border-separator rounded-md text-[13px] text-text-primary focus:outline-none focus:border-brand-primary transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor={`variant-sku-${variant.id}`} className="text-xs font-semibold text-text-secondary">SKU</label>
                        <input 
                          id={`variant-sku-${variant.id}`}
                          type="text" 
                          required
                          aria-required="true"
                          value={variant.sku}
                          onChange={e => updateVariant(variant.id, 'sku', e.target.value)}
                          placeholder="SKU-123"
                          className="w-full px-2.5 py-1.5 bg-surface border border-separator rounded-md text-[13px] text-text-primary focus:outline-none focus:border-brand-primary transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor={`variant-price-${variant.id}`} className="text-xs font-semibold text-text-secondary">Price (GHS)</label>
                        <input 
                          id={`variant-price-${variant.id}`}
                          type="number" 
                          required
                          aria-required="true"
                          min="0"
                          step="0.01"
                          value={variant.price || ''}
                          onChange={e => updateVariant(variant.id, 'price', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-full px-2.5 py-1.5 bg-surface border border-separator rounded-md text-[13px] text-text-primary focus:outline-none focus:border-brand-primary transition-colors"
                        />
                      </div>
                    </div>

                    <div className="bg-surface-elevated/30 rounded-lg p-4 border border-separator/50 mt-2">
                      <h4 className="text-xs font-semibold text-text-primary mb-3 flex items-center gap-2">
                        <Settings size={14} className="text-text-muted" />
                        Initial Stock Allocation
                      </h4>
                      {(!stores || stores.length === 0) ? (
                        <p className="text-xs text-text-secondary">No stores found.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {stores.map(store => (
                            <div key={store.id} className="flex items-center justify-between gap-3 bg-surface border border-separator rounded-md p-2">
                              <span className="text-xs font-medium text-text-secondary truncate">{store.name}</span>
                              <input 
                                type="number" 
                                min="0"
                                value={variant.inventory[store.id] || ''}
                                onChange={e => updateVariantInventory(variant.id, store.id, parseInt(e.target.value, 10) || 0)}
                                placeholder="0"
                                className="w-20 px-2 py-1 bg-surface-elevated border border-separator rounded text-xs text-text-primary text-right focus:outline-none focus:border-brand-primary"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

        </div>

        {/* RIGHT COLUMN - Sidebar */}
        <div className="space-y-6">
          
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardBody>
              <label htmlFor="product-status" className="sr-only">Product Status</label>
              <select 
                id="product-status"
                value={isActive ? 'active' : 'draft'}
                onChange={e => setIsActive(e.target.value === 'active')}
                className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
              >
                <option value="active">Active (Published)</option>
                <option value="draft">Draft (Hidden)</option>
              </select>
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
                  <label htmlFor="product-category" className="text-[13px] font-semibold text-text-primary">Category</label>
                  <button 
                    type="button" 
                    onClick={() => setIsCreatingCategory(!isCreatingCategory)} 
                    className="text-xs font-medium text-brand-primary hover:text-brand-primary/80 transition-colors flex items-center gap-1"
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
                      onChange={e => setNewCategoryName(e.target.value)}
                      placeholder="Category name"
                      className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-text-muted"
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
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                  >
                    <option value="">Select Category...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="product-vendor" className="text-[13px] font-semibold text-text-primary">Vendor</label>
                <input 
                  id="product-vendor"
                  type="text" 
                  value={vendor}
                  onChange={e => setVendor(e.target.value)}
                  placeholder="e.g. Merchander"
                  className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-text-muted"
                />
              </div>
            </CardBody>
          </Card>

        </div>

      </div>
    </form>
  );
}
