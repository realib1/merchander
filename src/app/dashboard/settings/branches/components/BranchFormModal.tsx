'use client';

import React, { useState } from 'react';
import { BranchData, BranchInput } from '@/types/branches';
import { X, Loader2, Store, Phone, MessageCircle, Navigation, Check } from 'lucide-react';

const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Central',
  'Eastern',
  'Western',
  'Volta',
  'Northern',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
  'Oti',
  'Savannah',
  'North East',
  'Western North',
];

interface BranchFormModalProps {
  branch?: BranchData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: BranchInput) => Promise<void>;
  isPending?: boolean;
}

export function BranchFormModal({ branch, isOpen, onClose, onSave, isPending = false }: BranchFormModalProps) {
  const isEditing = Boolean(branch);

  const [name, setName] = useState(branch?.name || '');
  const [streetAddress, setStreetAddress] = useState(branch?.street_address || '');
  const [city, setCity] = useState(branch?.city || 'Accra');
  const [region, setRegion] = useState(branch?.region || 'Greater Accra');
  const [landmark, setLandmark] = useState(branch?.landmark || '');
  const [digitalAddress, setDigitalAddress] = useState(branch?.digital_address || '');
  const [phone, setPhone] = useState(branch?.phone || '');
  const [whatsappPhone, setWhatsappPhone] = useState(branch?.whatsapp_phone || '');
  const [pickupEnabled, setPickupEnabled] = useState(branch?.pickup_enabled ?? true);
  const [isPrimary, setIsPrimary] = useState(branch?.is_primary ?? false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      name,
      street_address: streetAddress,
      city,
      region,
      landmark,
      digital_address: digitalAddress,
      phone,
      whatsapp_phone: whatsappPhone,
      pickup_enabled: pickupEnabled,
      is_primary: isPrimary,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface border border-separator rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-separator/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
              <Store size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground font-display">
                {isEditing ? 'Edit Branch Location' : 'Add New Branch'}
              </h2>
              <p className="text-xs text-muted">Manage location, address, and customer pickup options.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Branch Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Osu Oxford Street Main Branch"
              className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-surface-elevated border border-separator rounded-xl px-3 py-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
              >
                {GHANA_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">City / Town *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Accra, Kumasi, Takoradi"
                className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Street Address</label>
            <input
              type="text"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              placeholder="e.g. 14 Oxford Street, Near Danquah Circle"
              className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                <Navigation size={12} className="text-brand-primary" /> GhanaPost GPS (Digital Code)
              </label>
              <input
                type="text"
                value={digitalAddress}
                onChange={(e) => setDigitalAddress(e.target.value.toUpperCase())}
                placeholder="e.g. GA-183-9022"
                className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs font-mono placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Landmark / Directions</label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Opposite Shell Filling Station"
                className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                <Phone size={12} className="text-muted" /> Branch Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 030 212 3456"
                className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                <MessageCircle size={12} className="text-success" /> Branch WhatsApp
              </label>
              <input
                type="tel"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="e.g. 024 123 4567"
                className="w-full bg-surface-elevated border border-separator rounded-xl px-3.5 py-2 text-xs placeholder:text-muted outline-none focus-visible:ring-1 focus-visible:ring-brand-primary transition"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-2 border-t border-separator/50 space-y-2.5">
            <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={pickupEnabled}
                onChange={(e) => setPickupEnabled(e.target.checked)}
                className="rounded text-brand-primary focus:ring-brand-primary/50"
              />
              <span className="font-semibold">Store Pickup</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="rounded text-brand-primary focus:ring-brand-primary/50"
              />
              <span className="font-semibold">Main Branch</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-separator/50">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-foreground border border-separator hover:bg-surface-elevated cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="px-5 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary/90 disabled:opacity-50 cursor-pointer transition flex items-center gap-1.5 shadow-xs"
            >
              {isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              <span>{isEditing ? 'Update Branch' : 'Create Branch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
