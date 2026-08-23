'use client';

import { useActionState, useEffect } from 'react';
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
  phone
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

  useEffect(() => {
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
            <span className="text-2xl font-semibold text-secondary">{initials}</span>
            <button type="button" className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100 cursor-pointer">
              <Camera className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-primary">Profile Photo</h4>
            <p className="text-xs text-secondary">JPG, GIF or PNG. Max size of 5MB.</p>
            <div className="flex gap-3 mt-2">
              <Button variant="outline" size="sm" type="button">Change</Button>
              <Button variant="ghost" size="sm" type="button" className="text-destructive hover:bg-destructive/10 hover:text-destructive">Remove</Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField name="firstName" label="First Name" defaultValue={firstName} />
          <FormField name="lastName" label="Last Name" defaultValue={lastName} />
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
      <CardFooter className="justify-end border-t border-separator/50 mt-4 pt-6">
        <Button variant="primary" type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardFooter>
    </form>
  );
}
