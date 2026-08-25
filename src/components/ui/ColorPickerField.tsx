'use client';

import React from 'react';
import { FormField } from '@/components/ui/FormField';
import { getContrastTextColor, normalizeHex, isValidHex } from '@/utils/color';

interface ColorPickerFieldProps {
  id?: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
}

export function ColorPickerField({ id, name, label, value, onChange, hint, error }: ColorPickerFieldProps) {
  const fieldId = id || name;
  const pickerId = `${fieldId}-native-picker`;
  const textColor = getContrastTextColor(value);
  const normalizedPickerValue = normalizeHex(value);

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 items-start">
      <FormField
        id={fieldId}
        name={name}
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        hint={hint}
        error={error}
        aria-invalid={!!error || (value !== '' && !isValidHex(value))}
      />
      <div className="flex flex-col space-y-1.5 pt-5">
        <span className="text-xs font-semibold text-primary select-none sm:invisible" aria-hidden="true">
          Preview
        </span>
        <label
          htmlFor={pickerId}
          className="h-10 w-full rounded-md border border-separator flex items-center justify-center text-xs font-medium shadow-xs transition-colors duration-200 cursor-pointer relative overflow-hidden focus-within:ring-2 focus-within:ring-brand-primary"
          style={{
            backgroundColor: isValidHex(value) ? value : '#000000',
            color: textColor,
          }}
        >
          <span>Click to pick color</span>
          <input
            id={pickerId}
            type="color"
            value={normalizedPickerValue}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`${label} visual picker`}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
      </div>
    </div>
  );
}
