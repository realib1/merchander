'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';

interface ProductGeneralInfoProps {
  name: string;
  description: string;
  onNameChange: (val: string) => void;
  onDescriptionChange: (val: string) => void;
}

export function ProductGeneralInfo({ name, description, onNameChange, onDescriptionChange }: ProductGeneralInfoProps) {
  return (
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
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. Authentic Kente Cloth"
            className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-muted"
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
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Provide a detailed description..."
            className="w-full px-3 py-2 bg-surface border border-separator rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-muted resize-y"
          />
        </div>
      </CardBody>
    </Card>
  );
}
