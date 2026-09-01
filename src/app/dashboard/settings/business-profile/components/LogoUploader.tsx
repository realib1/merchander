'use client';

import React, { useRef, useTransition } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { uploadBusinessLogo } from '@/app/actions/settings-business';
import { getBusinessInitials } from '@/utils/format';
import { toast } from 'sonner';

interface LogoUploaderProps {
  logoUrl: string;
  businessName: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function LogoUploader({ logoUrl, businessName, onChange, disabled = false }: LogoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, startUpload] = useTransition();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processUpload(file);
  };

  const processUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WebP, SVG)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo file must be smaller than 5MB');
      return;
    }

    startUpload(async () => {
      try {
        const formData = new FormData();
        formData.append('logoFile', file);
        const res = await uploadBusinessLogo(formData);
        if (res.error) {
          toast.error(res.error);
        } else if (res.url) {
          onChange(res.url);
          toast.success('Logo uploaded');
        }
      } catch (err) {
        console.error('Logo upload error:', err);
        toast.error('Failed to upload logo image');
      }
    });
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-6">
        {/* Business Logo Preview with Profile Gradient Border */}
        <div className="relative h-20 w-20 shrink-0 rounded-2xl bg-linear-to-tr from-brand-secondary to-brand-primary p-0.5 shadow-xs">
          <div className="relative w-full h-full rounded-[14px] bg-surface flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={`${businessName || 'Business'} Logo`} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-foreground font-display">
                {getBusinessInitials(businessName)}
              </span>
            )}

            {isUploading ? (
              <div className="absolute inset-0 bg-background/70 backdrop-blur-xs flex items-center justify-center">
                <Loader2 size={18} className="animate-spin text-brand-primary" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                aria-label="Upload business logo"
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100 cursor-pointer text-white disabled:pointer-events-none"
              >
                <Camera className="h-6 w-6" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={handleFileChange}
          disabled={disabled || isUploading}
          className="hidden"
        />

        <div className="space-y-1">
          <p className="text-xs font-semibold text-foreground">Business Brand Logo</p>
          <p className="text-xs text-muted">PNG, JPG, WebP, or SVG (max. 5MB)</p>
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-separator text-xs font-semibold text-foreground hover:bg-surface-elevated active:scale-95 transition-all cursor-pointer shadow-2xs disabled:opacity-60"
            >
              <span>{logoUrl ? 'Change' : 'Upload'}</span>
            </button>
            {logoUrl && (
              <button
                type="button"
                onClick={() => onChange('')}
                disabled={disabled || isUploading}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
              >
                <Trash2 size={12} />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
