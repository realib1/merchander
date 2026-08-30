'use client';

import { useState, useActionState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Camera, Trash2, User } from 'lucide-react';
import { updateProfile } from '@/app/actions/profile';
import { toast } from 'sonner';

interface ProfileFormProps {
  initials: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl?: string | null;
}

export function ProfileForm({ initials, firstName, lastName, email, phone, avatarUrl }: ProfileFormProps) {
  const router = useRouter();
  const [userSelectedPreview, setUserSelectedPreview] = useState<string | null | undefined>(undefined);
  const [prevAvatarUrl, setPrevAvatarUrl] = useState<string | null | undefined>(avatarUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state if avatarUrl prop changes from server during render
  if (avatarUrl !== prevAvatarUrl) {
    setPrevAvatarUrl(avatarUrl);
    setUserSelectedPreview(undefined);
    setSelectedFile(null);
  }

  const photoPreview = userSelectedPreview !== undefined ? userSelectedPreview : avatarUrl || null;

  const [state, action, isPending] = useActionState(async (prevState: unknown, formData: FormData) => {
    if (selectedFile) {
      formData.set('avatarFile', selectedFile);
      formData.set('avatarUrl', '');
    } else if (photoPreview) {
      formData.set('avatarUrl', photoPreview);
    } else {
      formData.set('avatarUrl', '');
    }

    const result = await updateProfile(formData);
    if (result?.success) {
      setSelectedFile(null);
      setUserSelectedPreview(undefined);
    }
    return result;
  }, null);

  const lastToastedState = useRef<typeof state>(null);

  useEffect(() => {
    if (state === lastToastedState.current) return;
    lastToastedState.current = state;

    if (state?.error) {
      toast.error(state.error);
    } else if (state?.success) {
      toast.success('Profile updated successfully');
      router.refresh();
    }
  }, [state, router]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error('Image is too large. Max size is 3MB.');
      return;
    }

    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setUserSelectedPreview(previewUrl);
    toast.success('Photo selected! Click "Save Changes" to apply.');
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setUserSelectedPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.info('Photo removed. Click "Save Changes" to apply.');
  };

  return (
    <form action={action}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
            <User className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your profile photo and personal contact details.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-6">
        {/* Profile Avatar Section */}
        <div className="flex items-center gap-6">
          <div className="relative h-20 w-20 shrink-0 rounded-2xl bg-linear-to-tr from-brand-secondary to-brand-primary p-0.5 shadow-xs">
            <div className="relative w-full h-full rounded-[14px] bg-surface flex items-center justify-center overflow-hidden">
              {photoPreview ? (
                <Image src={photoPreview} alt="Profile Avatar" fill className="object-cover" unoptimized />
              ) : (
                <span className="text-2xl font-bold text-foreground font-display">{initials}</span>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload profile photo"
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100 cursor-pointer text-white"
              >
                <Camera className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handlePhotoSelect}
            className="hidden"
          />

          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Profile Photo</p>
            <p className="text-xs text-muted">PNG, JPG or WebP (max. 3MB)</p>
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs cursor-pointer"
              >
                Change
              </Button>
              {photoPreview && (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
                >
                  <Trash2 size={13} className="mr-1" /> Remove
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Input Fields */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField name="firstName" label="First Name" defaultValue={firstName} required />
          <FormField name="lastName" label="Last Name" defaultValue={lastName} required />
          <div className="space-y-1.5">
            <label htmlFor="profile-email" className="text-xs font-semibold text-foreground">
              Email Address
            </label>
            <input
              id="profile-email"
              type="email"
              value={email}
              readOnly
              className="w-full rounded-xl border border-separator bg-surface-elevated/70 px-3.5 py-2 text-xs text-muted cursor-not-allowed outline-none font-mono"
            />
            <p className="text-[11px] text-muted">Primary account email used for sign-in.</p>
          </div>
          <FormField
            name="phone"
            label="Personal Phone Number"
            type="tel"
            defaultValue={phone}
            placeholder="024 123 4567"
            hint="Your direct personal contact number for account communication."
          />
        </div>
      </CardBody>
      <CardFooter className="justify-end">
        <Button variant="primary" type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardFooter>
    </form>
  );
}
