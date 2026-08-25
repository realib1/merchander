'use client';

import { useActionState, useEffect, useRef } from 'react';
import { CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Camera } from 'lucide-react';
import { updateProfile } from '@/app/actions/profile';
import { toast } from 'sonner';

export function ProfileForm({
  initials,
  firstName,
  lastName,
  email,
  phone,
}: {
  initials: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}) {
  const [state, action, isPending] = useActionState(async (prevState: unknown, formData: FormData) => {
    return await updateProfile(formData);
  }, null);

  const lastToastedState = useRef<typeof state>(null);

  useEffect(() => {
    if (state === lastToastedState.current) return;
    lastToastedState.current = state;

    if (state?.error) {
      toast.error(state.error);
    } else if (state?.success) {
      toast.success('Profile updated successfully');
    }
  }, [state]);

  return (
    <form action={action}>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Update your photo and personal details.</CardDescription>
      </CardHeader>
      <CardBody className="space-y-6">
        <div className="flex items-center gap-6">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-surface-elevated border border-separator flex items-center justify-center">
            <span className="text-2xl font-semibold text-primary">{initials}</span>
            <button
              type="button"
              aria-label="Change profile photo (Coming Soon)"
              disabled
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100 cursor-not-allowed"
            >
              <Camera className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-primary">Profile Photo</p>
            <p className="text-xs text-secondary">JPG, GIF or PNG. Max size of 5MB.</p>
            <div className="flex items-center gap-3 mt-2">
              <Button variant="outline" size="sm" type="button" disabled>
                Change
                <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-surface-elevated text-muted">Soon</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                disabled
                className="text-destructive/60 hover:bg-destructive/10"
              >
                Remove
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField name="firstName" label="First Name" defaultValue={firstName} required />
          <FormField name="lastName" label="Last Name" defaultValue={lastName} required />
          <FormField
            name="email"
            label="Email Address"
            type="email"
            defaultValue={email}
            readOnly
            className="bg-surface-elevated opacity-70 cursor-not-allowed"
            hint="Contact support to change your email address."
          />
          <FormField name="phone" label="Phone Number" type="tel" defaultValue={phone} />
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
