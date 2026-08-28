'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCustomer } from '@/app/actions/customers';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewCustomerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createCustomer(formData);
      toast.success('Customer added successfully!');
      router.push('/dashboard/customers');
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || 'Failed to add customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-6">
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center gap-2 text-sm  hover:text-brand-primary transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Customers
        </Link>
        <h1 className="text-3xl font-bold  tracking-tight font-display">Add Customer</h1>
        <p className="mt-1 font-medium">Create a new customer profile.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface border border-separator rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium  mb-1.5">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="e.g. Kwame Mensah"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-surface-elevated border border-separator rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary  transition-colors"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium  mb-1.5">
            Phone Number <span className="text-brand-primary">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            required
            placeholder="e.g. 0241234567"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full bg-surface-elevated border border-separator rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary  transition-colors"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium  mb-1.5">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            placeholder="e.g. kwame@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-surface-elevated border border-separator rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary  transition-colors"
          />
        </div>

        <div className="pt-4 border-t border-separator flex justify-end gap-3">
          <Link
            href="/dashboard/customers"
            className="px-5 py-2.5 text-sm font-medium  hover:text-brand-primary transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !formData.phone}
            className="flex items-center gap-2 bg-brand-primary hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSubmitting ? 'Saving...' : 'Save Customer'}
          </button>
        </div>
      </form>
    </div>
  );
}
