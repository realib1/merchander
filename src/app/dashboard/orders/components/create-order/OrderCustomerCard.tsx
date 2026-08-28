'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardBody, CardDescription } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { User } from 'lucide-react';
import { Customer } from './types';

interface CustomerAutocompleteProps {
  customers: Customer[];
  onSelect: (customer: Customer) => void;
}

function CustomerAutocomplete({ customers, onSelect }: CustomerAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered =
    search.length > 1
      ? customers.filter((c) => c.phone.includes(search) || c.name.toLowerCase().includes(search.toLowerCase()))
      : [];

  return (
    <div className="relative w-full">
      <div className="mb-1.5 flex justify-between items-end">
        <label className="block text-sm font-medium">Search Existing Customer</label>
      </div>
      <div className="relative">
        <input
          type="text"
          className="w-full rounded-xl border border-separator bg-surface text-sm px-4 py-2.5 focus:ring-brand-primary outline-none transition-shadow placeholder:text-muted"
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
              {filtered.map((c) => (
                <div
                  key={c.id}
                  className="px-4 py-3 text-sm border-b border-separator/50 hover:bg-surface cursor-pointer last:border-0"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    onSelect(c);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs">{c.phone}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface OrderCustomerCardProps {
  customers: Customer[];
  custPhone: string;
  custName: string;
  onPhoneChange: (phone: string) => void;
  onNameChange: (name: string) => void;
  onCustomerSelect: (customer: Customer) => void;
}

export function OrderCustomerCard({
  customers,
  custPhone,
  custName,
  onPhoneChange,
  onNameChange,
  onCustomerSelect,
}: OrderCustomerCardProps) {
  return (
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
            <CustomerAutocomplete customers={customers} onSelect={onCustomerSelect} />
          </div>
        )}
        <div className="space-y-4">
          <FormField
            name="customerPhone"
            label="Phone Number"
            placeholder="e.g. 024 123 4567"
            value={custPhone}
            onChange={(e) => onPhoneChange(e.target.value)}
          />
          <FormField
            name="customerName"
            label="Full Name"
            placeholder="e.g. Walk-in Customer"
            value={custName}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>
      </CardBody>
    </Card>
  );
}
