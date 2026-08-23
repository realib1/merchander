'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardBody, CardDescription } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { createOrderAction } from '@/app/actions/create-order';
import { Plus, Trash2, User, Package, MapPin, Search, Barcode } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/utils/format';
import { useFormStatus } from 'react-dom';

interface Variant {
  id: string;
  name: string;
  price: number;
  product_name: string;
  sku: string;
}

interface Store {
  id: string;
  name: string;
}

interface LineItem {
  id: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

function SubmitButtons({ paymentMethod }: { paymentMethod: string }) {
  const { pending } = useFormStatus();
  const isDirectConfirm = paymentMethod === 'cash_payment' || paymentMethod === 'cash_on_delivery';
  return (
    <>
      <Button variant="primary" type="submit" name="action" value="create" disabled={pending} className="w-full shadow-sm shadow-brand-primary/20">
        {pending ? 'Creating...' : (isDirectConfirm ? 'Confirm Order' : 'Create Order & Request Pay')}
      </Button>
      <Button variant="secondary" type="submit" name="action" value="draft" disabled={pending} className="w-full bg-surface-elevated hover:bg-surface-elevated/80">
        {pending ? 'Saving...' : 'Save as Draft'}
      </Button>
    </>
  );
}

function CustomerAutocomplete({
  customers,
  onSelect
}: {
  customers: Customer[];
  onSelect: (customer: Customer) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = search.length > 1
    ? customers.filter(c =>
      c.phone.includes(search) ||
      c.name.toLowerCase().includes(search.toLowerCase())
    )
    : [];

  return (
    <div className="relative w-full">
      <div className="mb-1.5 flex justify-between items-end">
        <label className="block text-sm font-medium text-text-primary">Search Existing Customer</label>
      </div>
      <div className="relative">
        <input
          type="text"
          className="w-full rounded-xl border border-separator bg-surface text-sm px-4 py-2.5 text-primary focus:border-brand-primary focus:ring-brand-primary outline-none transition-shadow placeholder:text-text-muted"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (e.target.value.length > 1) setIsOpen(true);
            else setIsOpen(false);
          }}
          onFocus={() => {
            if (search.length > 1) setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (filtered.length > 0) {
                onSelect(filtered[0]);
                setIsOpen(false);
                setSearch('');
              }
            }
          }}
        />
        {isOpen && filtered.length > 0 && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute z-50 w-full mt-1 bg-surface-elevated border border-separator rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
              {filtered.map(c => (
                <div
                  key={c.id}
                  className="px-4 py-3 text-sm border-b border-separator/50 hover:bg-surface cursor-pointer last:border-0"
                  onClick={() => {
                    onSelect(c);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <div className="font-semibold text-text-primary">{c.name}</div>
                  <div className="text-text-secondary text-xs">{c.phone}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function GlobalProductSearch({
  variants,
  onSelect
}: {
  variants: Variant[];
  onSelect: (variantId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = search.length > 0
    ? variants.filter(v => {
        const target = `${v.product_name} ${v.name || ''} ${v.sku}`.toLowerCase();
        const searchTerms = search.toLowerCase().trim().split(/\\s+/);
        return searchTerms.every(term => target.includes(term));
      })
    : [];

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-text-muted" />
        </div>
        <input
          type="text"
          className="w-full rounded-xl border border-separator bg-surface text-sm pl-10 pr-10 py-2.5 text-text-primary focus:border-brand-primary focus:ring-brand-primary outline-none transition-shadow placeholder:text-text-muted"
          placeholder="Search or scan barcode..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (e.target.value.length > 0) setIsOpen(true);
            else setIsOpen(false);
          }}
          onFocus={() => {
            if (search.length > 0) setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (filtered.length > 0) {
                onSelect(filtered[0].id);
                setIsOpen(false);
                setSearch('');
              }
            }
          }}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <Barcode className="h-5 w-5 text-text-muted" />
        </div>
        {isOpen && search.length > 0 && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute z-50 w-full mt-1 bg-surface-elevated border border-separator rounded-xl shadow-lg overflow-hidden max-h-96 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-4 text-sm text-text-muted text-center">No products found</div>
              ) : (
                filtered.map(v => (
                  <div
                    key={v.id}
                    className="px-4 py-3 border-b border-separator/50 hover:bg-surface cursor-pointer flex items-center gap-3 last:border-0"
                    onClick={() => {
                      onSelect(v.id);
                      setIsOpen(false);
                      setSearch('');
                    }}
                  >
                    <div className="w-8 h-8 shrink-0 bg-surface-elevated rounded border border-separator flex items-center justify-center overflow-hidden">
                      <Package className="w-4 h-4 text-text-muted opacity-50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-text-primary truncate">{v.product_name} {v.name ? `- ${v.name}` : ''}</div>
                      <div className="text-xs text-text-secondary">{formatCurrency(v.price)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function CreateOrderForm({ variants, stores, userRole, customers }: { variants: Variant[], stores: Store[], userRole: string, customers: Customer[] }) {
  const [items, setItems] = useState<LineItem[]>([]);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [custPhone, setCustPhone] = useState('');
  const [custName, setCustName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('momo');

  const handleAddProduct = (variantId: string) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;
    
    // Check if variant already exists in order
    const existing = items.find(i => i.variantId === variantId);
    if (existing) {
      setItems(items.map(i => i.variantId === variantId ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, {
        id: Math.random().toString(36).substring(7),
        variantId: variantId,
        quantity: 1,
        unitPrice: variant.price
      }]);
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof LineItem, value: unknown) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // If variant changes, update unit price
        if (field === 'variantId') {
          const variant = variants.find(v => v.id === value);
          if (variant) updated.unitPrice = variant.price;
        }
        return updated;
      }
      return item;
    }));
  };

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    const res = await createOrderAction(formData);
    if (res?.error) {
      setError(res.error);
    }
  };

  const subtotal = items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const total = subtotal + deliveryFee;

  return (
    <form action={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pb-12">
      {error && (
        <div className="lg:col-span-3 p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      {/* Main Content (Left Column) */}
      <div className="lg:col-span-2 space-y-6">
        <Card className='relative z-20'>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Order Items</CardTitle>
                  <CardDescription>Select products and quantities.</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <GlobalProductSearch variants={variants} onSelect={handleAddProduct} />
            
            <div className="space-y-3 mt-2">
              {items.length === 0 ? (
                <div className="text-center p-8 bg-surface-elevated rounded-xl border border-dashed border-separator">
                  <p className="text-text-muted text-sm">No items added yet. Search above to add products.</p>
                </div>
              ) : (
                items.map((item) => {
                  const variant = variants.find(v => v.id === item.variantId);
                  return (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-surface-elevated rounded-xl border border-separator">
                      <div className="flex items-center gap-3 w-full sm:w-auto flex-1 min-w-0">
                        {/* Image Placeholder */}
                        <div className="w-12 h-12 shrink-0 bg-surface rounded-lg border border-separator flex items-center justify-center overflow-hidden">
                          <Package className="w-5 h-5 text-text-muted opacity-50" />
                        </div>

                        {/* Name & Price */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-text-primary truncate">
                            {variant?.product_name} {variant?.name ? `- ${variant.name}` : ''}
                          </h4>
                          <p className="text-xs text-text-secondary mt-0.5">{formatCurrency(item.unitPrice)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                        {/* Quantity */}
                        <div className="w-24 shrink-0">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full rounded-lg border border-separator bg-surface text-sm px-3 py-2 text-text-primary focus:border-brand-primary outline-none text-center"
                          />
                        </div>

                        {/* Line Total */}
                        <div className="flex-1 sm:w-24 text-right">
                          <span className="font-semibold text-text-primary">{formatCurrency(item.unitPrice * item.quantity)}</span>
                        </div>

                        {/* Delete */}
                        <button type="button" onClick={() => removeItem(item.id)} className="p-2 -mr-2 text-text-muted hover:text-red-500 transition-colors shrink-0">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardBody>
        </Card>

      </div>

      {/* Sidebar Content (Right Column) */}
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <User className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Customer Details</CardTitle>
                <CardDescription className="text-xs">Optional for walk-ins</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            {customers && customers.length > 0 && (
              <div className="pb-4 border-b border-separator">
                <CustomerAutocomplete
                  customers={customers}
                  onSelect={(c) => {
                    setCustPhone(c.phone);
                    setCustName(c.name);
                  }}
                />
              </div>
            )}
            <div className="space-y-4">
              <FormField
                name="customerPhone"
                label="Phone Number"
                placeholder="e.g. 024 123 4567"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
              />
              <FormField
                name="customerName"
                label="Full Name"
                placeholder="e.g. Walk-in Customer"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Delivery Info</CardTitle>
                <CardDescription className="text-xs">Optional</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <FormField
              name="deliveryAddress"
              label="Delivery Address"
              placeholder="e.g. Jisonayili, Near Central Mosque"
              isTextarea
              rows={2}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Fulfillment</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Fulfillment Branch</label>
              {(userRole === 'admin' || userRole === 'owner') ? (
                <select
                  name="storeId"
                  className="w-full rounded-xl border-separator bg-surface text-sm px-4 py-2.5 text-text-primary focus:border-brand-primary focus:ring-brand-primary outline-none transition-shadow"
                  required
                >
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <>
                  <input type="hidden" name="storeId" value={stores[0]?.id || ''} />
                  <div className="w-full rounded-xl border border-separator bg-surface-elevated/50 text-sm px-4 py-2.5 text-text-secondary cursor-not-allowed">
                    {stores[0]?.name || 'No Branch Available'}
                  </div>
                </>
              )}
            </div>
            <FormField
              name="deliveryFee"
              label="Delivery Fee (GHS)"
              type="number"
              min="0"
              step="0.01"
              value={deliveryFee.toString()}
              onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardBody>
            <select
              name="paymentMethod"
              className="w-full rounded-xl border border-separator bg-surface text-sm px-4 py-2.5 text-text-primary focus:border-brand-primary focus:ring-brand-primary outline-none transition-shadow"
              required
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="momo">Mobile Money (MoMo)</option>
              <option value="card_payment">Card Payment</option>
              <option value="cash_payment">Cash Payment</option>
              <option value="cash_on_delivery">Cash on Delivery</option>

            </select>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Subtotal</span>
                <span className="font-medium text-text-primary">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm pb-3 border-b border-separator">
                <span className="text-text-secondary">Delivery</span>
                <span className="font-medium text-text-primary">{formatCurrency(deliveryFee)}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="font-semibold text-text-primary">Total: </span>
                <span className="text-lg font-bold text-text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="flex flex-col gap-3 sticky top-6">
          <SubmitButtons paymentMethod={paymentMethod} />
          <Link href="/dashboard/orders" className="w-full">
            <Button variant="outline" type="button" className="w-full border-separator text-text-secondary hover:text-brand-primary">Cancel</Button>
          </Link>
        </div>
      </div>
    </form>
  );
}
